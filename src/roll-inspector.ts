import type { OwnedRollData, WeaponEvaluationPayload } from './types';
import { activityRecommendations, evaluateLens, recommendedOwnedPlugs, type ActivityVerdict, type LensVerdict, type RollSlot } from './roll-lens';

const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const activityName = (v: ActivityVerdict) => v.activity === 'pve' ? 'PvE' : 'PvP';
const completeSocket = (owned: OwnedRollData | null | undefined, slot: RollSlot) => {
  const socket = owned?.slots?.[slot];
  return !!socket?.complete && !!socket.plugs.length && socket.plugs.every(p => !!p.name.trim());
};
const count = (v: ActivityVerdict) => v.state === 'fixed' ? 'Fixed roll' : v.matchedCount === null ? 'Undefined' : `${v.matchedCount}/5${v.perfect ? ' · God roll' : ''}`;
const shortReason = (v: ActivityVerdict) => v.state === 'fixed' ? 'No random roll' : v.perfect ? 'All five slots owned' : v.matchedCount === null ? 'Coverage incomplete' : `Missing ${v.slots.filter(s => s.status === 'missing').map(s => s.label).join(' · ')}`;

function explanation(v: ActivityVerdict, owned: OwnedRollData | null | undefined): string {
  if (v.state === 'fixed') return 'Fixed main traits. There is no random five-slot roll to grade.';
  if (!v.slots.length) return v.sourceResolution === 'ambiguous' ? 'The source cannot identify this weapon edition yet.' : `No compatible recommendation for this weapon in ${v.source}.`;
  if (v.perfect) return 'All five recommended slots are on your gun.';
  if (v.matchedCount !== null) return `Missing: ${v.slots.filter(s => s.status === 'missing').map(s => s.label).join(' · ')}.`;
  const unspecified = v.slots.filter(s => !s.recommendations.length).map(s => s.label);
  const unknown = v.slots.filter(s => !completeSocket(owned, s.type as RollSlot)).map(s => s.label);
  return [unspecified.length ? `Source does not specify: ${unspecified.join(' · ')}.` : '', unknown.length ? `DIM data incomplete: ${unknown.join(' · ')}.` : ''].filter(Boolean).join(' ');
}

function combinationHtml(v: ActivityVerdict, owned: OwnedRollData | null | undefined): string {
  const slots = v.slots.map(s => {
    const slot = s.type as RollSlot;
    const known = completeSocket(owned, slot);
    const matched = s.status === 'active' || s.status === 'selectable';
    const state = !s.recommendations.length || !known ? 'unknown' : matched ? 'owned' : 'missing';
    const recommendations = s.recommendations.map(name => {
      const present = recommendedOwnedPlugs(owned, slot, [name]).length > 0;
      return `<span class="rl-inspector-choice${present ? ' rl-choice-owned' : ''}">${present ? '<span aria-label="Owned">✓ </span>' : ''}${escape(name)}</span>`;
    }).join('<span class="rl-choice-or"> / </span>');
    const actual = [...new Set((owned?.slots?.[slot]?.plugs || []).map(p => p.name.trim() || 'Unnamed perk'))];
    return `<li class="rl-inspector-slot rl-inspector-${state}" data-slot="${slot}"><div class="rl-inspector-slot-heading"><b>${s.label}</b><span>${state === 'owned' ? '✓ Owned' : state === 'missing' ? '− Missing' : '/ Undefined'}</span></div><div class="rl-inspector-recommended"><span class="rl-inspector-field">Want</span><div>${recommendations || '<span class="rl-inspector-unknown">Not specified by source</span>'}</div></div><div class="rl-inspector-actual"><span class="rl-inspector-field">Have</span><span>${escape(actual.join(' / ') || 'Not available from DIM')}${!known && actual.length ? ' · DIM data incomplete' : ''}</span></div></li>`;
  }).join('');
  return `<p class="rl-inspector-reason${v.perfect ? ' rl-inspector-perfect' : ''}">${escape(explanation(v, owned))}</p>${slots ? `<ul class="rl-inspector-slots">${slots}</ul>` : ''}${v.notes && v.state !== 'fixed' ? `<details class="rl-inspector-notes"><summary>Source notes</summary><p>${escape(v.notes)}</p></details>` : ''}`;
}

function activityHtml(v: ActivityVerdict, data: WeaponEvaluationPayload): string {
  const combinations = activityRecommendations(v.activity, data);
  const body = combinations.length > 1 ? combinations.map((row, i) => `<details class="rl-inspector-combination"${i === 0 ? ' open' : ''}><summary>Combination ${i + 1}${i === 0 ? ' · closest match' : ''}<span>${count(row)}</span></summary>${combinationHtml(row, data.ownedRoll)}</details>`).join('') : combinationHtml(combinations[0] || v, data.ownedRoll);
  return `<section class="rl-inspector-activity rl-inspector-${v.activity}" aria-label="${activityName(v)} god-roll recommendations"><div class="rl-inspector-activity-heading"><h3>${activityName(v)}</h3><span class="${v.perfect ? 'rl-inspector-perfect' : ''}">${count(v)}</span></div>${body}<footer><a href="${v.sourceUrl}" target="_blank" rel="noopener noreferrer">${v.source} recommendations ↗</a></footer></section>`;
}

/** A pure renderer: every alternative uses the same evaluator as the tile badge. */
export function rollInspectorHtml(data: WeaponEvaluationPayload, verdict = evaluateLens(data)): string {
  return `<header class="rl-inspector-header"><div><span class="rl-eyebrow">ROLL LENS · GOD-ROLL GUIDE</span><h2>${escape(data.name)}</h2></div><button type="button" class="rl-inspector-close" aria-label="Close god-roll recommendations">✕</button><p>One complete 5/5 combination. Inactive perks count.</p><div class="rl-inspector-overview">${[verdict.pve, verdict.pvp].map(v => `<span class="rl-inspector-${v.activity}"><b>${activityName(v)}</b><span>${count(v)}</span><small>${escape(shortReason(v))}</small></span>`).join('')}</div></header><div class="rl-inspector-body" tabindex="0" aria-label="Recommended combinations and owned perks">${activityHtml(verdict.pve, data)}${activityHtml(verdict.pvp, data)}<p class="rl-inspector-definition">Want = source choices; choose one per slot in the same combination. Have = every option actually on your gun. A gold check marks an owned recommendation.</p></div>`;
}

let current: { popup: HTMLElement; identity: string; panel: HTMLElement | null; signature: string; dismissed: boolean } | undefined;

export function clearRollInspector(popup?: HTMLElement): void {
  if (current && (!popup || current.popup === popup)) { current.panel?.remove(); current = undefined; }
}

/** A fixed sidebar inside the native popup shares DIM's close/outside-click lifecycle. */
export function updateRollInspector(popup: HTMLElement, data: WeaponEvaluationPayload, verdict: LensVerdict): void {
  if (!popup.isConnected) return;
  const identity = JSON.stringify([popup.dataset.aegisItemHash, popup.dataset.aegisInstanceId, data.name]);
  if (current?.popup !== popup || current.identity !== identity) {
    clearRollInspector(); current = { popup, identity, panel: null, signature: '', dismissed: false };
  }
  if (current.dismissed) return;
  // Owned non-matching choices and alternate rows can change without changing the badge.
  const signature = rollInspectorHtml(data, verdict);
  if (current.signature === signature && current.panel?.isConnected) return;
  const panel = current.panel || document.createElement('aside');
  panel.id = 'rl-roll-inspector'; panel.className = 'rl-inspector';
  panel.setAttribute('aria-label', 'God-roll recommendations');
  const scroll = current.panel?.querySelector('.rl-inspector-body')?.scrollTop || 0;
  panel.innerHTML = signature;
  panel.querySelector('.rl-inspector-body')!.scrollTop = scroll;
  panel.querySelector('.rl-inspector-close')!.addEventListener('click', event => {
    event.stopPropagation();
    if (current?.panel === panel) { current.dismissed = true; current.panel = null; }
    panel.remove();
  });
  if (!current.panel) {
    // Keep native item/title handlers from receiving sidebar interactions.
    for (const event of ['click', 'pointerdown', 'mousedown', 'touchstart']) panel.addEventListener(event, e => e.stopPropagation());
    popup.append(panel);
  }
  current.panel = panel; current.signature = signature;
}
