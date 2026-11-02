import { useRef, useState } from 'react';
import { EmojiGifPicker } from './emoji-gif-picker';
import { motion } from 'framer-motion';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import { variants } from './input';
import { ProgressBar } from './progress-bar';
import type { ChangeEvent, ClipboardEvent } from 'react';
import type { IconName } from '@components/ui/hero-icon';

type Options = {
  name: string;
  iconName: IconName;
  disabled: boolean;
  onClick?: () => void;
}[];

const options: Readonly<Options> = [
  {
    name: 'Media',
    iconName: 'PhotoIcon',
    disabled: false
  },
  {
    name: 'GIF',
    iconName: 'GifIcon',
    disabled: false
  },
  {
    name: 'Emoji',
    iconName: 'FaceSmileIcon',
    disabled: false
  },
  {
    name: 'Poll',
    iconName: 'ChartBarIcon',
    disabled: true
  },
  {
    name: 'Schedule',
    iconName: 'CalendarDaysIcon',
    disabled: true
  },
  {
    name: 'Location',
    iconName: 'MapPinIcon',
    disabled: true
  }
];

type InputOptionsProps = {
  reply?: boolean;
  modal?: boolean;
  inputLimit: number;
  inputLength: number;
  isValidTweet: boolean;
  isCharLimitExceeded: boolean;
  handleImageUpload: (
    e: ChangeEvent<HTMLInputElement> | ClipboardEvent<HTMLTextAreaElement>
  ) => void;
  onEmoji?: (emoji: string) => void;
  onGifFile?: (file: File) => void;
};

export function InputOptions({
  reply,
  modal,
  inputLimit,
  inputLength,
  isValidTweet,
  isCharLimitExceeded,
  handleImageUpload,
  onEmoji,
  onGifFile
}: InputOptionsProps): JSX.Element {
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [picker, setPicker] = useState<'emoji' | 'gif' | null>(null);
  const onClick = (): void => inputFileRef.current?.click();
  const handlers: Record<string, (() => void) | undefined> = {
    Media: onClick,
    GIF: onGifFile ? () => setPicker(p => (p === 'gif' ? null : 'gif')) : undefined,
    Emoji: onEmoji ? () => setPicker(p => (p === 'emoji' ? null : 'emoji')) : undefined
  };

  let filteredOptions = options;

  if (reply)
    filteredOptions = filteredOptions.filter(
      (_, index) => ![3, 4].includes(index)
    );

  return (
    <motion.div className='flex justify-between' {...variants}>
      <div className='relative'>
      <div
        className='flex text-main-accent xs:[&>button:nth-child(n+6)]:hidden 
                   md:[&>button]:!block [&>button:nth-child(n+4)]:hidden'
      >
        <input
          className='hidden'
          type='file'
          accept='image/*,video/*'
          onChange={handleImageUpload}
          ref={inputFileRef}
          multiple
        />
        {filteredOptions.map(({ name, iconName, disabled }, index) => (
          <Button
            className='accent-tab accent-bg-tab group relative rounded-full p-2 
                       hover:bg-main-accent/10 active:bg-main-accent/20'
            onClick={e => { e.preventDefault(); handlers[name]?.(); }}
            aria-label={name}
            disabled={disabled || !handlers[name]}
            key={name}
          >
            <HeroIcon className='h-5 w-5' iconName={iconName} />
            <ToolTip tip={name} modal={modal} />
          </Button>
        ))}
      </div>
      {picker && onEmoji && onGifFile && (
        <EmojiGifPicker
          mode={picker}
          onEmoji={onEmoji}
          onGif={onGifFile}
          onClose={() => setPicker(null)}
        />
      )}
      </div>
      <div className='flex items-center gap-4'>
        <motion.div
          className='flex items-center gap-4'
          animate={
            inputLength ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }
          }
        >
          <ProgressBar
            modal={modal}
            inputLimit={inputLimit}
            inputLength={inputLength}
            isCharLimitExceeded={isCharLimitExceeded}
          />
          {!reply && (
            <>
              <i className='hidden h-8 w-[1px] bg-[#B9CAD3] dark:bg-[#3E4144] xs:block' />
              <Button
                className='group relative hidden rounded-full border border-light-line-reply p-[1px]
                           text-main-accent dark:border-light-secondary xs:block'
                disabled
              >
                <HeroIcon className='h-5 w-5' iconName='PlusIcon' />
                <ToolTip tip='Add' modal={modal} />
              </Button>
            </>
          )}
        </motion.div>
        <Button
          type='submit'
          className='accent-tab bg-main-accent px-4 py-1.5 font-bold text-main-accent-foreground
                     enabled:hover:bg-main-accent/90
                     enabled:active:bg-main-accent/75'
          disabled={!isValidTweet}
        >
          {reply ? 'Reply' : 'Post'}
        </Button>
      </div>
    </motion.div>
  );
}
