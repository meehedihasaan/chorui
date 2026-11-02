/**
 * Data mutations for the Twitter clone, backed by Lovable Cloud.
 * Function names/signatures match the source app so call sites stay stable.
 */
import { supabase } from '@/integrations/supabase/client';
import { getCollectionCount, mapTweet } from './db';
import type { EditableUserData } from '@lib/types/user';
import type { FilesWithId, ImagesPreview } from '@lib/types/file';
import type { Bookmark } from '@lib/types/bookmark';
import type { Theme, Accent } from '@lib/types/theme';
import type { Tweet } from '@lib/types/tweet';

export { getCollectionCount };

/* The generated table types are stricter than the shim's generic tables. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

const PROFILE_UPDATED_EVENT = 'app:profile-updated';
const DATA_CHANGED_EVENT = 'app:data-changed';

function notifyDataChanged(): void {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}

export function onDataChanged(callback: () => void): () => void {
  window.addEventListener(DATA_CHANGED_EVENT, callback);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, callback);
}

export async function getTweetById(tweetId: string): Promise<Tweet | null> {
  const { data } = await client
    .from('tweets')
    .select('*')
    .eq('id', tweetId)
    .maybeSingle();

  return mapTweet((data as Record<string, unknown>) ?? null);
}

function notifyProfileUpdated(): void {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function onProfileUpdated(callback: () => void): () => void {
  window.addEventListener(PROFILE_UPDATED_EVENT, callback);
  return () => window.removeEventListener(PROFILE_UPDATED_EVENT, callback);
}

export async function checkUsernameAvailability(
  username: string
): Promise<boolean> {
  // Handles are compared without letter case, so ask the database directly.
  const { data, error } = await client.rpc('username_taken', {
    p_username: username
  });

  if (!error && typeof data === 'boolean') return !data;

  const { data: rows } = await client
    .from('profiles')
    .select('id')
    .eq('username', username)
    .limit(1);

  return !rows?.length;
}

async function bumpProfileCounter(
  userId: string,
  field: 'total_tweets' | 'total_photos',
  delta: number
): Promise<void> {
  const { data } = await client
    .from('profiles')
    .select(field)
    .eq('id', userId)
    .single();

  if (!data) return;

  const current = (data as Record<string, unknown>)[field] as number;

  await client
    .from('profiles')
    .update({
      [field]: Math.max(current + delta, 0),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

export async function updateUserData(
  userId: string,
  userData: EditableUserData
): Promise<void> {
  const { photoURL, coverPhotoURL, ...rest } = userData;

  const { error } = await client
    .from('profiles')
    .update({
      ...rest,
      ...(photoURL !== undefined ? { photo_url: photoURL } : {}),
      ...(coverPhotoURL !== undefined
        ? { cover_photo_url: coverPhotoURL }
        : {}),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
  if (error) {
    if (error.code === '23505')
      throw new Error('That username is taken. Try another one.');
    throw error;
  }
  notifyProfileUpdated();
}

export async function updateUserTheme(
  userId: string,
  themeData: { theme?: Theme; accent?: Accent }
): Promise<void> {
  await client.from('profiles').update(themeData).eq('id', userId);
}

export async function updateUsername(
  userId: string,
  username?: string
): Promise<void> {
  await client
    .from('profiles')
    .update({
      ...(username && { username }),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  notifyProfileUpdated();
}

export async function managePinnedTweet(
  type: 'pin' | 'unpin',
  userId: string,
  tweetId: string
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({
      updated_at: new Date().toISOString(),
      pinned_tweet: type === 'pin' ? tweetId : null
    })
    .eq('id', userId);
  if (error) throw error;
  notifyProfileUpdated();
}

export async function manageFollow(
  type: 'follow' | 'unfollow',
  userId: string,
  targetUserId: string
): Promise<void> {
  if (type === 'follow') {
    const { error } = await client
      .from('follows')
      .upsert({ follower_id: userId, following_id: targetUserId }, { onConflict: 'follower_id,following_id', ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await client
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);
    if (error) throw error;
  }
  notifyDataChanged();
}

export async function removeTweet(tweetId: string): Promise<void> {
  const { error } = await client.from('tweets').delete().eq('id', tweetId);
  if (error) throw error;
  notifyDataChanged();
}

export async function createTweet(
  text: string | null,
  images: ImagesPreview | null,
  parentId?: string
): Promise<Tweet | null> {
  const { data, error } = await supabase.rpc('create_tweet', {
    p_text: text,
    p_images: images ? JSON.parse(JSON.stringify(images)) : null,
    p_parent_id: parentId ?? null
  } as never);

  if (error) {
    console.error('createTweet failed', error.message);
    throw new Error(error.message.includes('restricted') ? 'You cannot reply to this post.' : 'Could not publish the post.');
  }

  notifyDataChanged();
  return mapTweet((data as Record<string, unknown>) ?? null);
}

/** Uploads image files to cloud storage and returns preview data for a Tweet. */
export async function uploadImages(
  userId: string,
  files: FilesWithId
): Promise<ImagesPreview | null> {
  if (!files.length) return null;

  const imagesPreview = await Promise.all(
    files.map(async (file) => {
      const { id, name: alt, type } = file;

      const { error } = await supabase.storage
        .from('images')
        .upload(`${userId}/${id}`, file, {
          contentType: file.type || 'application/octet-stream'
        });

      if (error) throw new Error('Photo upload failed. Please try again.');

      return {
        id,
        src: `/api/public/media/${userId}/${id}`,
        alt,
        type
      };
    })
  );

  return imagesPreview;
}

export async function manageReply(
  type: 'increment' | 'decrement',
  tweetId: string
): Promise<void> {
  try {
    await supabase.rpc('manage_reply', {
      p_tweet_id: tweetId,
      p_increment: type === 'increment'
    });
    notifyDataChanged();
  } catch {
    // do nothing, because parent tweet was already deleted
  }
}

export async function manageTotalTweets(
  type: 'increment' | 'decrement',
  userId: string
): Promise<void> {
  await bumpProfileCounter(userId, 'total_tweets', type === 'increment' ? 1 : -1);
  notifyProfileUpdated();
}

export async function manageTotalPhotos(
  type: 'increment' | 'decrement',
  userId: string
): Promise<void> {
  await bumpProfileCounter(userId, 'total_photos', type === 'increment' ? 1 : -1);
  notifyProfileUpdated();
}

export function manageRetweet(
  type: 'retweet' | 'unretweet',
  userId: string,
  tweetId: string
) {
  return async (): Promise<void> => {
    const { error } = await supabase.rpc('manage_retweet', {
      p_tweet_id: tweetId,
      p_retweet: type === 'retweet'
    });
    if (error) throw error;
    notifyDataChanged();
  };
}

export function manageLike(type: 'like' | 'unlike', userId: string, tweetId: string) {
  return async (): Promise<void> => {
    const { error } = await supabase.rpc('manage_like', {
      p_tweet_id: tweetId,
      p_like: type === 'like'
    });
    if (error) throw error;
    notifyDataChanged();
  };
}

export async function manageBookmark(
  type: 'bookmark' | 'unbookmark',
  userId: string,
  tweetId: string
): Promise<Bookmark | void> {
  if (type === 'bookmark') {
    const bookmarkData: Bookmark = {
      id: tweetId,
      createdAt: new Date().toISOString()
    };
    await client.from('bookmarks').insert({ user_id: userId, tweet_id: tweetId });
    notifyDataChanged();
    return bookmarkData;
  }

  await client
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('tweet_id', tweetId);
  notifyDataChanged();
}

export async function clearAllBookmarks(userId: string): Promise<void> {
  await client.from('bookmarks').delete().eq('user_id', userId);
}
