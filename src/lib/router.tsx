/**
 * Next.js router compatibility shim built on TanStack Router.
 * Exposes the source app's `Link` (default export) and `useRouter` APIs.
 */
import { isValidElement, type MouseEvent, type ReactNode } from 'react';
import { useLocation, useRouter as useTanstackRouter } from '@tanstack/react-router';

type LinkProps = {
  href: string;
  children?: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
} & Record<string, unknown>;

export function Link({ href, children, onClick, className, ...rest }: LinkProps) {
  const router = useTanstackRouter();

  const isExternal = /^https?:/i.test(href) || href.startsWith('mailto:');

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(event);

    if (event.defaultPrevented) return;
    if (isExternal) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;

    event.preventDefault();
    router.history.push(href);
  };

  return (
    <a href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

// Some call sites import Link as a named export as well.
export { Link as default };

export function useRouter() {
  const router = useTanstackRouter();
  const location = useLocation();

  const query = Object.fromEntries(new URLSearchParams(location.search));

  return {
    push: (to: string): void => {
      router.history.push(to);
    },
    replace: (to: string): void => {
      router.history.replace(to);
    },
    back: (): void => {
      router.history.back();
    },
    asPath: location.pathname + location.search,
    pathname: location.pathname,
    query
  };
}

export { isValidElement };
