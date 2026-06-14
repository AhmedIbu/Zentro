// Client-side platform detection (mirrors the backend detector) so the Home
// screen can show the right badge instantly as the user types.

const PATTERNS = [
  { platform: 'youtube', re: /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i },
  { platform: 'instagram', re: /instagram\.com|instagr\.am/i },
  { platform: 'tiktok', re: /tiktok\.com|vm\.tiktok\.com/i },
  { platform: 'twitter', re: /(?:twitter\.com|x\.com|t\.co)/i },
  { platform: 'reddit', re: /reddit\.com|redd\.it/i },
];

export function detectPlatform(url) {
  if (!url || typeof url !== 'string') return 'unknown';
  for (const { platform, re } of PATTERNS) {
    if (re.test(url)) return platform;
  }
  return 'unknown';
}

export function looksLikeUrl(text) {
  return /^https?:\/\/\S+\.\S+/i.test((text || '').trim());
}
