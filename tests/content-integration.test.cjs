const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const pve = JSON.parse(fs.readFileSync(path.resolve('data/pve-database.json')));
const pvp = JSON.parse(fs.readFileSync(path.resolve('data/pvp-database.json')));
const dom = new JSDOM('<!doctype html><body><div class="sub-bucket"><div class="item-drag-container"><div id="item-synthetic" class="item" data-aegis-item-hash="1" data-aegis-item-name="No Hesitation" data-aegis-instance-id="synthetic-1" data-aegis-masterwork="range" data-aegis-perk-hashes="1,2,3,4,5" data-aegis-active-perk-hashes="1,2,3,4,5"></div></div></div></body>', { url:'https://app.destinyitemmanager.com/demo/d2/inventory',runScripts:'outside-only',pretendToBeVisual:true });
const window=dom.window;
const observers=[]; const BaseObserver=window.MutationObserver; window.MutationObserver=class extends BaseObserver { constructor(fn) { super(fn); observers.push(this); } };
const shutdown=()=>{observers.forEach(o=>o.disconnect());dom.window.close();};
const tile=window.document.getElementById('item-synthetic');
const recommendation=pve.weapons['no hesitation'];
const names=[recommendation.barrel,recommendation.mag,recommendation.perk1.split('\n')[0],recommendation.perk2.split('\n')[0],recommendation.origin];
tile.dataset.aegisPerksData=JSON.stringify(Object.fromEntries(names.map((name,i)=>[i+1,{name,icon:''}])));
const stored={ aegisSheetDb:pve,aegisSheetDbPvE:pve,aegisSheetDbPvP:pvp,aegisMode:'both',aegisWelcomeDismissed:true,rollLensEnabled:true };
const listeners=[];
function get(keys,cb) { const result=Object.fromEntries((typeof keys==='string'?[keys]:keys||Object.keys(stored)).map(key=>[key,stored[key]])); if(cb) queueMicrotask(()=>cb(result)); return Promise.resolve(result); }
window.chrome={ storage:{ local:{ get, set:async values=>{const changes={};for(const key in values){changes[key]={oldValue:stored[key],newValue:values[key]};stored[key]=values[key];}listeners.forEach(fn=>fn(changes,'local'));}, remove:async()=>{} },onChanged:{addListener:fn=>listeners.push(fn)} },runtime:{ id:'demo',lastError:null,getURL:file=>'https://extension.invalid/'+file,sendMessage:(message,cb)=>{if(cb) queueMicrotask(()=>cb({success:true}));return Promise.resolve({success:true});},onMessage:{addListener:()=>{}}} };
window.fetch=async url=>({ok:true,json:async()=>url.includes('manifest-weapons')?JSON.parse(fs.readFileSync(path.resolve('data/manifest-weapons.json'))):{},text:async()=>''});
window.CSS={escape:s=>s};window.HTMLElement.prototype.scrollIntoView=()=>{};
window.console={...console,debug:()=>{}};
window.eval(fs.readFileSync(path.resolve('dist/content.js'),'utf8'));
(async()=>{
  await new Promise(r=>setTimeout(r,450));
  assert.equal(tile.querySelector('.rl-badge')?.textContent,'★ PVE','Full built content must evaluate real bundled recommendation names and render the badge');
  assert.equal(tile.dataset.rlUsage,'pve');
  assert.equal(tile.querySelectorAll('.rl-badge').length,1);
  const panel=window.document.getElementById('rl-dashboard');
  panel.showModal=()=>{panel.open=true}; panel.close=()=>{panel.open=false;panel.dispatchEvent(new window.Event('close'));};
  window.document.getElementById('rl-launcher').click();
  assert.equal(panel.querySelectorAll('.rl-row').length,1);
  panel.querySelector('.rl-row').click();assert.match(panel.querySelector('.rl-detail').textContent,/Physic/);
  panel.close();
  // A trait change must replace the old god verdict without duplicating badges.
  const map=JSON.parse(tile.dataset.aegisPerksData);map[3].name='Unrecommended trait';tile.dataset.aegisPerksData=JSON.stringify(map);
  await new Promise(r=>setTimeout(r,350));assert.notEqual(tile.dataset.rlUsage,'pve');
  assert.equal(tile.querySelectorAll('.rl-badge').length,1);
  // No PvP source must not silently fall back to PvE recommendations.
  map[3].name=names[2]; tile.dataset.aegisPerksData=JSON.stringify(map);
  await window.chrome.storage.local.set({aegisSheetDbPvP:null});
  await new Promise(r=>setTimeout(r,250));
  assert.equal(tile.dataset.rlUsage,'pve');
  shutdown();console.log('Built-content integration passed: bundled recommendations, dashboard, mutation rescore, deduplication and missing-source isolation.');
})().catch(error=>{shutdown();console.error(error);process.exitCode=1;});
