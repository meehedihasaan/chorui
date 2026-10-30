import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type React from 'react';

type AccountDrawerContext = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const globalKey = '__chorui_account_drawer_ctx__';
const g = globalThis as unknown as Record<string, unknown>;
// Keep one context instance across hot reloads so providers and consumers match.
const AccountDrawer = (g[globalKey] ??= createContext<AccountDrawerContext | null>(
  null
)) as React.Context<AccountDrawerContext | null>;
const noop = (): void => undefined;

type AccountDrawerProviderProps = {
  children: ReactNode;
};

/**
 * Holds the state for the account drawer (the side menu that used to live
 * inside MobileSidebar) so every trigger — the header avatar and the phone
 * bottom bar avatar — opens the same single drawer instance.
 */
export function AccountDrawerProvider({
  children
}: AccountDrawerProviderProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const value: AccountDrawerContext = {
    open,
    openDrawer: (): void => setOpen(true),
    closeDrawer: (): void => setOpen(false)
  };

  return (
    <AccountDrawer.Provider value={value}>{children}</AccountDrawer.Provider>
  );
}

export function useAccountDrawer(): AccountDrawerContext {
  const context = useContext(AccountDrawer);

  return context ?? { open: false, openDrawer: noop, closeDrawer: noop };
}
