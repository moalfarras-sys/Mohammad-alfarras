export type ProjectFeature = {
  icon: string;
  labelAR: string;
  labelEN: string;
};

export type ProjectLinks = {
  android?: string;
  ios?: string;
  github?: string;
};

export type ProjectEntry = {
  id: string;
  nameAR: string;
  nameEN: string;
  descriptionAR: string;
  descriptionEN: string;
  coverImage: string;
  screenshots: string[];
  features: ProjectFeature[];
  downloadLinks: ProjectLinks;
  status: "live" | "coming-soon" | "beta";
  tags: string[];
};

export const projects: ProjectEntry[] = [
  {
    id: "moplayer",
    nameAR: "MoPlayer",
    nameEN: "MoPlayer",
    descriptionAR: "تطبيق شخصي قيد التطوير لتجربة تشغيل وسائط بواجهة مرتبة وصوت بصري واضح.",
    descriptionEN: "A personal app in development for a clean, focused media experience.",
    coverImage: "/images/moplayer-app-cover.jpeg",
    screenshots: [
      "/images/moplayer-app-cover.jpeg",
      "/images/brand-spotlight-2026.jpeg",
      "/images/portrait-hero-2026.jpeg",
    ],
    features: [
      { icon: "play", labelAR: "تشغيل سريع وواجهة نظيفة", labelEN: "Fast playback, clean UI" },
      { icon: "sparkles", labelAR: "هوية بصرية متماسكة", labelEN: "Cohesive visual identity" },
      { icon: "shield", labelAR: "تجربة مستقرة وقابلة للتوسع", labelEN: "Stable and scalable UX" },
    ],
    downloadLinks: {
      github: "https://github.com/moalfarras-sys",
    },
    status: "coming-soon",
    tags: ["Next.js", "UI", "Product"],
  },
];
