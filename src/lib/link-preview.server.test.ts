import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLinkMetadata } from './link-preview.server';

afterEach(() => vi.unstubAllGlobals());

describe('link metadata recovery', () => {
  it('rejects temporary provider failures so callers can retry', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ status: 'success', data: { title: 'Recovered article', image: { url: '/cover.jpg' } } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchLinkMetadata('https://news.bbc.com/article')).rejects.toThrow('temporarily unavailable');
    await expect(fetchLinkMetadata('https://news.bbc.com/article')).resolves.toMatchObject({ title: 'Recovered article', image: 'https://news.bbc.com/cover.jpg' });
    expect(new URL(fetchMock.mock.calls[0][0]).hostname).toBe('api.microlink.io');
  });

  it('rejects provider error payloads instead of caching empty metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'error' })));
    await expect(fetchLinkMetadata('https://bbc.com/news')).rejects.toThrow();
  });

  it('keeps a readable fallback and rejects unsafe image addresses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ status: 'success', data: { title: '  ', image: { url: 'http://127.0.0.1/cover.jpg' } } })));
    await expect(fetchLinkMetadata('https://bbc.com/news')).resolves.toMatchObject({ title: 'bbc.com', image: null });
  });
});