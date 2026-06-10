/** V1 template distill — no LLM. */
const MAX_EXCERPT = 800;

export function distillMarkdown(title, body) {
  const lines = body.split('\n');
  const chunks = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    if (t.startsWith('```')) continue;
    if (t.length < 40) continue;
    chunks.push(t.replace(/\s+/g, ' '));
    if (chunks.join(' ').length > 1200) break;
  }
  let excerpt = chunks.slice(0, 6).join(' ').trim();
  if (!excerpt) excerpt = title;
  return truncateExcerpt(excerpt);
}

export function distillHtml(title, html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return truncateExcerpt(text.slice(0, 1200) || title);
}

function truncateExcerpt(s) {
  if (s.length <= MAX_EXCERPT) return s;
  const cut = s.slice(0, MAX_EXCERPT);
  const last = cut.lastIndexOf('. ');
  return (last > 400 ? cut.slice(0, last + 1) : cut).trim() + '…';
}
