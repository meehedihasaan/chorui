import { useAuth } from '@lib/context/auth-context';
import { useModal } from '@lib/hooks/useModal';
import { preventBubbling } from '@lib/utils';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { Button } from '@components/ui/button';
import { useFollowAction } from '@lib/hooks/useFollowAction';

type FollowButtonProps = {
  userTargetId: string;
  userTargetUsername: string;
};

export function FollowButton({
  userTargetId,
  userTargetUsername
}: FollowButtonProps): JSX.Element | null {
  const { user } = useAuth();
  const { open, openModal, closeModal } = useModal();
  const { followed: userIsFollowed, pending, toggle } = useFollowAction(userTargetId);

  if (user?.id === userTargetId) return null;

  const handleFollow = toggle;

  const handleUnfollow = async (): Promise<void> => {
    closeModal();
    await toggle();
    closeModal();
  };


  return (
    <>
      <Modal
        modalClassName='flex flex-col gap-6 max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={open}
        closeModal={closeModal}
      >
        <ActionModal
          title={`Unfollow @${userTargetUsername}?`}
          description='Their Posts will no longer show up in your home timeline. You can still view their profile, unless their Posts are protected.'
          mainBtnLabel='Unfollow'
          action={handleUnfollow}
          closeModal={closeModal}
        />
      </Modal>
      {userIsFollowed ? (
        <Button
          disabled={pending}
          className='dark-bg-tab btn-mint min-w-[106px] self-start
                     hover:border-accent-red hover:bg-accent-red/10 hover:text-accent-red
                     hover:before:content-["Unfollow"] inner:hover:hidden'
          onClick={preventBubbling(openModal)}
        >
          <span>Following</span>
        </Button>
      ) : (
        <Button
          disabled={pending}
          className='btn-solid min-w-[106px] self-start'
          onClick={preventBubbling(handleFollow)}
        >
          Follow
        </Button>
      )}
    </>
  );
}
