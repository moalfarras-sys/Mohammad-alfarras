import { expect, test } from "@playwright/test";

test("home renders in dark mode and switches to light mode", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByTestId("home-hero")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByTestId("theme-toggle").click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("link", { name: /start your standout project/i })).toBeVisible();
});

test("mobile dock is visible and routes stay reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");

  await expect(page.getByTestId("mobile-dock")).toBeVisible();
  await expect(page.getByTestId("mobile-dock").getByRole("link", { name: "Work" })).toBeVisible();
  await expect(page.getByTestId("mobile-dock").getByRole("link", { name: "Contact" })).toBeVisible();
});

test("key inner pages render redesigned surfaces", async ({ page }) => {
  await page.goto("/en/projects");
  await expect(page.getByTestId("projects-page")).toBeVisible();

  await page.goto("/en/cv");
  await expect(page.getByTestId("cv-page")).toBeVisible();

  await page.goto("/en/youtube");
  await expect(page.getByTestId("youtube-page")).toBeVisible();

  await page.goto("/en/contact");
  await expect(page.getByTestId("contact-page")).toBeVisible();
  await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
});

test("contact chips update the subject preview", async ({ page }) => {
  await page.goto("/en/contact");

  await page.getByTestId("preset-redesign").click();
  await expect(page.getByTestId("contact-subject-preview")).toContainText("Redesign");
});
