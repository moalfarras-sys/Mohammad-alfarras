import { expect, test } from "@playwright/test";

test.describe("public site smoke", () => {
  test("Arabic home hero is visible", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("main").first()).toBeVisible();
    await expect(
      page.getByRole("navigation").first().getByRole("link", { name: "AI", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /فتح مساعد Mo Ai/i })).toBeVisible();
  });

  test("English work surface loads", async ({ page }) => {
    await page.goto("/en/work");
    await expect(page.getByRole("heading", { name: /Selected Engineering Work/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Explore the decisions behind the interface." }),
    ).toBeVisible();

    const caseStudyLink = page.locator(".work-spotlight-media");
    await expect(caseStudyLink).toHaveAttribute("href", /^\/en\/work\/.+/);

    await page.getByRole("button", { name: /Ask Mo Ai about this project/i }).click();
    await expect(page.locator(".mo-ai-panel")).toBeVisible();
    await expect(page.locator(".mo-ai-form input")).toHaveValue(/Explain the .+ project/);
  });

  test("Arabic work discovery stays readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/work");

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "اكتشف القرارات خلف الواجهة." })).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("case studies expose the story and project navigation", async ({ page }) => {
    await page.goto("/en/work/moplayer");
    await expect(page.getByText("From brief to outcome", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What actually changed?" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Project navigation" })).toBeVisible();
  });

  test("MoPlayer activation surfaces load on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/activate");
    await expect(page.getByRole("heading", { name: /Activate your TV/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /TV code/i })).toBeVisible();

    await page.goto("/ar/activate");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("textbox").first()).toBeVisible();
  });
});

test.describe("legacy public admin redirects", () => {
  test("localized admin routes leave the public site", async ({ request }) => {
    for (const path of ["/ar/admin", "/en/admin", "/en/admin/settings"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers().location).toMatch(
        /^https:\/\/admin\.moalfarras\.space(?:\/|\/website)?$/,
      );
    }
  });
});

test.describe("search indexing signals", () => {
  test("sitemap only advertises final indexable public pages", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);

    const body = await response.text();
    expect(body).toContain("<loc>https://moalfarras.space/en</loc>");
    expect(body).not.toContain("<loc>https://moalfarras.space/en/ai</loc>");
    expect(body).not.toContain("<loc>https://moalfarras.space/ar/ai</loc>");
    expect(body).toContain("<loc>https://moalfarras.space/en/apps/moplayer2</loc>");
    expect(body).not.toContain("<loc>https://moalfarras.space/app</loc>");
    expect(body).not.toContain("<loc>https://moalfarras.space/privacy</loc>");
    expect(body).not.toContain("<loc>https://moalfarras.space/support</loc>");

    const homeEntry = body.match(
      /<url>\s*<loc>https:\/\/moalfarras\.space\/en<\/loc>[\s\S]*?<\/url>/,
    )?.[0];
    expect(homeEntry).toBeTruthy();
    expect(homeEntry).not.toContain("<lastmod>");
  });

  test("localized pages publish self-canonical language alternates", async ({ request }) => {
    const response = await request.get("/ar/about");
    expect(response.ok()).toBe(true);

    const body = await response.text();
    expect(body).toContain('<link rel="canonical" href="https://moalfarras.space/ar/about"');
    expect(body).toContain(
      '<link rel="alternate" hrefLang="x-default" href="https://moalfarras.space/en/about"',
    );
  });

  test("retired assistant pages permanently redirect to the localized home", async ({
    request,
  }) => {
    for (const locale of ["ar", "en"]) {
      const response = await request.get(`/${locale}/ai`, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe(`/${locale}`);
    }
  });
});
