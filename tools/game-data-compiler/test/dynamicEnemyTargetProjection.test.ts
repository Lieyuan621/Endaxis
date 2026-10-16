/** 验证目标组读写保留：动态查询可为空，分支内静态查询不能丢失后续读取需要的写入。 */
import { describe, expect, it } from 'vitest';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { compileActiveSkillRuntimeProjectionSource } from '../src/compiler/skills/activeSkillRuntimeProjection.ts';
import { collectCompiledBuffApplications } from '../src/compiler/references/compiledReferences.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import { readActionGraphChain } from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';
import { compileGraphSequence } from './support/graphSequence.ts';
import { CombatActionSequenceRuntime } from '../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard.ts';
import { RuntimeTargetContext } from '../../../src/core/combat/abilities/runtimeTargetContext.ts';
import {
  TargetContextOperationExecutor,
  resolveDirectActionTargets,
} from '../../../src/core/combat/abilities/targetContextOperationExecutor.ts';
import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import {
  ownerSpawnedAbilityEntityFindTargetActionFixture,
  activeSkillFixture,
  scalarFixture,
  targetFixture,
} from './sourceFixtures.ts';

const meta = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
};

function sequence(actionData: unknown[]) {
  return {
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
    actionData,
  };
}

function applyBuff(targetSource: string, targetGroupKey = '') {
  return {
    ...meta,
    $type: 'Example.CreateBuffAction+Data, Example',
    buffs: [
      {
        buffId: 'test_buff',
        assignBlackboard: false,
        assignItems: [],
        readIdFromBlackboard: false,
        buffIdKey: '',
      },
    ],
    count: scalarFixture(1),
    targetSettings: targetFixture(targetSource, undefined, targetGroupKey),
    buffSource: 'ActionSource',
    contextKey: '',
    autoFinishByAction: false,
    inheritSkillIdList: [],
    finishWithNextSkillIfNotInherited: true,
    asChildBuff: false,
    inheritSourceSkillCastId: true,
    inheritSourceSkillCastInfo: true,
    isExtra: false,
    passTargetGroupsToBuff: false,
    overrideBuffIconDuration: false,
    buffIconDurationSource: { durationSourceType: 'AbilityEntity', timedMarkerId: '' },
  };
}

function project(
  kind: 'forEach' | 'applyBuff',
  group: string,
  abilityEntityEvent: boolean,
  intervalSeconds?: number,
) {
  const query = {
    ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
    ...(intervalSeconds === undefined
      ? {}
      : {
          $type: 'Example.ContinuousFindTargetAction+Data, Example',
          findInterval: intervalSeconds,
        }),
    targetGroupKey: group,
    selectorData: {
      finderData: { $type: 'Example.Selector+InFightEnemyFinder+Data, Example' },
      validatorData: [
        {
          $type: 'Example.Selector+TagValidator+Data, Example',
          query: { queryType: 'HasAny', tags: [{ tagId: -1369794537 }] },
        },
      ],
      postProcessorData: [],
    },
  };
  const consumer =
    kind === 'forEach'
      ? {
          ...meta,
          $type: 'Example.ForEachAction+Data, Example',
          target: targetFixture('Context', undefined, group),
          action: sequence([applyBuff('Target')]),
        }
      : applyBuff('Context', group);
  const context: Omit<CombatActionProjectionContextSource, 'graph'> = {
    gameplayTagRegistry: fixtureGameplayTagRegistry,
    actionOwnerTarget: abilityEntityEvent ? 'currentAbilityEntity' : 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: abilityEntityEvent ? 'eventSource' : 'enemy',
  };
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    parseKnownNativeActionSequenceSource(sequence([query, consumer]), 'test.sequence', {}),
    { ...context, graph: builder },
  );
  const graph = builder.finish();
  return {
    entry,
    graph,
    steps: readActionGraphChain(graph, entry),
    compiled: () => compileGraphSequence(entry, graph),
  };
}

describe('动态敌人集合的投影', () => {
  it('不能把动态持续查询静默转换为单次查询', () => {
    expect(() => project('applyBuff', 'filtered', false, 0.5)).toThrow(
      'continuous target query requires a runtime lifecycle',
    );
  });

  it('智能选择未命中仍回退主目标，缺宿主不覆盖旧组，空结果覆盖旧组', () => {
    const builder = createActionGraphBuilder<CompiledBuffStepSource>();
    const query = {
      ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
      targetGroupKey: 'selected',
      selectorOwner: 'ActionSource',
      selectorData: {
        finderData: {
          $type: 'Example.Selector+SmartTargetFinder+Data, Example',
          selectSetting: {
            smartTargetSelectStrategy: 'SelectByBuff',
            smartTargetBuffIds: [{ buffId: 'absent_buff' }],
            smartTargetTagQuery: { queryType: 'HasAny', tags: [] },
            smartTargetBuffFindSettings: {
              checkType: 'Id',
              buffIdList: [],
              tagQuery: { queryType: 'HasAny', tags: [] },
            },
          },
          useCustomRange: false,
          range: scalarFixture(0),
          limitFallbackRange: false,
        },
        validatorData: [],
        postProcessorData: [],
      },
    };
    const entry = compileCombatActionSequenceSource(
      parseKnownNativeActionSequenceSource(sequence([query]), 'smartTarget', {}),
      {
        graph: builder,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      },
    );
    const graph = builder.finish();
    expect(readActionGraphChain(graph, entry)).toMatchObject([
      {
        kind: 'findTargets',
        parameters: { owner: { kind: 'source' }, query: { kind: 'mainTarget' } },
      },
    ]);
    let hasTarget = true;
    const targets = new RuntimeTargetContext();
    targets.set('selected', [{ kind: 'operator', operatorId: 'old' }]);
    const executor = new TargetContextOperationExecutor(
      'operator',
      {
        execute: () => {
          throw new Error('unexpected synthetic action');
        },
        evaluate: () => {
          throw new Error('unexpected Buff condition');
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { mainTarget: () => (hasTarget ? { kind: 'enemy' } : undefined), ownerSpawned: () => [] },
    );
    const run = (actionSourceId?: string) =>
      new CombatActionSequenceRuntime(executor, {
        blackboard: new ActionBlackboard(),
        targetContext: targets,
        actionSourceId,
      })
        .createSequence(compileGraphSequence(entry, graph))
        .executeInstant({});
    expect(run()).toBe(false);
    expect(targets.get('selected')).toEqual([{ kind: 'operator', operatorId: 'old' }]);
    expect(run('operator')).toBe(true);
    expect(targets.get('selected')).toEqual([{ kind: 'enemy' }]);
    hasTarget = false;
    expect(run('operator')).toBe(true);
    expect(targets.get('selected')).toEqual([]);
  });

  it.each([
    ['forEach', 'filtered', false],
    ['forEach', 'another_group', true],
    ['applyBuff', 'filtered', false],
    ['applyBuff', 'another_group', true],
  ] as const)('%s 保留 %s 的零次或一次执行（实体事件=%s）', (kind, group, entityEvent) => {
    const projected = project(kind, group, entityEvent);
    expect(projected.steps[0]).toMatchObject({
      kind: 'findTargets',
      parameters: { query: { kind: 'enemyByTags' }, saveToContextKey: group },
    });
    const loopStep = projected.steps[1]!;
    expect(loopStep).toMatchObject({
      kind: kind === 'forEach' ? 'forEachContextTarget' : 'applyBuff',
      parameters: { targets: { kind: 'context', key: group } },
    });
    // 生命周期闭包保留宿主种类；原生显式循环与 CreateBuff 内部遍历共用目标查询。
    expect(collectCompiledBuffApplications(projected.graph)).toEqual([
      { buffId: 'test_buff', target: 'enemy' },
    ]);

    const targets = new RuntimeTargetContext();
    const applications: unknown[] = [];
    let matchesTag = false;
    const executor = new TargetContextOperationExecutor(
      'operator',
      {
        evaluate: condition => {
          throw new Error(`unexpected synthetic condition ${condition.kind}`);
        },
        execute: (step, context) => {
          expect(step.kind).toBe('applyBuff');
          if (step.kind !== 'applyBuff') throw new Error(`unexpected ${step.kind}`);
          applications.push(
            ...resolveDirectActionTargets(step.parameters.targets, context!, 'operator')!,
          );
          return true;
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        mainTarget: () => undefined,
        ownerSpawned: () => [],
        enemyMatchesTags: query => {
          expect(query).toEqual({
            kind: 'enemyByTags',
            tagQueryType: 'hasAny',
            tags: ['Test/Tag123'],
          });
          return matchesTag;
        },
      },
    );
    const runtime = new CombatActionSequenceRuntime(executor, {
      blackboard: new ActionBlackboard(),
      targetContext: targets,
      actionOwnerId: 'operator',
      actionSourceId: 'operator',
    });
    const compiled = runtime.createSequence(projected.compiled());

    // 同一个查询连续经历空、命中、再次清空，后一次不能复用旧目标。
    for (const expectedMatch of [false, true, false]) {
      matchesTag = expectedMatch;
      applications.length = 0;
      compiled.executeInstant({});
      const expectedTargets = expectedMatch ? [{ kind: 'enemy' }] : [];
      expect(targets.get(group)).toEqual(expectedTargets);
      expect(applications).toEqual(expectedTargets);
    }
  });
});

describe('跨时间段的目标组读写', () => {
  it.each([true, false])(
    '保留非主控分支的静态查询，后续数量读取有对应写入（主控=%s）',
    controlled => {
      const group = 'secondary_targets';
      const branch = (condition: unknown, whenTrue: unknown[], whenFalse: unknown[]) => ({
        ...meta,
        $type: 'Example.IfElseAction+IfElseActionData, Example',
        conditionAction: sequence([condition]),
        succeedActions: sequence(whenTrue),
        failActions: sequence(whenFalse),
        alwaysNext: true,
      });
      const mainCharacter = {
        ...meta,
        $type: 'Example.Conditions.CheckMainCharacterCondition+Data, Example',
        checkTarget: targetFixture('Owner'),
      };
      const count = (source: string, key = '') => ({
        ...meta,
        $type: 'Example.Conditions.CheckEntityNum+Data, Example',
        checkTarget: targetFixture(source, undefined, key),
        minNum: 1,
        containsHittableTarget: false,
        compareType: 'GE',
        excludeDeadEntity: false,
        storeKey: '',
      });
      const query = (finder: Record<string, unknown>) => ({
        ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
        targetGroupKey: group,
        selectorData: { finderData: finder, validatorData: [], postProcessorData: [] },
      });
      const writer = branch(
        mainCharacter,
        [],
        [
          branch(
            count('Target'),
            [query({ $type: 'Example.Selector+AllEnemyFinder+Data, Example' })],
            [
              query({
                $type: 'Example.Selector+FixedPointFinder+Data, Example',
                positionOffset: { x: 0, y: 0, z: 8 },
                rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
                snapToNavmesh: false,
                sampleRadius: scalarFixture(0),
              }),
            ],
          ),
        ],
      );
      const reader = branch(
        mainCharacter,
        [applyBuff('Owner')],
        [branch(count('Context', group), [applyBuff('Target')], [])],
      );
      const skill = activeSkillFixture('test_cross_timeline');
      skill.actionGroupData = {
        passiveEventActions: [],
        timelineActions: [writer, reader].map((action, index) => ({
          _startFrame: index * 2,
          _endFrame: index * 2 + 1,
          _sequenceActionData: sequence([action]),
          forceSyncAnimData: {
            forceSync: false,
            montageName: '',
            targetFrame: 0,
            playbackSpeed: 1,
          },
        })),
      };
      const projected = compileActiveSkillRuntimeProjectionSource({
        value: skill,
        sourcePath: 'test.crossTimeline',
        patch: null,
        context: {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
        },
      });
      expect(projected.scheduledSequences).toHaveLength(2);
      const targets = new RuntimeTargetContext();
      const applications: string[] = [];
      const runtime = new CombatActionSequenceRuntime(
        new TargetContextOperationExecutor(
          'operator',
          {
            evaluate: condition => {
              if (condition.kind === 'checkMainCharacter') return controlled;
              throw new Error(`unexpected ${condition.kind}`);
            },
            execute: (step, context) => {
              if (step.kind !== 'applyBuff') throw new Error(`unexpected ${step.kind}`);
              for (const target of resolveDirectActionTargets(
                step.parameters.targets,
                context!,
                'operator',
              )!)
                applications.push(target.kind === 'enemy' ? 'enemy' : 'caster');
              return true;
            },
          },
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            entityLifeState: () => 'alive',
            mainTarget: () => undefined,
            ownerSpawned: () => [],
          },
        ),
        {
          blackboard: new ActionBlackboard(),
          targetContext: targets,
          actionInputTarget: { kind: 'enemy' },
          actionOwnerId: 'operator',
          actionSourceId: 'operator',
        },
      );
      for (const scheduled of projected.scheduledSequences) {
        runtime
          .createSequence(compileGraphSequence(scheduled.sequence, projected.actionGraph))
          .executeInstant({});
      }
      expect(applications).toEqual([controlled ? 'caster' : 'enemy']);
      if (controlled) expect(() => targets.get(group)).toThrow('target context group');
      else expect(targets.get(group)).toEqual([{ kind: 'enemy' }]);
    },
  );
});
