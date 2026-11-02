import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { setAccountRestriction } from '@lib/post-controls.functions';
import { PostControlDialog } from './post-control-dialog';
import type { PostControlMode } from './post-control-dialog';
import { useRouter } from '@lib/router';
import { Popover, Portal } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import cn from 'clsx';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { useFollowAction } from '@lib/hooks/useFollowAction';
import { useModal } from '@lib/hooks/useModal';
import {
  getTweetById,
  removeTweet,
  manageFollow,
  managePinnedTweet
} from '@lib/firebase/utils';
import { delayScroll, preventBubbling, sleep } from '@lib/utils';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { Button } from '@components/ui/button';
import { ToolTip } from '@components/ui/tooltip';
import { HeroIcon } from '@components/ui/hero-icon';
import { CustomIcon } from '@components/ui/custom-icon';
import type { Variants } from 'framer-motion';
import type { Tweet } from '@lib/types/tweet';
import type { User } from '@lib/types/user';

export const variants: Variants = {
  initial: { opacity: 0, y: -25 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', duration: 0.4 }
  },
  exit: { opacity: 0, y: -25, transition: { duration: 0.2 } }
};

type TweetActionsProps = Pick<Tweet, 'createdBy'> & {
  isOwner: boolean;
  ownerId: string;
  tweetId: string;
  username: string;
  parentId?: string;
  hasImages: boolean;
  viewTweet?: boolean;
};

type PinModalData = Record<'title' | 'description' | 'mainBtnLabel', string>;

const pinModalData: Readonly<PinModalData[]> = [
  {
    title: 'Pin Post to profile?',
    description:
      'This will appear at the top of your profile and replace any previously pinned Post.',
    mainBtnLabel: 'Pin'
  },
  {
    title: 'Unpin Post from profile?',
    description:
      'This will no longer appear automatically at the top of your profile.',
    mainBtnLabel: 'Unpin'
  }
];

export function TweetActions({
  isOwner,
  ownerId,
  tweetId,
  parentId,
  username,
  hasImages,
  viewTweet,
  createdBy
}: TweetActionsProps): JSX.Element {
  const { user, isAdmin } = useAuth();
  const { push } = useRouter();
  const [menuTop, setMenuTop] = useState(16);
  const [controlMode, setControlMode] = useState<PostControlMode | null>(null);
  const [restriction, setRestriction] = useState<'mute' | 'block' | null>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const restrict = useServerFn(setAccountRestriction);
  const { followed: userIsFollowed, toggle: toggleFollow } = useFollowAction(createdBy);

  const {
    open: removeOpen,
    openModal: removeOpenModal,
    closeModal: removeCloseModal
  } = useModal();

  const {
    open: pinOpen,
    openModal: pinOpenModal,
    closeModal: pinCloseModal
  } = useModal();

  const { open: activityOpen, openModal: activityOpenModal, closeModal: activityCloseModal } = useModal();

  const { id: userId, following, pinnedTweet } = user as User;

  const isInAdminControl = isAdmin && !isOwner;
  const tweetIsPinned = pinnedTweet === tweetId;

  const handleRemove = async (): Promise<void> => {
    if (viewTweet)
      if (parentId) {
        const parent = await getTweetById(parentId);
        if (parent) {
          await push(`/tweet/${parentId}`);
          delayScroll(200)();
          await sleep(50);
        } else await push('/home');
      } else await push('/home');

    try { await removeTweet(tweetId); } catch { toast.error('Could not delete the post.'); return; }
    await queryClient.invalidateQueries();

    toast.success(
      `${isInAdminControl ? `@${username}'s` : 'Your'} post was deleted`
    );

    removeCloseModal();
  };

  const handlePin = async (): Promise<void> => {
    try { await managePinnedTweet(tweetIsPinned ? 'unpin' : 'pin', userId, tweetId); } catch { toast.error('Could not pin this post.'); return; }
    await queryClient.invalidateQueries();
    toast.success(
      `Your post was ${tweetIsPinned ? 'unpinned' : 'pinned'} to your profile`
    );
    pinCloseModal();
  };

  const handleFollow =
    (closeMenu: () => void, ...args: Parameters<typeof manageFollow>) =>
    async (): Promise<void> => {
      const [type] = args;

      closeMenu();
      const updated = await toggleFollow();
      if (!updated) return;

      toast.success(
        `You ${type === 'follow' ? 'followed' : 'unfollowed'} @${username}`
      );
    };


  const currentPinModalData = useMemo(
    () => pinModalData[+tweetIsPinned],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinOpen]
  );

  return (
    <>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={removeOpen}
        closeModal={removeCloseModal}
      >
        <ActionModal
          title='Delete Post?'
          description={`This can’t be undone and it will be removed from ${
            isInAdminControl ? `@${username}'s` : 'your'
          } profile, the timeline of any accounts that follow ${
            isInAdminControl ? `@${username}` : 'you'
          }, and from Chorui search results.`}
          mainBtnClassName='bg-accent-red hover:bg-accent-red/90 active:bg-accent-red/75 accent-tab
                            focus-visible:bg-accent-red/90'
          mainBtnLabel='Delete'
          focusOnMainBtn
          action={handleRemove}
          closeModal={removeCloseModal}
        />
      </Modal>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={pinOpen}
        closeModal={pinCloseModal}
      >
        <ActionModal
          {...currentPinModalData}
          mainBtnClassName='bg-light-primary hover:bg-light-primary/90 active:bg-light-primary/80 dark:text-light-primary
                            dark:bg-light-border dark:hover:bg-light-border/90 dark:active:bg-light-border/75'
          focusOnMainBtn
          action={handlePin}
          closeModal={pinCloseModal}
        />
      </Modal>
      <Popover className='relative' as='div'>
        {({ open, close }): JSX.Element => (
          <>
            <Popover.Button
              aria-label='More post options'
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setMenuTop(Math.max(16, Math.min(rect.bottom + 8, window.innerHeight - 350)));
              }}
              as={Button}
              className={cn(
                `main-tab group p-2 ${viewTweet ? 'absolute top-2 right-2' : 'relative'}
                 hover:bg-accent-blue/10 focus-visible:bg-accent-blue/10
                 focus-visible:ring-accent-blue/80! active:bg-accent-blue/20`,
                open && 'bg-accent-blue/10 [&>div>svg]:text-accent-blue'
              )}
            >
              <div className='group relative'>
                <HeroIcon
                  className='h-5 w-5 text-light-secondary group-hover:text-accent-blue
                             group-focus-visible:text-accent-blue dark:text-dark-secondary/80'
                  iconName='EllipsisVerticalIcon'
                />
                {!open && <ToolTip tip='More' />}
              </div>
            </Popover.Button>
            <AnimatePresence>
              {open && (
                <Portal>
                <Popover.Panel
                  style={{ top: menuTop }}
                  className='menu-container group fixed right-4 z-50 max-h-[calc(100dvh-32px)] w-64 max-w-[calc(100vw-32px)] overflow-y-auto bg-main-background text-light-primary 
                             dark:text-dark-primary'
                  as={motion.div}
                  {...variants}
                  static
                >
                  {isOwner ? (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(pinOpenModal)}
                    >
                      {tweetIsPinned ? (
                        <>
                          <CustomIcon iconName='PinOffIcon' />
                          Unpin from profile
                        </>
                      ) : (
                        <>
                          <CustomIcon iconName='PinIcon' />
                          Pin to your profile
                        </>
                      )}
                    </Popover.Button>
                  ) : userIsFollowed ? (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(
                        handleFollow(close, 'unfollow', userId, createdBy)
                      )}
                    >
                      <HeroIcon iconName='UserMinusIcon' />
                      Unfollow @{username}
                    </Popover.Button>
                  ) : (
                    <Popover.Button
                      className='accent-tab flex w-full gap-3 rounded-md rounded-t-none p-4 hover:bg-main-sidebar-background'
                      as={Button}
                      onClick={preventBubbling(
                        handleFollow(close, 'follow', userId, createdBy)
                      )}
                    >
                      <HeroIcon iconName='UserPlusIcon' />
                      Follow @{username}
                    </Popover.Button>
                  )}
                  {isOwner && <>
                    <Popover.Button as={Button} className='accent-tab flex w-full items-center gap-3 rounded-none p-4 text-left text-accent-red hover:bg-main-sidebar-background' onClick={preventBubbling(removeOpenModal)}>
                      <HeroIcon iconName='TrashIcon' />Delete Post
                    </Popover.Button>
                    <Popover.Button as={Button} onClick={() => setControlMode('edit')} className='flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background'><HeroIcon iconName='PencilSquareIcon' />Edit Post</Popover.Button>
                    <Popover.Button as={Button} onClick={() => setControlMode('replies')} className='flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background'><HeroIcon iconName='ChatBubbleLeftRightIcon' /><span>Change who can reply</span></Popover.Button>
                  </>}
                  {!isOwner && <>
                    <Popover.Button as={Button} onClick={() => setRestriction('mute')} className='flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background'><HeroIcon iconName='SpeakerXMarkIcon' />Mute</Popover.Button>
                    <Popover.Button as={Button} onClick={() => setRestriction('block')} className='flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background'><HeroIcon iconName='NoSymbolIcon' /><span className='break-all'>Block @{username}</span></Popover.Button>
                  </>}
                  <Popover.Button as={Button} className='accent-tab flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background' onClick={preventBubbling(() => { close(); if (isOwner) void push(`/analytics?post=${tweetId}`); else activityOpenModal(); })}>
                    <HeroIcon iconName='ChartBarIcon' />View post activity
                  </Popover.Button>
                  {!isOwner && <Popover.Button as={Button} onClick={() => setControlMode('report')} className='flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background'><HeroIcon iconName='FlagIcon' />Report post</Popover.Button>}
                </Popover.Panel>
                </Portal>
              )}
            </AnimatePresence>
          </>
        )}
      </Popover>
      {(controlMode || activityOpen) && <PostControlDialog mode={controlMode ?? 'activity'} postId={tweetId} hasImages={hasImages} close={() => { setControlMode(null); activityCloseModal(); }} />}
      <Modal open={!!restriction} closeModal={() => setRestriction(null)} modalClassName='w-full max-w-sm rounded-lg bg-main-background p-6'>
        <div className='space-y-4 text-light-primary dark:text-dark-primary'><h2 className='text-xl font-bold'>{restriction === 'block' ? 'Block' : 'Mute'} @{username}?</h2><p className='text-light-secondary dark:text-dark-secondary'>{restriction === 'block' ? 'Posts will be hidden and you cannot follow, reply, react, or message each other. Existing follows are removed.' : 'Their posts and notifications will be hidden for your account.'}</p><div className='flex gap-3'><Button disabled={busy} className='flex-1 border border-light-border py-2 dark:border-dark-border' onClick={() => setRestriction(null)}>Cancel</Button><Button loading={busy} className='flex-1 bg-main-accent py-2 font-bold text-main-accent-foreground' onClick={async () => {
          if (!restriction || busy) return; const kind = restriction; setBusy(true);
          try { await restrict({ data: { targetId: createdBy, kind, enabled: true } }); setRestriction(null); await queryClient.invalidateQueries(); window.dispatchEvent(new Event('app:data-changed')); window.dispatchEvent(new Event('app:profile-updated'));
            toast.success(t => <span>{kind === 'block' ? 'Blocked' : 'Muted'} @{username} <Button className='ml-3 font-bold underline' onClick={async () => { try { await restrict({ data: { targetId: createdBy, kind, enabled: false } }); await queryClient.invalidateQueries(); toast.dismiss(t.id); } catch { toast.error('Could not undo.'); } }}>Undo</Button></span>, { duration: 8000 });
          } catch { toast.error('Could not update the account.'); } finally { setBusy(false); }
        }}>{restriction === 'block' ? 'Block' : 'Mute'}</Button></div></div>
      </Modal>
    </>
  );
}
