// Only rewrite root-relative paths; preserve external URLs and fragment links.
export function withBase(path, base = import.meta.env.BASE_URL) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const prefix = base.replace(/\/$/, '');
  if (!prefix || path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`) || path.startsWith(`${prefix}#`)) return path;
  return `${prefix}${path}`;
}
