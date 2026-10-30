import { useState } from 'react';
import { useRouter } from '@lib/router';
import { HeroIcon } from '@components/ui/hero-icon';
import type { ChangeEvent, FormEvent } from 'react';

/**
 * The compact search box shown in the mobile header's right section on Home.
 * Submitting opens the Explore page with the query applied.
 */
export function HeaderSearch(): JSX.Element {
  const [inputValue, setInputValue] = useState('');

  const { push } = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) void push(`/explore?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      className='flex w-full items-center gap-2 rounded-full
                 bg-main-search-background px-3 py-1.5'
      onSubmit={handleSubmit}
      role='search'
    >
      <HeroIcon
        className='h-4 w-4 shrink-0 text-light-secondary dark:text-dark-secondary'
        iconName='MagnifyingGlassIcon'
      />
      <input
        className='w-full min-w-0 bg-transparent text-sm outline-none
                   placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
        type='search'
        placeholder='Search'
        aria-label='Search Chorui'
        value={inputValue}
        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
          setInputValue(value)
        }
      />
    </form>
  );
}
