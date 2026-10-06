import type { AegisSheetWeapon, OwnedRollData, TooltipPerk, WeaponEvaluationPayload } from './types';
import { normalizeMasterwork } from './masterwork';

// Retain the setting type for stored preferences; every verdict now requires 5/5.
export type LensRule = 'traits' | 'complete';
export type LensState = 'god' | 'swap' | 'good' | 'partial' | 'unknown' | 'fixed';
export type LensUsage = 'pve' | 'pvp' | 'both' | 'none';
export type SourceResolution = 'resolved' | 'incomplete' | 'missing' | 'ambiguous';
type Slot = 'barrel' | 'mag' | 'perk1' | 'perk2' | 'masterwork';
export interface NativeRecommended { hash: number; slot: Slot }
export interface LensSlot {
  label: string; type: TooltipPerk['type'] | 'masterwork';
  status: 'active' | 'selectable' | 'missing' | 'unspecified';
  recommendations: string[]; selected?: string;
}
export interface ActivityVerdict {
  activity: 'pve' | 'pvp'; state: LensState; label: string; source: string; sourceUrl: string;
  tier: string; notes: string; slots: LensSlot[]; activeTraits: number; ownedTraits: number;
  activeMatches: number; matchedCount: number | null; ownedMatches: number; requiredCount: number;
  distance: number | null; perfect: boolean; swaps: string[]; nativeRecommended: NativeRecommended[];
  sourceResolution: SourceResolution;
}
export interface LensVerdict {
  pve: ActivityVerdict; pvp: ActivityVerdict; usage: LensUsage; potentialUsage: LensUsage;
  nearUsage: LensUsage; label: string; badge: string; state: LensState; sourceResolution: SourceResolution;
}
const fields = [ ['barrel','Barrel','barrel'], ['mag','Magazine','mag'], ['perk1','Trait 1','perk1'], ['perk2','Trait 2','perk2'], ['masterwork','Masterwork','mw'] ] as const;
const usageFor = (e: boolean,p: boolean): LensUsage => e && p ? 'both' : e ? 'pve' : p ? 'pvp' : 'none';
const activityName = (u: LensUsage) => u === 'both' ? 'PvE + PvP' : u === 'pve' ? 'PvE' : 'PvP';
export const normalizeRollPerk = (value: string): string => value.toLowerCase().replace(/^enhanced\s+/, '').replace(/\s*\(enhanced\)\s*$/, '').replace(/\s+enhanced\s*$/, '').replace(/[^a-z0-9]/g, '');
const normalizeMW = (value: string) => normalizeMasterwork(value.replace(/\btier\s*\d+\s*:?\s*/ig, '')).replace(/[^a-z0-9]/g, '');
const choices = (raw?: string): string[] => !raw?.trim() || /^(?:n\/?a|none|any|undefined|undef|unknown|tbd|see notes)$/i.test(raw.trim()) ? [] : raw.split(/[\n/,]+/).map(s=>s.trim()).filter(s => !!normalizeRollPerk(s) && !/^(?:n\/?a|none|any|undefined|undef|unknown|tbd|see notes)$/i.test(s));
function empty(activity: 'pve'|'pvp', resolution: SourceResolution = 'missing'): ActivityVerdict {
  return { activity, state:'unknown', label:'Undefined five-slot roll', source:activity === 'pve' ? 'Aegis' : 'Finnald',
    sourceUrl:`https://docs.google.com/spreadsheets/d/${activity === 'pve' ? '1JM-0SlxVDAi-C6rGVlLxa-J1WGewEeL8Qvq4htWZHhY' : '1TVgtTRWNGEPi6OMlTLxXFSKUTi_ycwykhwuw8EW_jJ0'}/edit`,
    tier:'',notes:'',slots:[],activeTraits:0,ownedTraits:0,activeMatches:0,matchedCount:null,ownedMatches:0,requiredCount:5,distance:null,perfect:false,swaps:[],nativeRecommended:[],sourceResolution:resolution };
}
/** Evaluate one whole recommendation against exact owned socket columns. */
export function activityVerdict(activity: 'pve'|'pvp', sheet?: AegisSheetWeapon|null, owned?: OwnedRollData|null): ActivityVerdict {
  const v=empty(activity,sheet?'incomplete':'missing');
  if (!sheet) return v;
  v.tier=sheet.tier||''; v.notes=sheet.notes||'';
  let complete=true;
  for (const [slot,label,field] of fields) {
    const recommendations=choices(sheet[field]);
    const socket=owned?.slots?.[slot];
    const normalize=slot === 'masterwork' ? normalizeMW : normalizeRollPerk;
    const matches=(socket?.plugs||[]).filter(p=>!!normalize(p.name) && recommendations.some(r=>normalize(r)===normalize(p.name))).sort((a,b)=>a.hash-b.hash);
    const selected=matches[0];
    const status=!recommendations.length ? 'unspecified' : selected ? selected.active ? 'active' : 'selectable' : 'missing';
    v.slots.push({type:slot,label,status,recommendations,selected:selected?.name});
    if (!recommendations.length || !socket?.complete || !socket.plugs.length || socket.plugs.some(p=>!p.name.trim())) complete=false;
    if (matches.length) {
      v.ownedMatches++;
      if (slot === 'perk1' || slot === 'perk2') v.ownedTraits++;
      if (matches.some(p=>p.active)) { v.activeMatches++; if(slot==='perk1'||slot==='perk2')v.activeTraits++; }
      for (const p of matches) if(p.hash>0) v.nativeRecommended.push({slot,hash:p.hash});
    }
  }
  if (!complete) return v;
  v.sourceResolution='resolved'; v.matchedCount=v.ownedMatches; v.distance=5-v.ownedMatches; v.perfect=v.distance===0;
  v.state=v.perfect?'god':'partial'; v.label=v.perfect?'God roll · 5/5 owned':v.distance===1?'One slot away · 4/5 owned':`${v.ownedMatches}/5 slots owned`;
  return v;
}
function bestActivity(activity:'pve'|'pvp',data:WeaponEvaluationPayload):ActivityVerdict {
  const resolution=activity==='pve'?data.sourceResolutionPvE:data.sourceResolutionPvP;
  if(resolution && resolution!=='resolved') return empty(activity,resolution);
  const supplied=activity==='pve'?data.sheetWeaponPvECandidates:data.sheetWeaponPvPCandidates;
  const fallback=activity==='pve'?data.sheetWeaponPvE:data.sheetWeaponPvP;
  // An explicitly empty candidate list means unresolved; do not borrow legacy selection.
  const rows=supplied!==undefined ? supplied : fallback?[fallback]:[];
  if(!rows.length)return empty(activity);
  return rows.map(row=>activityVerdict(activity,row,data.ownedRoll)).sort((a,b)=>Number(b.sourceResolution==='resolved')-Number(a.sourceResolution==='resolved') || b.ownedMatches-a.ownedMatches)[0];
}
export function evaluateLens(data:WeaponEvaluationPayload,_rule:LensRule='complete'):LensVerdict {
  if(data.ownedRoll?.randomizedTraits===false) {
    const fixed=(activity:'pve'|'pvp'):ActivityVerdict=>({...empty(activity),state:'fixed',label:'Fixed roll',requiredCount:0,sourceResolution:'resolved',notes:'This weapon has fixed main traits. There is no random roll to grade.'});
    return {pve:fixed('pve'),pvp:fixed('pvp'),usage:'none',potentialUsage:'none',nearUsage:'none',badge:'',state:'fixed',label:'Fixed roll',sourceResolution:'resolved'};
  }
  const pve=bestActivity('pve',data),pvp=bestActivity('pvp',data);
  const usage=usageFor(pve.perfect,pvp.perfect),nearUsage=usageFor(pve.distance===1,pvp.distance===1);
  const undefinedRoll=pve.distance===null&&pvp.distance===null;
  const badge=usage!=='none'?usage.toUpperCase():nearUsage!=='none'?[pve.distance===1?'PVE-1':'',pvp.distance===1?'PVP-1':''].filter(Boolean).join(' '):undefinedRoll?'UNDEF':'';
  const sourceResolution:SourceResolution=usage!=='none'||nearUsage!=='none'||!undefinedRoll?'resolved':[pve,pvp].some(v=>v.sourceResolution==='ambiguous')?'ambiguous':[pve,pvp].some(v=>v.sourceResolution==='incomplete')?'incomplete':'missing';
  const state:LensState=usage!=='none'?'god':badge==='UNDEF'?'unknown':'partial';
  const label=usage!=='none'?`${activityName(usage)} god roll`:nearUsage!=='none'?`${activityName(nearUsage)} one slot away`:badge==='UNDEF'?'Undefined five-slot roll':'Partial match';
  return {pve,pvp,usage,potentialUsage:usage,nearUsage,badge,state,label,sourceResolution};
}
