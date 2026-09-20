import { describe, expect, it } from 'vitest';
import type { CombatOperatorProgram } from '../combat/runtime/combatRuntimeAssembly';
import type { ResolvedOperatorPanel } from './resolveOperatorPanel';
import { resolveScenarioOperatorResourceRules } from './resolveScenarioResourceRules';

function operator(costs: readonly number[]): CombatOperatorProgram {
  return {
    operatorId: 'operator:alpha',
    skills: costs.map((value, index) => ({
      operatorId: 'operator:alpha',
      skillGroupKey: 'ultimate',
      skillId: `ultimate:${index}`,
      skillType: 'ultimate',
      skillLevel: 12,
      initialBlackboard: {},
      timelineBlockFrames: 30,
      costs: [{ resource: 'ultimateEnergy', value }],
      timelineActions: [],
    })),
  };
}

function panel(): ResolvedOperatorPanel {
  return {
    operatorId: 'operator:alpha',
    level: 1,
    attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
    attack: 0,
    attackBeforeAttributeScalar: 0,
    mainAttribute: 'strength',
    secondaryAttribute: 'agility',
    health: 0,
    defense: 0,
    criticalRate: 0.05,
    criticalDamage: 0.5,
    artsIntensity: 0,
    ultimateEnergyGainEfficiency: 1.25,
    skillCooldownReduction: 0,
    staggerDamagePercent: 0,
    combatModifiers: [],
    receipt: [],
  };
}

describe('resolveScenarioOperatorResourceRules', () => {
  it('uses patched ultimate costs and the resolved panel gain multiplier', () => {
    expect(
      resolveScenarioOperatorResourceRules([operator([68])], [panel()]).get('operator:alpha'),
    ).toEqual({
      maxUltimateEnergy: 68,
      ultimateEnergyGainMultiplier: 1.25,
      allowedUltimateEnergyRecoveryTags: null,
    });
  });

  it('accepts form variants only when their resulting costs agree', () => {
    expect(resolveScenarioOperatorResourceRules([operator([80, 80])], [panel()])).toBeDefined();
    expect(() => resolveScenarioOperatorResourceRules([operator([80, 100])], [panel()])).toThrow(
      'inconsistent ultimate energy costs',
    );
  });

  it('requires the panel from the same resolved build', () => {
    expect(() => resolveScenarioOperatorResourceRules([operator([80])], [])).toThrow(
      'has no resolved panel',
    );
  });
});
