import { expect, test } from "@playwright/test";

test.describe("public site smoke", () => {
  test("Arabic home hero is visible", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.getByTestId("home-hero")).toBeVisible();
  });

  test("English projects surface loads", async ({ page }) => {
    await page.goto("/en/projects");
    await expect(page.getByTestId("projects-page")).toBeVisible();
  });
});

test.describe("admin sign-in surface", () => {
  test("Arabic admin shows sign-in heading", async ({ page }) => {
    await page.goto("/ar/admin");
    await expect(page.getByRole("heading", { name: /دخول لوحة التحكم/i })).toBeVisible();
  });

  test("English admin shows sign-in heading", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByRole("heading", { name: /Control Center sign in/i })).toBeVisible();
  });

  test("mobile viewport admin login renders", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/admin");
    await expect(page.getByRole("button", { name: /دخول/i })).toBeVisible();
  });
});
