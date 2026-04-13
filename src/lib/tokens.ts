export const themeTokens = {
  colors: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#F59E0B",
    bg: "#050507",
    surface: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    text: "#F8F8FF",
    textSoft: "#94A3B8",
    textMuted: "#475569",
  },
  radius: {
    md: "16px",
    lg: "20px",
    xl: "24px",
    xxl: "32px",
  },
  shadow: {
    soft: "0 4px 40px rgba(0,0,0,0.4)",
    glow: "0 22px 80px rgba(99, 102, 241, 0.22)",
  },
  spacing: {
    section: "clamp(4rem, 8vw, 7rem)",
    container: "1240px",
  },
  motion: {
    smooth: "320ms cubic-bezier(0.16, 1, 0.3, 1)",
    float: "20s ease-in-out infinite alternate",
  },
  breakpoints: {
    sm: 720,
    md: 960,
    lg: 1200,
  },
} as const;

export type ThemeTokens = typeof themeTokens;
