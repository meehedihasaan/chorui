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
    <div className='flex items-center gap-1.5'>
      <button
        aria-label={liked ? 'Unlike' : 'Like'}
        className={cn(
          `accent-tab hover-animation flex shrink-0 items-center gap-1.5 rounded-full
           px-3 py-1.5 text-sm font-bold active:brightness-90`,
          liked
            ? 'bg-light-line-reply text-light-primary dark:bg-dark-line-reply dark:text-dark-primary'
            : 'bg-like-blue text-like-blue-foreground hover:brightness-95'
        )}
        onClick={preventBubbling(onClick)}
        type='button'
      >
        <HeroIcon
          className={viewTweet ? 'h-5 w-5' : 'h-4 w-4'}
          iconName='HandThumbUpIcon'
          solid
        />
        <span>{liked ? 'Unlike' : 'Like'}</span>
      </button>
      <NumberStats move={move} stats={stats} />
    </div>
  );
}
