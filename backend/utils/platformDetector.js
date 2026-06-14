// Detects which social platform a URL belongs to.
// Returns one of: youtube | instagram | tiktok | twitter | reddit | unknown

const PATTERNS = [
  { platform: 'youtube', re: /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i },
  { platform: 'instagram', re: /instagram\.com|instagr\.am/i },
  { platform: 'tiktok', re: /tiktok\.com|vm\.tiktok\.com/i },
  { platform: 'twitter', re: /(?:twitter\.com|x\.com|t\.co)/i },
  { platform: 'reddit', re: /reddit\.com|redd\.it/i },
];

function detectPlatform(url) {
  if (!url || typeof url !== 'string') return 'unknown';
  for (const { platform, re } of PATTERNS) {
    if (re.test(url)) return platform;
  }
  return 'unknown';
}

function isSupported(url) {
  return detectPlatform(url) !== 'unknown';
}

module.exports = { detectPlatform, isSupported };
