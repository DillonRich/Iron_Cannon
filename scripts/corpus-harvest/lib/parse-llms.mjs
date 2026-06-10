/** Parse llms.txt markdown link lists. */
export function parseLlmsMarkdown(text, provider) {
  const links = [];
  const re = /\[([^\]]+)\]\((https?:[^)]+)\)(?::\s*(.+))?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    links.push({
      title: m[1].trim(),
      url: m[2].trim(),
      description: m[3]?.trim(),
      provider,
    });
  }
  return links;
}

export function hostAllowed(url, allowlist) {
  try {
    const host = new URL(url).hostname;
    return allowlist.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
