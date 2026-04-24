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
        try {
          const path = typeof href === "string" ? href : href.pathname ?? "";
          const lang = path.startsWith("/ar") ? "ar" : "en";
          localStorage.setItem("preferred-lang", lang);
        } catch {
          /* ignore */
        }
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
