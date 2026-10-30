import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { HeroIcon } from '@components/ui/hero-icon';
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
          ? 'text-like-red'
          : 'text-light-secondary hover:text-like-red dark:text-dark-secondary'
      )}
      onClick={preventBubbling(onClick)}
      type='button'
    >
      <i
        className={cn(
          'hover-animation relative rounded-full p-2 not-italic',
          liked
            ? 'bg-like-red/10'
            : 'group-hover:bg-like-red/10 group-active:bg-like-red/20'
        )}
      >
        <HeroIcon
          className={viewTweet ? 'h-6 w-6' : 'h-5 w-5'}
          iconName='HeartIcon'
          solid={liked}
        />
      </i>
      <NumberStats move={move} stats={stats} />
    </button>
  );
}
