/**
 * Canonicalizes the perks a DIM item actually owns.
 *
 * `plugOptions` is a manifest/socket possibility list and may contain every
 * craftable option for a weapon.  It must never be used as proof that an
 * instance owns a perk.  DIM exposes the instance's reusable choices through
 * `reusablePlugItems`; the plugged item is included separately because some
 * older DIM responses omit it from that list.
 */
export interface OwnedRollDefinition {
  hash?: number;
  displayProperties?: { name?: string; icon?: string };
  name?: string;
  icon?: string;
  plug?: { plugCategoryIdentifier?: string };
  itemTypeDisplayName?: string;
}

export interface OwnedRollPlug {
  plugDef?: OwnedRollDefinition;
  plugItemHash?: number;
  hash?: number;
  displayProperties?: { name?: string; icon?: string };
  name?: string;
  icon?: string;
}

export interface OwnedRollSocket {
  socketIndex?: number;
  socketTypeHash?: number;
  socketDefinition?: { socketTypeHash?: number };
  hasRandomizedPlugItems?: boolean;
  plugged?: OwnedRollPlug | OwnedRollDefinition | null;
  reusablePlugItems?: OwnedRollPlug[];
  /** Present for diagnostics only; never used to add an owned perk. */
  plugOptions?: OwnedRollPlug[];
}

export type OwnedRollSlot = 'barrel' | 'mag' | 'perk1' | 'perk2' | 'origin' | 'masterwork';

export interface OwnedRollPerk {
  hash: number;
  name: string;
  icon: string;
  slot: OwnedRollSlot;
  active: boolean;
}

function definitionOf(value: OwnedRollPlug | OwnedRollDefinition | null | undefined): OwnedRollDefinition | null {
  if (!value) return null;
  const plug = (value as OwnedRollPlug).plugDef;
  if (plug) return plug as OwnedRollDefinition;
  const raw = value as OwnedRollDefinition;
  return raw.displayProperties || raw.plug || raw.itemTypeDisplayName ? raw : null;
}

function hashOf(value: OwnedRollPlug | OwnedRollDefinition | null | undefined): number | null {
  if (!value) return null;
  const plug = value as OwnedRollPlug;
  const def = definitionOf(value);
  const hash = plug.plugItemHash ?? plug.hash ?? def?.hash;
  return typeof hash === 'number' && Number.isFinite(hash) && hash > 0 ? hash : null;
}

function nameOf(value: OwnedRollPlug | OwnedRollDefinition | null | undefined): string {
  const def = definitionOf(value);
  return String(def?.displayProperties?.name || def?.name || (value as OwnedRollPlug | undefined)?.name || '').trim();
}

function iconOf(value: OwnedRollPlug | OwnedRollDefinition | null | undefined): string {
  const def = definitionOf(value);
  return String(def?.displayProperties?.icon || def?.icon || '').trim();
}

function categoryOf(value: OwnedRollPlug | OwnedRollDefinition | null | undefined): string {
  const def = definitionOf(value);
  return String(def?.plug?.plugCategoryIdentifier || '').toLowerCase();
}

function typeNameOf(value: OwnedRollPlug | OwnedRollDefinition | null | undefined): string {
  return String(definitionOf(value)?.itemTypeDisplayName || '').toLowerCase();
}

function classify(definition: OwnedRollDefinition | null, socket: OwnedRollSocket, traitOrdinal: number): OwnedRollSlot | null {
  if (!definition) return null;
  const cat = categoryOf(definition);
  const type = typeNameOf(definition);
  if (cat.startsWith('weapon_barrel') || cat.includes('barrel') || cat.includes('scope') || cat.includes('tube') ||
      cat.startsWith('bow_string') || cat.includes('bowstring') || cat.startsWith('sword_blade') || cat.includes('blade') ||
      type.includes('barrel') || type.includes('scope') || type.includes('sight') || type.includes('bowstring')) return 'barrel';
  if (cat.startsWith('weapon_magazine') || cat.startsWith('weapon_battery') || cat.includes('magazine') ||
      cat.includes('battery') || cat.startsWith('bow_arrow') || cat.includes('arrow') || cat.includes('guard') ||
      type.includes('magazine') || type.includes('battery') || type.includes('arrow') || type.includes('sword guard')) return 'mag';
  if (cat.startsWith('enhancements.') || cat.includes('origin_trait') || cat.includes('_origin') || cat.startsWith('origin') || type.includes('origin')) return 'origin';
  // Several older DIM items use `frames` for both random trait sockets. DIM's
  // socketTypeHash is stable for these two columns; socket order is the safe
  // fallback for newer socket shapes.
  const typeHash = socket.socketTypeHash ?? socket.socketDefinition?.socketTypeHash;
  if (typeHash === 1215804697) return 'perk1';
  if (typeHash === 1215804696) return 'perk2';
  if (cat.startsWith('weapon_perks') || cat.startsWith('weapon_perk') || cat.includes('_perks') || cat.includes('_perk') ||
      cat === 'word_perks' || cat === 'frames' || type.includes('perk') || type.includes('trait')) {
    return traitOrdinal === 1 ? 'perk1' : traitOrdinal === 2 ? 'perk2' : null;
  }
  return null;
}

/** Build exact, deduplicated owned perks for all five random-roll slots. */
export function buildOwnedRollPerks(sockets: OwnedRollSocket[] | null | undefined): OwnedRollPerk[] {
  if (!Array.isArray(sockets)) return [];
  const result = new Map<string, OwnedRollPerk>();
  let traitOrdinal = 0;
  for (const socket of sockets) {
    if (!socket) continue;
    const plugged = socket.plugged;
    const pluggedDef = definitionOf(plugged);
    const definitionByHash = new Map<number, OwnedRollDefinition>();
    for (const option of socket.plugOptions || []) {
      const hash = hashOf(option);
      const def = definitionOf(option);
      if (hash && def) definitionByHash.set(hash, def);
    }
    const reusable = (socket.reusablePlugItems || []).map((entry) => {
      if (definitionOf(entry)) return entry;
      const hash = hashOf(entry);
      const def = hash ? definitionByHash.get(hash) : undefined;
      return def ? { ...entry, plugDef: def } : entry;
    });
    const probe = pluggedDef || definitionOf(reusable[0]);
    const slot = classify(probe, socket, traitOrdinal + 1);
    if (slot === 'perk1' || slot === 'perk2') traitOrdinal = slot === 'perk1' ? Math.max(traitOrdinal, 1) : Math.max(traitOrdinal, 2);
    // A socket with only a type hash may have an unclassifiable plugged def;
    // classify each reusable definition using the same socket and ordinal.
    const owned = [...reusable];
    if (plugged) owned.push(plugged as OwnedRollPlug);
    for (const value of owned) {
      const valueSlot = slot;
      if (!valueSlot || valueSlot === 'masterwork') continue;
      if (valueSlot === 'perk1' || valueSlot === 'perk2') {
        traitOrdinal = valueSlot === 'perk1' ? Math.max(traitOrdinal, 1) : Math.max(traitOrdinal, 2);
      }
      const hash = hashOf(value);
      if (!hash) continue;
      const key = `${valueSlot}:${hash}`;
      const current = result.get(key);
      const entry: OwnedRollPerk = {
        hash,
        name: nameOf(value),
        icon: iconOf(value),
        slot: valueSlot,
        active: value === plugged || hashOf(plugged) === hash,
      };
      if (!current || entry.active) result.set(key, { ...current, ...entry });
    }
  }
  return [...result.values()];
}

export function ownedRollsBySlot(perks: OwnedRollPerk[]): Record<OwnedRollSlot, OwnedRollPerk[]> {
  const result = { barrel: [], mag: [], perk1: [], perk2: [], origin: [], masterwork: [] } as Record<OwnedRollSlot, OwnedRollPerk[]>;
  for (const perk of perks) result[perk.slot].push(perk);
  return result;
}

export interface OwnedRollData {
  slots: Record<OwnedRollSlot, { complete: boolean; plugs: Array<{ hash: number; name: string; icon: string; active: boolean }> }>;
  /** False only when DIM positively identifies all present main-trait sockets as fixed. */
  randomizedTraits?: boolean;
}

/** Public fixture/test representation of a canonical item roll. */
export function buildOwnedRollData(sockets: OwnedRollSocket[] | null | undefined, masterwork = '', masterworkHash = 0): OwnedRollData {
  const bySlot = ownedRollsBySlot(buildOwnedRollPerks(sockets));
  const slots = {} as OwnedRollData['slots'];
  for (const slot of ['barrel', 'mag', 'perk1', 'perk2', 'origin'] as const) {
    slots[slot] = { complete: bySlot[slot].length > 0, plugs: bySlot[slot].map(({ hash, name, icon, active }) => ({ hash, name, icon, active })) };
  }
  slots.masterwork = { complete: !!masterwork.trim(), plugs: masterwork.trim() ? [{ hash: masterworkHash, name: masterwork.trim(), icon: '', active: true }] : [] };
  const traitSockets=(sockets||[]).filter(s=>[1215804697,1215804696].includes(s.socketTypeHash ?? s.socketDefinition?.socketTypeHash ?? 0));
  const randomizedTraits=traitSockets.some(s=>s.hasRandomizedPlugItems===true) ? true :
    traitSockets.length>0 && traitSockets.every(s=>s.hasRandomizedPlugItems===false) ? false : undefined;
  return { slots, randomizedTraits };
}
