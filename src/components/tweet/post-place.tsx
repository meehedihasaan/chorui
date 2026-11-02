import { MapPinIcon } from '@heroicons/react/24/solid';
import type { PostPlace } from '@lib/types/tweet';

/** Builds a maps link from the typed place text only (no API calls). */
export function placeMapsUrl(place: PostPlace): string {
  const q = [place.name, place.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function PostPlaceCard({ place }: { place: PostPlace }): JSX.Element {
  return (
    <a
      href={placeMapsUrl(place)}
      target='_blank'
      rel='noopener noreferrer'
      onClick={e => e.stopPropagation()}
      className='flex items-center gap-3 rounded-2xl border border-light-border px-3 py-2.5
                 transition hover:bg-light-primary/5 dark:border-dark-border dark:hover:bg-dark-primary/5'
      aria-label={`Open ${place.name} in maps`}
    >
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-main-accent/10 text-main-accent'>
        <MapPinIcon className='h-5 w-5' />
      </span>
      <span className='min-w-0'>
        <span className='block truncate font-bold'>{place.name}</span>
        <span className='block truncate text-sm text-light-secondary dark:text-dark-secondary'>
          {place.address || 'Tap to open in maps'}
        </span>
      </span>
    </a>
  );
}
