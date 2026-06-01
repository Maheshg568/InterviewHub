const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function resolveMediaUrl(path) {
  if (!path || typeof path !== 'string') return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  try {
    return new URL(path, API_BASE_URL).toString();
  } catch {
    return path;
  }
}
