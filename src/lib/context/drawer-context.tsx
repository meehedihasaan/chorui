import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type AccountDrawerContext = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const AccountDrawer = createContext<AccountDrawerContext | null>(null);

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

  if (!context)
    throw new Error(
      'useAccountDrawer must be used within an AccountDrawerProvider'
    );

  return context;
}
