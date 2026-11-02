import { describe, expect, it } from 'vitest';
import { firstPostLink, publicWebUrl } from './link-preview';

describe('post link previews', () => {
  it('previews the first web link without sentence punctuation', () => {
    expect(firstPostLink('Read https://www.bbc.com/news. Then https://www.wikipedia.org/')).toBe('https://www.bbc.com/news');
  });
  it('does not preview posts without links', () => {
    expect(firstPostLink('Hello Chorui')).toBeNull();
  });
  it('rejects local addresses, credentials and non-web schemes', () => {
    for (const url of ['http://127.0.0.1', 'http://10.0.0.1', 'http://[::1]', 'http://localhost', 'https://x.internal', 'https://user:pass@bbc.com', 'file:///etc/passwd', 'https://bbc.com:8443']) expect(publicWebUrl(url)).toBeNull();
  });
});
describe('link detection without http', () => {
  it('detects www and bare domains', async () => {
    const { firstPostLink } = await import('./link-preview');
    expect(firstPostLink('see www.bbc.com/news')).toBe('https://www.bbc.com/news');
    expect(firstPostLink('watch youtube.com/watch?v=1.')).toBe('https://youtube.com/watch?v=1');
    expect(firstPostLink('mail me@gmail.com')).toBeNull();
  });
});
