"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSliderSettings } from "@/lib/types";

type HeroSliderProps = {
  settings: HeroSliderSettings;
  apiBaseUrl: string;
};

export function HeroSliceCarousel({ settings, apiBaseUrl }: HeroSliderProps) {
  const { images, intervalMs } = settings;
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resolveImageUrl = useCallback(
    (url: string) => {
      if (url.startsWith("/")) {
        return `${apiBaseUrl}${url}`;
      }

      return url;
    },
    [apiBaseUrl],
  );

  const goToSlide = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex || images.length <= 1) {
        return;
      }

      setActiveIndex(nextIndex);
      setProgress(0);
    },
    [activeIndex, images.length],
  );

  const nextSlide = useCallback(() => {
    const next = (activeIndex + 1) % images.length;
    goToSlide(next);
  }, [activeIndex, images.length, goToSlide]);

  // Auto-play timer
  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(nextSlide, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [nextSlide, intervalMs, images.length]);

  // Progress bar
  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    if (progressRef.current) {
      clearInterval(progressRef.current);
    }

    setProgress(0);
    const step = 100 / (intervalMs / 50);

    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next >= 100 ? 100 : next;
      });
    }, 50);

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [activeIndex, intervalMs, images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="hero-slider" aria-label="Hero image carousel">
      {images.map((image, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        const desktopUrl = resolveImageUrl(image.url);
        const hasMobile = image.mobileUrl && image.mobileUrl.trim().length > 0;
        const mobileUrl = hasMobile ? resolveImageUrl(image.mobileUrl!) : null;

        return (
          <div
            aria-hidden={!isActive}
            className={`hero-slider__slide ${isActive ? "hero-slider__slide--active" : ""}`}
            key={image.id}
          >
            {mobileUrl ? (
              <picture>
                <source media="(max-width: 639px)" srcSet={mobileUrl} />
                <img
                  alt={image.alt || ""}
                  className="hero-slider__image"
                  draggable={false}
                  src={desktopUrl}
                />
              </picture>
            ) : (
              <img
                alt={image.alt || ""}
                className="hero-slider__image"
                draggable={false}
                src={desktopUrl}
              />
            )}
          </div>
        );
      })}

      {/* Dots & progress */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
          <div className="hero-slider__progress">
            <div
              className="hero-slider__progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="hero-slider__dots">
            {images.map((_, dotIndex) => (
              <button
                aria-label={`Go to slide ${dotIndex + 1}`}
                className={`hero-slider__dot ${
                  dotIndex === activeIndex ? "hero-slider__dot--active" : ""
                }`}
                key={dotIndex}
                onClick={() => {
                  goToSlide(dotIndex);

                  // Reset auto-play timer on manual navigation
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = setInterval(nextSlide, intervalMs);
                  }
                }}
                type="button"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
