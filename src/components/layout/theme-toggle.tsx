"use client";

import { useEffect, useState } from "react";

import type { Locale } from "@/types/cms";

type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("mf-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return getInitialTheme();
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
  }, [mounted, theme]);

  if (!mounted) {
    return (
      <button className="theme-toggle" type="button" aria-label="Toggle theme">
        <span>🌙</span>
      </button>
    );
  }

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("mf-theme", next);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={locale === "ar" ? "تبديل الثيم" : "Toggle theme"}
      title={locale === "ar" ? "تبديل الثيم" : "Toggle theme"}
    >
      <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>
    </button>
  );
}
