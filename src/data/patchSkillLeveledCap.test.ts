import { describe, it, expect } from 'vitest';
import { collectEffects } from './collect';
import type { OperatorInstance, GearInstance, TeamSlot, TeamInstance } from '../types';

// Arcane's will form: comboSkill effect `arcane-combo-susceptibility` has a combo-level-leveled
// cap; its p1 potential patches the cap via `skillLevelKey: 'comboSkill'`, so the leveled array
// resolves at the combo skill's level instead of being spliced raw.
const willGloves: GearInstance = {
  id: 'g1',
  gearPieceId: 'xiranflow-gloves',
  artificingLevels: [3, 3, 3],
};

function arcaneP1(comboLevel: number): OperatorInstance {
  return {
    id: 'op1',
    operatorSlug: 'arcane',
    level: 1 as OperatorInstance['level'],
    promoted: false,
    potential: 1,
    skillLevels: { comboSkill: comboLevel },
    talentStates: {},
    trustLevel: 0,
  };
}

const EMPTY_SLOT: TeamSlot = {
  operatorId: null,
  weaponId: null,
  gear: { armor: null, gloves: null, kit1: null, kit2: null },
};

function willFormTeam(): TeamInstance {
  const slot: TeamSlot = {
    operatorId: 'op1',
    weaponId: null,
    gear: { armor: null, gloves: 'g1', kit1: null, kit2: null },
  };
  return { id: 't1', name: '', slots: [slot, EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT] };
}

function susceptibility(comboLevel: number) {
  const effects = collectEffects(willFormTeam(), [arcaneP1(comboLevel)], [], [willGloves]);
  const ce = effects.find(e => e.effect.id === 'arcane-combo-susceptibility');
  return (ce?.effect as any)?.scaling;
}

describe('patchEffect skillLevelKey — arcane p1 cap', () => {
  it('resolves the patched cap at the combo skill level (leveled, not raw)', () => {
    expect(susceptibility(1)?.cap).toBe(13); // comboSkill L1 → cap[0]
    expect(susceptibility(12)?.cap).toBe(14); // comboSkill L12 → cap[11]
  });

  it('keeps both the base will-scaling term and the patched +6', () => {
    const additive = susceptibility(12)?.additive ?? [];
    expect(additive).toContain(6);
    expect(additive.some((t: any) => t?.basis === 'will')).toBe(true);
  });
});
