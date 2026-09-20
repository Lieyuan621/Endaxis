import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { describe, expect, it } from 'vitest';
import { perlica } from '../../../data/operators/perlica.generated';
import { compileSkill } from '../../compiler/compileSkill';

import type { SkillDefinition } from '../../game-data/operatorDefinition';
import { calculatePlayerActiveDamage } from './playerActiveDamage';
import {
  resolvePlayerActiveDamageInput,
  type PlayerDamageDefenderSnapshot,
} from './playerActiveDamageInput';

const defender: PlayerDamageDefenderSnapshot = {
  defense: 100,
  shelterDamageMultiplier: 0,
  breakingAttackDamageTakenMultiplier: 1,
  resistances: {
    physical: { percent: 0, damageTakenMultiplier: 1 },
    heat: { percent: 0, damageTakenMultiplier: 1 },
    electric: { percent: 20, damageTakenMultiplier: 1.25 },
    cryo: { percent: 0, damageTakenMultiplier: 1 },
    nature: { percent: 0, damageTakenMultiplier: 1 },
    ether: { percent: 0, damageTakenMultiplier: 1 },
  },
};

function findPerlicaBattleSkill(): SkillDefinition {
  const group = perlica.skillGroups.find(candidate => candidate.key === 'battleSkill');
  if (group === undefined || !('key' in group.skills)) {
    throw new Error('Perlica battle skill fixture is not singular');
  }
  return group.skills;
}

function findDamageStep(): ResolvedCombatStepForKind<'dealDamage'> {
  const program = compileSkill({
    operatorId: 'perlica',
    skillGroupKey: 'battleSkill',
    skillType: 'battleSkill',
    skillLevel: 12,
    skill: findPerlicaBattleSkill(),
  });
  const step = program.timelineActions
    .flatMap(action => action.sequence.steps)
    .find(candidate => candidate.kind === 'dealDamage');
  if (step?.kind !== 'dealDamage') throw new Error('Perlica damage step is missing');
  return step;
}

describe('resolvePlayerActiveDamageInput', () => {
  it('carries a compiled Perlica hit into the recovered standard formula', () => {
    const input = resolvePlayerActiveDamageInput({
      step: findDamageStep(),
      finalAttackValue: 4800,
      attacker: {
        attack: 1000,
        criticalRate: 0,
        criticalDamageIncrease: 0.5,
        weaknessDamageMultiplier: 1,
        igniteDamageMultiplier: 1,
        physicalInflictionDamageMultiplier: 1,
      },
      defender,
      runtime: {
        criticalSample: 0,
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      },
    });

    expect(input.finalAttackValue).toBe(4800);
    expect(input.resistancePercent).toBe(20);
    expect(input.damageTakenMultiplier).toBe(1.25);
    expect(calculatePlayerActiveDamage(input).value).toBe(2400);
  });

  it('accepts an already-resolved breaking-attack value and rejects unresolved status stacks', () => {
    const step = findDamageStep();
    const common = {
      finalAttackValue: 1,
      attacker: {
        attack: 1,
        criticalRate: 0,
        criticalDamageIncrease: 0,
        weaknessDamageMultiplier: 1,
        igniteDamageMultiplier: 1,
        physicalInflictionDamageMultiplier: 1,
      },
      defender,
      runtime: {
        criticalSample: 0,
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      },
    } as const;

    expect(
      resolvePlayerActiveDamageInput({
        ...common,
        step: {
          ...step,
          parameters: { ...step.parameters, calculation: 'breakingAttack' },
        },
      }).finalAttackValue,
    ).toBe(1);
    expect(() =>
      resolvePlayerActiveDamageInput({
        ...common,
        step: {
          ...step,
          parameters: {
            ...step.parameters,
            attackScalePerStatusStack: {
              statusKey: 'test',
              target: 'caster',
              coefficient: 1,
            },
          },
        },
      }),
    ).toThrow('must be resolved');
  });
});
