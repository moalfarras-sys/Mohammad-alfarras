"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

/** Persists locale choice for client-side UX hints. */
export function LocalePreferenceLink(props: ComponentProps<typeof Link>) {
  const { href, onClick, ...rest } = props;
  return (
    <Link
      href={href}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        const path = typeof href === "string" ? href : href.pathname ?? "";
        try {
          const lang = path.startsWith("/ar") ? "ar" : "en";
          localStorage.setItem("preferred-lang", lang);
        } catch {
          /* ignore */
        }
        onClick?.(e);
        if (!e.defaultPrevented && typeof href === "string" && !href.includes("?") && window.location.search) {
          e.preventDefault();
          window.location.assign(`${href}${window.location.search}${window.location.hash}`);
        }
      }}
      {...rest}
    />
  );
}
