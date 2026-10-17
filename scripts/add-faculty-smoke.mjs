import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  const id = '11111111-1111-4111-8111-111111111111';
  const candidateId = '22222222-2222-4222-8222-222222222222';
  const departmentId = '33333333-3333-4333-8333-333333333333';
  const admin = { id, full_name: 'UI Admin', email: 'admin@example.invalid', role: 'admin', account_status: 'active' };
  const candidate = { id: candidateId, full_name: 'Faculty Candidate', email: 'faculty@example.invalid', role: 'student', account_status: 'active', department_id: null };
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [{alg:'HS256',typ:'JWT'},{sub:id,role:'authenticated',exp},'fixture'].map(value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')).join('.');
  await page.addInitScript(session => localStorage.setItem('sb-jvpkueplvqyqsmruslsy-auth-token', JSON.stringify(session)), {access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id,email:admin.email,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}});
  let mutation;
  await page.route('https://jvpkueplvqyqsmruslsy.supabase.co/**', async route => {
    const request=route.request(); const url=new URL(request.url()); let data=[];
    if(url.pathname.includes('/profiles')) {
      if(request.method()==='PATCH') { mutation={filter:url.searchParams.get('id'),body:request.postDataJSON()};Object.assign(candidate,mutation.body);data={id:candidateId}; }
      else data=url.searchParams.has('id')?[admin]:[admin,candidate];
    } else if(url.pathname.includes('/departments')) data=[{id:departmentId,name:'Computer Applications',code:'BCA'}];
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto('http://127.0.0.1:5173/app/people');
  await page.getByRole('button',{name:'Add faculty',exact:true}).click();
  await page.getByLabel('Registered account').selectOption(candidateId);
  await page.getByLabel('Department',{exact:true}).selectOption(departmentId);
  await page.getByRole('button',{name:'Add faculty access'}).click();
  await page.getByText('Faculty access added. Assign their teaching subjects under Subjects.').waitFor();
  assert.deepEqual(mutation,{filter:`eq.${candidateId}`,body:{role:'faculty',department_id:departmentId,semester_id:null}});
  assert.equal(await page.getByRole('dialog').count(),0);
  console.log('PASS: admin Add faculty dialog selects an account and department, saves the intended faculty role, refreshes and closes. Uses isolated API fixtures.');
} finally { await browser.close(); }
