import { Link } from '@tanstack/react-router';

/** Post text with @mentions linked to profiles and #hashtags linked to Explore. */
export function PostText({ text, className }: { text: string; className?: string }): JSX.Element {
  const parts = text.split(/(@[A-Za-z0-9_]{1,30}|#[\p{L}\p{N}_]+)/gu);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        const prev = parts[i - 1] ?? '';
        if (i % 2 === 1 && !/[\p{L}\p{N}_.]$/u.test(prev)) {
          if (part.startsWith('@'))
            return (
              <Link key={i} to='/user/$id' params={{ id: part.slice(1) }}
                onClick={e => e.stopPropagation()}
                className='font-semibold text-main-accent hover:underline'>
                {part}
              </Link>
            );
          return (
            <Link key={i} to='/explore' search={{ q: part }}
              onClick={e => e.stopPropagation()}
              className='font-bold text-main-accent hover:underline'>
              {part}
            </Link>
          );
        }
        return part;
      })}
    </p>
  );
}
