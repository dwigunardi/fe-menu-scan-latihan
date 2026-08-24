'use client';

import { useState, useEffect, useCallback, useRef, TouchEvent } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import { BannerData } from '@/lib/validations/banner.schema';
import { usePublicBannersQuery } from '@/hooks/queries/use-admin-banners';
import { cn } from '@/lib/utils/cn';

interface PromoCarouselProps {
  initialBanners?: BannerData[];
  autoPlayInterval?: number;
  className?: string;
}

export function PromoCarousel({
  initialBanners,
  autoPlayInterval = 5000,
  className,
}: PromoCarouselProps) {
  const { data: fetchedBanners, isLoading } = usePublicBannersQuery();
  const banners = initialBanners || fetchedBanners || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalBanners = banners.length;

  const nextSlide = useCallback(() => {
    if (totalBanners === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const prevSlide = useCallback(() => {
    if (totalBanners === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  // Auto-play timer
  useEffect(() => {
    if (totalBanners <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [totalBanners, isPaused, autoPlayInterval, nextSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsPaused(false);
      return;
    }
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  if (isLoading && !initialBanners) {
    return (
      <div
        className={cn(
          'w-full aspect-16/9 rounded-3xl bg-stone-200/80 dark:bg-zinc-800/80 animate-pulse',
          className
        )}
      />
    );
  }

  if (totalBanners === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const renderBannerContent = () => (
    <div className="relative w-full h-full">
      <img
        src={currentBanner.imageUrl}
        alt={currentBanner.title}
        className="w-full h-full object-cover select-none"
        draggable={false}
      />
      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Banner Text Content */}
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Promo Spesial Kafe</span>
        </div>
        <h2 className="text-base sm:text-xl font-bold leading-tight drop-shadow-md">
          {currentBanner.title}
        </h2>
        {currentBanner.description && (
          <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 max-w-xl drop-shadow-sm">
            {currentBanner.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'relative w-full aspect-16/9 rounded-3xl overflow-hidden shadow-lg border border-stone-200/60 dark:border-zinc-800 bg-stone-900 group',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Clickable link wrapper if targetUrl exists */}
      {currentBanner.targetUrl ? (
        <Link
          href={currentBanner.targetUrl}
          className="block w-full h-full cursor-pointer"
        >
          {renderBannerContent()}
        </Link>
      ) : (
        renderBannerContent()
      )}

      {/* Navigation Arrows (Desktop visible on hover) */}
      {totalBanners > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Next Banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicator Dot Pills */}
          <div className="absolute bottom-3.5 right-4 sm:bottom-4 sm:right-6 flex items-center gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                  idx === currentIndex
                    ? 'w-6 bg-amber-500 shadow-sm'
                    : 'w-2 bg-white/50 hover:bg-white/80'
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
