import cn from 'clsx';
import likeMark from '@/assets/like-mark.png';

type LikeGlyphProps = {
  className?: string;
};

/**
 * Chorui's own thumbs-up mark, used for the Like reaction.
 * The artwork is painted with currentColor through a CSS mask, so it stays
 * white on the blue Like button and dark on the grey Unlike button.
 */
export function LikeGlyph({ className }: LikeGlyphProps): JSX.Element {
  const mask = `url(${likeMark})`;

  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0', className ?? 'h-5 w-5')}
      style={{
        backgroundColor: 'currentColor',
        maskImage: mask,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: mask,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain'
      }}
    />
  );
}
