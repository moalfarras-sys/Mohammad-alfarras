import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import { readSnapshot } from "@/lib/content/store";
import { buildCvPresentationModel } from "@/lib/cv-presenter";
import type { Locale } from "@/types/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeLocale(value: string | null): Locale {
  return value === "ar" ? "ar" : "en";
}

function pick(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function text(value: string, bold = false, size = 22) {
  return new TextRun({ text: value, bold, size, font: "Arial" });
}

function paragraph(
  value: string,
  options: { bold?: boolean; size?: number; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel] } = {},
) {
  return new Paragraph({
    heading: options.heading,
    spacing: { after: 120 },
    children: [text(value, options.bold, options.size)],
  });
}

function bullet(value: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [text(value, false, 21)],
  });
}

function sectionTitle(value: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [text(value, true, 28)],
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

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [text(title, true, 36)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [text(headline, false, 22)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [
        text([builder.profile.email, builder.profile.phone, location, builder.profile.website].filter(Boolean).join(" | "), false, 18),
      ],
    }),
    paragraph(summary, { size: 22 }),
    sectionTitle(pick(locale, "الخبرة", "Experience")),
  ];

  cv.experience.forEach((entry) => {
    children.push(paragraph(`${entry.role} - ${entry.company}`, { bold: true, size: 24 }));
    children.push(paragraph(`${entry.period} | ${entry.location}`, { size: 19 }));
    children.push(paragraph(entry.description, { size: 21 }));
    entry.highlights.slice(0, 5).forEach((highlight) => children.push(bullet(highlight)));
  });

  children.push(sectionTitle(pick(locale, "المهارات", "Skills")));
  const skills = builder.skills
    .map((skill) => `${pick(locale, skill.label_ar, skill.label_en)} (${skill.category})`)
    .join(" | ");
  children.push(paragraph(skills, { size: 21 }));

  children.push(sectionTitle(pick(locale, "المشاريع", "Projects")));
  cv.projects.slice(0, 5).forEach((project) => {
    children.push(paragraph(project.title, { bold: true, size: 23 }));
    children.push(paragraph(project.summary, { size: 21 }));
  });

  children.push(sectionTitle(pick(locale, "اللغات", "Languages")));
  builder.languages.forEach((language) => {
    children.push(
      bullet(`${pick(locale, language.label_ar, language.label_en)} - ${pick(locale, language.level_ar, language.level_en)}`),
    );
  });

  children.push(sectionTitle(pick(locale, "التعليم والروابط", "Education and links")));
  builder.education.forEach((entry) => {
    children.push(paragraph(`${pick(locale, entry.degree_ar, entry.degree_en)} - ${pick(locale, entry.school_ar, entry.school_en)}`, { bold: true, size: 22 }));
    if (entry.period) children.push(paragraph(entry.period, { size: 19 }));
  });
  builder.links.forEach((link) => children.push(bullet(`${pick(locale, link.label_ar, link.label_en)}: ${link.url}`)));

  const doc = new Document({
    creator: "moalfarras.space",
    title: `${title} CV`,
    description: "ATS-friendly CV generated from moalfarras.space structured CV data.",
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Arial", size: 22 },
          paragraph: { spacing: { line: 300 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 900, right: 900, bottom: 900, left: 900 },
          },
        },
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
