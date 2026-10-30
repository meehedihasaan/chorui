import { useState } from 'react';
import cn from 'clsx';
import type { ReactNode } from 'react';

type NextImageProps = {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  children?: ReactNode;
  className?: string;
  useSkeleton?: boolean;
  imgClassName?: string;
  previewCount?: number;
  blurClassName?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>;

/**
 * @description Drop-in replacement for the source app's next/image wrapper.
 */
export function NextImage({
  src,
  alt,
  width,
  height,
  children,
  className,
  useSkeleton,
  imgClassName,
  previewCount,
  blurClassName,
  ...rest
}: NextImageProps): JSX.Element {
  const [loading, setLoading] = useState(!!useSkeleton);

  const handleLoad = (): void => setLoading(false);

  return (
    <figure style={{ width }} className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={cn(
          imgClassName,
          loading
            ? blurClassName ??
                'animate-pulse bg-light-secondary dark:bg-dark-secondary'
            : previewCount === 1
            ? '!h-auto !min-h-0 !w-auto !min-w-0 rounded-lg object-contain'
            : 'object-cover'
        )}
        src={src}
        width={width as number | undefined}
        height={height as number | undefined}
        alt={alt}
        onLoad={handleLoad}
        {...rest}
      />
      {children}
    </figure>
  );
}

import type * as React from 'react';
