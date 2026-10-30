import { useNavigate } from '@lib/router';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';

/**
 * The search button shown in the mobile header's right section. It opens the
 * Explore page, whose header carries the search box.
 */
export function HeaderSearch(): JSX.Element {
  const navigate = useNavigate();

  return (
    <Button
      className='dark-bg-tab group relative p-2 hover:bg-light-primary/10
                 active:bg-light-primary/20 dark:hover:bg-dark-primary/10
                 dark:active:bg-dark-primary/20'
      onClick={() => void navigate({ to: '/explore' })}
    >
      <HeroIcon className='h-5 w-5' iconName='MagnifyingGlassIcon' />
      <ToolTip tip='Search' />
    </Button>
  );
}
