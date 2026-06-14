// Thin wrapper around the yt-dlp binary.
//
// downloadMedia() runs yt-dlp into a unique temp directory, then returns the
// path/metadata of the produced file. The caller streams that file to the
// client and is responsible for deleting the temp directory afterwards.

const { spawn } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp';
const FFMPEG_LOCATION = process.env.FFMPEG_LOCATION || '';

// Cookies let yt-dlp act as a logged-in user — required to get past YouTube's
// "confirm you're not a bot" check when running from a datacenter IP (Render).
// Two ways to provide them:
//   1. YTDLP_COOKIES_FILE = absolute path to an existing cookies.txt (local dev)
//   2. YOUTUBE_COOKIES     = full cookies.txt contents (Render env var)
// Cookies are domain-scoped in the file, so passing them is harmless for other
// platforms.
const COOKIES_FILE = resolveCookiesFile();

function resolveCookiesFile() {
  const explicit = process.env.YTDLP_COOKIES_FILE;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const inline = process.env.YOUTUBE_COOKIES;
  if (inline && inline.trim()) {
    try {
      const target = path.join(os.tmpdir(), 'zentro-cookies.txt');
      // Normalize CRLF -> LF so the Netscape cookie file parses correctly.
      fs.writeFileSync(target, inline.replace(/\r\n/g, '\n'), { mode: 0o600 });
      console.log('[ytdlp] using cookies from YOUTUBE_COOKIES env var');
      return target;
    } catch (err) {
      console.error('[ytdlp] failed to write cookies file:', err.message);
    }
  }
  return '';
}

// Maps the app's quality picker values to yt-dlp format selectors.
//   bv* = best video, ba = best audio, b = best combined fallback
const QUALITY_FORMATS = {
  best: ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4'],
  '1080p': ['-f', 'bv*[height<=1080]+ba/b[height<=1080]/b', '--merge-output-format', 'mp4'],
  '720p': ['-f', 'bv*[height<=720]+ba/b[height<=720]/b', '--merge-output-format', 'mp4'],
  '480p': ['-f', 'bv*[height<=480]+ba/b[height<=480]/b', '--merge-output-format', 'mp4'],
  audio: ['-x', '--audio-format', 'mp3', '-f', 'ba/b'],
};

function formatArgs(quality) {
  return QUALITY_FORMATS[quality] || QUALITY_FORMATS.best;
}

/**
 * Download a media URL with yt-dlp.
 *
 * @param {object}   opts
 * @param {string}   opts.url        Source URL.
 * @param {string}  [opts.quality]   One of the QUALITY_FORMATS keys.
 * @param {function}[opts.onProgress] Called with a 0-100 percent number.
 * @returns {Promise<{id,dir,filePath,fileName,ext,title,fileSize}>}
 */
async function downloadMedia({ url, quality = 'best', onProgress } = {}) {
  if (!url) throw new Error('url is required');

  const id = crypto.randomUUID();
  const dir = path.join(os.tmpdir(), `zentro-${id}`);
  await fsp.mkdir(dir, { recursive: true });

  // Limit the title portion of the filename to 120 bytes to avoid overly long
  // names while still keeping the real title for display.
  const outTemplate = path.join(dir, '%(title).120B.%(ext)s');

  const args = [
    ...formatArgs(quality),
    '--no-playlist',
    '--no-warnings',
    '--no-mtime',
    '--newline',
    '-o',
    outTemplate,
  ];
  if (FFMPEG_LOCATION) args.push('--ffmpeg-location', FFMPEG_LOCATION);
  if (COOKIES_FILE) args.push('--cookies', COOKIES_FILE);
  args.push(url);

  return new Promise((resolve, reject) => {
    const child = spawn(YTDLP_PATH, args);
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const match = text.match(/\[download\]\s+([0-9.]+)%/);
      if (match && typeof onProgress === 'function') {
        onProgress(parseFloat(match[1]));
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      cleanup(dir);
      reject(new Error(`Failed to start yt-dlp (${YTDLP_PATH}): ${err.message}`));
    });

    child.on('close', async (code) => {
      if (code !== 0) {
        await cleanup(dir);
        const tail = stderr.trim().split('\n').slice(-3).join(' ');
        return reject(new Error(tail || `yt-dlp exited with code ${code}`));
      }
      try {
        const files = (await fsp.readdir(dir)).filter((f) => !f.endsWith('.part'));
        if (files.length === 0) throw new Error('yt-dlp produced no output file');

        // Pick the largest file (merged output) in the directory.
        let chosen = null;
        let chosenSize = -1;
        for (const f of files) {
          const stat = await fsp.stat(path.join(dir, f));
          if (stat.isFile() && stat.size > chosenSize) {
            chosen = f;
            chosenSize = stat.size;
          }
        }
        if (!chosen) throw new Error('No regular file found in output directory');

        const filePath = path.join(dir, chosen);
        const ext = path.extname(chosen).replace('.', '').toLowerCase();
        const title = path.basename(chosen, path.extname(chosen));

        resolve({ id, dir, filePath, fileName: chosen, ext, title, fileSize: chosenSize });
      } catch (err) {
        await cleanup(dir);
        reject(err);
      }
    });
  });
}

async function cleanup(dir) {
  try {
    await fsp.rm(dir, { recursive: true, force: true });
  } catch (_) {
    /* ignore */
  }
}

// Verify the binary is callable (used by /health style checks if desired).
function ytdlpVersion() {
  return new Promise((resolve) => {
    const child = spawn(YTDLP_PATH, ['--version']);
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.on('error', () => resolve(null));
    child.on('close', () => resolve(out.trim() || null));
  });
}

// Diagnostic: is a cookies file configured and readable?
function cookieStatus() {
  if (!COOKIES_FILE) return { configured: false, path: null, lines: 0 };
  let lines = 0;
  try {
    lines = fs.readFileSync(COOKIES_FILE, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
  } catch (_) {
    /* ignore */
  }
  return { configured: true, path: COOKIES_FILE, lines };
}

module.exports = { downloadMedia, formatArgs, ytdlpVersion, cleanup, cookieStatus, fs };
