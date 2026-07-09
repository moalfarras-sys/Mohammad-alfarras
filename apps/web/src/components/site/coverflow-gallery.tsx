"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type CoverflowImage = { id?: string; src: string; alt: string; label?: string };

/**
 * 3D cover-flow gallery. The active image faces front; neighbours rotate back in
 * perspective. Fully interactive: prev/next buttons, dots, drag/swipe, arrow keys,
 * and clicking a side card brings it to the front. Respects prefers-reduced-motion
 * (falls back to a flat fade) and never overflows on mobile.
 */
export function CoverflowGallery({
  images,
  locale,
  className,
}: {
  images: CoverflowImage[];
  locale: "ar" | "en";
  className?: string;
}) {
  const isAr = locale === "ar";
  const total = images.length;
  const [rawActive, setActive] = useState(0);
  // Derive (clamp) the active index during render so a shrinking image list can
  // never point past the end — avoids a setState-in-effect.
  const active = total > 0 ? Math.min(rawActive, total - 1) : 0;
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  const go = useCallback(
    (dir: number) => {
      if (total < 2) return;
      setActive((prev) => (prev + dir + total) % total);
    },
    [total],
  );

  // Gentle autoplay: advance every 5s, pause while the visitor hovers,
  // touches, or focuses the gallery, and never run under reduced motion or
  // in a hidden tab. One interval per mount — no re-arming, no stacking.
  useEffect(() => {
    if (total < 2) return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (pausedRef.current || document.hidden || dragRef.current) return;
      setActive((prev) => (prev + 1) % total);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [total]);

  // Keyboard navigation when the gallery has focus.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(isAr ? -1 : 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(isAr ? 1 : -1);
      }
    },
    [go, isAr],
  );

  // Pointer drag / touch swipe.
  function onPointerDown(event: React.PointerEvent) {
    dragRef.current = { x: event.clientX, moved: false };
  }
  function onPointerMove(event: React.PointerEvent) {
    if (!dragRef.current) return;
    if (Math.abs(event.clientX - dragRef.current.x) > 8) dragRef.current.moved = true;
  }
  function onPointerUp(event: React.PointerEvent) {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    const delta = event.clientX - start.x;
    if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
  }

  if (total === 0) return null;

  if (total === 1) {
    const only = images[0];
    return (
      <div className={`cf-gallery cf-gallery-single ${className ?? ""}`}>
        <div className="cf-stage cf-stage-single">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cf-slide-img" src={only.src} alt={only.alt} loading="lazy" decoding="async" />
          {only.label ? <span className="cf-label">{only.label}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`cf-gallery ${className ?? ""}`}
      role="group"
      aria-roledescription={isAr ? "معرض صور" : "carousel"}
      aria-label={isAr ? "معرض صور ثلاثي الأبعاد" : "3D image gallery"}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => (pausedRef.current = true)}
      onPointerLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
    >
      <div
        ref={stageRef}
        className="cf-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragRef.current = null)}
      >
        {images.map((image, index) => {
          let offset = index - active;
          // Shortest wrap-around distance so the flow feels circular.
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;
          const abs = Math.abs(offset);
          const hidden = abs > 2;
          // Deeper cinema arc: side cards sink down and back while turning away.
          const style = {
            transform: `translateX(${offset * 54}%) translateY(${abs * 14}px) translateZ(${-abs * 175}px) rotateY(${offset * -42}deg) scale(${
              offset === 0 ? 1 : 0.8
            })`,
            opacity: hidden ? 0 : offset === 0 ? 1 : abs === 1 ? 0.74 : 0.36,
            zIndex: 50 - abs,
            pointerEvents: hidden ? ("none" as const) : ("auto" as const),
          };
          return (
            <button
              type="button"
              key={image.id ?? `${image.src}-${index}`}
              className={`cf-slide ${offset === 0 ? "cf-slide-active" : ""}`}
              style={style}
              aria-hidden={offset !== 0}
              tabIndex={offset === 0 ? 0 : -1}
              aria-label={offset === 0 ? image.label || image.alt : isAr ? "اعرض هذه الصورة" : "Show this image"}
              onClick={() => {
                if (dragRef.current?.moved) return;
                if (offset !== 0) setActive(index);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cf-slide-img" src={image.src} alt={image.alt} loading="lazy" decoding="async" draggable={false} />
              {image.label && offset === 0 ? <span className="cf-label">{image.label}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="cf-controls">
        <button type="button" className="cf-btn" onClick={() => go(-1)} aria-label={isAr ? "السابق" : "Previous"}>
          {isAr ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className="cf-dots" role="tablist">
          {images.map((image, index) => (
            <button
              key={image.id ?? `dot-${index}`}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`${isAr ? "صورة" : "Image"} ${index + 1}`}
              className={`cf-dot ${index === active ? "cf-dot-active" : ""}`}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
        <button type="button" className="cf-btn" onClick={() => go(1)} aria-label={isAr ? "التالي" : "Next"}>
          {isAr ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <p className="cf-live" aria-live="polite">
        {`${active + 1} / ${total}`}
      </p>
    </div>
  );
}
