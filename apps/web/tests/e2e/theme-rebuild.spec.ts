import { expect, test } from "@playwright/test";

test("home renders and theme toggle changes the root class", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");

  await expect(page.getByRole("heading", { name: /premium websites and digital experiences/i })).toBeVisible();
  const before = (await page.locator("html").getAttribute("class")) ?? "";

  await page.getByRole("button", { name: /toggle theme/i }).click();

  await expect.poll(async () => (await page.locator("html").getAttribute("class")) ?? "").not.toBe(before);
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
  await expect(page.getByRole("heading", { name: /CV|experience|Mohammad/i })).toBeVisible();

  await page.goto("/en/youtube");
  await expect(page.getByRole("heading", { name: /YouTube|creator/i })).toBeVisible();

  await page.goto("/en/contact");
  await expect(page.getByRole("heading", { name: /Tell me what you want to build/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue/i })).toBeVisible();
});

test("contact form validates required fields", async ({ page }) => {
  await page.goto("/en/contact");

  await page.getByRole("button", { name: /continue/i }).click();
  await expect(page.getByRole("button", { name: /send inquiry/i })).toBeVisible();
  await page.getByRole("button", { name: /send inquiry/i }).click();
  await expect(page.getByText(/Write at least 20 characters/i).first()).toBeVisible();
});
