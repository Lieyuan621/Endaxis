/** 对照执行器验证黑板用途摘要，防止把条件的旧值读取或外部对象读取漏掉。 */
import { describe, expect, it } from 'vitest';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import type { CombatStepForKind } from '../../../../packages/game-data-contract/src/actions.ts';
import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import type { CombatOperationContext } from '../../../../src/core/combat/skills/skillRuntime.ts';
import { ActionBlackboard } from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';
import { EventContextConditionExecutor } from '../../../../src/core/combat/events/eventContextConditionExecutor.ts';
import { AbilityEntityOperationExecutor } from '../../../../src/core/combat/abilities/abilityEntityOperationExecutor.ts';
import { LogicalAbilityEntityRuntime } from '../../../../src/core/combat/abilities/logicalAbilityEntityRuntime.ts';
import { RuntimeTargetContext } from '../../../../src/core/combat/abilities/runtimeTargetContext.ts';
import {
  analyzeConditionUsage,
  analyzeSequenceUsage,
  analyzeStepUsage,
} from '../../src/compiler/optimization/definitionUsageAnalysis.ts';
import { pruneUnusedSkillValues } from '../../src/compiler/optimization/skillValueOptimization.ts';

describe('黑板用途的读取对象', () => {
  it('可中断标记有运行时作用，但不读写黑板，也不阻止无用值裁剪', () => {
    const usage = analyzeStepUsage({ kind: 'markCurrentSkillCanInterrupt', parameters: {} });
    expect(usage.observable).toBe(true);
    expect(usage.unknownAccess).toBe(false);
    expect(usage.reads.size).toBe(0);
    expect(usage.writes.size).toBe(0);
  });
  it.each([
    {
      condition: {
        kind: 'eventInflictionElementIn',
        elements: ['nature'],
        outputKey: 'saved',
      } satisfies CombatCondition,
      event: {
        event: 'beforeTakeInfliction',
        payload: {
          skillId: 'skill',
          isExtra: false,
          sourceId: 'ally',
          targetId: 'enemy',
          element: 'nature',
        },
      } satisfies CombatOperationContext['event'],
    },
    {
      condition: {
        kind: 'eventPhysicalInflictionTypeIn',
        types: ['fracture'],
        outputKey: 'saved',
      } satisfies CombatCondition,
      event: {
        event: 'afterTakePhysicalInfliction',
        payload: { sourceId: 'ally', targetId: 'enemy', type: 'fracture' },
      } satisfies CombatOperationContext['event'],
    },
  ])('$condition.kind 在保存前读取旧值，缺声明仍报错', ({ condition, event }) => {
    const executor = new EventContextConditionExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    expect(() =>
      executor.evaluate(condition, { blackboard: new ActionBlackboard(), event }),
    ).toThrow("action blackboard value 'saved' is missing");
    const usage = analyzeConditionUsage(condition);
    expect(usage.reads).toEqual(new Set(['saved']));
    expect(usage.writes).toEqual(new Set(['saved']));
    expect(usage.mayThrow).toBe(true);
  });

  it('没有保存键时不虚构读写', () => {
    for (const condition of [
      { kind: 'eventInflictionElementIn', elements: ['nature'] },
      { kind: 'eventPhysicalInflictionTypeIn', types: ['fracture'] },
    ] satisfies CombatCondition[]) {
      const usage = analyzeConditionUsage(condition);
      expect(usage.reads.size).toBe(0);
      expect(usage.writes.size).toBe(0);
    }
  });

  it('普通数值输出保留 epsilon 旧值，但缺少目的键允许创建', () => {
    const step: CombatStepForKind<'storeCurrentTimelineFrame'> = {
      kind: 'storeCurrentTimelineFrame',
      parameters: { outputKey: 'saved' },
    };
    const executor = new ActionBlackboardOperationExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    const run = (blackboard: ActionBlackboard) => {
      expect(executor.execute(step, { blackboard, getCurrentTimelineFrame: () => 7 })).toBe(true);
      return blackboard.getNumber('saved');
    };
    expect(run(new ActionBlackboard({ saved: 7.000001 }))).toBe(7.000001);
    expect(run(new ActionBlackboard())).toBe(7);
    const usage = analyzeStepUsage(step);
    expect(usage.reads).toEqual(new Set(['saved']));
    expect(usage.writes).toEqual(new Set(['saved']));
    // 仍需保留运行环境错误；目的键允许缺失不代表动作在无 timeline host 时可执行。
    expect(usage.mayThrow).toBe(true);
    expect(() => executor.execute(step, { blackboard: new ActionBlackboard() })).toThrow(
      'timeline host',
    );
  });

  it('隐式旧值读取不把带 fallback 的算术输入变成严格缺键读取', () => {
    const base: CombatStepForKind<'modifyActionValue'> = {
      kind: 'modifyActionValue',
      parameters: { key: 'saved', operation: 'assign', value: { kind: 'constant', value: 7 } },
    };
    expect(analyzeStepUsage(base).mayThrow).toBe(false);
    const strict = {
      ...base,
      parameters: { ...base.parameters, value: { kind: 'blackboard' as const, key: 'input' } },
    };
    const fallback = {
      ...strict,
      parameters: { ...strict.parameters, value: { ...strict.parameters.value, fallback: 7 } },
    };
    expect(analyzeStepUsage(strict).mayThrow).toBe(true);
    expect(analyzeStepUsage(fallback).mayThrow).toBe(false);
    expect(analyzeStepUsage(fallback).reads).toEqual(new Set(['input', 'saved']));
    const executor = new ActionBlackboardOperationExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    expect(() => executor.execute(strict, { blackboard: new ActionBlackboard() })).toThrow(
      "'input' is missing",
    );
    expect(executor.execute(fallback, { blackboard: new ActionBlackboard() })).toBe(true);
  });

  it('数值事件参数保留旧值依赖，字符串 Buff ID 则直接覆盖', () => {
    const executor = new EventContextConditionExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    const numeric: CombatCondition = {
      kind: 'eventCustomAbilityNameMatch',
      eventName: 'fixture',
      outputKey: 'saved',
    };
    const numericBoard = new ActionBlackboard({ saved: 7.000001 });
    expect(
      executor.evaluate(numeric, {
        blackboard: numericBoard,
        event: {
          event: 'customAbilityEvent',
          payload: { sourceId: 'ally', targetId: 'enemy', eventName: 'fixture', eventParam: 7 },
        },
      }),
    ).toBe(true);
    expect(numericBoard.getNumber('saved')).toBe(7.000001);
    expect(analyzeConditionUsage(numeric).reads).toEqual(new Set(['saved']));
    for (const condition of [
      { kind: 'eventBuffIdMatch', buffIds: ['status'], buffIdOutputKey: 'saved' },
      {
        kind: 'eventBuffTagsMatch',
        match: 'hasAny',
        buffTags: ['Fixture/Tag'],
        buffIdOutputKey: 'saved',
      },
    ] satisfies CombatCondition[]) {
      const blackboard = new ActionBlackboard({ saved: 7 });
      expect(
        executor.evaluate(condition, {
          blackboard,
          event: {
            event: 'addedBuff',
            payload: {
              targetId: 'enemy',
              sourceId: 'ally',
              buffId: 'status',
              buffTags: ['Fixture/Tag'],
            },
          },
        }),
      ).toBe(true);
      expect(blackboard.getString('saved')).toBe('status');
      expect(analyzeConditionUsage(condition).reads.size).toBe(0);
      expect(analyzeConditionUsage(condition).writes).toEqual(new Set(['saved']));
    }
  });

  it('多输出动作与带阈值条件分别合并输入和目的键旧值', () => {
    expect(
      analyzeStepUsage({
        kind: 'storeEventHealValues',
        parameters: { finalHealOutputKey: 'requested', realHealOutputKey: 'actual' },
      }).reads,
    ).toEqual(new Set(['requested', 'actual']));
    expect(
      analyzeStepUsage({
        kind: 'readSkillSettingData',
        parameters: {
          items: [
            {
              values: [1, 2, 3, 4],
              column: { kind: 'blackboard', key: 'column' },
              storeKey: 'saved',
            },
          ],
        },
      }).reads,
    ).toEqual(new Set(['column', 'saved']));
    expect(
      analyzeConditionUsage({
        kind: 'eventConsumedBuffLayerCompare',
        outputKey: 'saved',
        value: { kind: 'blackboard', key: 'threshold' },
        operator: 'greater',
      }).reads,
    ).toEqual(new Set(['threshold', 'saved']));
    expect(
      analyzeConditionUsage({
        kind: 'eventOverheal',
        overHealKey: 'excess',
        finalHealKey: 'requested',
        realHealKey: 'actual',
      }).reads,
    ).toEqual(new Set(['excess', 'requested', 'actual']));
  });

  it('环排序读取查询到的实体板，技能上同名初值可以删除', () => {
    const query: CombatStepForKind<'findOwnerSpawnedAbilityEntities'> = {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: {
        saveToContextKey: 'places',
        abilityEntityIds: ['place'],
        circularOrder: { indexBlackboardKey: 'slot', desiredCount: 3, reverseFlag: 1 },
      },
    };
    const input: SkillDefinition = {
      key: 'fixture',
      timelineBlockFrames: 1,
      blackboard: { slot: 99 },
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [query] } }],
    };
    const result = pruneUnusedSkillValues(input);
    expect(result.report.removedInitialKeys).toEqual(['slot']);
    const usage = analyzeStepUsage(query);
    expect(usage.reads.size).toBe(0);
    expect(usage.externalReads).toEqual([
      { kind: 'abilityEntity', abilityEntityIds: ['place'], key: 'slot' },
    ]);
    expect(usage.unknownAccess).toBe(false);

    const entities = new LogicalAbilityEntityRuntime({});
    for (const slot of [2, 0, 1]) {
      entities.spawn({
        abilityEntityId: 'place',
        definition: { lifetime: { kind: 'infinite' } },
        ownerId: 'caster',
        source: { kind: 'operator', operatorId: 'caster' },
        blackboardAssignments: { slot },
      });
    }
    const executor = new AbilityEntityOperationExecutor('caster', entities, {
      execute: () => false,
      evaluate: () => false,
    });
    const run = (blackboard: ActionBlackboard) => {
      const targetContext = new RuntimeTargetContext();
      expect(executor.execute(query, { blackboard, targetContext })).toBe(true);
      return targetContext
        .get('places')
        .map(target => entities.entityBlackboard(target).getNumber('slot'));
    };
    expect(run(new ActionBlackboard({ slot: 99 }))).toEqual([0, 2, 1]);
    expect(run(new ActionBlackboard())).toEqual([0, 2, 1]);
    expect(
      analyzeStepUsage({
        ...query,
        parameters: { ...query.parameters, ownerContextKey: 'owners', sameSourceSkillCast: true },
      }).externalReads,
    ).toEqual([
      {
        kind: 'abilityEntity',
        abilityEntityIds: ['place'],
        ownerContextKey: 'owners',
        sameSourceSkillCast: true,
        key: 'slot',
      },
    ]);
  });

  it('Buff 查询与事件实例的外部读随嵌套条件合并，保留实际目标和筛选条件', () => {
    const usage = analyzeSequenceUsage({
      steps: [
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'enemy',
            query: { kind: 'id', buffIds: ['status'] },
            desiredKey: 'remote',
            outputKey: 'copied',
          },
        },
        {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'buffBlackboardValueCompare',
              target: 'actionInputTarget',
              query: { kind: 'tag', tagQueryType: 'hasAny', buffTags: [] },
              desiredKey: 'remote',
              outputKey: 'compared',
              operator: 'equal',
              value: { kind: 'blackboard', key: 'threshold' },
            },
          },
          whenTrue: {
            steps: [
              {
                kind: 'readEventBuffBlackboard',
                parameters: { desiredKey: 'eventValue', outputKey: 'eventCopy' },
              },
            ],
          },
        },
      ],
    });
    expect(usage.reads).toEqual(new Set(['copied', 'threshold', 'compared', 'eventCopy']));
    expect(usage.writes).toEqual(new Set(['copied', 'compared', 'eventCopy']));
    expect(usage.externalReads).toEqual([
      { kind: 'buff', target: 'enemy', query: { kind: 'id', buffIds: ['status'] }, key: 'remote' },
      {
        kind: 'buff',
        target: 'actionInputTarget',
        query: { kind: 'tag', tagQueryType: 'hasAny', buffTags: [] },
        key: 'remote',
      },
      { kind: 'eventBuff', key: 'eventValue' },
    ]);
  });
});
