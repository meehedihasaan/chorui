import { createServerFn } from '@tanstack/react-start';
import { linkFallback, publicWebUrl } from './link-preview';
import type { LinkMetadata } from './link-preview';

export const getLinkPreview = createServerFn({ method: 'GET' })
  .inputValidator((input: { url: string }) => {
    const url = typeof input?.url === 'string' ? publicWebUrl(input.url) : null;
    if (!url) throw new Error('Invalid link');
    return { url };
  })
  .handler(async ({ data }): Promise<LinkMetadata> => {
    const fallback = linkFallback(data.url);
    try {
      // The fixed provider handles remote page retrieval, not this app's network.
      const endpoint = new URL('https://api.microlink.io/');
      endpoint.searchParams.set('url', data.url);
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000), redirect: 'error' });
      if (!response.ok) return fallback;
      const result = await response.json() as { status?: string; statusCode?: number; data?: { title?: string; description?: string; image?: { url?: string } } };
      if (result.status !== 'success' || (result.statusCode && result.statusCode >= 400)) return fallback;
      return {
        ...fallback,
        title: typeof result.data?.title === 'string' ? result.data.title.slice(0, 300) : fallback.title,
        description: typeof result.data?.description === 'string' ? result.data.description.slice(0, 500) : '',
        image: typeof result.data?.image?.url === 'string' ? publicWebUrl(result.data.image.url) : null
      };
    } catch { return fallback; }
  });