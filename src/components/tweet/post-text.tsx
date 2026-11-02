import { Link } from '@tanstack/react-router';

/** Post text with @mentions turned into profile links. */
export function PostText({ text, className }: { text: string; className?: string }): JSX.Element {
  const parts = text.split(/(@[A-Za-z0-9_]{1,30})/g);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        const prev = parts[i - 1] ?? '';
        if (i % 2 === 1 && !/[A-Za-z0-9_.]$/.test(prev))
          return (
            <Link key={i} to='/user/$id' params={{ id: part.slice(1) }}
              onClick={e => e.stopPropagation()}
              className='text-main-accent hover:underline'>
              {part}
            </Link>
          );
        return part;
      })}
    </p>
  );
}
