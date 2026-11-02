import { useMemo } from 'react';
import { useRouter } from '@lib/router';
import { Popover } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import cn from 'clsx';
import { toast } from 'react-hot-toast';
import { useAuth } from '@lib/context/auth-context';
import { useFollowAction } from '@lib/hooks/useFollowAction';
import { useModal } from '@lib/hooks/useModal';
import {
  getTweetById,
  removeTweet,
  manageReply,
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

    await Promise.all([
      removeTweet(tweetId),
      parentId && manageReply('decrement', parentId)
    ]);

    toast.success(
      `${isInAdminControl ? `@${username}'s` : 'Your'} Tweet was deleted`
    );

    removeCloseModal();
  };

  const handlePin = async (): Promise<void> => {
    await managePinnedTweet(tweetIsPinned ? 'unpin' : 'pin', userId, tweetId);
    toast.success(
      `Your tweet was ${tweetIsPinned ? 'unpinned' : 'pinned'} to your profile`
    );
    pinCloseModal();
  };

  const handleFollow =
    (closeMenu: () => void, ...args: Parameters<typeof manageFollow>) =>
    async (): Promise<void> => {
      const [type] = args;

      closeMenu();
      await toggleFollow();

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
                <Popover.Panel
                  className='menu-container group absolute top-[50px] right-0 z-20 w-64 max-w-[calc(100vw-32px)] text-light-primary 
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
                    <Button disabled title='Post editing is not available yet' className='flex w-full items-center gap-3 rounded-none p-4 text-left disabled:opacity-50'><HeroIcon iconName='PencilSquareIcon' />Edit Post</Button>
                    <Button disabled title='Reply permissions are not available yet' className='flex w-full items-center gap-3 rounded-none p-4 text-left disabled:opacity-50'><HeroIcon iconName='ChatBubbleLeftRightIcon' /><span>Change who can reply</span></Button>
                  </>}
                  {!isOwner && <>
                    <Button disabled title='Muting is not available yet' className='flex w-full items-center gap-3 rounded-none p-4 text-left disabled:opacity-50'><HeroIcon iconName='SpeakerXMarkIcon' />Mute</Button>
                    <Button disabled title='Blocking is not available yet' className='flex w-full items-center gap-3 rounded-none p-4 text-left disabled:opacity-50'><HeroIcon iconName='NoSymbolIcon' /><span className='break-all'>Block @{username}</span></Button>
                  </>}
                  <Popover.Button as={Button} className='accent-tab flex w-full items-center gap-3 rounded-none p-4 text-left hover:bg-main-sidebar-background' onClick={preventBubbling(() => { close(); if (isOwner) void push(`/analytics?post=${tweetId}`); else activityOpenModal(); })}>
                    <HeroIcon iconName='ChartBarIcon' />View post activity
                  </Popover.Button>
                  {!isOwner && <Button disabled title='Reporting is not available yet' className='flex w-full items-center gap-3 rounded-none p-4 text-left disabled:opacity-50'><HeroIcon iconName='FlagIcon' />Report post</Button>}
                </Popover.Panel>
              )}
            </AnimatePresence>
          </>
        )}
      </Popover>
      <Modal open={activityOpen} closeModal={activityCloseModal} modalClassName='w-full max-w-sm rounded-lg bg-main-background p-6'>
        <div className='space-y-4 text-light-primary dark:text-dark-primary'>
          <h2 className='text-xl font-bold'>Post activity</h2>
          <p className='text-light-secondary dark:text-dark-secondary'>Detailed analytics are only available to the author. Public likes, replies, and repost counts appear below the post.</p>
          <Button onClick={activityCloseModal} className='w-full bg-main-accent py-2 font-bold text-main-accent-foreground'>Close</Button>
        </div>
      </Modal>
    </>
  );
}
