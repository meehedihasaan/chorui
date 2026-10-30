import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { LikeGlyph } from '@components/ui/like-glyph';
import { NumberStats } from './number-stats';

type TweetLikeButtonProps = {
  liked: boolean;
  stats: number;
  move: number;
  viewTweet?: boolean;
  onClick?: (...args: unknown[]) => unknown;
};

export function TweetLikeButton({
  liked,
  stats,
  move,
  viewTweet,
  onClick
}: TweetLikeButtonProps): JSX.Element {
  return (
    <button
      aria-label={liked ? 'Unlike' : 'Like'}
      className={cn(
        `group accent-tab flex items-center gap-1.5 p-0 transition-none
         inner:transition inner:duration-200`,
        liked
          ? 'text-like-blue'
          : 'text-light-secondary hover:text-like-blue dark:text-dark-secondary'
      )}
      onClick={preventBubbling(onClick)}
      type='button'
    >
      <i
        className={cn(
          'hover-animation relative rounded-full p-2 not-italic',
          liked
            ? 'bg-like-blue/10'
            : 'group-hover:bg-like-blue/10 group-active:bg-like-blue/20'
        )}
      >
        <LikeGlyph className={viewTweet ? 'h-6 w-6' : 'h-5 w-5'} />
      </i>
      <NumberStats move={move} stats={stats} />
    </button>
  );
}
