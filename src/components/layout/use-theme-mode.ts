"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export type SiteTheme = "dark" | "light";

function subscribe() {
  return () => {};
}

export function useThemeMode() {
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  const currentTheme = mounted ? (theme === "system" ? systemTheme : theme) || "dark" : "dark";

  return {
    theme: currentTheme as SiteTheme,
    setTheme: (nextTheme: SiteTheme) => {
      setTheme(nextTheme);
    },
    toggleTheme: () => {
      setTheme(currentTheme === "dark" ? "light" : "dark");
    },
  };
}
