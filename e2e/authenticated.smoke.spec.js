import { expect, test } from '@playwright/test';

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test('configured Firebase test account can sign in and open protected pages', async ({ page }) => {
  test.skip(!email || !password, 'E2E_EMAIL and E2E_PASSWORD are required for the authenticated smoke test.');

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /login/i }).click();

  await expect(page).toHaveURL(/\/$/);
  await page.goto('/mypage');
  await expect(page).toHaveURL(/\/mypage$/);
  await expect(page.locator('body')).toBeVisible();

  await page.goto('/ai-planner');
  await expect(page).toHaveURL(/\/ai-planner$/);
  await expect(page.locator('body')).toBeVisible();
});
