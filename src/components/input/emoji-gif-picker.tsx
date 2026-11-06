import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { searchGifs } from '@lib/gif.functions';
import type { GifResult } from '@lib/gif.functions';

const EMOJI_GROUPS: { name: string; emojis: string }[] = [
  { name: 'Smileys', emojis: '😀😃😄😁😆😅😂🤣🥲😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥸🤩🥳😏😒😞😔😟😕🙁😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🫡🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👻💀👽🤖💩😺😸😹😻😼😽🙀😿😾' },
  { name: 'Gestures', emojis: '👋🤚🖐✋🖖👌🤌🤏✌🤞🫰🤟🤘🤙👈👉👆👇☝👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍💅💪🦾👀👁👄🧠🫀' },
  { name: 'Hearts', emojis: '❤🧡💛💚💙💜🖤🤍🤎💔❣💕💞💓💗💖💘💝💟✨⭐🌟💫🔥💯✅❌⚡💥🎉🎊🎈🎁🏆🥇' },
  { name: 'Nature & food', emojis: '🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦅🦋🌸🌹🌻🌼🌷🌱🌿🍀🌙☀🌈☔❄🍎🍊🍋🍉🍇🍓🍒🥭🍍🥥🍔🍟🍕🌭🥪🌮🍜🍛🍚🍰🎂🍫🍿☕🍵🥤' },
  { name: 'Activities & places', emojis: '⚽🏀🏈⚾🎾🏐🏏🏸🥊🎮🎯🎲🎸🎧🎤🎬📷📱💻⌚📚✏📌🚗🚕🚌🚲✈🚀🏠🏢🕌⛪🏝🌍🇧🇩🇮🇳🇺🇸🇬🇧' }
];

type Props = {
  mode: 'emoji' | 'gif';
  onEmoji: (emoji: string) => void;
  onGif: (file: File) => void;
  onClose: () => void;
};

export function EmojiGifPicker({ mode, onEmoji, onGif, onClose }: Props): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className='fixed inset-0 z-40' onClick={e => { e.preventDefault(); onClose(); }} />
      <div
        role='dialog'
        aria-label={mode === 'emoji' ? 'Choose an emoji' : 'Choose a GIF'}
        onClick={e => e.preventDefault()}
        className='absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border
                   border-light-border bg-main-background shadow-lg dark:border-dark-border'
      >
        {mode === 'emoji' ? <EmojiGrid onEmoji={onEmoji} /> : <GifGrid onGif={onGif} onClose={onClose} />}
      </div>
    </>
  );
}

function EmojiGrid({ onEmoji }: { onEmoji: (e: string) => void }): JSX.Element {
  return (
    <div className='max-h-72 overflow-y-auto p-2'>
      {EMOJI_GROUPS.map(({ name, emojis }) => (
        <div key={name}>
          <p className='px-1 pb-1 pt-2 text-xs font-bold text-light-secondary dark:text-dark-secondary'>{name}</p>
          <div className='grid grid-cols-8 gap-0.5'>
            {Array.from(emojis).map((emoji, i) => (
              <button
                key={`${emoji}${i}`}
                type='button'
                aria-label={emoji}
                onClick={e => { e.preventDefault(); onEmoji(emoji); }}
                className='grid h-9 w-full place-items-center rounded-lg text-2xl hover:bg-main-accent/10'
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GifGrid({ onGif, onClose }: { onGif: (f: File) => void; onClose: () => void }): JSX.Element {
  const search = useServerFn(searchGifs);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<string>();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      search({ data: { q } })
        .then(r => { if (alive) { setResults(r.results); setError(r.error); } })
        .catch(() => alive && setError('GIFs are unavailable right now.'))
        .finally(() => alive && setLoading(false));
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [q, search]);

  const pick = async (gif: GifResult): Promise<void> => {
    setPicking(gif.id);
    try {
      const res = await fetch(gif.url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      onGif(new File([blob], `gif-${gif.id}.gif`, { type: 'image/gif' }));
      onClose();
    } catch {
      toast.error('That GIF could not be added. Try another.');
    } finally { setPicking(undefined); }
  };

  return (
    <div className='p-2'>
      <input
        autoFocus
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder='Search GIFs'
        className='mb-2 w-full rounded-full border border-light-border bg-transparent px-4 py-2 text-sm outline-none
                   focus:border-main-accent dark:border-dark-border'
      />
      <div className='h-72 overflow-y-auto'>
        {error ? (
          <div className='grid h-full place-items-center p-4 text-center text-sm text-light-secondary dark:text-dark-secondary'>
            <div className='space-y-3'>
              <p>GIF search isn't switched on yet. You can still add a GIF from your device.</p>
              <label className='btn-solid inline-block cursor-pointer'>
                Choose a GIF
                <input type='file' accept='image/gif' className='hidden'
                  onChange={e => { const f = e.target.files?.[0]; if (f) { onGif(f); onClose(); } }} />
              </label>
            </div>
          </div>
        )
          : loading && !results.length ? <p className='p-4 text-center text-sm text-light-secondary'>Loading…</p>
          : !results.length ? <p className='p-4 text-center text-sm text-light-secondary'>No GIFs found</p>
          : (
            <div className='grid grid-cols-2 gap-1'>
              {results.map(gif => (
                <button key={gif.id} type='button' disabled={!!picking}
                  onClick={e => { e.preventDefault(); void pick(gif); }}
                  className='relative overflow-hidden rounded-lg disabled:opacity-60'>
                  <img src={gif.preview} alt={gif.title} loading='lazy' className='h-28 w-full object-cover' />
                  {picking === gif.id && <span className='absolute inset-0 grid place-items-center bg-main-background/60 text-xs font-bold'>Adding…</span>}
                </button>
              ))}
            </div>
          )}
      </div>
      <p className='pt-1 text-right text-[10px] text-light-secondary dark:text-dark-secondary'>Powered by GIPHY</p>
    </div>
  );
}
