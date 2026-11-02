import { useQuery } from '@tanstack/react-query';
import Link from '@lib/router';
import { supabase } from '@/integrations/supabase/client';
import { resolveAvatarUrl } from '@lib/default-avatar';
import { UserAvatar } from '@components/user/user-avatar';
import { UserName } from '@components/user/user-name';

type Highlight = {
  id: string;
  text: string | null;
  likes: number;
  name: string;
  username: string;
  verified: boolean;
  photoURL: string;
};

async function fetchHighlight(postId: string): Promise<Highlight | null> {
  const { data: replies } = await supabase
    .from('tweets')
    .select('id, text, user_likes, created_by, created_at')
    .eq('parent_id', postId)
    .order('created_at', { ascending: true })
    .limit(30);
  const withText = (replies ?? []).filter((r) => r.text);
  if (!withText.length) return null;
  const top = [...withText].sort(
    (a, b) => ((b.user_likes as string[] | null)?.length ?? 0) - ((a.user_likes as string[] | null)?.length ?? 0)
  )[0];
  const { data: author } = await supabase
    .from('profiles')
    .select('name, username, verified, photo_url')
    .eq('id', top.created_by)
    .maybeSingle();
  if (!author) return null;
  return {
    id: top.id,
    text: top.text,
    likes: (top.user_likes as string[] | null)?.length ?? 0,
    name: author.name as string,
    username: author.username as string,
    verified: !!author.verified,
    photoURL: resolveAvatarUrl(author.photo_url as string | null)
  };
}

export function HighlightedReply({
  postId,
  replyCount
}: {
  postId: string;
  replyCount: number;
}): JSX.Element | null {
  const { data } = useQuery({
    queryKey: ['highlighted-reply', postId, replyCount],
    queryFn: () => fetchHighlight(postId),
    enabled: replyCount > 0,
    staleTime: 60_000
  });

  if (!data) return null;

  return (
    <Link href={`/tweet/${postId}`}>
      <a className='mt-1 flex gap-2 rounded-2xl bg-main-sidebar-background p-3 text-left
                    transition hover:brightness-95 dark:hover:brightness-110'>
        <UserAvatar src={data.photoURL} alt={data.name} username={data.username} size={28} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1 text-sm'>
            <UserName name={data.name} username={data.username} verified={data.verified} />
            <span className='truncate text-light-secondary dark:text-dark-secondary'>
              @{data.username}
            </span>
          </div>
          <p className='line-clamp-2 whitespace-pre-line break-words text-sm'>{data.text}</p>
          {replyCount > 1 && (
            <p className='mt-1 text-sm text-light-secondary dark:text-dark-secondary'>
              View all {replyCount} comments
            </p>
          )}
        </div>
      </a>
    </Link>
  );
}
