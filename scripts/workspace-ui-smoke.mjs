// UI-only fixtures; never shipped in the application and never written to Supabase.
// Real access-control tests are in supabase/tests/security.sql.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('artifacts', { recursive: true });
try {
  for (const role of ['student', 'faculty', 'admin']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const profile = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ui-fixture@example.invalid',
      full_name: 'UI Test Account',
      role,
      account_status: 'active',
      department_id: null,
      semester_id: null,
      avatar_url: null,
      phone: null,
      roll_number: null,
      registration_number: null,
    };
    const user = {
      id: profile.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: profile.email,
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
    const expires_at = Math.floor(Date.now() / 1000) + 3600;
    const token = [
      { alg: 'HS256', typ: 'JWT' },
      { sub: profile.id, role: 'authenticated', exp: expires_at },
      'test-fixture-only',
    ]
      .map((v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url'))
      .join('.');
    await context.addInitScript(
      (session) =>
        localStorage.setItem('sb-jvpkueplvqyqsmruslsy-auth-token', JSON.stringify(session)),
      {
        access_token: token,
        refresh_token: 'ui-fixture-only',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at,
        user,
      },
    );
    await context.route('https://jvpkueplvqyqsmruslsy.supabase.co/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          path.includes('/auth/v1/user')
            ? user
            : path.includes('/rest/v1/profiles')
              ? [profile]
              : [],
        ),
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/app');
    await page.getByRole('heading', { name: role === 'student' ? 'CampusHub' : /Welcome back/ }).waitFor();
    await page.screenshot({ path: `artifacts/${role}-workspace-ui-test.png`, fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${role} desktop overflow`,
    );
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    assert.equal(await page.locator('html').evaluate((el) => el.classList.contains('dark')), true);
    if (role === 'admin') {
      await page.getByRole('link', { name: 'Departments', exact: true }).click();
      await page.getByRole('button', { name: 'New department' }).click();
      await page.getByRole('dialog').waitFor();
      await page.getByLabel('Name', { exact: true }).fill('Test form only');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    } else if (role === 'student') {
      await page.goto('http://127.0.0.1:5173/app/people');
      await page.getByRole('heading', { name: 'Administrator access required' }).waitFor();
    }
    for (const path of [
      'attendance',
      'assignments',
      'notices',
      'timetable',
      'results',
      'exams',
      'materials',
      'events',
      'placements',
      'complaints',
      'notifications',
      'profile',
      'ai',
    ]) {
      await page.goto(`http://127.0.0.1:5173/app/${path}`);
      await page.locator('main.workspace-content h1').waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:5173/app');
    await page.getByRole('heading', { name: role === 'student' ? 'CampusHub' : /Welcome back/ }).waitFor();
    if (role === 'student') {
      await page.getByRole('link', {name: 'Attendance Record', exact:true}).click();
    } else {
      await page.locator('.sp-tile-grid').getByRole('link', { name: role === 'faculty' ? 'Record Attendance' : 'Attendance', exact: true }).click();
    }
    await page.getByRole('heading', { name: 'Attendance', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${role} mobile overflow`,
    );
    assert.deepEqual(errors, [], `${role} runtime errors`);
    await context.close();
  }
  console.log(
    'PASS: all three workspace roles render; feature routes, admin form, student route guard, dark mode and mobile drawer pass. These are isolated UI fixtures; database permissions are tested separately.',
  );
} finally {
  await browser.close();
}
