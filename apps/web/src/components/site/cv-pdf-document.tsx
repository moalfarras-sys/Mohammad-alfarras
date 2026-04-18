import type { CSSProperties, ReactNode } from "react";

import { formatNumber } from "@/lib/locale-format";
import type { CvPresentationModel } from "@/lib/cv-presenter";

type Props = {
  cv: CvPresentationModel;
  variant: "branded" | "ats";
  portraitSrc?: string;
  contactWebsite?: string;
};

const pageStyle: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  margin: "0 auto",
  padding: "18mm 16mm",
  boxSizing: "border-box",
  background: "#ffffff",
};

function text(locale: CvPresentationModel["locale"], ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function CvPdfDocument({ cv, variant, portraitSrc, contactWebsite }: Props) {
  const { locale, builder, experience, certifications, projects } = cv;
  const isArabic = locale === "ar";
  const isBranded = variant === "branded";
  const dir = isArabic ? "rtl" : "ltr";

  const palette = isBranded
    ? {
        page: "#f6f8fc",
        ink: "#0f172a",
        muted: "#475569",
        soft: "#64748b",
        line: "#d7e0ea",
        accent: builder.theme.accent,
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
        accentSoft: "#f3f4f6",
        card: "#ffffff",
        side: "#f8fafc",
        sideInk: "#111827",
        sideMuted: "#64748b",
      };

  return (
    <div
      dir={dir}
      style={{
        ...pageStyle,
        background: palette.page,
        color: palette.ink,
        fontFamily: isArabic
          ? "NotoArabicPdf, NotoSansPdf, sans-serif"
          : "NotoSansPdf, NotoArabicPdf, sans-serif",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isArabic ? "1.35fr 0.85fr" : "0.85fr 1.35fr",
          gap: "14mm",
          minHeight: "261mm",
        }}
      >
        <aside
          style={{
            background: palette.side,
            color: palette.sideInk,
            borderRadius: 24,
            padding: "12mm 9mm",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "8mm",
            order: isArabic ? 2 : 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "5mm" }}>
            {builder.theme.showPhoto && portraitSrc ? (
              <div
                style={{
                  width: "32mm",
                  height: "42mm",
                  borderRadius: 20,
                  overflow: "hidden",
                  border: isBranded
                    ? `1px solid ${builder.theme.accent}`
                    : `1px solid ${palette.line}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portraitSrc}
                  alt={builder.profile.name_en}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : null}

            <div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>
                {text(locale, builder.profile.name_ar, builder.profile.name_en)}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10.5,
                  lineHeight: 1.7,
                  color: palette.sideMuted,
                }}
              >
                {text(locale, builder.profile.headline_ar, builder.profile.headline_en)}
              </div>
            </div>
          </div>

          <section style={{ display: "grid", gap: "3mm" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", fontWeight: 800, color: palette.sideMuted }}>
              {text(locale, "بيانات التواصل", "CONTACT")}
            </div>
            {[
              builder.profile.email,
              builder.profile.phone,
              contactWebsite ?? builder.profile.website,
              text(locale, builder.profile.location_ar, builder.profile.location_en),
            ]
              .filter(Boolean)
              .map((item) => (
                <div key={item} style={{ fontSize: 10, lineHeight: 1.7 }}>
                  {item}
                </div>
              ))}
          </section>

          <section style={{ display: "grid", gap: "3mm" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", fontWeight: 800, color: palette.sideMuted }}>
              {text(locale, "المهارات", "SKILLS")}
            </div>
            <div style={{ display: "grid", gap: "3mm" }}>
              {builder.skills.map((skill) => (
                <div key={skill.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10 }}>
                    <span>{text(locale, skill.label_ar, skill.label_en)}</span>
                    <strong>{formatNumber(locale, skill.level)}%</strong>
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      height: 5,
                      borderRadius: 999,
                      background: isBranded ? "rgba(255,255,255,0.10)" : "#e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        width: `${skill.level}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: isBranded
                          ? `linear-gradient(90deg, ${builder.theme.accent}, ${builder.theme.secondary})`
                          : palette.ink,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "3mm" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", fontWeight: 800, color: palette.sideMuted }}>
              {text(locale, "اللغات", "LANGUAGES")}
            </div>
            <div style={{ display: "grid", gap: "3mm" }}>
              {builder.languages.map((language) => (
                <div
                  key={language.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    fontSize: 10,
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {text(locale, language.label_ar, language.label_en)}
                    </div>
                    <div style={{ color: palette.sideMuted }}>
                      {text(locale, language.level_ar, language.level_en)}
                    </div>
                  </div>
                  <strong>{formatNumber(locale, language.proficiency)}%</strong>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "3mm" }}>
            <div style={{ fontSize: 9, letterSpacing: "0.18em", fontWeight: 800, color: palette.sideMuted }}>
              {text(locale, "الروابط", "LINKS")}
            </div>
            <div style={{ display: "grid", gap: "2mm" }}>
              {builder.links.map((link) => (
                <div key={link.id} style={{ fontSize: 10, lineHeight: 1.7 }}>
                  {text(locale, link.label_ar, link.label_en)}
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7mm",
            order: isArabic ? 1 : 2,
          }}
        >
          <header
            style={{
              borderRadius: 24,
              padding: "9mm 8mm",
              background: palette.card,
              border: `1px solid ${palette.line}`,
              boxShadow: isBranded ? "0 20px 50px rgba(15, 23, 42, 0.07)" : "none",
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>
              {text(locale, builder.profile.name_ar, builder.profile.name_en)}
            </div>
            <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: palette.muted }}>
              {text(locale, builder.profile.headline_ar, builder.profile.headline_en)}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, lineHeight: 2, color: palette.muted }}>
              {text(locale, builder.summary.body_ar, builder.summary.body_en)}
            </div>
          </header>

          <Section title={text(locale, "الخبرات", "Experience")} palette={palette} locale={locale}>
            {experience.map((entry) => (
              <Block key={entry.id} palette={palette}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "baseline",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800 }}>
                    {entry.role} - {entry.company}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: palette.soft }}>
                    {entry.period}
                  </div>
                </div>
                <div style={{ marginTop: 4, fontSize: 10.5, color: palette.soft }}>{entry.location}</div>
                <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.8, color: palette.muted }}>
                  {entry.description}
                </div>
                {entry.highlights.length > 0 ? (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {entry.highlights.map((item) => (
                      <span
                        key={item}
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: 999,
                          background: palette.accentSoft,
                          color: palette.ink,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Block>
            ))}
          </Section>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7mm" }}>
            <Section title={text(locale, "التعليم", "Education")} palette={palette} locale={locale}>
              {builder.education.map((entry) => (
                <Block key={entry.id} palette={palette}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    {text(locale, entry.degree_ar, entry.degree_en)}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: palette.soft }}>
                    {text(locale, entry.school_ar, entry.school_en)} - {entry.period}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.8, color: palette.muted }}>
                    {text(locale, entry.details_ar, entry.details_en)}
                  </div>
                </Block>
              ))}
            </Section>

            <Section
              title={text(locale, "الأعمال المختارة", "Selected Projects")}
              palette={palette}
              locale={locale}
            >
              {projects.slice(0, 3).map((project) => (
                <Block key={project.id} palette={palette}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{project.title}</div>
                  <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.8, color: palette.muted }}>
                    {project.summary}
                  </div>
                </Block>
              ))}
            </Section>
          </div>

          {certifications.length > 0 ? (
            <Section title={text(locale, "الشهادات", "Certifications")} palette={palette} locale={locale}>
              {certifications.slice(0, 3).map((entry) => (
                <Block key={entry.id} palette={palette}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{entry.name}</div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: palette.soft }}>{entry.issuer}</div>
                  <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.8, color: palette.muted }}>
                    {entry.description}
                  </div>
                </Block>
              ))}
            </Section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  palette,
  children,
  locale,
}: {
  title: string;
  palette: {
    ink: string;
    soft: string;
    accent: string;
  };
  children: ReactNode;
  locale: CvPresentationModel["locale"];
}) {
  return (
    <section style={{ display: "grid", gap: "4mm" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: locale === "ar" ? "flex-end" : "flex-start",
        }}
      >
        <div style={{ width: 32, height: 2, borderRadius: 999, background: palette.accent }} />
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: palette.ink }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Block({
  children,
  palette,
}: {
  children: ReactNode;
  palette: { line: string; card: string };
}) {
  return (
    <article
      style={{
        borderRadius: 18,
        border: `1px solid ${palette.line}`,
        background: palette.card,
        padding: "5mm",
      }}
    >
      {children}
    </article>
  );
}
