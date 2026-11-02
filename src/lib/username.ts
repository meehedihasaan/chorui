/**
 * Username rules for the Edit profile form. Pure and browser-safe so the same
 * checks used by the UI can be unit-tested.
 */
import { isValidUsername } from './validation';

export function normalizeUsername(
  value: string | null | undefined
): string {
  return (value ?? '').trim().toLowerCase();
}

/** Handles only differ by letter case or surrounding spaces. */
export function isUsernameUnchanged(
  current: string | null | undefined,
  value: string | null | undefined
): boolean {
  return normalizeUsername(current) === normalizeUsername(value);
}

/**
 * Returns the reason a typed handle cannot be saved, or null when it is either
 * already the account's handle or a valid new one. Uniqueness is checked
 * separately against the database.
 */
export function getUsernameError(
  current: string | null | undefined,
  value: string | null | undefined
): string | null {
  if (isUsernameUnchanged(current, value)) return null;

  return isValidUsername(normalizeUsername(current), normalizeUsername(value));
}
