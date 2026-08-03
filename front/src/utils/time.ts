export function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `fa ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `fa ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `fa ${h} h`;
  return `fa ${Math.floor(h / 24)} dies`;
}