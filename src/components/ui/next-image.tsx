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
  /** Compatibility with the source app's next/image props (ignored). */
  layout?: string;
  onLoadingComplete?: () => void;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

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
  layout,
  onLoadingComplete,
  ...rest
}: NextImageProps): JSX.Element {
  const [loading, setLoading] = useState(!!useSkeleton);

  const handleLoad = (): void => { setLoading(false); onLoadingComplete?.(); };

  const fixedSize = width != null && height != null && layout !== 'fill';

  return (
    <figure
      style={fixedSize ? { width, height } : { width }}
      className={cn(fixedSize && 'shrink-0 overflow-hidden', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={cn(
          imgClassName,
          layout === 'fill' && 'absolute inset-0 h-full w-full',
          fixedSize && 'h-full w-full',
          loading
            ? blurClassName ??
                'animate-pulse bg-light-secondary dark:bg-dark-secondary'
            : previewCount === 1 ? 'object-contain' : 'object-cover'
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
