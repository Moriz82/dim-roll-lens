import type { WeaponEvaluationPayload } from './types';
import { evaluateLens, type ActivityVerdict, type LensRule, type LensVerdict } from './roll-lens';

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export interface LensSettings { enabled: boolean; glow: boolean; rule: LensRule }
export const defaultLensSettings: LensSettings = { enabled: true, glow: true, rule: 'complete' };
let settings = { ...defaultLensSettings };
let status: { lastSync?: number; syncing?: boolean; error?: string } = {};
export function configureLens(next: Partial<LensSettings>) {
  settings = { ...settings, ...next, rule: 'complete' };
  document.documentElement.dataset.rollLens = settings.enabled ? 'on' : 'off';
}
export function updateLensStatus(next: typeof status) { status = next; }
export function isLensEnabled(): boolean { return settings.enabled; }
export function renderLensCard(data: WeaponEvaluationPayload): string { return lensCardHtml(data.name, evaluateLens(data, settings.rule)); }

function activityHtml(v: ActivityVerdict): string {
  const match = v.state === 'fixed' ? 'No random roll to grade' : v.matchedCount === null ? 'Five-slot verdict undefined' : `${v.matchedCount}/5 recommended slots owned`;
  const rows = v.slots.map(s => `<li class="rl-slot rl-slot-${s.status}"><span class="rl-slot-status">${s.status === 'active' || s.status === 'selectable' ? '✓' : s.status === 'missing' ? '−' : '/'}</span><div><small>${s.label}</small><span>${escape(s.selected || s.recommendations.join(' / ') || 'No source recommendation')}</span></div><em>${s.status === 'active' || s.status === 'selectable' ? 'Owned' : s.status === 'missing' ? 'Missing' : 'Undefined'}</em></li>`).join('');
  return `<section class="rl-activity rl-${v.activity}"><div class="rl-activity-heading"><b>${v.activity === 'pve' ? 'PvE' : 'PvP'}</b><span class="rl-status rl-status-${v.state}">${escape(v.label)}</span></div><p class="rl-match">${match}</p>${rows ? `<ul class="rl-slots">${rows}</ul>` : v.state === 'fixed' ? '' : '<p class="rl-empty-detail">This source has no complete five-slot recommendation for this weapon.</p>'}${v.notes ? `<p class="rl-notes">${escape(v.notes)}</p>` : ''}<footer><a href="${v.sourceUrl}" target="_blank" rel="noopener noreferrer">${v.source} ↗</a>${v.tier ? `<span>Weapon meta tier ${escape(v.tier)}</span>` : ''}</footer></section>`;
}

export function lensCardHtml(name: string, verdict: LensVerdict): string {
  return `<div class="rl-card-heading"><div><span class="rl-eyebrow">ROLL LENS</span><h2>${escape(name)}</h2></div><span class="rl-headline rl-status-${verdict.state}">${escape(verdict.label)}</span></div><div class="rl-activities">${activityHtml(verdict.pve)}${activityHtml(verdict.pvp)}</div><p class="rl-definition">God roll = one complete 5/5 recommendation present on the gun: barrel, magazine, both traits and masterwork. Inactive options count. Ratings reflect these community sources.</p>`;
}

/** Decorate DIM's native socket icons without changing their controls or layout. */
function markNativePerks(popup: HTMLElement, verdict?: LensVerdict): void {
  popup.querySelectorAll('.rl-item-card, .rl-badge').forEach(node => node.remove());
  const wanted = new Map<string, Set<string>>();
  for (const activity of verdict ? [verdict.pve, verdict.pvp] : []) {
    for (const plug of activity.nativeRecommended) {
      const key = `${plug.slot}:${plug.hash}`;
      if (!wanted.has(key)) wanted.set(key, new Set());
      wanted.get(key)!.add(activity.activity === 'pve' ? 'PvE' : 'PvP');
    }
  }
  popup.querySelectorAll<HTMLElement>('[data-rl-plug-hash][data-rl-plug-slot], .rl-recommended-perk').forEach(icon => {
    const activities = wanted.get(`${icon.dataset.rlPlugSlot}:${icon.dataset.rlPlugHash}`);
    icon.classList.toggle('rl-recommended-perk', !!activities);
    let check = icon.querySelector<HTMLElement>(':scope > .rl-perk-check');
    if (!activities) { check?.remove(); return; }
    if (!check) {
      check = document.createElement('span'); check.className = 'rl-perk-check'; check.setAttribute('role', 'img'); icon.append(check);
    }
    const label = `Recommended for ${[...activities].join(' and ')}`;
    if (check.getAttribute('aria-label') !== label) check.setAttribute('aria-label', label);
  });
}

const previous = new WeakMap<HTMLElement, string>();
/** Called at the end of DIM's existing per-item pipeline, including unrated items. */
export function applyLens(el: HTMLElement, data: WeaponEvaluationPayload): void {
  const popup = el.matches('.item-popup, [class*="item-popup"], [class*="ItemPopup"]') ? el : el.closest<HTMLElement>('.item-popup, [class*="item-popup"], [class*="ItemPopup"]');
  if (!settings.enabled || data.sheetArmor || ['armor', 'other'].includes(el.dataset.aegisItemType || '')) {
    el.querySelectorAll('.rl-badge, .rl-item-card').forEach(node => node.remove());
    if (popup) markNativePerks(popup);
    delete el.dataset.rlState; delete el.dataset.rlUsage; delete el.dataset.rlPotential; delete el.dataset.rlGlow;
    previous.delete(el); return;
  }
  const verdict = evaluateLens(data);
  const nativeIcons = popup ? [...popup.querySelectorAll<HTMLElement>('[data-rl-plug-hash][data-rl-plug-slot]')].map(i => [i.dataset.rlPlugHash, i.dataset.rlPlugSlot]) : [];
  const signature = JSON.stringify([data.name, verdict, settings, !!popup, nativeIcons]);
  if (previous.get(el) === signature && (popup ? !popup.querySelector('.rl-item-card') : !!el.querySelector('.rl-badge') === !!verdict.badge)) return;
  previous.set(el, signature);
  el.dataset.rlState = verdict.state;
  el.dataset.rlUsage = verdict.usage;
  el.dataset.rlPotential = verdict.potentialUsage;
  el.dataset.rlGlow = !popup && settings.glow && verdict.state === 'god' ? 'on' : 'off';
  if (popup) { markNativePerks(popup, verdict); return; }
  const target = el.querySelector<HTMLElement>('[data-aegis-badge-slot]') || el;
  let badge = target.querySelector<HTMLElement>('.rl-badge');
  if (!verdict.badge) { badge?.remove(); return; }
  if (!badge) {
    badge = document.createElement('span'); badge.className = 'rl-badge'; badge.setAttribute('role', 'img'); target.append(badge);
  }
  badge.dataset.state = verdict.usage !== 'none' ? 'god' : verdict.badge === 'UNDEF' ? 'undefined' : 'near';
  badge.dataset.usage = verdict.usage !== 'none' ? verdict.usage : verdict.nearUsage;
  badge.textContent = verdict.badge;
  badge.title = verdict.badge === 'UNDEF' ? 'Undefined: neither activity has a complete five-slot evaluation for this weapon.' : `${verdict.badge}. PvE: ${verdict.pve.label}. PvP: ${verdict.pvp.label}.`;
  badge.setAttribute('aria-label', badge.title);
}

type Filter = 'all' | 'god' | 'pve' | 'pvp' | 'both' | 'swap' | 'unknown';
export function initLensDashboard(getData: (el: HTMLElement) => WeaponEvaluationPayload | undefined): void {
  if (document.getElementById('rl-launcher')) return;
  const button = document.createElement('button');
  button.id = 'rl-launcher'; button.className = 'rl-launcher'; button.type = 'button';
  button.innerHTML = '<span class="rl-mark">◈</span><span>Roll Lens</span>';
  button.setAttribute('aria-label', 'Open Roll Lens inventory overview');
  button.setAttribute('aria-expanded', 'false');
  document.body.append(button);
  let filter: Filter = 'all';
  let query = '';
  let selected: string | null = null;
  let opener: Element | null = null;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  const panel = document.createElement('dialog'); panel.className = 'rl-dashboard'; panel.id = 'rl-dashboard';
  panel.setAttribute('aria-label', 'Roll Lens inventory overview');
  panel.innerHTML = `<header class="rl-dash-header"><div><span class="rl-eyebrow">YOUR VAULT, IN FOCUS</span><h1><span class="rl-mark">◈</span> Roll Lens</h1></div><button type="button" class="rl-close" aria-label="Close Roll Lens">✕</button></header><div class="rl-dash-intro"><h2>Know what to keep.</h2><p>Every roll. Both activities. One clear verdict.</p></div><div class="rl-counts"></div><nav class="rl-filters" aria-label="Filter rolls">${(['all', 'god', 'pve', 'pvp', 'both', 'swap', 'unknown'] as Filter[]).map(f => `<button type="button" data-filter="${f}" aria-pressed="${f === 'all'}">${({ all: 'All rolls', god: 'God rolls', pve: 'PvE', pvp: 'PvP', both: 'Both', swap: 'One away', unknown: 'Undefined' })[f]}</button>`).join('')}</nav><label class="rl-search-label"><span>Search weapons</span><input class="rl-search" type="search" placeholder="Search your weapons…" autocomplete="off"></label><p class="rl-coverage" aria-live="polite"></p><div class="rl-dash-body"><div class="rl-inventory"></div><section class="rl-detail" aria-label="Selected roll details"><p class="rl-empty">Select a weapon to see its recommended perks.</p></section></div><footer class="rl-dash-footer"><span class="rl-sync"></span><span>Built on <a href="https://github.com/Maxeption/dim-aegis-overlay" target="_blank" rel="noopener noreferrer">Maxeption’s original</a> · <a href="https://github.com/Moriz82/dim-roll-lens" target="_blank" rel="noopener noreferrer">Source ↗</a></span></footer>`;
  document.body.append(panel);
  const inventory = panel.querySelector<HTMLElement>('.rl-inventory')!;
  const detail = panel.querySelector<HTMLElement>('.rl-detail')!;
  const search = panel.querySelector<HTMLInputElement>('.rl-search')!;
  let rendered = '';
  function render() {
    const seen = new Set<string>();
    const entries = Array.from(document.querySelectorAll<HTMLElement>('[data-aegis-item-hash]')).flatMap(el => {
      // This is a DOM coverage count, never a claim to have scanned the complete account.
      if (el.parentElement?.closest('[data-aegis-item-hash]') || el.closest('.item-popup, [class*="ItemPopup"], [class*="item-popup"], .armory, .rl-dashboard')) return [];
      const data = getData(el);
      if (!data || data.sheetArmor || ['armor', 'other'].includes(el.dataset.aegisItemType || '') || el.dataset.aegisItemType === 'other') return [];
      const id = el.dataset.aegisInstanceId || el.id || `${el.dataset.aegisItemHash}:${el.dataset.aegisPerkHashes}:${el.dataset.aegisActivePerkHashes}`;
      if (seen.has(id)) return [];
      seen.add(id); return [{ id, data, verdict: evaluateLens(data, settings.rule) }];
    });
    const gods = entries.filter(e => e.verdict.state === 'god').length;
    const swaps = entries.filter(e => e.verdict.nearUsage !== 'none' && e.verdict.usage === 'none').length;
    const both = entries.filter(e => e.verdict.usage === 'both').length;
    panel.querySelector('.rl-counts')!.innerHTML = `<div><b>${entries.length}</b><span>Weapons loaded</span></div><div><b>${gods}</b><span>God rolls</span></div><div><b>${both}</b><span>Both activities</span></div><div><b>${swaps}</b><span>One slot away</span></div>`;
    const ordered = entries.filter(({ data, verdict: v }) => data.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'all' || filter === 'god' && v.state === 'god' || filter === 'swap' && v.nearUsage !== 'none' && v.usage === 'none' ||
      filter === 'unknown' && v.state === 'unknown' || filter === 'both' && v.usage === 'both' ||
      filter === 'pve' && v.pve.state === 'god' || filter === 'pvp' && v.pvp.state === 'god'))
      .sort((a, b) => ({ god: 0, swap: 1, good: 2, partial: 3, fixed: 4, unknown: 5 })[a.verdict.state] -
      ({ god: 0, swap: 1, good: 2, partial: 3, fixed: 4, unknown: 5 })[b.verdict.state] || a.data.name.localeCompare(b.data.name));
    panel.querySelector('.rl-coverage')!.textContent = `${ordered.length} shown · ${entries.length} weapon instances currently loaded in DIM. Hidden or unloaded items are not included.`;
    panel.querySelector('.rl-sync')!.textContent = status.syncing ? '↻ Refreshing community data…' : status.error ? 'Sync failed · cached ratings retained' : status.lastSync ? `Data cached ${new Date(status.lastSync).toLocaleString()}` : 'Bundled community data · awaiting first sync';
    const signature = JSON.stringify([ordered.map(e => [e.id, e.data.name, e.verdict]), selected, settings.rule]);
    if (signature === rendered) return;
    rendered = signature;
    inventory.innerHTML = ordered.length ? ordered.map(({ id, data, verdict: v }) => `<button type="button" class="rl-row${id === selected ? ' rl-selected' : ''}" data-instance="${escape(id)}"><span class="rl-row-icon rl-status-${v.state}">${v.state === 'god' ? '★' : v.nearUsage !== 'none' ? '−1' : '◇'}</span><span class="rl-row-title"><b>${escape(data.name)}</b><small>${escape(v.label)}</small></span><span class="rl-mini rl-pve">E ${v.pve.matchedCount ?? '—'}/5</span><span class="rl-mini rl-pvp">P ${v.pvp.matchedCount ?? '—'}/5</span></button>`).join('') : '<p class="rl-empty">No rolls here yet. Load your inventory in DIM, or choose another filter.</p>';
    const entry = entries.find(e => e.id === selected);
    detail.innerHTML = entry ? lensCardHtml(entry.data.name, entry.verdict) : '<div class="rl-detail-placeholder"><span>◈</span><h2>A closer look.</h2><p>Select a weapon for its PvE and PvP perk breakdown.</p><small>✓ Owned &nbsp; − Missing &nbsp; / Undefined</small></div>';
  }
  function close() { panel.close(); }
  button.addEventListener('click', () => {
    if (panel.open) { close(); return; }
    opener = document.activeElement; panel.showModal(); button.setAttribute('aria-expanded', 'true');
    render(); search.focus(); refreshTimer = setInterval(render, 2000);
  });
  panel.querySelector('.rl-close')!.addEventListener('click', close);
  panel.addEventListener('click', event => { if (event.target === panel) close(); });
  panel.addEventListener('close', () => {
    clearInterval(refreshTimer); button.setAttribute('aria-expanded', 'false');
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  });
  panel.querySelector('.rl-filters')!.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!target) return; filter = target.dataset.filter as Filter;
    panel.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === target))); render();
  });
  search.addEventListener('input', () => { query = search.value; render(); });
  inventory.addEventListener('click', event => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-instance]');
    if (row) { selected = row.dataset.instance!; render(); }
  });
}
