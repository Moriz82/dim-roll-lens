import type { AegisSheetDatabase, AegisSheetWeapon, ManifestWeapon } from './types';
import type { OwnedRollPerk } from './owned-rolls';
import { normalizeRollPerk } from './roll-lens';
export type SourceResolution = 'resolved' | 'incomplete' | 'missing' | 'ambiguous';
export interface SourceCandidates { rows:AegisSheetWeapon[]; resolution:SourceResolution }
const full=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const base=(value:string)=>full(value.replace(/\s*\([^)]*\)\s*$/,''));
const edition=(row:AegisSheetWeapon)=>full(row.versionTag || row.name.match(/\(([^)]*)\)\s*$/)?.[1] || 'original');
const originChoices=(raw:string)=>/^(?:-|—|none|n\/?a|any)$/i.test(raw.trim())?[]:raw.split(/[\n/,]+/).map(normalizeRollPerk).filter(Boolean);
type WeaponIdentity = Pick<ManifestWeapon, 'hash' | 'name' | 'perkColumns'>;
function fitsTraitPool(row:AegisSheetWeapon, weapon:WeaponIdentity):boolean {
  return [row.perk1,row.perk2].every((raw,index)=>{
    const wanted=originChoices(raw||'');
    const possible=new Set((weapon.perkColumns?.[index]||[]).map(normalizeRollPerk));
    return wanted.length>0 && possible.size>0 && wanted.every(choice=>possible.has(choice));
  });
}
function availableTraitChoices(raw:string, possible:string[]):string {
  const pool=new Set(possible.map(normalizeRollPerk));
  return raw.split(/[\n/,]+/).map(choice=>choice.trim()).filter(choice=>pool.has(normalizeRollPerk(choice))).join('\n');
}
/** Resolve the weapon edition first; only whole rows in that edition are candidates. */
export function resolveRollSourceCandidates(db:AegisSheetDatabase|null|undefined,name:string,itemHash:number|undefined,owned:OwnedRollPerk[],weapon?:WeaponIdentity):SourceCandidates {
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
  // The exact Bungie hash's legal trait pool identifies editions independently
  // of which traits this instance owns. It is never added to the owned roll.
  const identity=weapon && weapon.hash===itemHash && base(weapon.name)===base(nativeName) ? weapon : undefined;
  let compatible=identity ? rows.filter(row=>fitsTraitPool(row,identity)) : [];
  // An unversioned recommendation may contain an obsolete alternative or origin.
  // Recover only when the exact hash still supports choices in BOTH trait columns.
  // Named editions keep strict disambiguation; owned traits never select a source.
  if(!compatible.length && identity && rows.every(row=>edition(row)==='original')) {
    compatible=rows.map(row=>({...row,
      perk1:availableTraitChoices(row.perk1||'',identity.perkColumns?.[0]||[]),
      perk2:availableTraitChoices(row.perk2||'',identity.perkColumns?.[1]||[])
    })).filter(row=>fitsTraitPool(row,identity));
  }
  if(compatible.length)rows=compatible;
  const withOrigin=rows.filter(row=>originChoices(row.origin||'').some(o=>origins.includes(o)));
  if(withOrigin.length)rows=withOrigin;
  else if(!compatible.length && origins.length && rows.some(r=>originChoices(r.origin||'').length))return {rows:[],resolution:'ambiguous'};
  const exactOrigins=rows.filter(row=>{
    const recommended=new Set(originChoices(row.origin||''));
    return origins.length>0 && recommended.size===new Set(origins).size && origins.every(origin=>recommended.has(origin));
  });
  if(exactOrigins.length)rows=exactOrigins;
  const editions=new Set(rows.map(edition));
  if(editions.size!==1)return {rows:[],resolution:'ambiguous'};
  return {rows,resolution:'resolved'};
}
