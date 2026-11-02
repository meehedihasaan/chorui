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
  for (const match of text?.matchAll(/https?:\/\/[^\s<>"']+/gi) ?? []) {
    const url = publicWebUrl(match[0].replace(/[.,!?;:)\]}]+$/, ''));
    if (url) return url;
  }
  return null;
}

export function linkFallback(url: string): LinkMetadata {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  return { url, hostname, title: hostname, description: '', image: null };
}