import { expect, test } from "@playwright/test";

test("home renders and theme toggle changes the root class", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");

  await expect(page.getByTestId("home-hero")).toBeVisible();
  const before = (await page.locator("html").getAttribute("class")) ?? "";

  await page.getByTestId("theme-toggle").click();

  await expect.poll(async () => (await page.locator("html").getAttribute("class")) ?? "").not.toBe(before);
  await expect(page.getByRole("link", { name: /start a focused conversation/i })).toBeVisible();
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

test("contact form validates required fields", async ({ page }) => {
  await page.goto("/en/contact");

  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/The message could not be sent/i).first()).toBeVisible();
  await expect(page.getByText(/Write at least 20 characters/i).first()).toBeVisible();
});
