import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1050}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('heading',{name:/A smarter way/}).waitFor();
 for(const role of ['student','faculty','admin']) assert.equal(await page.locator(`.ch-portal[href="/auth/login/${role}"]`).count(),1);
 await page.getByText('How do I get started?',{exact:true}).click();
 assert.equal(await page.locator('details[open]').count(),1);
 await page.screenshot({path:'artifacts/home-redesign-desktop.png',fullPage:true});
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width===390)await page.screenshot({path:'artifacts/home-redesign-mobile.png',fullPage:true});}
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.ch-visual').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.getByRole('link',{name:'Student login',exact:true}).click();await page.waitForURL('**/auth/login/student');assert.deepEqual(errors,[]);
 console.log('PASS: home desktop and mobile layouts, portal links, FAQ, reduced motion and student login navigation.');
}finally{await browser.close();}
