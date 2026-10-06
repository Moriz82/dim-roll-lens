const assert = require('node:assert/strict');
const { load, sheet, ownedRoll, payload } = require('./lens-helpers.cjs');
const { activityVerdict, evaluateLens } = load('roll-lens');
let cases = 0;
const test = (name, fn) => { fn(); cases++; console.log(`✓ ${name}`); };

test('all five owned slots produce a PvE god roll', () => {
  const v = evaluateLens(payload()); assert.equal(v.badge, 'PVE'); assert.equal(v.pve.matchedCount, 5); assert.equal(v.pve.ownedMatches, 5);
});
test('inactive owned choices still count as god roll', () => {
  const v = evaluateLens(payload(ownedRoll(['selectable','selectable','selectable','selectable']))); assert.equal(v.badge, 'PVE'); assert.equal(v.pve.perfect, true);
});
test('selection state cannot change verdict or native recommendations', () => {
  const a = evaluateLens(payload(ownedRoll(['active','active','selectable','active'])));
  const b = evaluateLens(payload(ownedRoll(['selectable','selectable','active','selectable'])));
  assert.equal(a.badge, b.badge); assert.deepEqual(a.pve.nativeRecommended, b.pve.nativeRecommended);
});
test('one owned slot short is PVE-1', () => { const v=evaluateLens(payload(ownedRoll(['active','active','active','missing']))); assert.equal(v.badge,'PVE-1'); assert.equal(v.pve.matchedCount,4); });
test('two missing owned slots stay unlabeled', () => { const v=evaluateLens(payload(ownedRoll(['active','active','missing','missing']), ownedRoll())); assert.equal(v.badge,''); assert.equal(v.pve.matchedCount,3); });
test('PvE and PvP complete rows produce BOTH', () => assert.equal(evaluateLens(payload(undefined, ownedRoll())).badge, 'BOTH'));
test('missing recommendation in any source slot is UNDEF', () => { const data=payload(); data.sheetWeaponPvE={...sheet,perk2:'-'}; data.sheetWeaponPvECandidates=[data.sheetWeaponPvE]; assert.equal(evaluateLens(data).badge,'UNDEF'); assert.equal(evaluateLens(data).pve.matchedCount,null); });
test('missing bridge data is UNDEF', () => { const data=payload(); data.ownedRoll=undefined; assert.equal(evaluateLens(data).badge,'UNDEF'); });
test('masterwork is the fifth required slot', () => { const data=payload(); data.ownedRoll=ownedRoll(); data.ownedRoll.slots.masterwork.plugs[0].name='Handling'; assert.equal(evaluateLens(data).badge,'PVE-1'); assert.equal(evaluateLens(data).pve.matchedCount,4); });
test('complete candidate rows are scored coherently', () => { const data=payload(); data.sheetWeaponPvECandidates=[{...sheet,barrel:'Other Barrel'},{...sheet,perk2:'Other Trait'}]; data.sheetWeaponPvPCandidates=[]; assert.equal(evaluateLens(data).badge,'PVE-1'); });
test('exact perk names do not match substrings', () => { const r=activityVerdict('pve',{...sheet,barrel:'Barrel Extended'},ownedRoll()); assert.equal(r.ownedMatches,4); });
test('all matching alternatives receive native recommendations', () => { const o=ownedRoll(); o.slots.barrel.plugs.push({hash:99,name:'Barrel',icon:'',active:false}); const r=activityVerdict('pve',sheet,o); assert.ok(r.nativeRecommended.some(x=>x.hash===1)); assert.ok(r.nativeRecommended.some(x=>x.hash===99)); });
test('known ordinary roll stays blank when the other activity is undefined', () => {
  const v=evaluateLens(payload(ownedRoll(['active','active','missing','missing'])));
  assert.equal(v.pve.matchedCount,3); assert.equal(v.pvp.matchedCount,null); assert.equal(v.badge,''); assert.equal(v.sourceResolution,'resolved');
});
test('positively fixed main traits stay unlabeled and acquire no gold checks', () => {
  const data=payload(); data.ownedRoll.randomizedTraits=false; const v=evaluateLens(data);
  assert.equal(v.badge,''); assert.equal(v.state,'fixed'); assert.deepEqual(v.pve.nativeRecommended,[]);
});
test('unknown trait randomization cannot hide a missing recommendation', () => {
  const data=payload(); data.sheetWeaponPvECandidates=[]; const v=evaluateLens(data); assert.equal(v.badge,'UNDEF');
});
console.log(`${cases} owned five-slot verdict cases passed.`);
