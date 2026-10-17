import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await mkdir('artifacts', { recursive: true });
try {
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Smart college/ }).waitFor();
  await page.screenshot({ path: 'artifacts/landing-desktop.png', fullPage: true });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
    'Desktop horizontal overflow',
  );
  await page.getByRole('link', { name: 'Student login', exact: true }).click();
  await page.getByRole('heading', { name: 'Student login' }).waitFor();
  await page.getByLabel('College email').fill('invalid');
  await page.getByRole('button', { name: 'Sign in as Student', exact: true }).click();
  assert.match(page.url(), /auth\/login/);
  await page.goto('http://127.0.0.1:5173/app');
  await page.waitForURL('**/auth/login');
  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.getByRole('heading', { name: 'Your campus starts here.' }).waitFor();
  await page.screenshot({ path: 'artifacts/signup-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
    'Mobile horizontal overflow',
  );
  await page.screenshot({ path: 'artifacts/landing-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Student login', exact: true }).click();
  await page.getByRole('heading', { name: 'Student login' }).waitFor();
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
    'Mobile auth horizontal overflow',
  );
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(
    'PASS: desktop and mobile landing, login and signup routes, unauthenticated route protection, invalid-email validation, no horizontal overflow, no browser runtime errors.',
  );
} finally {
  await browser.close();
}
