/** Generate stable refId from official URL; collision-safe slug. */
export function refIdFromUrl(url, provider) {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\.md$/i, '').replace(/^\/+|\/+$/g, '');
    if (path === '' || path === 'docs') path = u.hostname.split('.')[0];
    const slug = path
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    const base = `${provider}/${slug || 'index'}`;
    return base.replace(/\/+/g, '/');
  } catch {
    return `${provider}/unknown-${hash(url)}`;
  }
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function specimenFilename(refId) {
  return `${refId.replace(/\//g, '-')}.specimen.json`;
}
