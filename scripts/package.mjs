import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const output = path.join(root, 'releases');
fs.mkdirSync(output, { recursive: true });
for (const browser of ['chromium', 'firefox']) {
  const stage = path.join(output, browser);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.cpSync(path.join(root, 'dist'), stage, { recursive: true });
  if (browser === 'firefox') fs.copyFileSync(path.join(stage, 'manifest.firefox.json'), path.join(stage, 'manifest.json'));
  fs.rmSync(path.join(stage, 'manifest.firefox.json'));
  const archive = path.join(output, `dim-roll-lens-v${version}-${browser}.zip`);
  fs.rmSync(archive, { force: true });
  // Preserve nested data/, icons/ and locales/ paths; a flattened ZIP cannot load.
  if (process.platform === 'win32') execFileSync('tar', ['-a', '-cf', archive, '-C', stage, '.'], { stdio: 'inherit' });
  else execFileSync('zip', ['-qr', archive, '.'], { cwd: stage, stdio: 'inherit' });
  console.log(`Packaged ${path.relative(root, archive)}`);
}
