import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { readSnapshot } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import { formatNumber } from "@/lib/locale-format";
import type { Locale } from "@/types/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PdfVariant = "branded" | "ats";

function text(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mimeFromPath(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function maybeReadFile(filePath: string) {
  try {
    await access(filePath);
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function fileToDataUrl(filePath: string) {
  const bytes = await maybeReadFile(filePath);
  if (!bytes) return null;
  return `data:${mimeFromPath(filePath)};base64,${bytes.toString("base64")}`;
}

async function resolvePortrait(src: string | undefined) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  const localPath = path.join(process.cwd(), "public", src.replace(/^\/+/, ""));
  return fileToDataUrl(localPath);
}

async function loadFontCss() {
  const [latin, arabic] = await Promise.all([
    readFile(path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")),
    readFile(path.join(process.cwd(), "public", "fonts", "NotoSansArabic-Regular.ttf")),
  ]);

  return `
    @font-face {
      font-family: "NotoSansPdf";
      src: url(data:font/ttf;base64,${latin.toString("base64")}) format("truetype");
      font-weight: 100 900;
      font-style: normal;
    }
    @font-face {
      font-family: "NotoArabicPdf";
      src: url(data:font/ttf;base64,${arabic.toString("base64")}) format("truetype");
      font-weight: 100 900;
      font-style: normal;
    }
  `;
}

async function findExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

async function createBrowser() {
  const puppeteer = await import("puppeteer-core");

  if (process.platform === "win32") {
    const executablePath = await findExecutablePath();
    if (!executablePath) {
      throw new Error("No local Chrome/Edge executable found for PDF generation.");
    }

    return puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
    });
  }

  const chromiumModule = await import("@sparticuz/chromium");
  const chromium = chromiumModule.default;

  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: true,
    args: [...chromium.args, "--font-render-hinting=medium"],
  });
}

function renderMetricBar(level: number, accent: string, secondary: string, dark: boolean) {
  return `
    <div class="meter">
      <div class="meter-fill" style="width:${level}%;background:${dark ? `linear-gradient(90deg, ${accent}, ${secondary})` : "#111827"}"></div>
    </div>
  `;
}

function renderHtml({
  locale,
  variant,
  portraitSrc,
  fontCss,
  cv,
}: {
  locale: Locale;
  variant: PdfVariant;
  portraitSrc: string | null;
  fontCss: string;
  cv: ReturnType<typeof buildCvPresentationModel>;
}) {
  const isArabic = locale === "ar";
  const isBranded = variant === "branded";
  const palette = isBranded
    ? {
        page: "#f6f8fc",
        ink: "#0f172a",
        muted: "#475569",
        soft: "#64748b",
        line: "#d7e0ea",
        accent: cv.builder.theme.accent,
        secondary: cv.builder.theme.secondary,
        accentSoft: "rgba(0, 255, 135, 0.10)",
        card: "#ffffff",
        side: "#0b1220",
        sideInk: "#eff6ff",
        sideMuted: "#a8b6cc",
      }
    : {
        page: "#ffffff",
        ink: "#111827",
        muted: "#374151",
        soft: "#6b7280",
        line: "#e5e7eb",
        accent: "#111827",
        secondary: "#4b5563",
        accentSoft: "#f3f4f6",
        card: "#ffffff",
        side: "#f8fafc",
        sideInk: "#111827",
        sideMuted: "#64748b",
      };

  const contacts = [
    cv.builder.profile.email,
    cv.builder.profile.phone,
    cv.builder.profile.website,
    text(locale, cv.builder.profile.location_ar, cv.builder.profile.location_en),
  ]
    .filter(Boolean)
    .map((item) => `<div class="contact-item">${escapeHtml(item)}</div>`)
    .join("");

  const skills = cv.builder.skills
    .map(
      (skill) => `
      <div class="skill-row">
        <div class="skill-top">
          <span>${escapeHtml(text(locale, skill.label_ar, skill.label_en))}</span>
          <strong>${escapeHtml(formatNumber(locale, skill.level))}%</strong>
        </div>
        ${renderMetricBar(skill.level, cv.builder.theme.accent, cv.builder.theme.secondary, isBranded)}
      </div>`,
    )
    .join("");

  const languages = cv.builder.languages
    .map(
      (language) => `
      <div class="language-row">
        <div>
          <div class="language-name">${escapeHtml(text(locale, language.label_ar, language.label_en))}</div>
          <div class="language-level">${escapeHtml(text(locale, language.level_ar, language.level_en))}</div>
        </div>
        <strong>${escapeHtml(formatNumber(locale, language.proficiency))}%</strong>
      </div>`,
    )
    .join("");

  const links = cv.builder.links
    .map((link) => `<div class="link-item">${escapeHtml(text(locale, link.label_ar, link.label_en))}</div>`)
    .join("");

  const experience = cv.experience
    .map(
      (entry) => `
      <article class="block">
        <div class="row spread baseline">
          <div class="title">${escapeHtml(entry.role)} - ${escapeHtml(entry.company)}</div>
          <div class="soft strong">${escapeHtml(entry.period)}</div>
        </div>
        <div class="soft mt-4">${escapeHtml(entry.location)}</div>
        <div class="body-copy mt-8">${escapeHtml(entry.description)}</div>
        ${
          entry.highlights.length > 0
            ? `<div class="chip-row mt-8">${entry.highlights
                .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
                .join("")}</div>`
            : ""
        }
      </article>`,
    )
    .join("");

  const education = cv.builder.education
    .map(
      (entry) => `
      <article class="block">
        <div class="title">${escapeHtml(text(locale, entry.degree_ar, entry.degree_en))}</div>
        <div class="soft mt-4">${escapeHtml(text(locale, entry.school_ar, entry.school_en))} - ${escapeHtml(entry.period)}</div>
        <div class="body-copy mt-8">${escapeHtml(text(locale, entry.details_ar, entry.details_en))}</div>
      </article>`,
    )
    .join("");

  const projects = cv.projects
    .slice(0, 3)
    .map(
      (project) => `
      <article class="block">
        <div class="title">${escapeHtml(project.title)}</div>
        <div class="body-copy mt-8">${escapeHtml(project.summary)}</div>
      </article>`,
    )
    .join("");

  const certifications =
    cv.certifications.length > 0
      ? `
      <section class="section">
        <div class="section-head">
          <div class="line"></div>
          <h2>${escapeHtml(text(locale, "الشهادات", "Certifications"))}</h2>
        </div>
        <div class="stack">
          ${cv.certifications
            .slice(0, 3)
            .map(
              (entry) => `
            <article class="block">
              <div class="title">${escapeHtml(entry.name)}</div>
              <div class="soft mt-4">${escapeHtml(entry.issuer)}</div>
              <div class="body-copy mt-8">${escapeHtml(entry.description)}</div>
            </article>`,
            )
            .join("")}
        </div>
      </section>`
      : "";

  const portrait = portraitSrc
    ? `<div class="portrait-wrap"><img src="${portraitSrc}" alt="${escapeHtml(cv.builder.profile.name_en)}" class="portrait" /></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${isArabic ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${fontCss}
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      @page { size: A4; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        background: ${palette.page};
        color: ${palette.ink};
        font-family: ${
          isArabic
            ? '"NotoArabicPdf", "NotoSansPdf", sans-serif'
            : '"NotoSansPdf", "NotoArabicPdf", sans-serif'
        };
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { width: 210mm; min-height: 297mm; }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 18mm 16mm;
        background: ${palette.page};
      }
      .layout {
        display: grid;
        grid-template-columns: ${isArabic ? "1.35fr 0.85fr" : "0.85fr 1.35fr"};
        gap: 14mm;
        min-height: 261mm;
      }
      .sidebar {
        order: ${isArabic ? 2 : 1};
        background: ${palette.side};
        color: ${palette.sideInk};
        border-radius: 24px;
        padding: 12mm 9mm;
        display: flex;
        flex-direction: column;
        gap: 8mm;
      }
      .main {
        order: ${isArabic ? 1 : 2};
        display: flex;
        flex-direction: column;
        gap: 7mm;
      }
      .hero {
        border-radius: 24px;
        padding: 9mm 8mm;
        background: ${palette.card};
        border: 1px solid ${palette.line};
        box-shadow: ${isBranded ? "0 20px 50px rgba(15,23,42,0.07)" : "none"};
      }
      .name { font-size: 30px; font-weight: 800; line-height: 1.1; }
      .headline { margin-top: 8px; font-size: 14px; line-height: 1.8; color: ${palette.muted}; }
      .summary { margin-top: 14px; font-size: 11px; line-height: 2; color: ${palette.muted}; }
      .section { display: grid; gap: 4mm; }
      .section-head {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: ${isArabic ? "flex-end" : "flex-start"};
      }
      .line { width: 32px; height: 2px; border-radius: 999px; background: ${palette.accent}; }
      h2 { margin: 0; font-size: 13px; font-weight: 900; color: ${palette.ink}; }
      .stack { display: grid; gap: 5mm; }
      .block {
        border-radius: 18px;
        border: 1px solid ${palette.line};
        background: ${palette.card};
        padding: 5mm;
      }
      .row { display: flex; gap: 16px; }
      .spread { justify-content: space-between; }
      .baseline { align-items: baseline; }
      .title { font-size: 14px; font-weight: 800; }
      .soft { color: ${palette.soft}; font-size: 10.5px; }
      .strong { font-weight: 700; font-size: 10px; }
      .body-copy { color: ${palette.muted}; font-size: 10.5px; line-height: 1.8; }
      .mt-4 { margin-top: 4px; }
      .mt-8 { margin-top: 8px; }
      .sidebar-heading {
        font-size: 9px;
        letter-spacing: 0.18em;
        font-weight: 800;
        color: ${palette.sideMuted};
      }
      .portrait-wrap {
        width: 32mm;
        height: 42mm;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid ${isBranded ? cv.builder.theme.accent : palette.line};
      }
      .portrait { width: 100%; height: 100%; object-fit: cover; display: block; }
      .contact-item, .link-item { font-size: 10px; line-height: 1.7; }
      .skill-row, .language-row { display: grid; gap: 4px; }
      .skill-top, .language-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .language-name { font-weight: 700; font-size: 10px; }
      .language-level { color: ${palette.sideMuted}; font-size: 10px; line-height: 1.7; }
      .meter { margin-top: 4px; height: 5px; border-radius: 999px; background: ${isBranded ? "rgba(255,255,255,0.10)" : "#e2e8f0"}; overflow: hidden; }
      .meter-fill { height: 100%; border-radius: 999px; }
      .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
      .chip {
        font-size: 9px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 999px;
        background: ${palette.accentSoft};
        color: ${palette.ink};
      }
      .sidebar-name { font-size: 22px; font-weight: 800; line-height: 1.25; }
      .sidebar-headline { margin-top: 6px; font-size: 10.5px; line-height: 1.7; color: ${palette.sideMuted}; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="layout">
        <aside class="sidebar">
          <div style="display:grid;gap:5mm">
            ${portrait}
            <div>
              <div class="sidebar-name">${escapeHtml(text(locale, cv.builder.profile.name_ar, cv.builder.profile.name_en))}</div>
              <div class="sidebar-headline">${escapeHtml(text(locale, cv.builder.profile.headline_ar, cv.builder.profile.headline_en))}</div>
            </div>
          </div>

          <section style="display:grid;gap:3mm">
            <div class="sidebar-heading">${escapeHtml(text(locale, "بيانات التواصل", "CONTACT"))}</div>
            ${contacts}
          </section>

          <section style="display:grid;gap:3mm">
            <div class="sidebar-heading">${escapeHtml(text(locale, "المهارات", "SKILLS"))}</div>
            <div style="display:grid;gap:3mm">${skills}</div>
          </section>

          <section style="display:grid;gap:3mm">
            <div class="sidebar-heading">${escapeHtml(text(locale, "اللغات", "LANGUAGES"))}</div>
            <div style="display:grid;gap:3mm">${languages}</div>
          </section>

          <section style="display:grid;gap:3mm">
            <div class="sidebar-heading">${escapeHtml(text(locale, "الروابط", "LINKS"))}</div>
            <div style="display:grid;gap:2mm">${links}</div>
          </section>
        </aside>

        <section class="main">
          <header class="hero">
            <div class="name">${escapeHtml(text(locale, cv.builder.profile.name_ar, cv.builder.profile.name_en))}</div>
            <div class="headline">${escapeHtml(text(locale, cv.builder.profile.headline_ar, cv.builder.profile.headline_en))}</div>
            <div class="summary">${escapeHtml(text(locale, cv.builder.summary.body_ar, cv.builder.summary.body_en))}</div>
          </header>

          <section class="section">
            <div class="section-head">
              <div class="line"></div>
              <h2>${escapeHtml(text(locale, "الخبرات", "Experience"))}</h2>
            </div>
            <div class="stack">${experience}</div>
          </section>

          <div class="two-col">
            <section class="section">
              <div class="section-head">
                <div class="line"></div>
                <h2>${escapeHtml(text(locale, "التعليم", "Education"))}</h2>
              </div>
              <div class="stack">${education}</div>
            </section>

            <section class="section">
              <div class="section-head">
                <div class="line"></div>
                <h2>${escapeHtml(text(locale, "الأعمال المختارة", "Selected Projects"))}</h2>
              </div>
              <div class="stack">${projects}</div>
            </section>
          </div>

          ${certifications}
        </section>
      </div>
    </main>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = (searchParams.get("locale") === "ar" ? "ar" : "en") as Locale;
  const variant = (searchParams.get("variant") === "ats" ? "ats" : "branded") as PdfVariant;
  const snapshot = await readSnapshot();
  const cv = buildCvPresentationModel(snapshot, locale);
  const portraitSrc = await resolvePortrait(cv.builder.profile.portrait);
  const fontCss = await loadFontCss();
  const html = renderHtml({ locale, variant, portraitSrc, fontCss, cv });

  const browser = await createBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="mohammad-alfarras-${locale}-${variant}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    await browser.close();
  }
}
