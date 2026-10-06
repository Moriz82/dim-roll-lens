const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  const file = path.resolve(__dirname, '../src', name + '.ts');
  if (cache.has(file)) return cache.get(file);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; cache.set(file, module.exports);
  new Function('require', 'module', 'exports', output)(name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name), module, module.exports);
  cache.set(file, module.exports); return module.exports;
}
const sheet = { name: 'Test weapon', energy: 'Solar', frame: 'Adaptive', barrel: 'Barrel', mag: 'Magazine', perk1: 'Trait A', perk2: 'Trait B', origin: 'Origin', notes: 'A source note.', tier: 'S', rank: '1', mw: 'Range' };
function ownedRoll(states = ['active','active','active','active']) {
  const slots = {};
  [['barrel','Barrel'],['mag','Magazine'],['perk1','Trait A'],['perk2','Trait B']].forEach(([slot,name], i) => {
    slots[slot] = { complete: true, plugs: [{ hash: i + 1, name: states[i] === 'missing' ? 'Other option' : name, icon: '', active: states[i] === 'active' }] };
  });
  slots.masterwork = { complete: true, plugs: [{ hash: 5, name: 'Range', icon: '', active: true }] };
  slots.origin = { complete: false, plugs: [] };
  return { slots };
}
function payload(pve = ownedRoll(), pvp = null) {
  return { name: 'Test weapon', result: { grade: 'S+', matchPercentage: 100, matchedPerks: [], missingPerks: [], wishlistPerks: [], notes: '' }, perksMap: {}, sheetWeaponPvE: sheet, sheetWeaponPvP: pvp ? sheet : null, sheetWeaponPvECandidates: [sheet], sheetWeaponPvPCandidates: pvp ? [sheet] : [], ownedRoll: pve };
}
const group = ownedRoll;
module.exports = { load, sheet, ownedRoll, group, payload };
