import type { AegisSheetWeapon, SheetPerksGroup, WeaponEvaluationPayload } from './types';
import { applyLens, configureLens, initLensDashboard } from './roll-lens-ui';
// Synthetic examples for interface QA. No account, token, instance or real-vault data.
const sheet: AegisSheetWeapon = { name:'Example', energy:'Solar', frame:'Adaptive', barrel:'Arrowhead Brake',mag:'Ricochet Rounds',perk1:'Trait Alpha',perk2:'Trait Beta',origin:'Origin',mw:'Range',tier:'A',rank:'1',notes:'Example source note: this recommendation suits the activity shown. This demo does not represent a live meta rating.' };
function group(states: Array<'active'|'selectable'|'missing'>): SheetPerksGroup {
  const names=['Arrowhead Brake','Ricochet Rounds','Trait Alpha','Trait Beta'];
  const types=['barrel','mag','perk1','perk2'] as const;
  const all=types.map((type,i)=>({type,name:names[i],status:states[i],matched:states[i]!=='missing'}));
  return { all, matched:all.filter(p=>p.matched),missing:all.filter(p=>!p.matched) };
}
const active=group(['active','active','active','active']);
const partial=group(['missing','active','active','missing']);
const swap=group(['active','active','selectable','active']);
const examples: Array<[string,SheetPerksGroup|null,SheetPerksGroup|null,string]> = [
  ['Dual-purpose example',active,active,'◈'],['PvE keeper',active,partial,'✦'],['PvP keeper',partial,active,'◇'],
  ['Perk-swap example',swap,partial,'↻'],['Traits-only keeper',group(['missing','missing','active','active']),partial,'★'],
  ['Partial match',partial,partial,'◌'],['Unrated weapon',null,null,'?'],['Fixed exotic',null,null,'✧'],
];
const map=new WeakMap<HTMLElement,WeaponEvaluationPayload>();
const grid=document.getElementById('demo-grid')!;
examples.forEach(([name,e,p,icon],i)=>{
  const el=document.createElement('div');el.className='demo-item';el.dataset.aegisItemHash=String(i+1);el.dataset.aegisInstanceId=`synthetic-${i}`;
  el.innerHTML=`<span class="demo-symbol">${icon}</span><b>${name}</b>`;
  const data: WeaponEvaluationPayload={ name,perksMap:{},equippedMasterwork:'Range',result:{grade:'S',matchPercentage:0,notes:'',matchedPerks:[],missingPerks:[],wishlistPerks:[]},sheetWeaponPvE:e?{...sheet}:null,sheetWeaponPvP:p?{...sheet}:null,sheetPerksPvE:e,sheetPerksPvP:p };
  if(i===7) data.sheetWeaponPvE={...sheet,source:'Exotic'};
  map.set(el,data);grid.append(el);applyLens(el,data);
});
configureLens({enabled:true,glow:true,rule:'traits'});initLensDashboard(el=>map.get(el));
document.getElementById('demo-rule')!.addEventListener('change',event=>{
  configureLens({rule:(event.target as HTMLSelectElement).value==='complete'?'complete':'traits'});
  grid.querySelectorAll<HTMLElement>('[data-aegis-item-hash]').forEach(el=>applyLens(el,map.get(el)!));
});
