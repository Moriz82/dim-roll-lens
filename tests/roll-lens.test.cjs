const assert = require('node:assert/strict');
const { load, sheet, group, payload } = require('./lens-helpers.cjs');
const { activityVerdict, evaluateLens } = load('roll-lens');
let cases = 0;
const test = (name, fn) => { fn(); cases++; console.log(`✓ ${name}`); };
test('PvE god roll, with unrated PvP left unknown', () => {
  const v = evaluateLens(payload()); assert.equal(v.usage, 'pve'); assert.equal(v.pvp.state, 'unknown'); assert.equal(v.badge, 'PVE');
});
test('simultaneous PvE and PvP are BOTH', () => assert.equal(evaluateLens(payload(group(), group())).usage, 'both'));
test('PvP alone is labeled correctly', () => { const data = payload(null, group()); data.sheetWeaponPvE = null; assert.equal(evaluateLens(data).usage, 'pvp'); });
test('an S+ grade and S meta tier never establish a god roll', () => assert.equal(evaluateLens(payload(group(['missing','missing','missing','missing']))).state, 'partial'));
test('an F-tier weapon can have matching god-roll perks', () => { const data=payload(); data.sheetWeaponPvE={ ...sheet, tier:'F' }; assert.equal(evaluateLens(data).pve.state,'god'); });
test('owned inactive trait is a swap, not active god', () => {
  const v=evaluateLens(payload(group(['active','active','selectable','active']))); assert.equal(v.usage,'none'); assert.equal(v.state,'swap'); assert.deepEqual(v.pve.swaps,['Trait A']);
});
test('two different activity configurations stay separate', () => {
  const v=evaluateLens(payload(group(),group(['active','active','selectable','selectable']))); assert.equal(v.usage,'pve'); assert.equal(v.potentialUsage,'both'); assert.equal(v.pvp.state,'swap');
});
test('complete definition requires the barrel and magazine', () => assert.equal(evaluateLens(payload(group(['missing','active','active','active'])),'complete').state,'good'));
test('traits definition explicitly permits a nonmatching barrel', () => assert.equal(evaluateLens(payload(group(['missing','active','active','active']))).state,'god'));
test('complete definition requires a matching masterwork', () => { const data=payload(); data.equippedMasterwork='Handling'; assert.equal(evaluateLens(data,'complete').pve.state,'good'); });
test('missing masterwork cannot meet strict matching', () => { const data=payload(); data.equippedMasterwork=null; assert.equal(evaluateLens(data,'complete').pve.state,'good'); });
test('complete barrel swap is identified', () => { const v=evaluateLens(payload(group(['selectable','active','active','active'])),'complete'); assert.equal(v.state,'swap'); assert.deepEqual(v.pve.swaps,['Barrel']); });
test('complete active match is perfect', () => assert.equal(evaluateLens(payload(),'complete').pve.perfect,true));
test('unspecified masterwork does not impose an invented requirement', () => { const data=payload(); data.sheetWeaponPvE={ ...sheet,mw:'Any' }; assert.equal(evaluateLens(data,'complete').pve.state,'god'); });
test('missing source data is unrated even with high old grades', () => { const data=payload(); data.sheetWeaponPvE=null; assert.equal(evaluateLens(data).state,'unknown'); });
test('missing bridge data is unrated', () => assert.equal(evaluateLens(payload(null)).state,'unknown'));
test('empty recommended traits are not a god roll', () => assert.equal(activityVerdict('pve',{...sheet,perk1:'-'},group()).state,'unknown'));
test('fixed exotic meta tier is not a random-roll verdict', () => assert.equal(activityVerdict('pve',{...sheet,exoticViability:{dps:'S'}},group()).state,'fixed'));
test('one missing trait never establishes god status', () => assert.equal(evaluateLens(payload(group(['active','active','active','missing']))).state,'partial'));
test('recommendation alternatives count once per slot', () => {
  const g=group(); g.all.push({...g.all[2],name:'Alternative',status:'missing'}); assert.equal(activityVerdict('pve',sheet,g,'Range').activeTraits,2);
});
test('god labels contain only the activity', () => {
  assert.equal(evaluateLens(payload(group(),group())).badge,'BOTH');
  const data=payload(null,group()); data.sheetWeaponPvE=null;
  assert.equal(evaluateLens(data).badge,'PVP');
});
test('one missing or selectable trait receives PVE-1', () => {
  for (const status of ['missing','selectable']) {
    const v=evaluateLens(payload(group(['active','active','active',status])));
    assert.equal(v.badge,'PVE-1'); assert.equal(v.pve.distance,1); assert.equal(v.usage,'none');
  }
});
test('one-away activity labels are independent', () => {
  const near=group(['active','active','missing','active']);
  assert.equal(evaluateLens(payload(near,near)).badge,'PVE-1 PVP-1');
  assert.equal(evaluateLens(payload(group(['active','active','missing','missing']),near)).badge,'PVP-1');
});
test('a god roll hides the other activity near label', () => {
  assert.equal(evaluateLens(payload(group(),group(['active','active','missing','active']))).badge,'PVE');
});
test('two missing or selectable traits stay unlabeled', () => {
  for (const status of ['missing','selectable']) {
    assert.equal(evaluateLens(payload(group(['active','active',status,status]))).badge,'');
  }
});
test('strict one-away counts required details, including masterwork', () => {
  const data=payload(); data.equippedMasterwork='Handling';
  assert.equal(evaluateLens(data,'complete').badge,'PVE-1');
  data.sheetPerksPvE=group(['missing','active','active','active']);
  assert.equal(evaluateLens(data,'complete').badge,'');
});
test('fixed and unrated weapons have no tile labels', () => {
  const data=payload(); data.sheetWeaponPvE={...sheet,exoticViability:{dps:'S'}};
  assert.equal(evaluateLens(data).badge,'');
  data.sheetWeaponPvE=null; assert.equal(evaluateLens(data).badge,'');
  assert.equal(evaluateLens(payload(null)).badge,'');
  data.sheetWeaponPvE={...sheet,perk1:'-'}; data.sheetPerksPvE=group(['active','active','missing','active']);
  assert.equal(evaluateLens(data).badge,'');
});
console.log(`${cases} verdict regression cases passed.`);
