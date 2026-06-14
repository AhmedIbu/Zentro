// POST /download        -> runs yt-dlp, logs history, returns metadata + a
//                          GET url the client can stream (with progress).
// GET  /download/file/:id -> streams the prepared file, then deletes it.
//
// Why two steps? Expo's FileSystem download (which gives real progress bars and
// writes straight to disk) works over GET. So POST does the heavy yt-dlp work
// and hands back a short-lived GET url for the actual byte transfer.

const express = require('express');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const router = express.Router();

const { detectPlatform } = require('../utils/platformDetector');
const { downloadMedia, cleanup } = require('../utils/ytdlp');
const { mimeFor } = require('../utils/mime');
const {
  logDownload,
  cacheEnabled,
  cacheKey,
  uploadToCache,
  findCachedDownload,
  getSignedUrl,
} = require('../config/supabase');

// ---------------------------------------------------------------------------
// In-memory registry of prepared files awaiting download.
// ---------------------------------------------------------------------------
const FILE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const registry = new Map(); // id -> { filePath, dir, fileName, fileSize, mime, expiresAt }

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of registry.entries()) {
    if (entry.expiresAt <= now) {
      cleanup(entry.dir);
      registry.delete(id);
    }
  }
}, 60 * 1000).unref();

const ALLOWED_QUALITY = new Set(['best', '1080p', '720p', '480p', 'audio']);

// ---------------------------------------------------------------------------
// POST /download
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const { url } = req.body || {};
  let { quality } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" in request body' });
  }
  if (!ALLOWED_QUALITY.has(quality)) quality = 'best';

  const platform = detectPlatform(url);

  // 1) Cache hit? Return a direct signed URL straight from Supabase Storage.
  if (cacheEnabled()) {
    try {
      const cached = await findCachedDownload(url, quality);
      if (cached && cached.storage_path) {
        const signed = await getSignedUrl(cached.storage_path);
        if (signed) {
          return res.json({
            cached: true,
            id: cached.id,
            title: cached.title,
            platform: cached.platform || platform,
            quality,
            fileName: path.basename(cached.storage_path),
            fileSize: cached.file_size,
            mime: mimeFor(cached.storage_path),
            downloadUrl: signed, // absolute URL
          });
        }
      }
    } catch (err) {
      console.error('[download] cache check failed:', err.message);
    }
  }

  // 2) Run yt-dlp.
  let result;
  try {
    result = await downloadMedia({ url, quality });
  } catch (err) {
    console.error('[download] yt-dlp failed:', err.message);
    logDownload({
      source_url: url,
      platform,
      title: null,
      file_size: 0,
      quality,
      status: 'failed',
    });
    return res.status(502).json({ error: 'Download failed', details: err.message });
  }

  const mime = mimeFor(result.fileName);
  registry.set(result.id, {
    filePath: result.filePath,
    dir: result.dir,
    fileName: result.fileName,
    fileSize: result.fileSize,
    mime,
    expiresAt: Date.now() + FILE_TTL_MS,
  });

  // 3) Optional: upload to Supabase Storage for future instant re-downloads.
  let storagePath = null;
  if (cacheEnabled()) {
    const key = cacheKey(url, quality, result.ext);
    storagePath = await uploadToCache(result.filePath, key, mime);
  }

  // 4) Log history (fire and forget).
  logDownload({
    source_url: url,
    platform,
    title: result.title,
    file_size: result.fileSize,
    quality,
    status: 'completed',
    storage_path: storagePath,
  });

  // 5) Hand back metadata + a GET url for the byte transfer.
  res.json({
    cached: false,
    id: result.id,
    title: result.title,
    platform,
    quality,
    fileName: result.fileName,
    fileSize: result.fileSize,
    mime,
    downloadUrl: `/download/file/${result.id}`, // relative; client prepends API base
  });
});

// ---------------------------------------------------------------------------
// GET /download/file/:id  -> stream the prepared file
// ---------------------------------------------------------------------------
router.get('/file/:id', (req, res) => {
  const entry = registry.get(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'File not found or expired' });
  }
  if (!fs.existsSync(entry.filePath)) {
    registry.delete(req.params.id);
    return res.status(404).json({ error: 'File no longer available' });
  }

  res.setHeader('Content-Type', entry.mime);
  res.setHeader('Content-Length', entry.fileSize);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(entry.fileName)}"`);
  res.setHeader('X-Zentro-Filename', encodeURIComponent(entry.fileName));
  res.setHeader('X-Zentro-Filesize', entry.fileSize);

  const stream = fs.createReadStream(entry.filePath);
  stream.on('error', (err) => {
    console.error('[download] stream error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Stream failed' });
  });
  stream.pipe(res);

  // Clean up once the response is closed (sent or client disconnected).
  res.on('close', () => {
    stream.destroy();
    fsp.rm(entry.dir, { recursive: true, force: true }).catch(() => {});
    registry.delete(req.params.id);
  });
});

module.exports = router;
