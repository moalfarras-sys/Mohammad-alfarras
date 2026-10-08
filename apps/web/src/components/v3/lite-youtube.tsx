"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";

/**
 * Click-to-play YouTube embed. Shows the real thumbnail first and loads the
 * privacy-enhanced player (youtube-nocookie, allowed by the site CSP) only when
 * the visitor presses play, so the page stays fast and sets no YouTube cookies
 * before consent-by-click.
 */
export function LiteYouTube({
  id,
  title,
  playLabel,
  className,
}: {
  id: string;
  title: string;
  playLabel: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`v3-yt-embed${className ? ` ${className}` : ""}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" className="v3-yt-poster" onClick={() => setPlaying(true)} aria-label={`${playLabel}: ${title}`}>
          <Image
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 900px) 92vw, 1100px"
            // Served straight from YouTube's CDN: the optimizer's upstream fetch to
            // i.ytimg.com intermittently returned 404.
            unoptimized
            className="v3-cover"
          />
          <span className="v3-yt-shade" aria-hidden="true" />
          <span className="v3-yt-play" aria-hidden="true">
            <Play fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
