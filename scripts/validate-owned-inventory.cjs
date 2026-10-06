// Local-only inventory validation. Pass a private DIM snapshot; no inventory is printed or uploaded.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { load } = require('../tests/lens-helpers.cjs');
const { buildOwnedRollData, buildOwnedRollPerks } = load('owned-rolls');
const { resolveRollSourceCandidates } = load('roll-lens-source');
const { evaluateLens } = load('roll-lens');
const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/validate-owned-inventory.cjs <private-inventory.json>');
const snapshot = JSON.parse(fs.readFileSync(file,'utf8'));
const dbs = ['pve','pvp'].map(activity=>JSON.parse(fs.readFileSync(`data/${activity}-database.json`,'utf8')));
const manifest=new Map(JSON.parse(fs.readFileSync('data/manifest-weapons.json','utf8')).map(w=>[w.hash,w]));
const canonical = value => String(value||'').toLowerCase().replace(/\benhanced\b/g,'').replace(/[^a-z0-9]/g,'');
const mwCanonical = value => canonical(String(value||'').replace(/tier\s*\d+\s*:?/ig,'').replace(/masterwork(?:ed|s)?|\bmw\b/ig,'').replace(/reload speed/ig,'reload').replace(/projectile speed/ig,'velocity'));
const fields = ['barrel','mag','perk1','perk2','masterwork'];
const tokens = raw => /^(?:-|—|n\/?a|none|any|undefined|undef)$/i.test(String(raw||'').trim()) ? [] : String(raw||'').split(/[\n/,]+/).map(x=>x.trim()).filter(Boolean);
// Deliberately independent slot-set oracle: count membership in each whole source row.
function oracle(source, owned) {
  if (source.resolution !== 'resolved' || !source.rows.length || fields.some(slot=>!owned.slots[slot].complete)) return null;
  const scores = source.rows.flatMap(row=>{
    const recs = fields.map(slot=>tokens(row[slot==='masterwork'?'mw':slot]));
    if (recs.some(r=>!r.length)) return [];
    return [fields.reduce((sum,slot,index)=>sum+Number(owned.slots[slot].plugs.some(p=>recs[index].some(r=>(slot==='masterwork'?mwCanonical:canonical)(p.name)===(slot==='masterwork'?mwCanonical:canonical)(r)))),0)];
  });
  return scores.length ? Math.max(...scores) : null;
}
const counts = {items:0,weapons:0,fixedWeapons:0,armor:0,other:0,stores:snapshot.stores.length,labels:{},selectionInvariant:0,ownedHashChecks:0};
assert.equal(snapshot.stores.some(s=>s.hadErrors),false,'DIM reported an inventory store error');
for (const store of snapshot.stores) {
  assert.equal(store.count,store.items.length,'Snapshot store coverage mismatch');
  for (const item of store.items) {
    counts.items++;
    if (!item.itemCategoryHashes?.includes(1)) { item.itemCategoryHashes?.includes(20) ? counts.armor++ : counts.other++; continue; }
    counts.weapons++;
    const sockets=item.sockets?.allSockets||[];
    const primaries=item.masterworkInfo?.stats?.filter(s=>s.isPrimary)||[];
    const mw=primaries.length===1?primaries[0].name:'';
    const ownedRoll=buildOwnedRollData(sockets,mw);
    const rawOwned=new Set(sockets.flatMap(s=>[s.plugged?.plugDef?.hash,...(s.reusablePlugItems||[]).map(p=>p.plugItemHash)]).filter(Boolean));
    for (const slot of fields.slice(0,4)) for (const plug of ownedRoll.slots[slot].plugs) {
      assert.ok(rawOwned.has(plug.hash),`Weapon case ${counts.weapons}: manifest option counted as owned`); counts.ownedHashChecks++;
    }
    const perks=buildOwnedRollPerks(sockets);
    const sources=dbs.map(db=>resolveRollSourceCandidates(db,item.name,item.hash,perks,manifest.get(item.hash)));
    const payload={name:item.name,ownedRoll,perksMap:{},equippedMasterwork:mw,result:{grade:null,notes:'',matchedPerks:[],missingPerks:[],wishlistPerks:[],matchPercentage:0},sheetWeaponPvECandidates:sources[0].rows,sheetWeaponPvPCandidates:sources[1].rows,sourceResolutionPvE:sources[0].resolution,sourceResolutionPvP:sources[1].resolution};
    const verdict=evaluateLens(payload);
    const traits=sockets.filter(s=>[1215804697,1215804696].includes(s.socketDefinition?.socketTypeHash));
    const fixed=traits.length>0 && traits.every(s=>s.hasRandomizedPlugItems===false);
    if(fixed)counts.fixedWeapons++;
    const expected=fixed?[null,null]:sources.map(s=>oracle(s,ownedRoll));
    const badge=fixed?'':expected[0]===5&&expected[1]===5?'BOTH':expected[0]===5?'PVE':expected[1]===5?'PVP':expected.some(n=>n===4)?[expected[0]===4?'PVE-1':'',expected[1]===4?'PVP-1':''].filter(Boolean).join(' '):expected.every(n=>n===null)?'UNDEF':'';
    assert.equal(verdict.badge,badge,`Weapon case ${counts.weapons}: five-slot oracle disagreement`);
    for (const [index,activity] of ['pve','pvp'].entries()) {
      assert.equal(verdict[activity].matchedCount,expected[index],`Weapon case ${counts.weapons}: ${activity} count disagrees`);
      for (const mark of verdict[activity].nativeRecommended) assert.ok(ownedRoll.slots[mark.slot].plugs.some(p=>p.hash===mark.hash),`Weapon case ${counts.weapons}: native check is not owned in its slot`);
    }
    const changed=structuredClone(ownedRoll);
    for (const slot of fields) for (const plug of changed.slots[slot].plugs) plug.active=!plug.active;
    const flipped=evaluateLens({...payload,ownedRoll:changed});
    assert.deepEqual([flipped.badge,flipped.pve.matchedCount,flipped.pvp.matchedCount,flipped.pve.nativeRecommended,flipped.pvp.nativeRecommended],[verdict.badge,verdict.pve.matchedCount,verdict.pvp.matchedCount,verdict.pve.nativeRecommended,verdict.pvp.nativeRecommended],`Weapon case ${counts.weapons}: selection affected verdict or gold checks`);
    counts.selectionInvariant++;
    counts.labels[verdict.badge||'blank']=(counts.labels[verdict.badge||'blank']||0)+1;
  }
}
console.log(JSON.stringify({passed:true,...counts},null,2));
