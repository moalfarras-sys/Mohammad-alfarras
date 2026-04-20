"use client";

/**
 * AtmosphericBackground — creator-minimal.
 * Keeps the canvas calm: a single soft aurora tint + a subtle grid in dark mode.
 * No heavy orbs, no animation, no parallax. Lets typography and content breathe.
 */
export function AtmosphericBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--background)" }} />

      {/* One very soft aurora tint, top-left, to give depth without glass. */}
      <div
        className="absolute -left-[15%] -top-[20%] h-[60vh] w-[60vh] opacity-60"
        style={{
          background: "radial-gradient(closest-side, var(--aurora-a), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Dark-only hairline grid, very low alpha, only visible close-up. */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          color: "var(--foreground)",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 85%)",
        }}
      />
    </div>
  );
}
