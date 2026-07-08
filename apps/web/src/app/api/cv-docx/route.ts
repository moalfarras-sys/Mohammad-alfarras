import {
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopPosition,
  TabStopType,
  TextRun,
} from "docx";

import { buildSiteModel } from "@/components/site/site-model";
import { readSnapshot } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import type { Locale } from "@/types/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCENT = "0E7490"; // teal — matches the branded PDF
const INK = "12233A";
const MUTED = "5A6A82";

function normalizeLocale(value: string | null): Locale {
  return value === "ar" ? "ar" : "en";
}

function pick(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function run(value: string, opts: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}) {
  return new TextRun({ text: value, bold: opts.bold, size: opts.size ?? 21, color: opts.color, italics: opts.italics, font: "Calibri" });
}

function body(value: string, opts: { size?: number; color?: string } = {}) {
  return new Paragraph({ spacing: { after: 110 }, children: [run(value, { size: opts.size ?? 21, color: opts.color ?? INK })] });
}

function bullet(value: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [run(value, { size: 21, color: INK })] });
}

// Section heading: accent colour + a thin accent rule beneath it.
function sectionTitle(value: string) {
  return new Paragraph({
    spacing: { before: 300, after: 140 },
    border: { bottom: { color: ACCENT, space: 4, style: BorderStyle.SINGLE, size: 10 } },
    children: [run(value.toUpperCase(), { bold: true, size: 24, color: ACCENT })],
  });
}

// Role line with the period pushed to the right via a tab stop.
function roleLine(role: string, period: string) {
  return new Paragraph({
    spacing: { before: 60, after: 20 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [run(role, { bold: true, size: 23, color: INK }), run(`\t${period}`, { bold: true, size: 19, color: ACCENT })],
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = normalizeLocale(searchParams.get("locale"));
  const snapshot = await readSnapshot();
  const cv = buildCvPresentationModel(snapshot, locale);
  const builder = cv.builder;

  const title = pick(locale, builder.profile.name_ar, builder.profile.name_en);
  const headline = pick(locale, builder.profile.headline_ar, builder.profile.headline_en);
  const summary = pick(locale, builder.summary.body_ar, builder.summary.body_en);
  const location = pick(locale, builder.profile.location_ar, builder.profile.location_en);
  const contact = [builder.profile.email, builder.profile.phone, location, builder.profile.website].filter(Boolean).join("  •  ");

  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [run(title, { bold: true, size: 44, color: ACCENT })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [run(headline, { size: 23, color: MUTED })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      border: { bottom: { color: "DCE5EF", space: 6, style: BorderStyle.SINGLE, size: 6 } },
      children: [run(contact, { size: 18, color: MUTED })],
    }),
    sectionTitle(pick(locale, "نبذة مهنية", "Profile")),
    body(summary, { size: 22 }),
    sectionTitle(pick(locale, "الخبرة العملية", "Experience")),
  ];

  cv.experience.forEach((entry) => {
    children.push(roleLine(entry.role, entry.period));
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [run(`${entry.company}${entry.location ? ` · ${entry.location}` : ""}`, { size: 20, color: MUTED, italics: true })],
      }),
    );
    children.push(body(entry.description, { size: 21 }));
    entry.highlights.slice(0, 5).forEach((highlight) => children.push(bullet(highlight)));
  });

  children.push(sectionTitle(pick(locale, "المهارات الأساسية", "Core skills")));
  builder.skills.forEach((skill) => children.push(bullet(pick(locale, skill.label_ar, skill.label_en))));

  // Use the same corrected project list as the branded PDF (the raw snapshot still
  // carries stale seed projects).
  const siteProjects = (await buildSiteModel({ locale, slug: "cv" })).projects
    .filter((project) => !/moplayer/i.test(String(project.id)))
    .map((project) => ({ title: project.title, summary: project.summary }));
  const projectList = (siteProjects.length ? siteProjects : cv.projects).slice(0, 5);
  children.push(sectionTitle(pick(locale, "مشاريع مختارة", "Selected projects")));
  projectList.forEach((project) => {
    children.push(new Paragraph({ spacing: { before: 60, after: 10 }, children: [run(project.title, { bold: true, size: 22, color: INK })] }));
    children.push(body(project.summary, { size: 20, color: MUTED }));
  });

  children.push(sectionTitle(pick(locale, "اللغات", "Languages")));
  builder.languages.forEach((language) => {
    children.push(bullet(`${pick(locale, language.label_ar, language.label_en)} — ${pick(locale, language.level_ar, language.level_en)}`));
  });

  if (builder.education.length || builder.links.length) {
    children.push(sectionTitle(pick(locale, "التعليم والروابط", "Education & links")));
    builder.education.forEach((entry) => {
      children.push(new Paragraph({ spacing: { before: 40, after: 10 }, children: [run(`${pick(locale, entry.degree_ar, entry.degree_en)} — ${pick(locale, entry.school_ar, entry.school_en)}`, { bold: true, size: 21, color: INK })] }));
      if (entry.period) children.push(body(entry.period, { size: 19, color: MUTED }));
    });
    builder.links.forEach((link) => children.push(bullet(`${pick(locale, link.label_ar, link.label_en)}: ${link.url}`)));
  }

  const doc = new Document({
    creator: "moalfarras.space",
    title: `${title} — CV`,
    description: "Professional CV generated from moalfarras.space structured CV data.",
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "Calibri", size: 21, color: INK }, paragraph: { spacing: { line: 288 } } },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `Mohammad-Alfarras-CV-${locale}.docx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
