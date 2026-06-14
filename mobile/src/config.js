// Central config. EXPO_PUBLIC_API_URL is injected by Expo from your .env file.
const RAW = process.env.EXPO_PUBLIC_API_URL || '';

// Strip a trailing slash so we can safely concatenate paths.
export const API_URL = RAW.replace(/\/+$/, '');

if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Zentro] EXPO_PUBLIC_API_URL is not set. Create mobile/.env from .env.example.'
  );
}

export const QUALITIES = [
  { key: 'best', label: 'Best', sub: 'Max quality', icon: 'sparkles' },
  { key: '1080p', label: '1080p', sub: 'Full HD', icon: 'tv' },
  { key: '720p', label: '720p', sub: 'HD', icon: 'tv-outline' },
  { key: '480p', label: '480p', sub: 'Data saver', icon: 'phone-portrait-outline' },
  { key: 'audio', label: 'Audio', sub: 'MP3 only', icon: 'musical-notes' },
];
