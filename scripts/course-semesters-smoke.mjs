// UI-only fixtures; never shipped in the application and never written to Supabase.
// Real access-control tests are in supabase/tests/security.sql.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('artifacts', { recursive: true });
try {
  for (const role of ['faculty', 'admin', 'student']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const profile = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'ui-fixture@example.invalid',
      full_name: 'UI Test Account',
      role,
      account_status: 'active',
      department_id: 'd1',
      semester_id: 's1',
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
    const saves = [];
    await context.route('https://jvpkueplvqyqsmruslsy.supabase.co/**', (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      if (['POST', 'PATCH'].includes(req.method()) && path.includes('/rest/v1/')) {
        saves.push({ table: path.split('/').at(-1), data: req.postDataJSON() });
        return route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ id: 'saved' }),
        });
      }
      const fixture = {
        departments: [
          { id: 'd1', name: 'Computing' },
          { id: 'd2', name: 'Business' },
        ],
        courses: [
          { id: 'c1', name: 'BCA', department_id: 'd1' },
          { id: 'c2', name: 'MCA', department_id: 'd1' },
          { id: 'c3', name: 'BBA', department_id: 'd2' },
        ],
        semesters: [
          {
            id: 's1',
            course_id: 'c1',
            department_id: 'd1',
            semester_number: 1,
            academic_year: '2026-2027',
          },
          {
            id: 's2',
            course_id: 'c2',
            department_id: 'd1',
            semester_number: 1,
            academic_year: '2026-2027',
          },
        ],
        subjects: [
          {
            id: 'subject1',
            subject_name: 'Databases',
            subject_code: 'BCA101',
            department_id: 'd1',
            semester_id: 's1',
            credits: 4,
            faculty_id: profile.id,
          },
        ],
      };
      const student = {
        ...profile,
        id: 'student-test',
        full_name: 'Test Student',
        role: 'student',
      };
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          path.includes('/auth/v1/user')
            ? user
            : path.includes('/rest/v1/profiles')
              ? new URL(req.url()).searchParams.has('id')
                ? [profile]
                : [profile, student]
              : fixture[path.split('/').at(-1)] || [],
        ),
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/app/subjects');
    await page
      .getByRole('heading', { name: role === 'admin' ? 'Subjects' : 'My subjects', exact: true })
      .waitFor();
    await page.getByRole('cell', { name: 'Databases', exact: true }).waitFor();
    if (role === 'admin') {
      await page.getByRole('button', { name: 'New subject', exact: true }).click();
      await page.locator('select[name="department_id"]').selectOption('d1');
      await page.locator('select[name="course_id"]').selectOption('c1');
      assert.equal(await page.locator('select[name="course_id"] option[value="c3"]').count(), 0);
      await page.locator('select[name="semester_id"]').selectOption('s1');
      await page.locator('select[name="course_id"]').selectOption('c2');
      assert.equal(await page.locator('select[name="semester_id"]').inputValue(), '');
      assert.equal(await page.locator('select[name="semester_id"] option[value="s1"]').count(), 0);
      await page.locator('select[name="semester_id"]').selectOption('s2');
      await page.locator('input[name="subject_name"]').fill('Advanced databases');
      await page.locator('input[name="subject_code"]').fill('MCA101');
      await page.locator('input[name="credits"]').fill('4');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await page.getByText('Subject saved', { exact: true }).waitFor();
      assert.equal(saves[0].data.semester_id, 's2');
      assert.equal('course_id' in saves[0].data, false);
      await page.goto('http://127.0.0.1:5173/app/people');
      await page.getByRole('button', { name: 'Edit Test Student', exact: true }).click();
      await page.waitForFunction(
        () => document.querySelector('select[name="course_id"]')?.value === 'c1',
      );
      assert.equal(await page.locator('select[name="semester_id"]').inputValue(), 's1');
    } else {
      assert.equal(await page.getByRole('button', { name: 'New subject', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: /^Edit / }).count(), 0);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    'PASS: course-semester filtering, dependent resets, subject saving, student course defaults, and read-only student/faculty subjects.',
  );
} finally {
  await browser.close();
}
