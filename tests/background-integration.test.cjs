const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const pve = JSON.parse(fs.readFileSync('data/pve-database.json'));
const pvp = JSON.parse(fs.readFileSync('data/pvp-database.json'));
const stored={aegisSheetDbPvE:pve,aegisSheetDbPvP:pvp,aegisSheetDb:pve,aegisSheetLastSync:12345};
let handler;
const event={addListener:()=>{}};
const chrome={storage:{local:{get:async keys=>Object.fromEntries((typeof keys==='string'?[keys]:keys).map(key=>[key,stored[key]])),set:async values=>Object.assign(stored,values),remove:async keys=>keys.forEach(key=>delete stored[key])},onChanged:event},runtime:{getURL:file=>'https://extension.invalid/'+file,getManifest:()=>({version:'2.0.0'}),onInstalled:event,onStartup:event,onMessage:{addListener:fn=>handler=fn}},alarms:{create:()=>{},onAlarm:event}};
vm.runInNewContext(fs.readFileSync('dist/background.js','utf8'),{chrome,console:{log:()=>{},error:()=>{},warn:()=>{}},fetch:async()=>({ok:true,json:async()=>({weapons:{}}),text:async()=>''}),AbortController,setTimeout,clearTimeout,URL});
(async()=>{
  const result=await new Promise(resolve=>handler({action:'syncSpreadsheets'},null,resolve));
  assert.equal(result.success,false);
  assert.equal(stored.aegisSheetDbPvE,pve);assert.equal(stored.aegisSheetDbPvP,pvp);
  assert.equal(stored.aegisSheetLastSync,12345);assert.equal(stored.rollLensSyncing,false);
  assert.match(stored.rollLensSyncError,/no weapons/);
  console.log('Background integration passed: empty remote sources cannot replace cached ratings or freshness timestamps.');
})().catch(error=>{console.error(error);process.exitCode=1;});
