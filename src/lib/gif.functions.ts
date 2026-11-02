import { createServerFn } from '@tanstack/react-start';

export type GifResult = { id: string; title: string; preview: string; url: string };

/** GIF search through GIPHY; the key stays on the server. */
export const searchGifs = createServerFn({ method: 'GET' })
  .inputValidator((input: { q?: string }) => ({
    q: typeof input?.q === 'string' ? input.q.trim().slice(0, 50) : ''
  }))
  .handler(async ({ data }): Promise<{ results: GifResult[]; error?: string }> => {
    const key = process.env.GIPHY_API_KEY;
    if (!key) return { results: [], error: 'GIF search is not set up yet.' };
    const endpoint = new URL(
      `https://api.giphy.com/v1/gifs/${data.q ? 'search' : 'trending'}`
    );
    endpoint.searchParams.set('api_key', key);
    endpoint.searchParams.set('limit', '24');
    endpoint.searchParams.set('rating', 'pg-13');
    if (data.q) endpoint.searchParams.set('q', data.q);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { results: [], error: 'GIFs are unavailable right now.' };
    const json = (await response.json()) as {
      data?: { id: string; title?: string; images?: Record<string, { url?: string }> }[];
    };
    const results = (json.data ?? [])
      .map(g => ({
        id: g.id,
        title: g.title ?? 'GIF',
        preview: g.images?.fixed_width_downsampled?.url ?? g.images?.fixed_width?.url ?? '',
        url: g.images?.downsized?.url ?? g.images?.fixed_width?.url ?? ''
      }))
      .filter(g => g.preview.startsWith('https://') && g.url.startsWith('https://'));
    return { results };
  });
