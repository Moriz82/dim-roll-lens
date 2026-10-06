import type { AegisSheetWeapon, OwnedRollData, WeaponEvaluationPayload } from './types';
import { applyLens, configureLens, initLensDashboard } from './roll-lens-ui';
// Synthetic examples for interface QA. No account or real inventory data.
const sheet: AegisSheetWeapon = { name:'Example', energy:'Solar', frame:'Adaptive', barrel:'Arrowhead Brake',mag:'Ricochet Rounds',perk1:'Trait Alpha',perk2:'Trait Beta',origin:'Origin',mw:'Range',tier:'A',rank:'1',notes:'Synthetic recommendation for interface testing.' };
function owned(missing: string[] = [], active = true): OwnedRollData {
  const names = { barrel:'Arrowhead Brake', mag:'Ricochet Rounds', perk1:'Trait Alpha', perk2:'Trait Beta', masterwork:'Range' };
  return { slots:Object.fromEntries(Object.entries(names).map(([slot,name],index)=>[slot,{complete:true,plugs:[{hash:index+1,name:missing.includes(slot)?'Other option':name,icon:'',active}]}])) as OwnedRollData['slots'] };
}
const examples: Array<[string,OwnedRollData,AegisSheetWeapon|null,AegisSheetWeapon|null,string]> = [
  ['Dual-purpose example',owned(),sheet,sheet,'◈'],
  ['PvE keeper',owned(),sheet,{...sheet,mw:'Handling'},'✦'],
  ['PvP keeper',owned(),{...sheet,mw:'Handling'},sheet,'◇'],
  ['Inactive options count',owned([],false),sheet,sheet,'✓'],
  ['One slot away',owned(['barrel']),sheet,null,'−1'],
  ['Ordinary roll',owned(['barrel','mag']),sheet,sheet,'◌'],
  ['Source incomplete',owned(),{...sheet,mw:''},null,'/'],
  ['Unrated weapon',owned(),null,null,'?'],
];
const map=new WeakMap<HTMLElement,WeaponEvaluationPayload>();
const grid=document.getElementById('demo-grid')!;
configureLens({enabled:true,glow:true});
examples.forEach(([name,ownedRoll,pve,pvp,icon],i)=>{
  const el=document.createElement('div');el.className='demo-item';el.dataset.aegisItemHash=String(i+1);el.dataset.aegisInstanceId=`synthetic-${i}`;
  el.innerHTML=`<span class="demo-symbol">${icon}</span><b>${name}</b>`;
  const data: WeaponEvaluationPayload={name,ownedRoll,perksMap:{},result:{grade:null,matchPercentage:0,notes:'',matchedPerks:[],missingPerks:[],wishlistPerks:[]},sheetWeaponPvE:pve,sheetWeaponPvP:pvp};
  map.set(el,data);grid.append(el);applyLens(el,data);
});
initLensDashboard(el=>map.get(el));
