/**
 * Instance lookup helpers and synthetic team factory.
 *
 * Centralises the repeated patterns of:
 *  - Finding operator/weapon/gear instances from their respective stores by ID
 *  - Constructing the 4-slot synthetic team object required by collectEffects / getTeamStatus
 */

import { useOperatorStore } from '@/stores/operatorStore';
import { useWeaponStore } from '@/stores/weaponStore';
import { useGearStore } from '@/stores/gearStore';
import { getEffectiveOperator } from '@/data/collect';
import { applyForm } from '@/data/forms';
import type { OperatorSheet } from '@/data/types';

interface TrackLike {
  id?: string | null;
  operatorInstanceId?: string | null;
  weaponInstanceId?: string | null;
  equipArmorInstanceId?: string | null;
  equipGlovesInstanceId?: string | null;
  equipAccessory1InstanceId?: string | null;
  equipAccessory2InstanceId?: string | null;
  /** @deprecated legacy alias for accessory1 */
  equipKit1InstanceId?: string | null;
  /** @deprecated legacy alias for accessory2 */
  equipKit2InstanceId?: string | null;
}

// ─── Instance lookups ────────────────────────────────────────────────────────

export function findOperatorInstance(id: string | null | undefined): any {
  if (!id) return null;
  return useOperatorStore().operators.find((o: any) => o.id === id) ?? null;
}

export function findWeaponInstance(id: string | null | undefined): any {
  if (!id) return null;
  return useWeaponStore().weapons.find((w: any) => w.id === id) ?? null;
}

export function findGearInstance(id: string | null | undefined): any {
  if (!id) return null;
  return useGearStore().gears.find((g: any) => g.id === id) ?? null;
}

// ─── Track instance bundle ───────────────────────────────────────────────────

interface TrackInstances {
  opInst: any;
  wpInst: any;
  gearInsts: any[];
  /** Slot-key → instance-ID map for passing to team builders. */
  gearMap: Record<string, string>;
}

/**
 * Resolve all operator/weapon/gear instances for a given track in one call.
 * Returns null if the track has no operator.
 */
export function getTrackInstances(track: TrackLike): TrackInstances | null {
  const opInst = findOperatorInstance(track.operatorInstanceId);
  if (!opInst) return null;

  const wpInst = findWeaponInstance(track.weaponInstanceId);

  const gearSlots: Record<string, string | null | undefined> = {
    armor: track.equipArmorInstanceId,
    gloves: track.equipGlovesInstanceId,
    kit1: track.equipAccessory1InstanceId ?? track.equipKit1InstanceId,
    kit2: track.equipAccessory2InstanceId ?? track.equipKit2InstanceId,
  };

  const gearInsts: any[] = [];
  const gearMap: Record<string, string> = {};
  for (const [key, gearInstId] of Object.entries(gearSlots)) {
    if (!gearInstId) continue;
    const gi = findGearInstance(gearInstId);
    if (gi) {
      gearInsts.push(gi);
      gearMap[key] = gearInstId;
    }
  }

  return { opInst, wpInst, gearInsts, gearMap };
}

// ─── Synthetic team factory ──────────────────────────────────────────────────

const EMPTY_SLOT: {
  operatorId: null;
  weaponId: null;
  gear: { armor: null; gloves: null; kit1: null; kit2: null };
} = {
  operatorId: null,
  weaponId: null,
  gear: { armor: null, gloves: null, kit1: null, kit2: null },
};

/**
 * Build a synthetic 4-slot team with one populated slot at index 0.
 * Used to feed single-operator data into collectEffects / getTeamStatus.
 */
export function makeSingleOpTeam(
  id: string,
  opInstanceId: string,
  weaponInstanceId?: string | null,
  gearMap?: Record<string, string>,
): any {
  return {
    id,
    name: '',
    slots: [
      {
        operatorId: opInstanceId,
        weaponId: weaponInstanceId ?? null,
        gear: gearMap
          ? { armor: null, gloves: null, kit1: null, kit2: null, ...gearMap }
          : { armor: null, gloves: null, kit1: null, kit2: null },
      },
      { ...EMPTY_SLOT },
      { ...EMPTY_SLOT },
      { ...EMPTY_SLOT },
    ] as [any, any, any, any],
  };
}

/**
 * Form operators (e.g. Arcane) keep empty base skill slots; real skills live in
 * `forms`. Resolve the active form sheet the same way the skill library does.
 */
export function resolveEffectiveOperatorForTrack(
  track: TrackLike,
  baseOperator: OperatorSheet,
): OperatorSheet {
  if (!baseOperator?.forms) return baseOperator;

  const inst = getTrackInstances(track);
  if (inst && track.id && track.operatorInstanceId) {
    const team = makeSingleOpTeam(
      track.id,
      track.operatorInstanceId,
      track.weaponInstanceId,
      inst.gearMap,
    );
    return (
      getEffectiveOperator(
        inst.opInst,
        inst.wpInst ? [inst.wpInst] : [],
        inst.gearInsts,
        team.slots[0],
      ) ?? baseOperator
    );
  }

  return applyForm(baseOperator, baseOperator.forms.forms[0]?.key ?? null);
}
