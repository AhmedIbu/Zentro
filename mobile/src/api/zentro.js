import { API_URL } from '../config';

// POST /download — tells the backend to fetch the media with yt-dlp.
// Returns metadata + a downloadUrl (relative to the backend, or an absolute
// signed URL when the file was served from cache).
export async function requestDownload(url, quality) {
  const res = await fetch(`${API_URL}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality }),
  });

  let body;
  try {
    body = await res.json();
  } catch (_) {
    throw new Error(`Server returned ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(body?.details || body?.error || `Download failed (${res.status})`);
  }
  return body;
}

// GET /history — recent downloads logged in Supabase.
export async function fetchHistory(limit = 50) {
  const res = await fetch(`${API_URL}/history?limit=${limit}`);
  if (!res.ok) throw new Error(`History failed (${res.status})`);
  const body = await res.json();
  return body.items || [];
}

// Build an absolute URL for the file transfer. Cache hits already return an
// absolute signed URL; backend-prepared files return a relative path.
export function buildFileUrl(downloadUrl) {
  if (!downloadUrl) return null;
  if (/^https?:\/\//i.test(downloadUrl)) return downloadUrl;
  return `${API_URL}${downloadUrl}`;
}
