/**
 * Data mutations for the Twitter clone, backed by Lovable Cloud.
 * Function names/signatures match the source app so call sites stay stable.
 */
import { supabase } from '@/integrations/supabase/client';
import { getCollectionCount, mapTweet, mapProfile } from './db';
import type { CollectionRef } from './db';
import type { EditableUserData } from '@lib/types/user';
import type { FilesWithId, ImagesPreview } from '@lib/types/file';
import type { Bookmark } from '@lib/types/bookmark';
import type { Theme, Accent } from '@lib/types/theme';
import type { Tweet } from '@lib/types/tweet';

export { getCollectionCount };

const PROFILE_UPDATED_EVENT = 'app:profile-updated';

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
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .limit(1);

  return !data?.length;
}

async function bumpProfileCounter(
  userId: string,
  field: 'total_tweets' | 'total_photos',
  delta: number
): Promise<void> {
  const { data } = await supabase
    .from('profiles')
    .select(field)
    .eq('id', userId)
    .single();

  if (!data) return;

  await supabase
    .from('profiles')
    .update({
      [field]: Math.max((data[field] as number) + delta, 0),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

export async function updateUserData(
  userId: string,
  userData: EditableUserData
): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      ...userData,
      photoURL: undefined,
      ...(userData.photoURL ? { photo_url: userData.photoURL } : {}),
      ...(userData.coverPhotoURL ? { cover_photo_url: userData.coverPhotoURL } : {}),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  notifyProfileUpdated();
}

export async function updateUserTheme(
  userId: string,
  themeData: { theme?: Theme; accent?: Accent }
): Promise<void> {
  await supabase.from('profiles').update(themeData).eq('id', userId);
}

export async function updateUsername(
  userId: string,
  username?: string
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ ...(username && { username }), updated_at: new Date().toISOString() })
    .eq('id', userId);

  notifyProfileUpdated();
}

export async function managePinnedTweet(
  type: 'pin' | 'unpin',
  userId: string,
  tweetId: string
): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      updated_at: new Date().toISOString(),
      pinned_tweet: type === 'pin' ? tweetId : null
    })
    .eq('id', userId);

  notifyProfileUpdated();
}

export async function manageFollow(
  type: 'follow' | 'unfollow',
  userId: string,
  targetUserId: string
): Promise<void> {
  if (type === 'follow')
    await supabase
      .from('follows')
      .insert({ follower_id: userId, following_id: targetUserId });
  else
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', targetUserId);
}

export async function removeTweet(tweetId: string): Promise<void> {
  await supabase.from('tweets').delete().eq('id', tweetId);
}

export async function createTweet(
  text: string | null,
  images: ImagesPreview | null,
  parentId?: string
): Promise<Tweet | null> {
  const { data, error } = await supabase.rpc('create_tweet', {
    p_text: text,
    p_images: images ? (images as unknown as never) : null,
    p_parent_id: parentId ?? null
  });

  if (error) {
    console.error('createTweet failed', error.message);
    return null;
  }

  return mapTweet(data as Record<string, unknown>);
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

      if (error) console.error('image upload failed', error.message);

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
    await supabase.rpc('manage_retweet', {
      p_tweet_id: tweetId,
      p_retweet: type === 'retweet'
    });
  };
}

export function manageLike(
  type: 'like' | 'unlike',
  userId: string,
  tweetId: string
) {
  return async (): Promise<void> => {
    await supabase.rpc('manage_like', {
      p_tweet_id: tweetId,
      p_like: type === 'like'
    });
  };
}

export async function manageBookmark(
  type: 'bookmark' | 'unbookmark',
  userId: string,
  tweetId: string
): Promise<void> {
  if (type === 'bookmark') {
    const bookmarkData: Bookmark = {
      id: tweetId,
      createdAt: new Date().toISOString()
    };
    await supabase.from('bookmarks').insert({
      user_id: userId,
      tweet_id: tweetId,
      createdAt: undefined as never
    }).then(() => bookmarkData);
  } else {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('tweet_id', tweetId);
  }
}

export async function clearAllBookmarks(userId: string): Promise<void> {
  await supabase.from('bookmarks').delete().eq('user_id', userId);
}

export type { CollectionRef, mapProfile, mapTweet };
