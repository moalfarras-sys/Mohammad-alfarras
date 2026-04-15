"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export type SiteTheme = "dark" | "light";

export function useThemeMode() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
