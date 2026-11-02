import { createFileRoute } from '@tanstack/react-router';
import { publicWebUrl } from '@lib/link-preview';

export const Route = createFileRoute('/api/public/link-image')({
  server: { handlers: { GET: async ({ request }) => {
    const source = publicWebUrl(new URL(request.url).searchParams.get('url') ?? '');
    if (!source) return new Response('Invalid image', { status: 400 });
    try {
      // An isolated public image proxy fetches the source, never the app itself.
      const endpoint = new URL('https://images.weserv.nl/');
      endpoint.searchParams.set('url', source);
      endpoint.searchParams.set('w', '800');
      endpoint.searchParams.set('output', 'webp');
      const response = await fetch(endpoint, { redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return new Response('Image unavailable', { status: 404 });
      return new Response(response.body, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
    } catch { return new Response('Image unavailable', { status: 404 }); }
  } } }
});