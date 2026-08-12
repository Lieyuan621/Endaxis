import { describe, it, expect } from 'vitest';
import { patchCombatSkills } from './collect';
import { applyForm } from './forms';
import arcaneSheet from './operators/arcane';
import type { OperatorInstance } from '../types';

// Arcane's will form: comboSkill hit effect `arcane-combo-susceptibility` has a combo-level-leveled
// cap; its p1 potential patches the cap via `skillLevelKey: 'comboSkill'`, so the leveled array
// resolves at the combo skill's level instead of being spliced raw.
//
// The effect lives in `comboSkill.segments[].damageGroups[].hits[].effects[]`, which `collectEffects`
// does not walk — `patchCombatSkills` is the pipeline that merges potential patches into hit effects.

function arcaneP1(
  comboLevel: number,
): Pick<OperatorInstance, 'talentStates' | 'potential'> &
  Partial<Pick<OperatorInstance, 'skillLevels'>> {
  return { talentStates: {}, potential: 1, skillLevels: { comboSkill: comboLevel } };
}

function findHitEffect(skill: any, effectId: string) {
  for (const segment of skill?.segments ?? [])
    for (const group of segment?.damageGroups ?? [])
      for (const hit of group?.hits ?? [])
        for (const effect of hit?.effects ?? []) if (effect?.id === effectId) return effect;
  return undefined;
}

function susceptibility(comboLevel: number) {
  const willForm = applyForm(arcaneSheet, 'will');
  const flatSkills = patchCombatSkills(willForm, arcaneP1(comboLevel));
  return findHitEffect(flatSkills.comboSkill, 'arcane-combo-susceptibility')?.scaling;
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
