import { expect, test } from '@playwright/test';

test('public login route loads after lazy chunk navigation', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test('guest sees a login gate on a protected route', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText('회원정보 접근 제한')).toBeVisible();
  await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
});

test('login gate returns the guest to the login route', async ({ page }) => {
  await page.goto('/ai-planner');
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel(/email/i)).toBeVisible();
});
