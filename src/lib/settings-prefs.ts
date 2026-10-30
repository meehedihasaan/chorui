// Per-device settings preferences (stored in the browser).
export type NotificationType = 'like' | 'retweet' | 'reply' | 'mention' | 'follow';

const KEY = 'chorui-notification-prefs';

export const notificationTypes: { type: NotificationType; label: string }[] = [
  { type: 'like', label: 'Likes' },
  { type: 'retweet', label: 'Reposts' },
  { type: 'reply', label: 'Replies' },
  { type: 'mention', label: 'Mentions' },
  { type: 'follow', label: 'New followers' }
];

export function getNotificationPrefs(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setNotificationPref(type: NotificationType, on: boolean): void {
  const prefs = getNotificationPrefs();
  prefs[type] = on;
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function isNotificationEnabled(type: string): boolean {
  return getNotificationPrefs()[type] !== false;
}
