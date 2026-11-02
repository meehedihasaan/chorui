import { linkFallback, publicWebUrl } from './link-preview';
import type { LinkMetadata } from './link-preview';

/** Only the fixed metadata service retrieves external pages. */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const fallback = linkFallback(url);
  const endpoint = new URL('https://api.microlink.io/');
  endpoint.searchParams.set('url', url);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  // Transient errors must reach Query so they are retried, not cached as success.
  if (!response.ok) throw new Error('Link preview temporarily unavailable');
  const result = await response.json() as {
    status?: string;
    statusCode?: number;
    data?: { title?: string; description?: string; image?: { url?: string } };
  };
  if (result.status !== 'success') throw new Error('Link preview temporarily unavailable');
  if (result.statusCode && result.statusCode >= 400) return fallback;
  let image: string | null = null;
  if (typeof result.data?.image?.url === 'string') {
    try { image = publicWebUrl(new URL(result.data.image.url, url).href); } catch { /* Text-only preview. */ }
  }
  return {
    ...fallback,
    title: result.data?.title?.trim().slice(0, 300) || fallback.title,
    description: result.data?.description?.trim().slice(0, 500) || '',
    image
  };
}