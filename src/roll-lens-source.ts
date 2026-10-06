import type { AegisSheetDatabase, AegisSheetWeapon } from './types';
import type { OwnedRollPerk } from './owned-rolls';
import { normalizeRollPerk } from './roll-lens';
export type SourceResolution = 'resolved' | 'incomplete' | 'missing' | 'ambiguous';
export interface SourceCandidates { rows:AegisSheetWeapon[]; resolution:SourceResolution }
const full=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const base=(value:string)=>full(value.replace(/\s*\([^)]*\)\s*$/,''));
const edition=(row:AegisSheetWeapon)=>full(row.versionTag || row.name.match(/\(([^)]*)\)\s*$/)?.[1] || 'original');
const originChoices=(raw:string)=>/^(?:-|—|none|n\/?a|any)$/i.test(raw.trim())?[]:raw.split(/[\n/,]+/).map(normalizeRollPerk).filter(Boolean);
/** Resolve the weapon edition first; only whole rows in that edition are candidates. */
export function resolveRollSourceCandidates(db:AegisSheetDatabase|null|undefined,name:string,_itemHash:number|undefined,owned:OwnedRollPerk[]):SourceCandidates {
  if(!db?.weapons)return {rows:[],resolution:'missing'};
  const nativeName=name.split('\n')[0].trim();
  const key=Object.keys(db.variants||{}).find(k=>base(k)===base(nativeName));
  let rows=key ? db.variants?.[key]||[] : Object.values(db.weapons).filter(r=>base(r.name)===base(nativeName));
  // Public snapshots may duplicate the same row across indexes. Keep distinct recommendations.
  rows=rows.filter((row,i)=>rows.findIndex(r=>JSON.stringify(r)===JSON.stringify(row))===i);
  if(!rows.length)return {rows:[],resolution:'missing'};
  const origins=owned.filter(p=>p.slot==='origin').map(p=>normalizeRollPerk(p.name)).filter(Boolean);
  const exactEdition=rows.filter(r=>full(r.name)===full(nativeName));
  if(nativeName.includes('(') && exactEdition.length)rows=exactEdition;
  const withOrigin=rows.filter(row=>originChoices(row.origin||'').some(o=>origins.includes(o)));
  if(withOrigin.length)rows=withOrigin;
  else if(origins.length && rows.some(r=>originChoices(r.origin||'').length))return {rows:[],resolution:'ambiguous'};
  const editions=new Set(rows.map(edition));
  if(editions.size!==1)return {rows:[],resolution:'ambiguous'};
  return {rows,resolution:'resolved'};
}
