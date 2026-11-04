import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import cn from 'clsx';
import { useModal } from '@lib/hooks/useModal';
import { preventBubbling } from '@lib/utils';
import { ImageModal } from '@components/modal/image-modal';
import { Modal } from '@components/modal/modal';
import { NextImage } from '@components/ui/next-image';
import { resolveMediaUrl } from '@/lib/media-url';
import { Button } from '@components/ui/button';
import { HeroIcon } from '@components/ui/hero-icon';
import { ToolTip } from '@components/ui/tooltip';
import type { MotionProps } from 'framer-motion';
import type { ImagesPreview, ImageData } from '@lib/types/file';

type ImagePreviewProps = {
  tweet?: boolean;
  viewTweet?: boolean;
  previewCount: number;
  imagesPreview: ImagesPreview;
  removeImage?: (targetId: string) => () => void;
};

const variants: MotionProps = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  },
  exit: { opacity: 0, scale: 0.5 },
  transition: { type: 'spring', duration: 0.5 }
};

type PostImageBorderRadius = Record<number, string[]>;

const postImageBorderRadius: Readonly<PostImageBorderRadius> = {
  1: ['rounded-2xl'],
  2: ['rounded-tl-2xl rounded-bl-2xl', 'rounded-tr-2xl rounded-br-2xl'],
  3: ['rounded-tl-2xl rounded-bl-2xl', 'rounded-tr-2xl', 'rounded-br-2xl'],
  4: ['rounded-tl-2xl', 'rounded-tr-2xl', 'rounded-bl-2xl', 'rounded-br-2xl']
};

export function ImagePreview({
  tweet,
  viewTweet,
  previewCount,
  imagesPreview,
  removeImage
}: ImagePreviewProps): JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const { open, openModal, closeModal } = useModal();

  useEffect(() => {
    const imageData = imagesPreview[selectedIndex];
    setSelectedImage(imageData ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, imagesPreview]);

  const handleVideoStop = (): void => {
    if (videoRef.current) videoRef.current.pause();
  };

  const handleSelectedImage = (index: number, isVideo?: boolean) => () => {
    if (isVideo) handleVideoStop();

    setSelectedIndex(index);
    openModal();
  };

  const handleNextIndex = (type: 'prev' | 'next') => () => {
    const nextIndex =
      type === 'prev'
        ? selectedIndex === 0
          ? previewCount - 1
          : selectedIndex - 1
        : selectedIndex === previewCount - 1
        ? 0
        : selectedIndex + 1;

    setSelectedIndex(nextIndex);
  };

  const isTweet = tweet ?? viewTweet;

  return (
    <div
      className={cn(
        'w-full min-w-0',
        isTweet && previewCount === 1
          ? 'mt-3 block overflow-hidden rounded-2xl border border-light-border dark:border-dark-border'
          : 'grid grid-cols-2 grid-rows-2 rounded-2xl',
        isTweet && previewCount > 1 && 'mt-3 aspect-video gap-0.5 overflow-hidden border border-light-border dark:border-dark-border',
        !isTweet && (previewCount === 1 ? 'aspect-[4/3] max-h-96 gap-3' : 'aspect-[4/3] gap-3')
      )}
    >
      <Modal
        modalClassName={cn(
          'flex justify-center w-full items-center relative',
          isTweet && 'h-full'
        )}
        open={open}
        closeModal={closeModal}
        closePanelOnClick
      >
        {selectedImage && <ImageModal
          tweet={isTweet}
          imageData={selectedImage as ImageData}
          previewCount={previewCount}
          selectedIndex={selectedIndex}
          handleNextIndex={handleNextIndex}
        />}
      </Modal>
      <AnimatePresence mode='popLayout'>
        {imagesPreview.map(({ id, src: rawSrc, alt }, index) => {
          const src = resolveMediaUrl(rawSrc);
          const isVideo = imagesPreview[index].type?.includes('video');

          return (
            <motion.div
              role='button'
              tabIndex={0}
              aria-label={`Preview ${alt}`}
              onKeyDown={e => { if (e.key === 'Enter') handleSelectedImage(index, isVideo)(); }}
              className={cn(
                'accent-tab group relative min-h-0 min-w-0 overflow-hidden transition-shadow',
                isTweet ? '' : 'rounded-2xl',
                {
                  'col-span-2 row-span-2': previewCount === 1,
                  'row-span-2':
                    previewCount === 2 || (index === 0 && previewCount === 3)
                }
              )}
              {...variants}
              onClick={preventBubbling(handleSelectedImage(index, isVideo))}
              layout={!isTweet ? true : false}
              key={id}
            >
              {isVideo ? (
                <>
                  <Button
                    className='visible absolute top-0 right-0 z-10 -translate-x-1 translate-y-1 
                               bg-light-primary/75 p-1 opacity-0 backdrop-blur-sm transition
                               hover:bg-image-preview-hover/75 group-hover:opacity-100 xs:invisible'
                  >
                    <HeroIcon className='h-5 w-5' iconName='ArrowUpRightIcon' />
                  </Button>
                  <video
                    ref={videoRef}
                    className={cn(
                      `relative h-full w-full cursor-pointer transition 
                       hover:brightness-75 hover:duration-200`,
                      isTweet
                        ? postImageBorderRadius[previewCount][index]
                        : 'rounded-2xl'
                    )}
                    src={src}
                    controls
                    muted
                  />
                </>
              ) : isTweet && previewCount === 1 ? (
                <img
                  src={src}
                  alt={alt}
                  loading='lazy'
                  className='block max-h-[510px] w-full cursor-pointer object-cover transition hover:brightness-90'
                />
              ) : (
                <NextImage
                  className='relative h-full w-full cursor-pointer transition 
                             hover:brightness-75 hover:duration-200'
                  imgClassName={cn(!isTweet && 'rounded-2xl')}
                  previewCount={previewCount}
                  layout='fill'
                  src={src}
                  alt={alt}
                  useSkeleton={isTweet}
                />
              )}
              {removeImage && (
                <Button
                  aria-label='Remove photo'
                  className='group absolute top-0 left-0 translate-x-1 translate-y-1
                           bg-light-primary/75 p-1 backdrop-blur-sm 
                           hover:bg-image-preview-hover/75'
                  onClick={preventBubbling(removeImage(id))}
                >
                  <HeroIcon
                    className='h-5 w-5 text-white'
                    iconName='XMarkIcon'
                  />
                  <ToolTip className='translate-y-2' tip='Remove' />
                </Button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
