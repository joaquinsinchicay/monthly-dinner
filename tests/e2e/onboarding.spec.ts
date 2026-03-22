import { test, expect } from "@playwright/test";

test("guest is redirected to login when opening onboarding", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login/);
});
