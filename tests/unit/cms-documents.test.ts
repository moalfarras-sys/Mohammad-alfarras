import { describe, expect, it } from "vitest";

import { getSiteSeoDocument, resolveRebuildLocaleContent } from "@/lib/cms-documents";
import { defaultSnapshot } from "@/data/default-content";

describe("getSiteSeoDocument", () => {
  it("returns defaults when site_seo is absent", () => {
    const doc = getSiteSeoDocument(defaultSnapshot);
    expect(doc.ar.home.title).toBeTruthy();
    expect(doc.en.home.title).toBeTruthy();
    expect(doc.ar.contact).toBeDefined();
  });

  it("merges partial overrides per locale", () => {
    const snapshot = structuredClone(defaultSnapshot);
    snapshot.site_settings.push({
      key: "site_seo",
      value_json: {
        ar: { home: { title: "عنوان مخصص", description: "", ogTitle: "", ogDescription: "" } },
      },
    });
    const doc = getSiteSeoDocument(snapshot);
    expect(doc.ar.home.title).toBe("عنوان مخصص");
    expect(doc.en.home.title).toBeTruthy();
  });
});

describe("resolveRebuildLocaleContent", () => {
  it("overlays seo from site_seo document", () => {
    const snapshot = structuredClone(defaultSnapshot);
    snapshot.site_settings.push({
      key: "site_seo",
      value_json: {
        en: { projects: { title: "Projects EN SEO", description: "D", ogTitle: "OG", ogDescription: "OGD" } },
      },
    });
    const copy = resolveRebuildLocaleContent(snapshot, "en");
    expect(copy.seo.projects.title).toBe("Projects EN SEO");
  });
});
