import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ExternalLink } from 'lucide-react';
import { firstPostLink, linkFallback } from '@lib/link-preview';
import { getLinkPreview } from '@lib/link-preview.functions';

export function PostLinkPreview({ text }: { text: string | null | undefined }) {
  const url = firstPostLink(text);
  if (!url) return null;
  return <LinkPreviewCard key={url} url={url} />;
}

function LinkPreviewCard({ url }: { url: string }) {
  const load = useServerFn(getLinkPreview);
  const [imageFailed, setImageFailed] = useState(false);
  // Supplementary metadata never blocks the post's initial render.
  const { data } = useQuery({ queryKey: ['link-preview', url], queryFn: () => load({ data: { url } }), staleTime: 60 * 60 * 1000, retry: false });
  const preview = data ?? linkFallback(url);
  return <a href={url} target='_blank' rel='noopener noreferrer' aria-label={`Open link: ${preview.title}`}
    onClick={e => e.stopPropagation()}
    className='mt-3 block min-w-0 overflow-hidden rounded-lg border border-light-border text-light-primary transition-colors hover:bg-main-accent/5 focus-visible:outline-2 focus-visible:outline-main-accent dark:border-dark-border dark:text-dark-primary'>
    {preview.image && !imageFailed && <img src={`/api/public/link-image?url=${encodeURIComponent(preview.image)}`} alt='' loading='lazy' referrerPolicy='no-referrer' onError={() => setImageFailed(true)} className='aspect-[1.91/1] w-full object-cover' />}
    <div className='space-y-1 px-3 py-3'>
      <div className='flex items-center gap-2 text-xs text-light-secondary dark:text-dark-secondary'><span className='truncate'>{preview.hostname}</span><ExternalLink className='h-3 w-3 shrink-0' /></div>
      <p className='line-clamp-2 break-words text-sm font-bold'>{preview.title}</p>
      {preview.description && <p className='line-clamp-2 break-words text-sm text-light-secondary dark:text-dark-secondary'>{preview.description}</p>}
    </div>
  </a>;
}