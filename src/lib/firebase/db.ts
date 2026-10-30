/**
 * Firestore-compatible query shim backed by Lovable Cloud (Postgres).
 *
 * Keeps the source app's query-builder call sites (`query`, `where`, `orderBy`,
 * `limit`, `doc`, `collection`) working while executing against the cloud
 * database through the browser client. Rows are mapped back to the source
 * app's camelCase domain types.
 */
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@lib/types/user';
import type { Tweet, TweetWithUser } from '@lib/types/tweet';
import type { Stats } from '@lib/types/stats';
import type { Bookmark } from '@lib/types/bookmark';

const FIELD_MAP: Readonly<Record<string, string>> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  createdBy: 'created_by',
  photoURL: 'photo_url',
  coverPhotoURL: 'cover_photo_url',
  pinnedTweet: 'pinned_tweet',
  totalTweets: 'total_tweets',
  totalPhotos: 'total_photos',
  userLikes: 'user_likes',
  userRetweets: 'user_retweets',
  userReplies: 'user_replies'
};

export function mapField(field: string): string {
  return FIELD_MAP[field] ?? field;
}

type WhereOp =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'array-contains';

export type QueryConstraint =
  | { type: 'where'; field: string; op: WhereOp; value: unknown }
  | { type: 'orderBy'; field: string; dir: 'asc' | 'desc' }
  | { type: 'limit'; count: number };

export type CollectionRef<T = unknown> = {
  __ref: 'collection';
  table: string;
  constraints: QueryConstraint[];
};

export type DocumentRef<T = unknown> = {
  __ref: 'document';
  table: string;
  id: string;
};

export function collection<T = unknown>(
  table: string,
  ...constraints: QueryConstraint[]
): CollectionRef<T> {
  return { __ref: 'collection', table, constraints };
}

export function doc<T = unknown>(
  ref: CollectionRef<T>,
  id: string
): DocumentRef<T> {
  return { __ref: 'document', table: ref.table, id };
}

export function query<T = unknown>(
  ref: CollectionRef<T>,
  ...constraints: QueryConstraint[]
): CollectionRef<T> {
  return { __ref: 'collection', table: ref.table, constraints: [...ref.constraints, ...constraints] };
}

export function where(
  field: string,
  op: WhereOp,
  value: unknown
): QueryConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, dir };
}

export function limit(count: number): QueryConstraint {
  return { type: 'limit', count };
}

export function documentId(): string {
  return 'id';
}

export function queryKey(ref: CollectionRef): unknown[] {
  return [ref.table, ref.constraints];
}

/* ------------------------------ row mappers ------------------------------ */

export function mapProfile(row: Record<string, unknown> | null): User | null {
  if (!row) return null;

  return {
    id: row.id as string,
    bio: (row.bio as string | null) ?? null,
    name: (row.name as string) ?? '',
    theme: (row.theme as User['theme']) ?? null,
    accent: (row.accent as User['accent']) ?? null,
    website: (row.website as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    username: (row.username as string) ?? '',
    photoURL: (row.photo_url as string) ?? '/assets/twitter-avatar.jpg',
    verified: Boolean(row.verified),
    following: (row.following as string[]) ?? [],
    followers: (row.followers as string[]) ?? [],
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string | null) ?? null,
    totalTweets: (row.total_tweets as number) ?? 0,
    totalPhotos: (row.total_photos as number) ?? 0,
    pinnedTweet: (row.pinned_tweet as string | null) ?? null,
    coverPhotoURL: (row.cover_photo_url as string | null) ?? null
  };
}

export function mapTweet(row: Record<string, unknown> | null): Tweet | null {
  if (!row) return null;

  return {
    id: row.id as string,
    text: (row.text as string | null) ?? null,
    images: (row.images as Tweet['images']) ?? null,
    parent:
      row.parent_id
        ? { id: row.parent_id as string, username: (row.parent_username as string) ?? '' }
        : null,
    userLikes: (row.user_likes as string[]) ?? [],
    userRetweets: (row.user_retweets as string[]) ?? [],
    createdBy: row.created_by as string,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string | null) ?? null,
    userReplies: (row.user_replies as number) ?? 0
  };
}

export function mapStats(row: Record<string, unknown> | null): Stats | null {
  if (!row) return null;

  return {
    likes: (row.likes as string[]) ?? [],
    tweets: (row.tweets as string[]) ?? [],
    updatedAt: (row.updated_at as string | null) ?? null
  };
}

export function mapBookmark(row: Record<string, unknown> | null): Bookmark | null {
  if (!row) return null;

  return {
    id: row.tweet_id as string,
    createdAt: (row.created_at as string) ?? new Date().toISOString()
  };
}

/* ------------------------------ execution ------------------------------- */

type RawRow = Record<string, unknown>;

function applyConstraints(builder: ReturnType<typeof fromTable>, constraints: QueryConstraint[]): void {
  let current = builder;

  for (const constraint of constraints) {
    if (constraint.type === 'where') {
      const field = mapField(constraint.field);
      switch (constraint.op) {
        case '==':
          current =
            constraint.value === null
              ? current.is(field, null)
              : current.eq(field, constraint.value as string);
          break;
        case '!=':
          current = current.neq(field, constraint.value as string);
          break;
        case '>':
          current = current.gt(field, constraint.value as string);
          break;
        case '>=':
          current = current.gte(field, constraint.value as string);
          break;
        case '<':
          current = current.lt(field, constraint.value as string);
          break;
        case '<=':
          current = current.lte(field, constraint.value as string);
          break;
        case 'array-contains':
          current = current.contains(field, [constraint.value]);
          break;
      }
    } else if (constraint.type === 'orderBy') {
      current = current.order(mapField(constraint.field), {
        ascending: constraint.dir === 'asc',
        nullsFirst: false
      });
    } else {
      current = current.limit(constraint.count);
    }
  }
}

type FromTable = ReturnType<typeof supabase.from>;

function fromTable(table: string): FromTable {
  return supabase.from(table);
}

export async function fetchRows(
  ref: CollectionRef
): Promise<RawRow[] | null> {
  const builder = applyConstraints(fromTable(ref.table).select('*'), ref.constraints);
  const { data, error } = await builder;

  if (error) {
    console.error('query failed', ref.table, error.message);
    return null;
  }

  return (data as RawRow[]) ?? [];
}

export async function fetchCollection<T>(
  ref: CollectionRef<T>,
  mapRow: (row: RawRow) => T | null
): Promise<(T & { id: string })[] | null> {
  const rows = await fetchRows(ref);

  if (rows === null) return null;

  return rows
    .map(mapRow)
    .filter((row): row is T & { id: string } => Boolean(row))
    .map((row) => ({ ...row, id: (row as { id: string }).id }));
}

export async function fetchDocument<T>(
  ref: DocumentRef<T>,
  mapRow: (row: RawRow) => T | null
): Promise<T | null> {
  const { data, error } = await fromTable(ref.table).select('*').eq('id', ref.id).maybeSingle();

  if (error) {
    console.error('get failed', ref.table, error.message);
    return null;
  }

  return mapRow(data as RawRow);
}

export async function getCollectionCount(ref: CollectionRef): Promise<number> {
  const builder = applyConstraints(
    fromTable(ref.table).select('id', { count: 'exact', head: true }),
    ref.constraints.filter((c) => c.type !== 'limit')
  );
  const { count, error } = await builder;

  if (error) return 0;

  return count ?? 0;
}

/** Fetch profiles for a list of owner ids and merge them onto the items. */
export async function populateUsers<
  T extends { createdBy: string }
>(items: T[]): Promise<(T & { user: User })[]> {
  const ownerIds = [...new Set(items.map(({ createdBy }) => createdBy))];

  if (!ownerIds.length) return items.map((item) => ({ ...item, user: null as unknown as User }));

  const { data, error } = await fromTable('profiles').select('*').in('id', ownerIds);

  if (error) {
    console.error('populateUsers failed', error.message);
    return items.map((item) => ({ ...item, user: null as unknown as User }));
  }

  const usersById = new Map(
    ((data as RawRow[]) ?? []).map((row) => [row.id as string, mapProfile(row)])
  );

  return items.map((item) => ({ ...item, user: usersById.get(item.createdBy) as User }));
}

export type { Tweet, TweetWithUser, User, Stats, Bookmark };
