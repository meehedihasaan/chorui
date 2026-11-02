import defaultAvatar from '@/assets/default-avatar.png.asset.json';
import { resolveMediaUrl } from '@/lib/media-url';

const LEGACY_DEFAULT_AVATAR = '/assets/twitter-avatar.jpg';

/** Picture shown for accounts that haven't uploaded their own. */
export const DEFAULT_AVATAR_URL: string = defaultAvatar.url;

/**
 * Normalise a stored profile picture into something renderable: anything
 * missing, or pointing at the old bundled placeholder, becomes the default.
 */
export function resolveAvatarUrl(
  value: string | null | undefined
): string {
  if (!value || value === LEGACY_DEFAULT_AVATAR) return resolveMediaUrl(DEFAULT_AVATAR_URL);
  return resolveMediaUrl(value);
}
