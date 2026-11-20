'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { formatImageUrl } from '@/lib/api/admin-menus-api';
import { cn } from '@/lib/utils/cn';

export interface AppImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackText?: string;
  containerClassName?: string;
}

export function AppImage({
  src,
  alt = 'Image',
  className,
  containerClassName,
  fallbackText,
  fill,
  width,
  height,
  unoptimized,
  ...props
}: Readonly<AppImageProps>) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const formattedSrc = formatImageUrl(src);

  // Reset error state when src changes (adjusting state during render instead of in an effect)
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setHasError(false);
    setIsLoading(true);
  }

  // Check if src is empty or invalid
  if (!formattedSrc || hasError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-stone-100 dark:bg-zinc-800/80 text-stone-400 dark:text-zinc-500 select-none p-2 text-center',
          fill ? 'w-full h-full absolute inset-0' : '',
          containerClassName,
          className
        )}
        style={!fill && width && height ? { width, height } : undefined}
      >
        <ImageIcon className="h-5 w-5 opacity-60 mb-0.5 shrink-0" />
        {fallbackText && (
          <span className="text-[10px] font-medium leading-tight line-clamp-1">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  // Auto-detect if unoptimized should be forced (e.g. data URL, blob URL, or local IP)
  const isBlobOrData =
    formattedSrc.startsWith('data:') || formattedSrc.startsWith('blob:');
  const shouldBeUnoptimized = unoptimized || isBlobOrData;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        fill ? 'w-full h-full' : '',
        containerClassName
      )}
    >
      <Image
        src={formattedSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        unoptimized={shouldBeUnoptimized}
        className={cn(
          'transition-all duration-300',
          isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...props}
      />

      {/* Subtle Shimmer Skeleton while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-stone-200/60 dark:bg-zinc-800/60 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
