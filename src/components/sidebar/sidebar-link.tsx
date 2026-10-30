import { useRouter } from '@lib/router';
import Link from '@lib/router';
import cn from 'clsx';
import { preventBubbling } from '@lib/utils';
import { HeroIcon } from '@components/ui/hero-icon';
import { useUnreadNotifications } from '@lib/hooks/useNotifications';
import type { NavLink } from './sidebar';

type SidebarLinkProps = NavLink & {
  username?: string;
};

export function SidebarLink({
  href,
  username,
  iconName,
  iconClassName,
  linkName,
  disabled,
  canBeHidden
}: SidebarLinkProps): JSX.Element {
  const { asPath } = useRouter();
  const unread = useUnreadNotifications();
  const showBadge = href === '/notifications' && unread > 0;
  const isActive = username ? asPath.includes(username) : asPath === href;

  return (
    <Link href={href}>
      <a
        className={cn(
          'group py-1 outline-none',
          canBeHidden ? 'hidden xs:flex' : 'flex',
          disabled && 'cursor-not-allowed'
        )}
        onClick={disabled ? preventBubbling() : undefined}
      >
        <div
          className={cn(
            `custom-button flex items-center justify-center gap-4 self-start p-2 text-xl transition 
             duration-200 group-hover:bg-light-primary/10 group-focus-visible:ring-2 
             group-focus-visible:ring-[#878a8c] dark:group-hover:bg-dark-primary/10 
             dark:group-focus-visible:ring-white xs:p-3 xl:pr-5`,
            isActive && 'font-bold'
          )}
        >
          <span className='relative flex'>
          {showBadge && (
            <span className='absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-main-accent px-1 text-xs font-bold text-main-accent-foreground'>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          <HeroIcon
            className={cn(
              iconClassName ?? 'h-7 w-7',
              isActive &&
                ['Explore', 'Lists'].includes(linkName) &&
                'stroke-white'
            )}
            iconName={iconName}
            solid={isActive}
          />
          </span>
          <p className='hidden xl:block'>{linkName}</p>
        </div>
      </a>
    </Link>
  );
}
