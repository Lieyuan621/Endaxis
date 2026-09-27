import { expect, it } from 'vitest';

import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../core/game-data/equipmentDefinition';
import { compileResolvedScenarioEquipment } from '../../core/compiler/compileScenarioEquipment';
import { compileScenarioTimeline } from '../../core/compiler/compileScenarioTimeline';
import { resolveScenarioBuilds } from '../../core/compiler/resolveScenarioBuilds';
import { createEmptyScenario } from '../../core/project/createProject';
import type { GlobalEffectDefinition } from '../../core/game-data/globalEffectDefinition';
import { createGameDataRepository } from '../../data/createGameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import {
  captureScenarioSimulationGameData,
  restoreScenarioSimulationGameData,
} from './scenarioSimulationGameData';

it('后台数据包只携带一次公共定义，并在恢复后保留其来源', () => {
  const repository = createGameDataRepository({
    revision: 'source-transfer',
    commonDefinitionSources: [
      {
        id: 'shared',
        buffDefinitions: { first: { stackingType: 'unlimited' as const } },
        abilityEntityDefinitions: { second: { lifetime: { kind: 'infinite' as const } } },
      },
    ],
  });
  const packet = captureScenarioSimulationGameData(
    createEmptyScenario('transfer', 'transfer'),
    repository,
  );
  expect(packet).not.toHaveProperty('commonBuffDefinitions');
  expect(packet).not.toHaveProperty('commonAbilityEntityDefinitions');
  const restored = restoreScenarioSimulationGameData(structuredClone(packet));
  const [source] = restored.getCommonDefinitionSources!();
  expect(restored.getCommonBuffSource!('first')).toBe(source);
  expect(restored.getCommonAbilityEntitySource!('second')).toBe(source);
  expect(restored.getCommonBuffDefinitions!().first).toBe(source!.buffDefinitions!.first);
});

it('真实干员图经过 Worker 数据包后仍能编译时间轴技能', () => {
  const scenario = createEmptyScenario('graph-transfer', 'graph-transfer');
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
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  const placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlica,
    skillGroupKey: 'battleSkill',
    startFrame: 30,
    ids: { allocate: () => 'cast:graph' },
  }).scenario;
  const graphWeapon: WeaponDefinition = {
    slug: 'graph-transfer-weapon',
    rarity: 6,
    weaponType: perlica.weaponType,
    baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
    traits: [
      {
        key: 'setup',
        levelCount: 1,
        initializationSequence: { $sequence: 'entry' },
        actionGraph: {
          main: {
            nodes: {
              entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
            },
          },
          macros: {},
        },
      },
    ],
  };
  placed.tracks[0]!.weapon = {
    weaponSlug: graphWeapon.slug,
    level: 90,
    tuned: true,
    potential: 0,
    traitLevels: [1],
  };
  const repository = createGameDataRepository({
    revision: 'graph-transfer',
    operators: [perlica],
    weapons: [graphWeapon],
    commonDefinitionSources: [],
  });
  const packet = captureScenarioSimulationGameData(placed, repository);
  const restored = restoreScenarioSimulationGameData(structuredClone(packet));
  expect(restored.getWeapon(graphWeapon.slug)).toEqual(graphWeapon);
  const compiled = compileScenarioTimeline(placed, {
    getOperator: restored.getOperator,
    actionPrograms: restored.actionPrograms!,
    getCommonDefinitionSources: () => restored.getCommonDefinitionSources!(),
  });
  const cast = compiled.operators[0]!.skillCasts![0]!;
  expect(cast.castId).toBe('cast:graph');
  expect('steps' in cast.program.timelineActions[0]!.sequence).toBe(false);
});

it('图干员和图装备经 Worker 数据包恢复后编译同一构筑', () => {
  const scenario = createEmptyScenario('mixed-transfer', 'mixed-transfer');
  const weapon: WeaponDefinition = {
    slug: 'mixed-weapon',
    rarity: 6,
    weaponType: perlica.weaponType,
    baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
    traits: [
      {
        key: 'start',
        levelCount: 1,
        initializationSequence: { $sequence: 'entry' },
        actionGraph: {
          main: {
            nodes: {
              entry: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
            },
          },
          macros: {},
        },
      },
    ],
  };
  const slots = ['armor', 'gloves', 'accessory1'] as const;
  const gears: GearDefinition[] = slots.map(slot => ({
    slug: `mixed-${slot}`,
    slotType: slot === 'accessory1' ? 'accessory' : slot,
    levelRequirement: 1,
    baseDefense: 1,
    gearSetSlug: 'mixed-set',
    traits: [
      {
        key: 'start',
        levelCount: 1,
        display: {
          kind: 'modifier',
          modifier: { kind: 'attribute', attribute: 'main', operation: 'flat', value: 1 },
        },
      },
    ],
  }));
  const gearSet: GearSetDefinition = {
    slug: 'mixed-set',
    initializationSequence: { $sequence: 'entry' },
    actionGraph: {
      main: {
        nodes: { entry: { action: { kind: 'dealStagger', parameters: { value: 4 } }, next: null } },
      },
      macros: {},
    },
  };
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
    weapon: { weaponSlug: weapon.slug, level: 90, tuned: true, potential: 0, traitLevels: [1] },
    gears: {
      armor: { gearSlug: gears[0]!.slug, artificingLevels: [0] },
      gloves: { gearSlug: gears[1]!.slug, artificingLevels: [0] },
      accessory1: { gearSlug: gears[2]!.slug, artificingLevels: [0] },
      accessory2: null,
    },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  const repository = createGameDataRepository({
    revision: 'mixed-transfer',
    operators: [perlica],
    weapons: [weapon],
    gears,
    gearSets: [gearSet],
  });
  const packet = captureScenarioSimulationGameData(scenario, repository);
  const restored = restoreScenarioSimulationGameData(structuredClone(packet));
  expect(restored.getGearSet(gearSet.slug)).toEqual(gearSet);
  const builds = resolveScenarioBuilds(scenario, restored);
  const contributions = compileResolvedScenarioEquipment(builds, restored.actionPrograms);
  expect(contributions[0]?.contributions.map(item => item.source.kind)).toEqual([
    'weaponTrait',
    'gearTrait',
    'gearTrait',
    'gearTrait',
    'gearSet',
  ]);
  expect(
    contributions[0]?.contributions.map(item => item.initializationSequence !== undefined),
  ).toEqual([true, false, false, false, true]);
});

it('数据包携带方案引用的全部全局效果（含禁用引用）并进入选择键', () => {
  const effect = (id: string, value: number): GlobalEffectDefinition => ({
    id,
    buff: {
      stackingType: 'unlimited',
      attributeModifiers: [
        { attribute: 'criticalRate', slot: 'baseAddition' as const, value: value },
      ],
    },
  });
  const scenario = createEmptyScenario('effect-transfer', 'effect-transfer');
  scenario.globalConfig.effects = [
    { effectId: 'project:globalEffect:enabled', enabled: true },
    { effectId: 'project:globalEffect:disabled', enabled: false },
  ];
  const repository = createGameDataRepository({
    revision: 'effect-transfer',
    globalEffects: [
      effect('project:globalEffect:enabled', 0.1),
      effect('project:globalEffect:disabled', 0.2),
      effect('project:globalEffect:unreferenced', 0.3),
    ],
  });
  const packet = captureScenarioSimulationGameData(scenario, repository);
  expect(packet.globalEffects.map(item => item.id)).toEqual([
    'project:globalEffect:enabled',
    'project:globalEffect:disabled',
  ]);
  expect(packet.selectionKey).toContain('globalEffect:project:globalEffect:enabled');
  expect(packet.selectionKey).toContain('globalEffect:project:globalEffect:disabled');
  expect(packet.selectionKey).not.toContain('globalEffect:project:globalEffect:unreferenced');
  const restored = restoreScenarioSimulationGameData(structuredClone(packet));
  expect(
    restored.getGlobalEffect('project:globalEffect:disabled')?.buff.attributeModifiers![0]?.value,
  ).toBe(0.2);
  expect(restored.getGlobalEffect('project:globalEffect:unreferenced')).toBeNull();
  expect(() =>
    captureScenarioSimulationGameData(
      {
        ...scenario,
        globalConfig: {
          effects: [{ effectId: 'project:globalEffect:missing', enabled: true }],
        },
      },
      repository,
    ),
  ).toThrow("global effect definition 'project:globalEffect:missing' does not exist");
});

it('同 ID 定义更新后新捕获使用新版本，已捕获数据包保持旧版本', () => {
  const scenario = createEmptyScenario('effect-version', 'effect-version');
  scenario.globalConfig.effects = [{ effectId: 'project:globalEffect:shared', enabled: true }];
  const versioned = (value: number) =>
    createGameDataRepository({
      revision: `effect-version-${value}`,
      globalEffects: [
        {
          id: 'project:globalEffect:shared',
          buff: {
            stackingType: 'unlimited',
            attributeModifiers: [
              { attribute: 'criticalRate', slot: 'baseAddition' as const, value: value },
            ],
          },
        },
      ],
    });
  const firstPacket = captureScenarioSimulationGameData(scenario, versioned(0.1));
  const secondPacket = captureScenarioSimulationGameData(scenario, versioned(0.2));
  expect(
    restoreScenarioSimulationGameData(structuredClone(firstPacket)).getGlobalEffect(
      'project:globalEffect:shared',
    )?.buff.attributeModifiers![0]?.value,
  ).toBe(0.1);
  expect(
    restoreScenarioSimulationGameData(structuredClone(secondPacket)).getGlobalEffect(
      'project:globalEffect:shared',
    )?.buff.attributeModifiers![0]?.value,
  ).toBe(0.2);
});
