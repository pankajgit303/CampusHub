import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5173/auth/login');
 await page.getByRole('heading',{name:'Choose your workspace.'}).waitFor();
 for(const role of ['Student','Faculty','Admin']){
  await page.goto(`http://127.0.0.1:5173/auth/login/${role.toLowerCase()}`);
  await page.getByRole('heading',{name:`${role} login`,exact:true}).waitFor();
  await page.getByRole('button',{name:`Sign in as ${role}`,exact:true}).waitFor();
 }
 const id='11111111-1111-4111-8111-111111111111';
 const user={id,email:'test@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},created_at:new Date().toISOString()};
 const exp=Math.floor(Date.now()/1000)+3600;
 const token=[{alg:'HS256',typ:'JWT'},{sub:id,role:'authenticated',exp},'fixture'].map(v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64url')).join('.');
 await page.route('https://jvpkueplvqyqsmruslsy.supabase.co/**',route=>{
  const path=new URL(route.request().url()).pathname;
  const data=path.includes('/token')?{access_token:token,refresh_token:'fixture',expires_in:3600,token_type:'bearer',user}:path.includes('/profiles')?[{id,role:'student',account_status:'active',full_name:'UI test',email:user.email}]:path.includes('/user')?user:[];
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.getByLabel('College email').fill(user.email);
 await page.getByLabel('Password',{exact:true}).fill('isolated-ui-fixture');
 await page.getByRole('button',{name:'Sign in as Admin',exact:true}).click();
 await page.getByText('This account has the student role. Please use student login.').waitFor();
 assert.match(page.url(),/auth\/login\/admin$/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('sb-jvpkueplvqyqsmruslsy-auth-token')),null);
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:5173/auth/login');
 await page.getByRole('heading',{name:'Choose your workspace.'}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 console.log('PASS: three separate login portals, incorrect-role rejection with sign-out, mobile chooser layout. Role mismatch uses isolated UI fixtures.');
} finally {await browser.close();}
