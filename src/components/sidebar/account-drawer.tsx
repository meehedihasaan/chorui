import { useAuth } from '@lib/context/auth-context';
import { useAccountDrawer } from '@lib/context/drawer-context';
import { Modal } from '@components/modal/modal';
import { MobileSidebarModal } from '@components/modal/mobile-sidebar-modal';
import type { Variants } from 'framer-motion';
import type { User } from '@lib/types/user';

const drawerAnimation: Variants = {
  initial: { x: '-100%', opacity: 0.8 },
  animate: {
    x: -8,
    opacity: 1,
    transition: { type: 'spring', duration: 0.8 }
  },
  exit: { x: '-100%', opacity: 0.8, transition: { duration: 0.4 } }
};

/**
 * The account drawer itself. Mounted once by MainLayout so the header avatar
 * and the phone bottom bar avatar share a single instance.
 */
export function AccountDrawer(): JSX.Element {
  const { user } = useAuth();
  const { open, closeDrawer } = useAccountDrawer();

  if (!user) return <></>;

  return (
    <Modal
      className='p-0'
      modalAnimation={drawerAnimation}
      modalClassName='pb-4 pl-2 min-h-screen w-80 max-w-[85vw] overflow-y-auto bg-main-background'
      open={open}
      closeModal={closeDrawer}
    >
      <MobileSidebarModal {...(user as User)} closeModal={closeDrawer} />
    </Modal>
  );
}
