import type { LiveYoutubeStats } from "@/lib/youtube-live";
import type { LiveWeather } from "@/lib/weather-live";
import type { LiveMatch } from "@/lib/matches-live";
import type { CvBuilderData, CvBuilderSection } from "@/lib/cv-builder";
import type { RebuildLocaleContent } from "@/data/rebuild-content";
import type { Locale, YoutubeVideo } from "@/types/cms";

export type SiteProject = {
  id: string;
  slug: string;
  title: string;
  ctaLabel: string;
  summary: string;
  description: string;
  image: string;
  href?: string;
  repoUrl?: string;
  featured: boolean;
  featuredRank: number;
  accent: "blue" | "amber" | "rose" | "ink";
  highlightStyle: "operations" | "trust" | "app" | "editorial";
  deviceFrame: "browser" | "phone" | "floating";
  eyebrow: string;
  challenge: string;
  solution: string;
  result: string;
  tags: string[];
  gallery: string[];
  metrics: Array<{ value: string; label: string }>;
};

export type SiteService = {
  id: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
};

export type SiteExperience = {
  id: string;
  role: string;
  description: string;
  highlights: string[];
  company: string;
  location: string;
  period: string;
};

export type SiteContactChannel = {
  id: string;
  type: string;
  label: string;
  description: string;
  value: string;
  icon: string;
  isPrimary: boolean;
};

export type SiteGalleryItem = {
  id: string;
  title: string;
  image: string;
  ratio: "portrait" | "wide" | "square";
};

export type SiteProfile = {
  name: string;
  subtitle: string;
  location: string;
};

export type YoutubeSummary = {
  channel_id?: string;
  views?: number | string;
  subscribers?: number | string;
  videos?: number | string;
  handle?: string;
  title?: string;
};

export type SiteCertification = {
  id: string;
  name: string;
  description: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
};

export type SiteViewModel = {
  locale: Locale;
  pageSlug: string;
  t: RebuildLocaleContent;
  profile: SiteProfile;
  projects: SiteProject[];
  services: SiteService[];
  experience: SiteExperience[];
  certifications: SiteCertification[];
  contact: {
    channels: SiteContactChannel[];
    emailAddress: string;
    whatsappUrl: string;
  };
  settings?: Record<string, { key: string; value_json: Record<string, unknown> }>;
  youtube: YoutubeSummary;
  featuredVideo: YoutubeVideo | null;
  latestVideos: YoutubeVideo[];
  gallery: SiteGalleryItem[];
  live: {
    weather: LiveWeather | null;
    matches: LiveMatch[];
    youtube?: LiveYoutubeStats | null;
  };
  cvBuilder: CvBuilderData;
  cvSections: CvBuilderSection[];
  cvProjects: {
    id: string;
    title: string;
    summary: string;
    href?: string;
    repoUrl?: string;
  }[];
  cvExperience: {
    id: string;
    role: string;
    company: string;
    period: string;
    location: string;
    description: string;
    highlights: string[];
  }[];
  portraitImage: string;
  brandMedia: {
    profilePortrait: string;
    youtubeHero: string;
    contactHero: string;
    gallery: {
      tech: string;
      brand: string;
      logistics: string;
      media: string;
    };
  };
  downloads: {
    branded: string;
    ats: string;
    docx: string;
  };
};
