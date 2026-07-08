import { useId } from "react";

/**
 * Mo AI robot head — hand-drawn SVG mascot.
 * All motion (blink, look-around, antenna pulse, mouth smile) is driven by
 * `moai-*` CSS classes in globals.css so the SVG stays paint-only and cheap.
 */
export function MoAiRobot({ className }: { className?: string }) {
  const id = useId();
  const head = `${id}-head`;
  const visor = `${id}-visor`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className ? `mo-bot ${className}` : "mo-bot"}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={head} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#31e8ff" />
          <stop offset="55%" stopColor="#0e9fdd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1428" />
          <stop offset="100%" stopColor="#040a18" />
        </linearGradient>
      </defs>

      {/* antenna */}
      <line x1="32" y1="7.5" x2="32" y2="13" stroke="#7ceeff" strokeWidth="2.4" strokeLinecap="round" />
      <circle className="mo-bot-tip" cx="32" cy="6" r="3.1" fill="#7ceeff" />

      {/* side pods */}
      <rect x="3.5" y="26" width="6.5" height="13" rx="3.2" fill="#0e9fdd" opacity="0.9" />
      <rect x="54" y="26" width="6.5" height="13" rx="3.2" fill="#8b5cf6" opacity="0.9" />

      {/* head */}
      <rect x="10" y="12.5" width="44" height="40" rx="14.5" fill={`url(#${head})`} stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" />
      {/* glass shine */}
      <path d="M15 21c1.5-4 5-6.5 9-7" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* visor */}
      <rect x="15.5" y="20.5" width="33" height="24.5" rx="10.5" fill={`url(#${visor})`} stroke="rgba(124,238,255,0.28)" strokeWidth="0.8" />

      {/* eyes (blink + look-around via CSS) */}
      <g className="mo-bot-eyes">
        <rect x="22.4" y="26.6" width="5.6" height="9.6" rx="2.8" fill="#7ceeff" />
        <rect x="36" y="26.6" width="5.6" height="9.6" rx="2.8" fill="#7ceeff" />
      </g>

      {/* mouth */}
      <path className="mo-bot-mouth" d="M26.5 40.4 Q32 44 37.5 40.4" stroke="#7ceeff" strokeWidth="2.1" strokeLinecap="round" fill="none" />

      {/* cheeks */}
      <circle cx="19.9" cy="38.6" r="1.9" fill="#ff8fa8" opacity="0.5" />
      <circle cx="44.1" cy="38.6" r="1.9" fill="#ff8fa8" opacity="0.5" />

      {/* chin light */}
      <rect x="27" y="47.6" width="10" height="2.3" rx="1.15" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}
