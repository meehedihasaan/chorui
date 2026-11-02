import { createConversation } from '@lib/hooks/useMessages';
import { useNavigate } from '@tanstack/react-router';
import { useParams } from '@tanstack/react-router';
import { useRouter } from '@lib/router';
import { motion } from 'framer-motion';
import { useAuth } from '@lib/context/auth-context';
import { useUser } from '@lib/context/user-context';
import { SEO } from '@components/common/seo';
import { UserHomeCover } from '@components/user/user-home-cover';
import { UserHomeAvatar } from '@components/user/user-home-avatar';
import { UserDetails } from '@components/user/user-details';
import { UserNav } from '@components/user/user-nav';
import { ComposeEntry } from '@components/home/compose-entry';
import { Button } from '@components/ui/button';
import { Loading } from '@components/ui/loading';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import { FollowButton } from '@components/ui/follow-button';
import { variants } from '@components/user/user-header';
import { UserEditProfile } from '@components/user/user-edit-profile';
import { UserShare } from '@components/user/user-share';
import type { LayoutProps } from './common-layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function UserHomeLayout({ children }: LayoutProps): JSX.Element {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { user: userData, loading } = useUser();

  const { id } = useParams({ strict: false }) as { id?: string };

  const coverData = userData?.coverPhotoURL
    ? { src: userData.coverPhotoURL, alt: userData.name }
    : null;

  const profileData = userData
    ? { src: userData.photoURL, alt: userData.name }
    : null;

  const { id: userId } = user ?? {};

  const isOwner = userData?.id === userId;
  const targetId = userData?.id;
  const { data: bannedData, isLoading: banLoading } = useQuery({
    queryKey: ['is-banned', targetId],
    enabled: !!targetId,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data } = await supabase.rpc('is_banned', { _user_id: targetId! });
      return !!data;
    }
  });
  const suspended = !!bannedData;
  const banChecked = !targetId || !banLoading;

  return (
    <>
      {userData && (
        <SEO
          title={`${`${userData.name} (@${userData.username})`} / Twitter`}
        />
      )}
      <motion.section {...variants} exit={undefined}>
        {loading ? (
          <Loading className='mt-5' />
        ) : !userData ? (
          <>
            <UserHomeCover />
            <div className='flex flex-col gap-8'>
              <div className='relative flex flex-col gap-3 px-4 py-3'>
                <UserHomeAvatar />
                <p className='text-xl font-bold'>@{id}</p>
              </div>
              <div className='p-8 text-center'>
                <p className='text-3xl font-bold'>This account doesn’t exist</p>
                <p className='text-light-secondary dark:text-dark-secondary'>
                  Try searching for another.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <UserHomeCover coverData={coverData} />
            <div className='relative flex flex-col gap-3 px-4 py-3'>
              <div className='flex justify-between'>
                <UserHomeAvatar profileData={profileData} />
                {isOwner ? (
                  <UserEditProfile />
                ) : (
                  <div className='flex gap-2 self-start'>
                    <UserShare username={userData.username} />
                    <div
                      aria-disabled={suspended}
                      className={suspended ? 'pointer-events-none flex gap-2 opacity-50' : 'contents'}
                    >
                    <Button
                      disabled={suspended}
                      onClick={async () => {
                        if (!userId) return;
                        const cid = await createConversation(userId, userData.id);
                        if (cid) void navigate({ to: '/messages/$id', params: { id: cid } });
                      }}
                      className='dark-bg-tab group relative border border-light-line-reply p-2
                                 hover:bg-light-primary/10 active:bg-light-primary/20 dark:border-light-secondary 
                                 dark:hover:bg-dark-primary/10 dark:active:bg-dark-primary/20'
                    >
                      <HeroIcon className='h-5 w-5' iconName='EnvelopeIcon' />
                      <ToolTip tip='Message' />
                    </Button>
                    <FollowButton
                      userTargetId={userData.id}
                      userTargetUsername={userData.username}
                    />
                    </div>
                    {isAdmin && <UserEditProfile hide />}
                  </div>
                )}
              </div>
              <UserDetails {...userData} />
            </div>
          </>
        )}
      </motion.section>
      {userData && (
        <>
          <UserNav />
          {!banChecked ? (
            <Loading className='mt-5' />
          ) : suspended ? (
            <div className='p-8 text-center'>
              <p className='text-3xl font-bold'>Account suspended</p>
              <p className='text-light-secondary dark:text-dark-secondary'>
                This account has been suspended, so its posts aren’t available.
              </p>
            </div>
          ) : (
            <>
              <ComposeEntry />
              {children}
            </>
          )}
        </>
      )}
    </>
  );
}
