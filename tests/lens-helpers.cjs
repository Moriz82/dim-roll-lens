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
function group(states = ['active','active','active','active']) {
  const all = ['barrel','mag','perk1','perk2'].map((type,i) => ({ type, name: ['Barrel','Magazine','Trait A','Trait B'][i], status: states[i], matched: states[i] !== 'missing', hash: i + 1 }));
  return { all, matched: all.filter(p => p.matched), missing: all.filter(p => !p.matched) };
}
function payload(pve = group(), pvp = null) {
  return { name: 'Test weapon', result: { grade: 'S+', matchPercentage: 100, matchedPerks: [], missingPerks: [], wishlistPerks: [], notes: '' }, perksMap: {}, equippedMasterwork: 'Range', sheetWeaponPvE: sheet, sheetWeaponPvP: pvp ? sheet : null, sheetPerksPvE: pve, sheetPerksPvP: pvp };
}
module.exports = { load, sheet, group, payload };
