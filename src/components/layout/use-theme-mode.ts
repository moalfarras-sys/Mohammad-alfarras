"use client";

import { useEffect, useState } from "react";

export type SiteTheme = "dark" | "light";

const THEME_KEY = "moalfarras-theme";
const THEME_EVENT = "moalfarras-theme-change";

function preferredTheme(): SiteTheme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "dark";
}

function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent<SiteTheme>(THEME_EVENT, { detail: theme }));
}

export function useThemeMode() {
  const [theme, setTheme] = useState<SiteTheme>(() => preferredTheme());

  useEffect(() => {
    function handleThemeChange(event: Event) {
      const nextTheme = (event as CustomEvent<SiteTheme>).detail;
      if (nextTheme === "dark" || nextTheme === "light") {
        setTheme(nextTheme);
      } else {
        setTheme(preferredTheme());
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_KEY) {
        setTheme(preferredTheme());
      }
    }

    window.addEventListener(THEME_EVENT, handleThemeChange as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return {
    theme,
    setTheme(nextTheme: SiteTheme) {
      setTheme(nextTheme);
      applyTheme(nextTheme);
    },
    toggleTheme() {
      const nextTheme = theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    },
  };
}
