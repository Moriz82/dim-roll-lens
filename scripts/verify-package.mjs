import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
for (const browser of ['chromium', 'firefox']) {
  const root = path.resolve('releases', browser);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  const required = [manifest.action.default_popup, ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap(entry => [...entry.js, ...(entry.css || [])]),
    'data/pve-database.json', 'data/pvp-database.json', 'data/manifest-weapons.json', 'LICENSE', 'CREDITS.md'];
  for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `${browser}: missing ${file}`);
  assert.equal(manifest.name, 'DIM Roll Lens');
  assert.ok(!manifest.host_permissions.includes('https://*/*'));
  if (browser === 'firefox') assert.deepEqual(manifest.background, { scripts: ['background.js'] });
  else assert.deepEqual(manifest.background, { service_worker: 'background.js' });
  const archive = path.resolve('releases', `dim-roll-lens-v${manifest.version}-${browser}.zip`);
  if (process.platform !== 'win32') {
    const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
    for (const file of required) assert.ok(entries.includes(file), `ZIP path missing: ${file}`);
  }
}
console.log('Chromium and Firefox manifests, nested ZIP paths, assets and bundled sources verified.');
