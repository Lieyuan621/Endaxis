/** 检查装备与公共 Buff 的优化入口、报告模式及正式定义渲染，不依赖正式游戏资源。 */
import { describe, expect, it } from 'vitest';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import type { SkillBuffDefinition } from '../../../../packages/game-data-contract/src/buffs.ts';

import type {
  EquipmentContributionDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../../packages/game-data-contract/src/equipment.ts';
import {
  finalizeCommonBuffDefinitions,
  finalizeGearSetDefinition,
  finalizeWeaponDefinition,
} from '../../src/compiler/finalizeDefinitions.ts';
import { renderWeaponDefinitionFiles } from '../../src/domains/weapon/renderRuntimeDefinitions.ts';
import { renderEquipmentSuitDefinitionFiles } from '../../src/domains/equipment/renderSuitDefinitions.ts';
import {
  compileGearSetContribution,
  compileWeaponContributions,
} from '../../../../src/core/compiler/compileEquipment.ts';
import { ActionGraphDefinitionRepository } from '../../../../src/core/compiler/actionGraphDefinitionRepository.ts';

import { EquipmentEventRuntime } from '../../../../src/core/combat/abilities/equipmentEventRuntime.ts';
import { CombatSemanticEventRuntime } from '../../../../src/core/combat/events/combatSemanticEventRuntime.ts';

const modifyOutput: ActionGraphStep = {
  kind: 'modifyActionValue',
  parameters: { key: 'output', operation: 'assign', value: { kind: 'constant', value: 2 } },
};
/** 恒真条件包裹的单动作体；优化后收敛为裸 body 节点。 */
const guardedGraph = (): ActionGraphResourceDefinition => ({
  main: {
    nodes: {
      'guard-0': {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'constant', value: true } },
          whenTrue: { $sequence: 'body-0' },
        },
        next: null,
      },
      'body-0': { action: modifyOutput, next: null },
    },
  },
  macros: {},
});
const guarded: ActionGraphReference = { $sequence: 'guard-0' };
const bodyReference = { $sequence: 'body-0' };
const createBuff = (): SkillBuffDefinition => ({
  stackingType: 'unlimited',
  blackboard: { externalConsumer: 9 },
  lifecycleSequences: { enable: guarded, disable: guarded },
  scheduledSequences: [{ startFrame: 2, endFrame: 5, sequence: guarded }],
  igniteEventResponses: [{ igniteType: 'fixture', finishAfterIgnited: true, sequence: guarded }],
  actionGraph: guardedGraph(),
});
const buff = createBuff();
const createContribution = (): Omit<GearSetDefinition, 'slug'> => ({
  blackboard: { externallyPatched: [1, 2], output: 0 },
  enableSequence: guarded,
  initializationSequence: guarded,
  eventHandlers: [{ key: 'event', priority: 3, abilityEvent: 'enterFight', sequence: guarded }],
  actionGraph: guardedGraph(),
});
const contribution = createContribution();
const weapon: WeaponDefinition = {
  slug: 'wpn_fixture',
  rarity: 3,
  weaponType: 'sword',
  baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
  buffDefinitions: { buff_fixture: buff },
  traits: [{ key: 'trait', levelCount: 2, ...contribution }],
};
const gearSet: GearSetDefinition = {
  slug: 'suit_fixture',
  ...contribution,
  buffDefinitions: { buff_fixture: buff },
};

function expectContributionOptimized(
  result: Omit<GearSetDefinition, 'slug'> & {
    buffDefinitions?: GearSetDefinition['buffDefinitions'];
  },
) {
  expect(result.enableSequence).toEqual(bodyReference);
  expect(result.initializationSequence).toEqual(bodyReference);
  expect(result.eventHandlers).toEqual([
    { key: 'event', priority: 3, abilityEvent: 'enterFight', sequence: bodyReference },
  ]);
  expect(result.blackboard).toEqual({ output: 0 });
  expect(result.buffDefinitions?.buff_fixture?.blackboard).toEqual(buff.blackboard);
  expect(result.buffDefinitions?.buff_fixture?.lifecycleSequences).toEqual({
    enable: bodyReference,
    disable: bodyReference,
  });
  expect(result.buffDefinitions?.buff_fixture?.scheduledSequences).toEqual([
    { startFrame: 2, endFrame: 5, sequence: bodyReference },
  ]);
}

describe('公共 Buff 和装备定义的优化入口', () => {
  it('显式报告模式保持定义内容和正式模块内容，关闭模式不报告改动', () => {
    const weaponResult = finalizeWeaponDefinition(weapon, 'report');
    const suitResult = finalizeGearSetDefinition(gearSet, 'report');
    expect(weaponResult.definition).toEqual(weapon);
    expect(suitResult.definition).toEqual(gearSet);
    expect(weaponResult.report.before.steps).toBe(14);
    expect(weaponResult.report.after.steps).toBe(7);
    expect(suitResult.report.after.steps).toBe(7);
    expect(
      renderWeaponDefinitionFiles({ definitions: [weaponResult.definition], diagnostics: [] }),
    ).toEqual(renderWeaponDefinitionFiles({ definitions: [weapon], diagnostics: [] }));
    expect(
      renderEquipmentSuitDefinitionFiles({ definitions: [suitResult.definition], diagnostics: [] }),
    ).toEqual(renderEquipmentSuitDefinitionFiles({ definitions: [gearSet], diagnostics: [] }));
    const off = finalizeWeaponDefinition(weapon, 'off');
    expect(off.definition).toEqual(weapon);
    expect(off.report.after).toEqual(off.report.before);
    expect(off.report.programs.flatMap(program => program.changes)).toEqual([]);
  });

  it('默认实际应用优化，访问装备安装、事件与私有 Buff，保留黑板和注册元数据', () => {
    const original = structuredClone(weapon);
    const appliedWeapon = finalizeWeaponDefinition(weapon);
    const appliedSuit = finalizeGearSetDefinition(gearSet);
    expect(appliedWeapon).toEqual(finalizeWeaponDefinition(weapon, 'apply'));
    expect(appliedSuit).toEqual(finalizeGearSetDefinition(gearSet, 'apply'));
    expect(appliedWeapon.report.mode).toBe('apply');
    expect(appliedSuit.report.mode).toBe('apply');
    expectContributionOptimized({
      ...appliedWeapon.definition.traits[0]!,
      buffDefinitions: appliedWeapon.definition.buffDefinitions,
    });
    expectContributionOptimized(appliedSuit.definition);
    expect(appliedWeapon.report.skillValues).toEqual([]);
    expect(appliedSuit.report.skillValues).toEqual([]);
    expect(weapon).toEqual(original);
    expect(
      finalizeWeaponDefinition(appliedWeapon.definition, 'apply').report.programs.flatMap(
        program => program.changes,
      ),
    ).toEqual([]);
    // 图时代的优化定位：入口引用与被移除节点的改写记录。
    expect(
      appliedWeapon.report.programs.map(program => program.changes.map(change => change.path)),
    ).toContainEqual(['entry[0]→guard-0']);
  });

  it('公共 Buff 保留全部身份、黑板初值和点燃结束标记，不按引用次数裁剪目录', () => {
    const definitions = { shared_a: buff, shared_b: { stackingType: 'unlimited' as const } };
    expect(finalizeCommonBuffDefinitions(definitions, 'report').definitions).toEqual(definitions);
    expect(finalizeCommonBuffDefinitions(definitions, 'off').definitions).toEqual(definitions);
    const applied = finalizeCommonBuffDefinitions(definitions);
    expect(applied).toEqual(finalizeCommonBuffDefinitions(definitions, 'apply'));
    expect(applied.report.mode).toBe('apply');
    expect(Object.keys(applied.definitions)).toEqual(['shared_a', 'shared_b']);
    expect(applied.definitions.shared_a?.blackboard).toEqual(buff.blackboard);
    expect(applied.definitions.shared_a?.igniteEventResponses).toEqual([
      { igniteType: 'fixture', finishAfterIgnited: true, sequence: bodyReference },
    ]);
    expect(applied.report.before.steps).toBe(8);
    expect(applied.report.after.steps).toBe(4);
    expect(applied.report.skillValues).toEqual([]);
  });

  it('武器既有审计文件携带优化报告，正式 TS 文件不受报告字段影响', () => {
    const result = finalizeWeaponDefinition(weapon);
    const baseline = renderWeaponDefinitionFiles({
      definitions: [result.definition],
      diagnostics: [],
    });
    const withReport = renderWeaponDefinitionFiles({
      definitions: [result.definition],
      diagnostics: [],
      optimization: [result.report],
    });
    expect(withReport.filter(file => file.relativePath.endsWith('.ts'))).toEqual(
      baseline.filter(file => file.relativePath.endsWith('.ts')),
    );
    const audit = withReport.find(file => file.relativePath.endsWith('.audit.json'));
    expect(JSON.parse(audit!.content).optimization).toEqual([result.report]);
  });

  it('没有运行入口的词条删除整块黑板，位置不影响判断，静态属性和独立 Buff 板保留', () => {
    const staticContribution: Omit<GearSetDefinition, 'slug'> = {
      modifiers: [{ kind: 'attribute', attribute: 'main', operation: 'flat', value: [4, 8] }],
      blackboard: { attributeSource: [4, 8], unusedSource: [1, 2], EntityBB_unused: 9 },
      buffDefinitions: {
        shared_definition: { stackingType: 'unlimited', blackboard: { foreignConsumer: 7 } },
      },
    };
    const { buffDefinitions: sharedBuffs, ...staticTrait } = staticContribution;
    const input: WeaponDefinition = {
      ...weapon,
      buffDefinitions: { ...weapon.buffDefinitions, ...sharedBuffs },
      traits: [
        { key: 'runtime', levelCount: 2, ...contribution },
        { key: 'static_middle', levelCount: 2, ...staticTrait },
        {
          key: 'static_last',
          levelCount: 2,
          ...staticTrait,
          eventHandlers: [],
        },
      ],
    };
    const original = structuredClone(input);
    const result = finalizeWeaponDefinition(input);
    expect(result.definition.traits[0]?.blackboard).toEqual({ output: 0 });
    for (const trait of result.definition.traits.slice(1)) {
      expect(Object.hasOwn(trait, 'blackboard')).toBe(false);
      expect(trait.modifiers).toEqual(staticContribution.modifiers);
      expect(trait).not.toHaveProperty('buffDefinitions');
      expect(result.definition.buffDefinitions?.shared_definition).toEqual(
        staticContribution.buffDefinitions?.shared_definition,
      );
    }
    expect(result.report.equipmentValues).toEqual([
      {
        definitionId: 'wpn_fixture:runtime',
        path: 'traits[0]',
        removedInitialKeys: ['externallyPatched'],
        retainedReason: 'runtime-value-access',
      },
      ...['static_middle', 'static_last'].map((key, index) => ({
        definitionId: `wpn_fixture:${key}`,
        path: `traits[${index + 1}]`,
        removedInitialKeys: ['attributeSource', 'unusedSource', 'EntityBB_unused'],
      })),
    ]);
    for (const level of [1, 2]) {
      const attributes = { main: 'agility', secondary: 'intellect' } as const;
      const baseline = compileWeaponContributions(
        input,
        [level, level, level],
        attributes,
        new ActionGraphDefinitionRepository(),
      );
      const optimized = compileWeaponContributions(
        result.definition,
        [level, level, level],
        attributes,
        new ActionGraphDefinitionRepository(),
      );
      expect(optimized.map(item => item.modifiers)).toEqual(baseline.map(item => item.modifiers));
      expect(optimized.slice(1).map(item => item.buffDefinitions)).toEqual(
        baseline.slice(1).map(item => item.buffDefinitions),
      );
    }
    expect(input).toEqual(original);
    expect(
      finalizeWeaponDefinition(result.definition).report.equipmentValues.flatMap(
        item => item.removedInitialKeys,
      ),
    ).toEqual([]);
  });

  it('静态贡献的显式 report 只报告删除，off 不删除；套装采用相同规则', () => {
    const input: GearSetDefinition = {
      slug: 'suit_static',
      displayName: '静态套装',
      modifiers: [{ kind: 'panelStat', stat: 'attackFlat', value: 5 }],
      blackboard: { obsolete: 5 },
    };
    const report = finalizeGearSetDefinition(input, 'report');
    expect(report.definition).toEqual(input);
    expect(report.report.equipmentValues).toEqual([
      { definitionId: input.slug, path: 'contribution', removedInitialKeys: ['obsolete'] },
    ]);
    const off = finalizeGearSetDefinition(input, 'off');
    expect(off.definition).toEqual(input);
    expect(off.report.equipmentValues[0]).toMatchObject({
      removedInitialKeys: [],
      retainedReason: 'optimization-disabled',
    });
    const applied = finalizeGearSetDefinition(input);
    expect(Object.hasOwn(applied.definition, 'blackboard')).toBe(false);
    expect(applied.definition).toEqual({
      slug: input.slug,
      displayName: input.displayName,
      modifiers: input.modifiers,
    });
    expect(finalizeCommonBuffDefinitions({}).report.equipmentValues).toEqual([]);
  });

  it('空入口的无用初值也删除，但仍创建装备宿主并保留注册行为', () => {
    const emptyGraph = (): ActionGraphResourceDefinition => ({ main: { nodes: {} }, macros: {} });
    const entryDefinitions: readonly EquipmentContributionDefinition[] = [
      { enableSequence: { $sequence: null }, actionGraph: emptyGraph() },
      { initializationSequence: { $sequence: null }, actionGraph: emptyGraph() },
      {
        eventHandlers: [
          { key: 'empty_handler', abilityEvent: 'enterFight', sequence: { $sequence: null } },
        ],
        actionGraph: emptyGraph(),
      },
    ];
    for (const entry of entryDefinitions) {
      const input: GearSetDefinition = {
        slug: 'suit_runtime',
        ...entry,
        blackboard: { possiblyRead: 7 },
      };
      const result = finalizeGearSetDefinition(input);
      expect(Object.hasOwn(result.definition, 'blackboard')).toBe(false);
      expect(result.definition.enableSequence).toEqual(input.enableSequence);
      expect(result.definition.initializationSequence).toEqual(input.initializationSequence);
      expect(result.definition.eventHandlers).toEqual(input.eventHandlers);
      expect(result.report.equipmentValues[0]).toMatchObject({
        removedInitialKeys: ['possiblyRead'],
      });
      const compiled = compileGearSetContribution(
        result.definition,
        {
          main: 'agility',
          secondary: 'intellect',
        },
        new ActionGraphDefinitionRepository(),
      );
      const runtime = new EquipmentEventRuntime(
        new CombatSemanticEventRuntime(),
        'operator_fixture',
        [compiled],
        () => ({ execute: () => true, evaluate: () => true }),
        () => ({ dispose() {} }),
      );
      try {
        expect(runtime.blackboardFor(0).snapshot()).toEqual({});
        runtime.enable(0);
        expect(() => runtime.assertAllEnabled()).not.toThrow();
      } finally {
        runtime.dispose();
      }
    }
  });
});
