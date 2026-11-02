import { createServerFn } from '@tanstack/react-start';
import { publicWebUrl } from './link-preview';
import { fetchLinkMetadata } from './link-preview.server';
import type { LinkMetadata } from './link-preview';

export const getLinkPreview = createServerFn({ method: 'GET' })
  .inputValidator((input: { url: string }) => {
    const url = typeof input?.url === 'string' ? publicWebUrl(input.url) : null;
    if (!url) throw new Error('Invalid link');
    return { url };
  })
  .handler(async ({ data }): Promise<LinkMetadata> => {
    return fetchLinkMetadata(data.url);
  });