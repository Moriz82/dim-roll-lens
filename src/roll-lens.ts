import type { AegisSheetWeapon, SheetPerksGroup, TooltipPerk, WeaponEvaluationPayload } from './types';
import { masterworkMatches } from './masterwork';

export type LensRule = 'traits' | 'complete';
export type LensState = 'god' | 'swap' | 'good' | 'partial' | 'unknown' | 'fixed';
export type LensUsage = 'pve' | 'pvp' | 'both' | 'none';
export interface LensSlot {
  label: string;
  type: TooltipPerk['type'] | 'masterwork';
  status: 'active' | 'selectable' | 'missing' | 'unspecified';
  recommendations: string[];
  selected?: string;
}
export interface ActivityVerdict {
  activity: 'pve' | 'pvp';
  state: LensState;
  label: string;
  source: string;
  sourceUrl: string;
  tier: string;
  notes: string;
  slots: LensSlot[];
  activeTraits: number;
  ownedTraits: number;
  activeMatches: number;
  requiredCount: number;
  perfect: boolean;
  swaps: string[];
}
export interface LensVerdict {
  pve: ActivityVerdict;
  pvp: ActivityVerdict;
  usage: LensUsage;
  potentialUsage: LensUsage;
  label: string;
  badge: string;
  state: LensState;
}

const labels: Record<LensState, string> = {
  god: 'God roll', swap: 'God roll after swap', good: 'Great traits',
  partial: 'Partial match', unknown: 'Not rated', fixed: 'Fixed roll',
};
const fields = [
  ['barrel', 'Barrel', 'barrel'], ['mag', 'Magazine', 'mag'],
  ['perk1', 'Trait 1', 'perk1'], ['perk2', 'Trait 2', 'perk2'],
] as const;
const usageFor = (e: boolean, p: boolean): LensUsage => e && p ? 'both' : e ? 'pve' : p ? 'pvp' : 'none';
const activityName = (usage: LensUsage) => usage === 'both' ? 'PvE + PvP' : usage === 'pve' ? 'PvE' : 'PvP';

/** Verdicts are based on socket matches, never on a meta tier or community popularity grade. */
export function activityVerdict(
  activity: 'pve' | 'pvp', sheet?: AegisSheetWeapon | null,
  perks?: SheetPerksGroup | null, masterwork = '', rule: LensRule = 'traits',
): ActivityVerdict {
  const verdict: ActivityVerdict = {
    activity, state: 'unknown', label: labels.unknown,
    source: activity === 'pve' ? 'Aegis' : 'Finnald',
    sourceUrl: `https://docs.google.com/spreadsheets/d/${activity === 'pve' ? '1JM-0SlxVDAi-C6rGVlLxa-J1WGewEeL8Qvq4htWZHhY' : '1TVgtTRWNGEPi6OMlTLxXFSKUTi_ycwykhwuw8EW_jJ0'}/edit`,
    tier: sheet?.tier || '', notes: sheet?.notes || '', slots: [],
    activeTraits: 0, ownedTraits: 0, activeMatches: 0, requiredCount: 0, perfect: false, swaps: [],
  };
  if (!sheet) return verdict;
  if (sheet.exoticViability || sheet.source === 'Exotic') {
    verdict.state = 'fixed'; verdict.label = labels.fixed; return verdict;
  }
  if (!perks) return verdict;
  const all = perks.all || [...perks.matched, ...perks.missing];
  for (const [type, label, field] of fields) {
    const recommendation = sheet[field]?.trim();
    const specified = !!recommendation && !/^(?:-|—|n\/?a|none|any)$/i.test(recommendation);
    const options = all.filter(p => p.type === type);
    const active = options.find(p => p.status === 'active');
    const selectable = options.find(p => p.status === 'selectable');
    verdict.slots.push({
      type, label, status: !specified ? 'unspecified' : active ? 'active' : selectable ? 'selectable' : 'missing',
      recommendations: options.length ? [...new Set(options.map(p => p.name))] : specified ? recommendation.split(/[\n/]+/).map(s => s.trim()).filter(Boolean) : [],
      selected: active?.name || selectable?.name,
    });
  }
  const mw = sheet.mw?.trim() || '';
  const masterworks = /^(?:-|—|n\/?a|none|any)$/i.test(mw) ? [] : mw.split(/[\n/,]+/).map(s => s.trim()).filter(Boolean);
  verdict.slots.push({ type: 'masterwork', label: 'Masterwork',
    status: !masterworks.length ? 'unspecified' : masterworkMatches(masterworks, masterwork) ? 'active' : 'missing',
    recommendations: masterworks, selected: masterwork || undefined,
  });
  const traits = verdict.slots.filter(s => s.type === 'perk1' || s.type === 'perk2');
  verdict.activeTraits = traits.filter(s => s.status === 'active').length;
  verdict.ownedTraits = traits.filter(s => s.status === 'active' || s.status === 'selectable').length;
  const required = verdict.slots.filter(s => s.status !== 'unspecified');
  verdict.requiredCount = required.length;
  verdict.activeMatches = required.filter(s => s.status === 'active').length;
  // Missing recommendations and incomplete bridge data cannot establish a god roll.
  if (traits.some(s => s.status === 'unspecified') || !all.length) return verdict;
  verdict.perfect = required.every(s => s.status === 'active');
  const target = rule === 'complete' ? required : traits;
  const activeGod = target.every(s => s.status === 'active');
  const ownedGod = target.every(s => s.status === 'active' || s.status === 'selectable');
  verdict.state = activeGod ? 'god' : ownedGod ? 'swap' : verdict.ownedTraits === 2 ? 'good' : 'partial';
  verdict.label = labels[verdict.state];
  verdict.swaps = target.filter(s => s.status === 'selectable').map(s => s.selected!).filter(Boolean);
  return verdict;
}

export function evaluateLens(data: WeaponEvaluationPayload, rule: LensRule = 'traits'): LensVerdict {
  const pve = activityVerdict('pve', data.sheetWeaponPvE, data.sheetPerksPvE, data.equippedMasterwork || '', rule);
  const pvp = activityVerdict('pvp', data.sheetWeaponPvP, data.sheetPerksPvP, data.equippedMasterwork || '', rule);
  const usage = usageFor(pve.state === 'god', pvp.state === 'god');
  const potentialUsage = usageFor(['god', 'swap'].includes(pve.state), ['god', 'swap'].includes(pvp.state));
  const state: LensState = usage !== 'none' ? 'god' : potentialUsage !== 'none' ? 'swap' :
    [pve, pvp].some(v => v.state === 'good') ? 'good' : [pve, pvp].some(v => v.state === 'partial') ? 'partial' :
    [pve, pvp].some(v => v.state === 'fixed') ? 'fixed' : 'unknown';
  const badge = usage !== 'none' ? `★ ${usage.toUpperCase()}` : potentialUsage !== 'none' ? `↑ ${potentialUsage.toUpperCase()}` :
    state === 'fixed' ? 'FIXED' : state === 'unknown' ? '?' : 'MATCH';
  const label = usage !== 'none' ? `${activityName(usage)} god roll` : potentialUsage !== 'none' ? `${activityName(potentialUsage)} god roll after perk swap` : labels[state];
  return { pve, pvp, usage, potentialUsage, state, label, badge };
}
