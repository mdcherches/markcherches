const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const config = JSON.parse(fs.readFileSync('content/lenses.json'));
const baseURL = process.env.LENS_TEST_URL || 'http://localhost:4174';
fs.mkdirSync('.test-artifacts', { recursive: true });
const sdk = `
export const Transform2D={MirrorX:1};
export const createMediaStreamSource=stream=>stream;
export async function bootstrapCameraKit(){return {
 lensRepository:{async loadLensGroups(){return {lenses:[{id:'vine-test',name:'Vine Trivia'}],errors:[]}}},
 async createSession(){const canvas=document.createElement('canvas');canvas.width=360;canvas.height=640;const ctx=canvas.getContext('2d');ctx.fillStyle='#dce8de';ctx.fillRect(0,0,360,640);const events=new EventTarget();window.__lensEvents=events;return {
 output:{live:canvas},events,async setSource(){},async applyLens(){return true},async play(){},pause(){},unmute(){window.__unmuted=true},async destroy(){window.__destroyed=(window.__destroyed||0)+1}
 }}
}}
`;
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try {
  const context=await browser.newContext({permissions:['camera'],viewport:{width:1440,height:1080}});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  let sdkRequests=0;page.on('request',r=>{if(r.url().endsWith('/assets/lenses/camera-kit.js'))sdkRequests++});
  await page.goto(baseURL + '/#projects');
  await page.getByRole('button',{name:'Try it live'}).waitFor();
  assert.equal(await page.locator('.project-list h2').count(),3);
  await page.screenshot({path:'.test-artifacts/projects-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Try it live'}).click();
  await page.getByText('Play in your browser on Snapchat’s website. No app download needed.').waitFor();
  assert.equal(sdkRequests,0);
  assert.equal(await page.getByRole('link',{name:'Try Vine Trivia on Snapchat'}).getAttribute('href'),config.lenses[0].hostedUrl);
  await page.screenshot({path:'.test-artifacts/projects-lens-panel.png',fullPage:true});
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.lens-panel').isVisible(),false);
  assert.equal(await page.getByRole('button',{name:'Try it live'}).evaluate(el=>el===document.activeElement),true);
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Try it live'}).click();
  await page.getByText('Play in your browser on Snapchat’s website. No app download needed.').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'.test-artifacts/projects-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Close lens demo'}).click();
  console.log('PASS: project rendering, hosted fallback, no SDK load before start, mobile overflow, Escape/focus');

  await page.route('**/content/lenses.json',r=>r.fulfill({json:{...config,productionApiToken:'test-only'}}));
  await page.route('**/assets/lenses/camera-kit.js',r=>r.fulfill({contentType:'text/javascript',body:sdk}));
  await page.addInitScript(()=>{
   const getMedia=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
   window.__streams=[];
   navigator.mediaDevices.getUserMedia=async(...args)=>{
    if(window.__deny)throw new DOMException('Denied','NotAllowedError');
    const stream=await getMedia(...args);window.__streams.push(stream);
    if(window.__delay)await new Promise(r=>setTimeout(r,1500));
    return stream;
   };
  });
  await page.reload();
  await page.getByRole('button',{name:'Try it live'}).click();
  await page.getByRole('button',{name:'Start camera',exact:true}).click();
  await page.getByText('Vine Trivia is ready.',{exact:false}).waitFor();
  assert.equal(await page.locator('.lens-canvas canvas').count(),1);
  await page.evaluate(()=>window.__lensEvents.dispatchEvent(new CustomEvent('error',{detail:{error:{name:'LensVideoPlaybackMutedError'}}})));
  await page.getByRole('button',{name:'Enable sound'}).click();
  assert.equal(await page.evaluate(()=>window.__unmuted),true);
  assert.equal(await page.locator('.lens-canvas canvas').count(),1);
  await page.getByRole('button',{name:'Stop camera',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true);
  await page.getByRole('button',{name:'Start camera',exact:true}).click();
  await page.getByText('Vine Trivia is ready.',{exact:false}).waitFor();
  await page.evaluate(()=>{location.hash='#about'});
  await page.waitForFunction(()=>document.title.startsWith('About'));
  assert.equal(await page.evaluate(()=>window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true);
  console.log('PASS: start, stop, restart, navigation release camera tracks');

  await page.evaluate(()=>{window.__deny=true;location.hash='#projects'});
  await page.getByRole('button',{name:'Try it live'}).click();
  await page.getByRole('button',{name:'Start camera',exact:true}).click();
  await page.getByText('Camera access was declined.',{exact:false}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Start camera',exact:true}).isEnabled(),true);
  await page.evaluate(()=>{window.__deny=false;window.__delay=true});
  await page.getByRole('button',{name:'Start camera',exact:true}).click();
  await page.waitForFunction(()=>window.__streams.some(s=>s.getTracks().some(t=>t.readyState==='live')));
  await page.getByRole('button',{name:'Close lens demo'}).click();
  await page.waitForFunction(()=>window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')));
  assert.equal(await page.locator('.lens-panel').isVisible(),false);
  console.log('PASS: denied permission and closing during pending camera access');
  assert.deepEqual(pageErrors,[]);
  console.log('PASS: no uncaught browser errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
