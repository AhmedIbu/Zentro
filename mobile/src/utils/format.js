export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function timeAgo(dateString) {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// Make a filename safe for the local filesystem.
export function sanitizeName(name) {
  const cleaned = (name || 'zentro-media')
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return cleaned || `zentro-${Date.now()}.mp4`;
}
