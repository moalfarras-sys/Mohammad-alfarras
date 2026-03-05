import { expect, test } from "@playwright/test";

test("home renders in arabic and english", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("header")).toBeVisible();

  await page.goto("/en");
  await expect(page.locator("header")).toBeVisible();
});

test("admin login view exists", async ({ page }) => {
  await page.goto("/ar/admin");
  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
});
