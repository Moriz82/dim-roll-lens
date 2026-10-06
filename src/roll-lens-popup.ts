const statusEl = document.getElementById('lens-status')!;
const enabled = document.querySelector<HTMLInputElement>('#lens-enabled')!;
const glow = document.querySelector<HTMLInputElement>('#lens-glow')!;
const rule = document.querySelector<HTMLSelectElement>('#lens-rule')!;
const sync = document.querySelector<HTMLButtonElement>('#lens-sync')!;

async function refresh() {
  const data = await chrome.storage.local.get(['rollLensEnabled', 'rollLensGlow', 'rollLensRule', 'aegisSheetLastSync', 'rollLensSyncError', 'rollLensSyncing']);
  enabled.checked = data.rollLensEnabled !== false; glow.checked = data.rollLensGlow !== false;
  rule.value = data.rollLensRule === 'complete' ? 'complete' : 'traits';
  statusEl.textContent = data.rollLensSyncing ? 'Refreshing Aegis + Finnald…' : data.rollLensSyncError ? `Sync failed. Cached ratings kept. ${data.rollLensSyncError}` : data.aegisSheetLastSync ? `Cached ${new Date(data.aegisSheetLastSync).toLocaleString()}` : 'Bundled ratings ready. Sync to check for updates.';
  sync.disabled = !!data.rollLensSyncing;
}
for (const [input, key] of [[enabled, 'rollLensEnabled'], [glow, 'rollLensGlow']] as const) {
  input.addEventListener('change', () => chrome.storage.local.set({ [key]: input.checked }));
}
rule.addEventListener('change', () => chrome.storage.local.set({ rollLensRule: rule.value }));
sync.addEventListener('click', async () => {
  sync.disabled = true; statusEl.textContent = 'Refreshing Aegis + Finnald…';
  try {
    const response = await chrome.runtime.sendMessage({ action: 'syncSpreadsheets' });
    if (!response?.success) statusEl.textContent = `Sync failed. Cached ratings kept. ${response?.error || 'Try again later.'}`;
    else await refresh();
  } catch { statusEl.textContent = 'Extension connection lost. Reopen this popup.'; }
  finally { sync.disabled = false; }
});
chrome.storage.onChanged.addListener(() => { void refresh(); });
void refresh();
