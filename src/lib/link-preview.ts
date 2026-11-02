export type LinkMetadata = {
  url: string;
  hostname: string;
  title: string;
  description: string;
  image: string | null;
};

/** Only public web hostnames; never send local addresses to the metadata service. */
export function publicWebUrl(value: string): string | null {
  if (value.length > 2048) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || host.includes('[')) return null;
    if (['localhost', 'local', 'internal', 'test', 'invalid', 'example', 'onion', 'home', 'lan'].some(suffix => host === suffix || host.endsWith(`.${suffix}`))) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

export function firstPostLink(text: string | null | undefined): string | null {
  // Accept full links, www. links and bare domains such as youtube.com/watch.
  const pattern = /(?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,24}(?:\/[^\s<>"']*)?/gi;
  for (const match of text?.matchAll(pattern) ?? []) {
    if (match.index && text?.[match.index - 1] === '@') continue;
    const raw = match[0].replace(/[.,!?;:)\]}]+$/, '');
    const url = publicWebUrl(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url) return url;
  }
  return null;
}

export function linkFallback(url: string): LinkMetadata {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  return { url, hostname, title: hostname, description: '', image: null };
}