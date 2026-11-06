import { useEffect, useState } from 'react';
import { MentionSuggest, currentMention } from './mention-suggest';
import TextArea from 'react-textarea-autosize';
import { motion } from 'framer-motion';
import { useModal } from '@lib/hooks/useModal';
import { Modal } from '@components/modal/modal';
import { ActionModal } from '@components/modal/action-modal';
import { HeroIcon } from '@components/ui/hero-icon';
import { Button } from '@components/ui/button';
import type {
  ReactNode,
  RefObject,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent
} from 'react';
import type { Variants } from 'framer-motion';

type InputFormProps = {
  modal?: boolean;
  formId: string;
  loading: boolean;
  visited: boolean;
  reply?: boolean;
  children: ReactNode;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  inputValue: string;
  replyModal?: boolean;
  keepNav?: boolean;
  isValidTweet: boolean;
  isUploadingImages: boolean;
  sendTweet: () => Promise<void>;
  handleFocus: () => void;
  discardTweet: () => void;
  handleChange: ({
    target: { value }
  }: ChangeEvent<HTMLTextAreaElement>) => void;
  handleImageUpload: (
    e: ChangeEvent<HTMLInputElement> | ClipboardEvent<HTMLTextAreaElement>
  ) => void;
};

const variants: Variants[] = [
  {
    initial: { y: -25, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring' } }
  },
  {
    initial: { x: 25, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: 'spring' } }
  }
];

export const [fromTop, fromBottom] = variants;

export function InputForm({
  modal,
  reply,
  formId,
  loading,
  visited,
  children,
  inputRef,
  replyModal,
  keepNav,
  inputValue,
  isValidTweet,
  isUploadingImages,
  sendTweet,
  handleFocus,
  discardTweet,
  handleChange,
  handleImageUpload
}: InputFormProps): JSX.Element {
  const { open, openModal, closeModal } = useModal();
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const trackMention = (): void => {
    const el = inputRef.current;
    setMention(el ? currentMention(el.value, el.selectionStart ?? el.value.length) : null);
  };
  const pickMention = (username: string): void => {
    const el = inputRef.current;
    if (!el || !mention) return;
    const end = el.selectionStart ?? el.value.length;
    const insert = `@${username} `;
    const value = el.value.slice(0, mention.start) + insert + el.value.slice(end);
    handleChange({ target: { value } } as ChangeEvent<HTMLTextAreaElement>);
    setMention(null);
    const pos = mention.start + insert.length;
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  };

  useEffect(() => handleShowHideNav(true), []);

  const handleKeyboardShortcut = ({
    key,
    ctrlKey
  }: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!modal && key === 'Escape')
      if (isValidTweet) {
        inputRef.current?.blur();
        openModal();
      } else discardTweet();
    else if (ctrlKey && key === 'Enter' && isValidTweet) void sendTweet();
  };

  const handleShowHideNav = (blur?: boolean) => (): void => {
    const sidebar = document.getElementById('sidebar') as HTMLElement;

    if (!sidebar) return;

    if (blur) {
      setTimeout(() => (sidebar.style.opacity = ''), 200);
      return;
    }

    if (keepNav) return;

    if (window.innerWidth < 500) sidebar.style.opacity = '0';
  };

  const handleFormFocus = (): void => {
    handleShowHideNav()();
    handleFocus();
  };

  const handleClose = (): void => {
    discardTweet();
    closeModal();
  };

  const isVisibilityShown = visited && !reply && !replyModal && !loading;

  return (
    <div className='flex min-h-[48px] w-full flex-col justify-center gap-4'>
      <Modal
        modalClassName='max-w-xs bg-main-background w-full p-8 rounded-2xl'
        open={open}
        closeModal={closeModal}
      >
        <ActionModal
          title='Discard Post?'
          description='This can’t be undone and you’ll lose your draft.'
          mainBtnClassName='bg-accent-red hover:bg-accent-red/90 active:bg-accent-red/75'
          mainBtnLabel='Discard'
          action={handleClose}
          closeModal={closeModal}
        />
      </Modal>
      <div className='flex flex-col gap-6'>
        {isVisibilityShown && (
          <motion.button
            type='button'
            className='custom-button accent-tab accent-bg-tab flex cursor-not-allowed items-center gap-1
                       self-start border border-light-line-reply py-0 px-3 text-main-accent
                       hover:bg-main-accent/10 active:bg-main-accent/20 dark:border-light-secondary'
            {...fromTop}
          >
            <p className='font-bold'>Everyone</p>
            <HeroIcon className='h-4 w-4' iconName='ChevronDownIcon' />
          </motion.button>
        )}
        <div className='relative flex items-center gap-3'>
          {mention && <MentionSuggest query={mention.query} onPick={pickMention} />}
          <TextArea
            id={formId}
            className='w-full min-w-0 resize-none bg-transparent text-xl outline-none
                       placeholder:text-light-secondary dark:placeholder:text-dark-secondary'
            value={inputValue}
            placeholder={
              reply || replyModal ? 'Post your reply' : "What's happening?"
            }
            onBlur={() => { handleShowHideNav(true)(); setTimeout(() => setMention(null), 150); }}
            onClick={trackMention}
            minRows={loading ? 1 : modal && !isUploadingImages ? 3 : 1}
            maxRows={isUploadingImages ? 5 : 15}
            onFocus={handleFormFocus}
            onPaste={handleImageUpload}
            onKeyUp={e => { handleKeyboardShortcut(e); trackMention(); }}
            onChange={e => { handleChange(e); trackMention(); }}
            ref={inputRef}
          />
          {reply && !visited && (
            <Button
              className='btn-solid cursor-pointer px-4 py-1.5 opacity-50'
              onClick={handleFocus}
            >
              Reply
            </Button>
          )}
        </div>
      </div>
      {children}
      {isVisibilityShown && (
        <motion.div
          className='flex border-b border-light-border pb-2 dark:border-dark-border'
          {...fromBottom}
        >
          <button
            type='button'
            className='custom-button accent-tab accent-bg-tab flex cursor-not-allowed items-center gap-1 py-0
                       px-3 text-main-accent hover:bg-main-accent/10 active:bg-main-accent/20'
          >
            <HeroIcon className='h-4 w-4' iconName='GlobeAmericasIcon' />
            <p className='font-bold'>Everyone can reply</p>
          </button>
        </motion.div>
      )}
    </div>
  );
}
