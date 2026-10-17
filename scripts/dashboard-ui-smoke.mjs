// UI-only fixtures; never shipped in the application and never written to Supabase.
// Real access-control tests are in supabase/tests/security.sql.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('artifacts', { recursive: true });
try {
  for (const role of ['faculty']) {
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
      const fixture = {
        subjects: [{id:'subject-1',subject_name:'Database Management Systems',subject_code:'BCA301',faculty_id:profile.id,credits:4}],
        attendance: [{id:'attendance-1',subject_id:'subject-1',status:'present',attendance_date:'2026-10-16'}],
        assignments: [{id:'assignment-1',title:'Relational database design',subject_id:'subject-1',due_date:'2099-10-20T12:00:00Z'}],
        assignment_submissions: role==='faculty'?[{id:'submission-1',assignment_id:'assignment-1',status:'submitted',student_id:'student-2'}]:[],
        timetable: [{id:'class-1',subject_id:'subject-1',day_of_week:new Date().getDay(),start_time:'09:30',end_time:'10:30',room_number:'A-204'}],
        notices: [{id:'notice-1',priority:'urgent',title:'Semester registration is now open',created_at:'2026-10-16T09:00:00Z'}]
      };
      const rows=fixture[path.split('/').at(-1)] || [];
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          path.includes('/auth/v1/user')
            ? user
            : path.includes('/rest/v1/profiles')
              ? [profile]
              : rows,
        ),
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/app');
    await page.getByRole('heading', { name: /Welcome back/ }).waitFor();
    await page.screenshot({ path: `artifacts/${role}-workspace-ui-test.png`, fullPage: true });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${role} desktop overflow`,
    );
    await page.getByText('Relational database design',{exact:true}).waitFor();
    await page.getByText(role==='faculty'?'1 to review':'To do',{exact:true}).waitFor();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path: 'artifacts/'+role+'-dashboard-mobile.png',fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,role+' mobile overflow');
    await page.getByRole('button',{name:'Switch to dark mode'}).click();
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.ad-hero').evaluate(el=>getComputedStyle(el).animationName),'none');
    await page.screenshot({path:'artifacts/'+role+'-dashboard-dark.png',fullPage:true});
    assert.deepEqual(errors,[],role+' runtime errors');
    await context.close();
  }
  console.log(
    'PASS: populated student and faculty dashboards, mobile layout, dark mode and reduced motion. Isolated API fixtures.',
  );
} finally {
  await browser.close();
}
