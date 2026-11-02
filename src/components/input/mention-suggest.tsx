import { resolveMediaUrl } from "@/lib/media-url";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_AVATAR_URL } from '@lib/default-avatar';

type Person = { id: string; username: string; name: string; photo_url: string | null; verified: boolean };

/** Returns the @query being typed right before the cursor, if any. */
export function currentMention(value: string, cursor: number): { start: number; query: string } | null {
  const m = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{0,30})$/.exec(value.slice(0, cursor));
  return m ? { start: cursor - m[2].length - 1, query: m[2] } : null;
}

export function MentionSuggest({ query, onPick }: { query: string; onPick: (username: string) => void }): JSX.Element | null {
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      let q = supabase.from('profiles').select('id, username, name, photo_url, verified').limit(6);
      if (query) q = q.or(`username.ilike.${query}%,name.ilike.%${query}%`);
      void q.then(({ data }) => { if (alive) setPeople((data as Person[]) ?? []); });
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [query]);
  if (!people.length) return null;
  return (
    <div role='listbox' aria-label='Mention someone'
      className='absolute left-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border
                 border-light-border bg-main-background shadow-lg dark:border-dark-border'>
      {people.map(p => (
        <button key={p.id} type='button' role='option' aria-selected='false'
          onMouseDown={e => { e.preventDefault(); onPick(p.username); }}
          className='flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-main-accent/10'>
          <img src={resolveMediaUrl(p.photo_url || DEFAULT_AVATAR_URL)} alt='' className='h-9 w-9 shrink-0 rounded-full object-cover' />
          <span className='min-w-0'>
            <span className='block truncate font-bold'>{p.name || p.username}</span>
            <span className='block truncate text-sm text-light-secondary dark:text-dark-secondary'>@{p.username}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
