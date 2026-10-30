import { useAuth } from '@lib/context/auth-context';
import { useAccountDrawer } from '@lib/context/drawer-context';
import { Button } from '@components/ui/button';
import { NextImage } from '@components/ui/next-image';
import type { User } from '@lib/types/user';

/**
 * The avatar button that opens the account drawer. The drawer itself is
 * mounted once by MainLayout through AccountDrawerProvider.
 */
export function MobileSidebar(): JSX.Element {
  const { user } = useAuth();
  const { openDrawer } = useAccountDrawer();

  const { photoURL, name } = user as User;

  return (
    <Button className='accent-tab p-0 xs:hidden' onClick={openDrawer}>
      <NextImage
        useSkeleton
        imgClassName='rounded-full'
        width={30}
        height={30}
        src={photoURL}
        alt={name}
      />
    </Button>
  );
}
