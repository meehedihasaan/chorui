import { useRouter } from '@lib/router';
import { HeroIcon } from '@components/ui/hero-icon';

/**
 * The search icon shown in the mobile header's right section on Home.
 * Tapping it opens the Explore page, where the search box lives.
 */
export function HeaderSearch(): JSX.Element {
  const { push } = useRouter();

  return (
    <button
      className='custom-button flex h-10 w-10 items-center justify-center rounded-full
                 text-main-accent transition hover:bg-main-accent/10 active:bg-main-accent/20'
      aria-label='Search Chorui'
      onClick={() => void push('/explore')}
    >
      <HeroIcon className='h-7 w-7' iconName='MagnifyingGlassIcon' />
    </button>
  );
}
