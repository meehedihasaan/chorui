import { expect, it } from 'vitest';
import {
  getUsernameError,
  isUsernameUnchanged,
  normalizeUsername
} from './username';

it('normalizes a typed handle by trimming and lowercasing it', () => {
  expect(normalizeUsername('  Chorui_99 ')).toBe('chorui_99');
  expect(normalizeUsername(null)).toBe('');
});

it('treats a handle that only changes letter case as unchanged', () => {
  expect(isUsernameUnchanged('Munna', 'munna')).toBe(true);
  expect(isUsernameUnchanged('munna', 'munnas')).toBe(false);
});

it('accepts a valid new handle and reports the exact rule it broke', () => {
  expect(getUsernameError('mehedihasan5616', 'chorui')).toBe(null);
  expect(getUsernameError('mehedihasan5616', 'abc')).toBe(
    'Your username must be longer than 4 characters.'
  );
  expect(getUsernameError('mehedihasan5616', 'a'.repeat(16))).toBe(
    'Your username must be shorter than 15 characters.'
  );
  expect(getUsernameError('mehedihasan5616', 'bad name!')).toBe(
    "Your username can only contain letters, numbers and '_'."
  );
  expect(getUsernameError('mehedihasan5616', '12345')).toBe(
    'Include a non-number character.'
  );
});

it('does not block saving other profile fields when the handle is unchanged', () => {
  expect(getUsernameError('Munna', '  MUNNA ')).toBe(null);
});
