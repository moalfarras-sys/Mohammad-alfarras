import { expect, test } from "@playwright/test";

for (const locale of ["ar", "en"]) {
  test(`${locale} product and activation pages fit the viewport without script errors`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
    for (const [name, route] of [
      ["home", ""],
      ["pro", "/apps/moplayer2"],
      ["activation", "/activate?product=moplayer2"],
    ]) {
      const response = await page.goto(`/${locale}${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("main").first()).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${locale}-${name}.png`) });
    }
    expect(errors).toEqual([]);
  });
}
