import { useIsAdmin } from '@lib/hooks/useIsAdmin';
import Link from '@lib/router';
import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { Button } from '@components/ui/button';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';
import { UserUsername } from '@components/user/user-username';
import { MobileSidebarLink } from '@components/sidebar/mobile-sidebar-link';
import { HeroIcon } from '@components/ui/hero-icon';
import { Modal } from './modal';
import { ActionModal } from './action-modal';
import { DisplayModal } from './display-modal';
import type { NavLink } from '@components/sidebar/sidebar';
import type { User } from '@lib/types/user';

export type MobileNavLink = Omit<NavLink, 'canBeHidden'>;

const topNavLinks: Readonly<MobileNavLink[]> = [
  { href: '/messages', linkName: 'Messages', iconName: 'ChatBubbleOvalLeftIcon' },
  { href: '/people', linkName: 'Follow', iconName: 'UserPlusIcon' },
  { href: '/explore', linkName: 'Explore', iconName: 'MagnifyingGlassIcon' },
  { href: '/notifications', linkName: 'Notifications', iconName: 'BellIcon' },
  { href: '/bookmarks', linkName: 'Bookmarks', iconName: 'BookmarkIcon' },
  { href: '/trends', linkName: 'Topics', iconName: 'ChatBubbleBottomCenterTextIcon' }
  ,{ href: '/analytics', linkName: 'Analytics', iconName: 'ChartBarIcon' }
  ,{ href: '/verified', linkName: 'Verified', iconName: 'CheckBadgeIcon' }
];

const bottomNavLinks: Readonly<MobileNavLink[]> = [
  { href: '/settings', linkName: 'Settings and privacy', iconName: 'Cog8ToothIcon' }
];

type Stats = [string, string, number];

type MobileSidebarModalProps = Pick<
  User,
  | 'name'
  | 'username'
  | 'verified'
  | 'photoURL'
  | 'following'
  | 'followers'
  | 'coverPhotoURL'
> & {
  closeModal: () => void;
};

export function MobileSidebarModal({
  name,
  username,
  verified,
  photoURL,
  following,
  followers,
  coverPhotoURL,
  closeModal
}: MobileSidebarModalProps): JSX.Element {
  const { signOut } = useAuth();
  const isAdmin = useIsAdmin();

  const {
    open: displayOpen,
    openModal: displayOpenModal,
    closeModal: displayCloseModal
  } = useModal();

  const {
    open: logOutOpen,
    openModal: logOutOpenModal,
    closeModal: logOutCloseModal
  } = useModal();

  const allStats: Readonly<Stats[]> = [
    ['following', 'Following', following.length],
    ['followers', 'Followers', followers.length]
  ];

  const userLink = `/user/${username}`;

  return (
    <>
      <Modal
        className='items-center justify-center xs:flex'
        modalClassName='max-w-xl bg-main-background w-full p-8 rounded-2xl hover-animation'
        open={displayOpen}
        closeModal={displayCloseModal}
      >
        <DisplayModal closeModal={displayCloseModal} />
      </Modal>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={logOutOpen}
        closeModal={logOutCloseModal}
      >
        <ActionModal
          useIcon
          focusOnMainBtn
          title='Log out of Chorui?'
          description='You can always log back in at any time. If you just want to switch accounts, you can do that by adding an existing account.'
          mainBtnLabel='Log out'
          action={signOut}
          closeModal={logOutCloseModal}
        />
      </Modal>
      <section className='flex h-full flex-col px-4 pt-4 pb-4'>
        <div className='flex items-start justify-between'>
          <UserAvatar username={username} src={photoURL} alt={name} size={44} />
          <Link href='/accounts'>
            <a
              aria-label='Add account'
              className='flex h-8 w-8 items-center justify-center rounded-full border border-light-border
                         transition hover:bg-light-primary/10 dark:border-dark-border dark:hover:bg-dark-primary/10'
              onClick={closeModal}
            >
              <HeroIcon className='h-5 w-5' iconName='PlusIcon' />
            </a>
          </Link>
        </div>
        <div className='mt-2 flex flex-col'>
          <UserName name={name} username={username} verified={verified} className='-mb-1 text-lg' />
          <UserUsername username={username} />
        </div>
        <div className='mt-3 flex gap-5'>
          {allStats.map(([id, label, stat]) => (
            <Link href={`${userLink}/${id}`} key={id}>
              <a className='flex items-center gap-1 hover:underline' onClick={closeModal}>
                <p className='font-bold'>{stat}</p>
                <p className='text-light-secondary dark:text-dark-secondary'>{label}</p>
              </a>
            </Link>
          ))}
        </div>
        <nav className='mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto' onClick={closeModal}>
          <MobileSidebarLink href={userLink} iconName='UserIcon' linkName='Profile' />
          {topNavLinks.map((linkData) => (
            <MobileSidebarLink {...linkData} key={linkData.href} />
          ))}
          {isAdmin && <MobileSidebarLink href='/admin' iconName='ShieldCheckIcon' linkName='Admin panel' />}
        </nav>
        <i className='my-2 h-px bg-light-border dark:bg-dark-border' />
        <nav className='flex flex-col gap-1'>
          {bottomNavLinks.map((linkData) => (
            <MobileSidebarLink {...linkData} key={linkData.href} />
          ))}
          <Button
            className='accent-tab flex items-center gap-6 rounded-md px-3 py-2 text-xl font-bold transition
                       hover:bg-light-primary/10 dark:hover:bg-dark-primary/10'
            onClick={displayOpenModal}
          >
            <HeroIcon className='h-6 w-6' iconName='PaintBrushIcon' />
            Display
          </Button>
          <Button
            className='accent-tab flex items-center gap-6 rounded-md px-3 py-2 text-xl font-bold transition
                       hover:bg-light-primary/10 dark:hover:bg-dark-primary/10'
            onClick={logOutOpenModal}
          >
            <HeroIcon className='h-6 w-6' iconName='ArrowRightOnRectangleIcon' />
            Log out
          </Button>
        </nav>
      </section>
    </>
  );
}
