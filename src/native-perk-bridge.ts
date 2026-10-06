import type { OwnedRollData } from './types';
interface Fiber {
  memoizedProps?: { plug?: { plugDef?: { hash?:number } }; socketInfo?: {socketIndex?:number;socketDefinition?:{socketTypeHash?:number}} };
  return?:Fiber|null;
}
const popupSelector='.item-popup, [class*="item-popup"], [class*="ItemPopup"]';
const set=(el:HTMLElement,name:string,value:string|null)=>{if(value===null){if(el.hasAttribute(name))el.removeAttribute(name);}else if(el.getAttribute(name)!==value)el.setAttribute(name,value);};
/** Publish only native plug identity; DIM retains all event handlers and layout. */
export function annotateNativePerks(element:HTMLElement,owned:OwnedRollData):void {
  const popup=element.matches(popupSelector)?element:element.closest<HTMLElement>(popupSelector);
  if(!popup)return;
  const found=new Set<HTMLElement>();
  for(const image of popup.querySelectorAll<HTMLElement>('svg image[href], img')) {
    if(image.closest('.rl-item-card, .aegis-popup-summary, [data-aegis-details], .aegis-title-badge'))continue;
    const icon=(image.closest('svg')?.parentElement||image.parentElement) as HTMLElement|null;
    if(!icon)continue;
    const key=Object.keys(icon).find(k=>k.startsWith('__reactFiber$'));
    let fiber=key?(icon as unknown as Record<string,Fiber>)[key]:undefined;
    let plug:Fiber['memoizedProps'];
    for(let depth=0;fiber&&depth<10;depth++,fiber=fiber.return||undefined) {
      if(fiber.memoizedProps?.plug?.plugDef?.hash){plug=fiber.memoizedProps;break;}
    }
    const hash=plug?.plug?.plugDef?.hash;
    if(!hash)continue;
    const matches=(['barrel','mag','perk1','perk2','masterwork'] as const).filter(slot=>owned.slots[slot]?.plugs.some(p=>p.hash===hash));
    let slot:typeof matches[number]|undefined=matches.length===1?matches[0]:undefined;
    if(matches.length>1) {
      const socket=plug?.socketInfo;
      const typeHash=socket?.socketDefinition?.socketTypeHash;
      const trait=typeHash===1215804697?'perk1':typeHash===1215804696?'perk2':socket?.socketIndex===3?'perk1':socket?.socketIndex===4?'perk2':undefined;
      if(trait&&matches.includes(trait))slot=trait;
    }
    if(!slot)continue;
    found.add(icon);
    set(icon,'data-rl-plug-hash',String(hash));set(icon,'data-rl-plug-slot',slot);
  }
  popup.querySelectorAll<HTMLElement>('[data-rl-plug-hash], [data-rl-plug-slot]').forEach(icon=>{
    if(!found.has(icon)){set(icon,'data-rl-plug-hash',null);set(icon,'data-rl-plug-slot',null);}
  });
}
