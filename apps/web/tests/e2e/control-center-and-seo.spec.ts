import { expect, test } from "@playwright/test";

test.describe("public site smoke", () => {
  test("Arabic home hero is visible", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.getByRole("heading", { name: /مواقع وتجارب رقمية|premium websites/i })).toBeVisible();
  });

  test("English work surface loads", async ({ page }) => {
    await page.goto("/en/work");
    await expect(page.getByRole("heading", { name: /Selected Engineering Work/i })).toBeVisible();
  });

  test("MoPlayer activation surfaces load on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/activate");
    await expect(page.getByRole("heading", { name: /Sign in, enter the TV code/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue/i }).first()).toBeVisible();

    await page.goto("/ar/activate");
    await expect(page.getByRole("heading", { name: /سجّل الدخول، أدخل كود التلفزيون/i })).toBeVisible();
  });
});

test.describe("admin sign-in surface", () => {
  test("Arabic admin shows sign-in heading", async ({ page }) => {
    await page.goto("/ar/admin");
    await expect(page.getByRole("heading", { name: /Command Login|Authenticate identity|تسجيل/i }).first()).toBeVisible();
  });

  test("English admin shows sign-in heading", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByRole("heading", { name: /Command Login|Authenticate identity/i }).first()).toBeVisible();
  });

  test("mobile viewport admin login renders", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/admin");
    await expect(page.getByRole("button", { name: /Unlock Command Center|دخول/i })).toBeVisible();
  });
});
