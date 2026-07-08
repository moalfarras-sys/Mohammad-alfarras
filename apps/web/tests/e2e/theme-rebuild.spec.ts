import { expect, test } from "@playwright/test";

test("home renders the intentional dark-only experience", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");

  await expect(
    page.getByRole("heading", { name: /premium websites and digital experiences/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /toggle theme/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /start a project/i }).first()).toBeVisible();
});

test("mobile dock is visible and routes stay reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");

  await expect(page.getByRole("link", { name: "Work" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact" }).first()).toBeVisible();
});

test("key inner pages render redesigned surfaces", async ({ page }) => {
  await page.goto("/en/work");
  await expect(page.getByRole("heading", { name: /Selected Engineering Work/i })).toBeVisible();

  await page.goto("/en/cv");
  await expect(page.getByRole("heading", { level: 1, name: /Mohammad/i })).toBeVisible();

  await page.goto("/en/youtube");
  await expect(page.getByRole("heading", { name: /YouTube|creator/i })).toBeVisible();

  await page.goto("/en/contact");
  // Contact copy is CMS-driven (Supabase), so assert structure, not exact text.
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page.locator("main form").first()).toBeVisible();
});

test("contact form validates required fields", async ({ page }) => {
  await page.goto("/en/contact");

  const continueButton = page.getByRole("button", { name: /continue/i });
  const sendButton = page.getByRole("button", { name: /send inquiry/i });
  await expect
    .poll(
      async () => {
        if (await sendButton.first().isVisible()) return true;
        if (await continueButton.first().isVisible()) await continueButton.first().click();
        return false;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  await sendButton.first().click();
  await expect(page.getByText(/at least 20 characters|لا تقل عن 20/i).first()).toBeVisible();
});
