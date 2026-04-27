import { AboutPageBody } from "../sections/about-page-body";
import { AppsPageBody } from "../sections/apps-page-body";
import { ContactPageBody } from "../sections/contact-page-body";
import { PortfolioCvPage } from "./portfolio-pages";
import { PortfolioHomePageNew } from "./home-page-new";
import { PortfolioPrivacyPage } from "./portfolio-pages";
import { ServicesPageBody } from "../sections/services-page-body";
import { WorkPageBody } from "../sections/work-page-body";
import { YoutubePageBody } from "../sections/youtube-page-body";
import { buildCvPresentationModel } from "@/lib/cv-builder";
import { cache } from "react";
import { getContact, getExperience, getProfile, getProjects, getServices, getYoutube } from "@/lib/cms-documents";
import { getGallery } from "@/lib/content/gallery";
import { getLiveMatches } from "@/lib/matches-live";
import { getLiveWeather } from "@/lib/weather-live";
import { getLiveYoutubeData } from "@/lib/youtube-live";
import { getPdfRegistry } from "@/lib/pdf-registry";
import { readSnapshot, readVideos } from "@/lib/content/store";
import { repairMojibakeDeep } from "@/lib/utils";
import { resolveBrandAssetPaths } from "@/lib/cms-documents";
import { resolveRebuildLocaleContent } from "@/data/rebuild-content";
import type { Locale } from "@/types/cms";
import type { SiteViewModel } from "./site-view-model";

function safeImageSrc(src: string | undefined | null, fallback: string): string {
  if (!src) return fallback;
  return src;
}

export async function buildSiteModel({ locale, slug }: { locale: Locale; slug: string }): Promise<SiteViewModel> {
  const snapshot = await readSnapshot();
  const copy = resolveRebuildLocaleContent(snapshot, locale);
  const brandMedia = resolveBrandAssetPaths(snapshot);
  const portraitImage = safeImageSrc("/images/protofeilnew.jpeg", "/images/protofeilnew.jpeg");
  const pdfRegistry = getPdfRegistry(snapshot);
  const youtube = getYoutube(snapshot);

  const [videos, liveYoutube, liveWeather, liveMatches] = await Promise.all([
    readVideos(),
    getLiveYoutubeData(typeof youtube.channel_id === "string" ? youtube.channel_id : undefined),
    getLiveWeather(),
    getLiveMatches(),
  ]);

  const pageSlug = slug || "home";
  const profile = getProfile(snapshot, locale);
  const projects = getProjects(snapshot, locale);
  const experience = getExperience(snapshot, locale, locale === "ar" ? "الآن" : "Now");
  const contact = getContact(snapshot, locale);
  const certifications = getCertifications(snapshot, locale);
  const services = getServices(snapshot, locale);
  const featuredVideo = videos.find((item) => item.is_featured) ?? videos[0] ?? null;
  const cvPresentation = buildCvPresentationModel(snapshot, locale);
  const brandedDownload =
    pdfRegistry.active.branded === "uploaded" && pdfRegistry.uploads.branded?.url
      ? pdfRegistry.uploads.branded.url
      : `/api/cv-pdf?locale=${locale}&variant=branded`;
  const atsDownload =
    pdfRegistry.active.ats === "uploaded" && pdfRegistry.uploads.ats?.url
      ? pdfRegistry.uploads.ats.url
      : `/api/cv-pdf?locale=${locale}&variant=ats`;
  const docxDownload = `/api/cv-docx?locale=${locale}`;

  const model: SiteViewModel = {
    locale,
    pageSlug,
    t: copy,
    profile,
    projects,
    services,
    experience,
    certifications,
    contact,
    youtube,
    featuredVideo,
    latestVideos: videos.slice(0, 6),
    gallery: getGallery(snapshot),
    live: {
      youtube: liveYoutube,
      weather: liveWeather,
      matches: liveMatches,
    },
    settings: snapshot.site_settings.reduce((acc, s) => ({ ...acc, [s.key]: s }), {}),
    cvBuilder: cvPresentation.builder,
    cvSections: cvPresentation.sections,
    cvProjects: cvPresentation.projects,
    cvExperience: cvPresentation.experience,
    portraitImage,
    brandMedia,
    downloads: {
      branded: brandedDownload,
      ats: atsDownload,
      docx: docxDownload,
    },
  };

  return repairMojibakeDeep(model);
}

function getCertifications(snapshot: any, locale: Locale) {
  return snapshot.certifications.map((cert: any) => {
    const translation = snapshot.certification_translations.find(
      (t: any) => t.certification_id === cert.id && t.locale === locale,
    );
    return {
      id: cert.id,
      name: translation?.name ?? cert.name,
      description: translation?.description ?? "",
      issuer: cert.issuer,
      issueDate: cert.issue_date,
      credentialUrl: cert.credential_url,
    };
  });
}

export async function SitePage({ locale, slug }: { locale: Locale; slug: string }) {
  const model = await buildSiteModel({ locale, slug });
  switch (model.pageSlug) {
    case "home":
      return <PortfolioHomePageNew model={model} />;
    case "about":
      return <AboutPageBody model={model} />;
    case "cv":
      return <PortfolioCvPage model={model} />;
    case "services":
      return <ServicesPageBody model={model} />;
    case "projects":
    case "work":
      return <WorkPageBody model={model} />;
    case "youtube":
      return <YoutubePageBody model={model} />;
    case "contact":
      return <ContactPageBody model={model} />;
    case "apps":
      return <AppsPageBody model={model} />;
    case "privacy":
      return <PortfolioPrivacyPage locale={model.locale} />;
    default:
      return <PortfolioHomePageNew model={model} />;
  }
}
