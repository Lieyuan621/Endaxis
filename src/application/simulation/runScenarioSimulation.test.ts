import { createTestBuffReference } from '../../core/combat/buffs/buffTestFixtures';
import { describe, expect, it, vi } from 'vitest';
import type {
  EnemyBuffRuntime,
  OperatorBuffRuntime,
} from '../../core/combat/runtime/combatRuntimeAssembly';
import type { CombatOperationExecutor } from '../../core/combat/skills/skillRuntime';
import type { CompileScenarioRuntimeAssemblyOptions } from '../../core/compiler/compileScenarioRuntimeAssembly';
import { createEmptyScenario } from '../../core/project/createProject';
import type { ScenarioDocument } from '../../core/project/schema';
import { perlica } from '../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import { runScenarioSimulation } from './runScenarioSimulation';

function createScenario(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:application', '应用层模拟样本');
  scenario.battle.resourceRules = {
    maxSp: 300,
    initialSp: 0,
    spRecoveryPerSecond: 30,
    defaultSkillSpCost: 100,
  };
  return scenario;
}

function enemyBuffRuntime(): EnemyBuffRuntime {
  return {
    ownerId: 'enemy',
    advanceFrame: () => undefined,
    getCountByIds: () => 0,
    findFirstByIds: () => undefined,
    finishByIds: () => 0,
    holdByIds: () => ({ release() {} }),
    getCountByTags: () => 0,
    matchesEntityTags: () => false,
    findFirstByTags: () => undefined,
    finishByTags: () => 0,
  };
}

function operatorBuffRuntime(ownerId: string): OperatorBuffRuntime {
  return {
    ownerId,
    advanceFrame: () => undefined,
    apply: () => true,
    applyScoped: () => ({
      isRecycled: false,
      reference: createTestBuffReference(),
      finish: () => true,
    }),
    getCountByIds: () => 0,
    findFirstByIds: () => undefined,
    finishByIds: () => 0,
    holdByIds: () => ({ release() {} }),
    getCountByTags: () => 0,
    matchesEntityTags: () => false,
    findFirstByTags: () => undefined,
    finishByTags: () => 0,
  };
}

function operationExecutor(): CombatOperationExecutor {
  return {
    execute: () => true,
    evaluate: () => true,
  };
}

function options(): CompileScenarioRuntimeAssemblyOptions {
  return {
    index: {
      getOperator: () => null,
      getWeapon: () => null,
      getGear: () => null,
      getGearSet: () => null,
    },
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
    environment: {
      enemyBuffRuntime: enemyBuffRuntime(),
      createOperatorBuffRuntime: operatorBuffRuntime,
      createOperationExecutor: () => operationExecutor(),
      registerComboSkillCondition: () => ({ dispose: () => undefined }),
      comboConditionEligibility: { isAlive: () => true, isSilenced: () => false },
    },
  };
}

function createUltimateScenario(): ScenarioDocument {
  const scenario = createScenario();

  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 80 },
    skillCasts: [],
  };
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlica,
    skillGroupKey: 'ultimate',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:1` },
  }).scenario;
}

function ultimateOptions(): CompileScenarioRuntimeAssemblyOptions {
  const settings = options();
  return {
    ...settings,
    index: {
      ...settings.index,
      getOperator: slug => (slug === perlica.slug ? perlica : null),
    },
    resources: settings.resources,
  };
}

describe('runScenarioSimulation', () => {
  it('compiles a scenario, advances to the exact end frame, and returns immutable receipts', () => {
    const result = runScenarioSimulation({
      scenario: createScenario(),
      options: options(),
      endFrame: 3,
    });

    expect(result.frame).toBe(3);
    expect(result.enemy).toMatchObject({
      source: { kind: 'custom', level: 90 },
      health: 100000,
      defenderAttributes: { defense: 100, breakingAttackDamageTakenMultiplier: 1 },
    });
    expect(result.receiptEntries).toHaveLength(3);
    expect(result.receiptEntries.map(entry => entry.frame)).toEqual([1, 2, 3]);
    expect(result.receiptEntries.at(-1)).toMatchObject({
      event: 'SpChanged',
      data: { currentValue: 3 },
    });
    expect(result.initialResources.sp).toBe(0);
    expect(result.finalResources.sp).toBe(3);
    expect(
      result.resourceCurves.sp.points.map(({ frame, time, value }) => ({ frame, time, value })),
    ).toEqual([
      { frame: 0, time: 0, value: 0 },
      { frame: 1, time: 1 / 30, value: 1 },
      { frame: 2, time: 2 / 30, value: 2 },
      { frame: 3, time: 3 / 30, value: 3 },
    ]);
    expect(result.finalResources.spRecovery).toEqual({
      valuePerSecond: 30,
      pauseDuration: 1.5,
      pauseRemaining: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.receiptHistory.toArray()).toBe(result.receiptEntries);
    expect(Object.isFrozen(result.receiptEntries)).toBe(true);
    expect(Object.isFrozen(result.receiptEntries[0])).toBe(true);
    expect(Object.isFrozen(result.receiptEntries[0]!.data)).toBe(true);
    expect(Object.isFrozen(result.resourceCurves.sp.points)).toBe(true);
    expect(Object.isFrozen(result.resourceCurves.sp.points[0])).toBe(true);
  });

  it('returns ultimate energy after an ultimate skill pays its cost', () => {
    const result = runScenarioSimulation({
      scenario: createUltimateScenario(),
      options: ultimateOptions(),
      endFrame: 1,
    });

    expect(result.finalResources.squad).toHaveLength(1);
    expect(result.operatorPanels).toHaveLength(1);
    expect(result.operatorPanels[0]).toMatchObject({
      operatorId: 'track:0',
      attack: 706,
      health: 5950,
    });
    expect(result.finalResources.squad[0]).toMatchObject({
      operatorId: 'track:0',
      ultimateEnergy: 0,
      maxUltimateEnergy: 80,
    });
    expect(result.resourceCurves.ultimateEnergy).toHaveLength(1);
    expect(result.resourceCurves.ultimateEnergy[0]).toMatchObject({
      resource: 'ultimateEnergy',
      operatorId: 'track:0',
      maxValue: 80,
    });
    expect(result.resourceCurves.ultimateEnergy[0]!.points).toHaveLength(2);
    expect(result.resourceCurves.ultimateEnergy[0]!.points[0]).toEqual({
      frame: 0,
      time: 0,
      sequence: null,
      value: 80,
    });
    expect(result.resourceCurves.ultimateEnergy[0]!.points[1]).toMatchObject({
      frame: 1,
      time: 1 / 30,
      value: 0,
    });
  });

  it('executes a skill placed in preparation time without advancing an empty preparation range', () => {
    const scenario = createUltimateScenario();
    scenario.tracks[0]!.skillCasts[0]!.placement.startFrame = -1;

    const result = runScenarioSimulation({
      scenario,
      options: ultimateOptions(),
      endFrame: 0,
    });

    expect(result.receiptEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ frame: -1, event: 'SkillInputProcessed' }),
      ]),
    );
    expect(result.initialResources.squad[0]?.ultimateEnergy).toBe(80);
    expect(result.finalResources.squad[0]?.ultimateEnergy).toBe(0);
    expect(result.resourceCurves.ultimateEnergy[0]?.points[0]?.frame).toBe(-1);
  });

  it.each([-1, 1.5, Number.NaN])('rejects invalid endFrame %s before compilation', endFrame => {
    const settings = options();
    const getOperator = vi.fn(settings.index.getOperator);

    expect(() =>
      runScenarioSimulation({
        scenario: createScenario(),
        options: { ...settings, index: { ...settings.index, getOperator } },
        endFrame,
      }),
    ).toThrow('endFrame must be a non-negative integer');
    expect(getOperator).not.toHaveBeenCalled();
  });

  it('rejects an end frame beyond the scenario duration', () => {
    const scenario = createScenario();
    scenario.battle.durationFrames = 2;

    expect(() => runScenarioSimulation({ scenario, options: options(), endFrame: 3 })).toThrow(
      'must not exceed scenario battle duration',
    );
  });

  it('supports frame zero without advancing the runtime', () => {
    const result = runScenarioSimulation({
      scenario: createScenario(),
      options: options(),
      endFrame: 0,
    });

    expect(result).toMatchObject({ frame: 0, receiptEntries: [] });
    expect(result.initialResources.sp).toBe(0);
    expect(result.finalResources.sp).toBe(0);
    expect(result.resourceCurves.sp.points).toEqual([
      { frame: 0, time: 0, sequence: null, value: 0 },
    ]);
  });
});
