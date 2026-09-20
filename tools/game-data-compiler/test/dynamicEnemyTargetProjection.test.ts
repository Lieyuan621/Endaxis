/** 验证目标组读写保留：动态查询可为空，分支内静态查询不能丢失后续读取需要的写入。 */
import { describe, expect, it } from 'vitest';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { compileActiveSkillRuntimeProjectionSource } from '../src/compiler/skills/activeSkillRuntimeProjection.ts';
import { collectCompiledBuffApplications } from '../src/compiler/references/compiledReferences.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { compileActionSequence } from '../../../src/core/compiler/compileSkill.ts';
import { CombatActionSequenceRuntime } from '../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard.ts';
import { RuntimeTargetContext } from '../../../src/core/combat/abilities/runtimeTargetContext.ts';
import { TargetContextOperationExecutor } from '../../../src/core/combat/abilities/targetContextOperationExecutor.ts';
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

function project(kind: 'forEach' | 'applyBuff', group: string, abilityEntityEvent: boolean) {
  const query = {
    ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
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
  const context: CombatActionProjectionContextSource = {
    gameplayTagRegistry: fixtureGameplayTagRegistry,
    actionOwnerTarget: abilityEntityEvent ? 'currentAbilityEntity' : 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: abilityEntityEvent ? 'eventSource' : 'enemy',
  };
  return compileCombatActionSequenceSource(
    parseKnownNativeActionSequenceSource(sequence([query, consumer]), 'test.sequence', {}),
    context,
  );
}

describe('动态敌人集合的投影', () => {
  it.each([
    ['forEach', 'filtered', false],
    ['forEach', 'another_group', true],
    ['applyBuff', 'filtered', false],
    ['applyBuff', 'another_group', true],
  ] as const)('%s 保留 %s 的零次或一次执行（实体事件=%s）', (kind, group, entityEvent) => {
    const projected = project(kind, group, entityEvent);
    expect(projected.steps[1]).toMatchObject({
      kind: 'forEachContextTarget',
      parameters: { contextKey: group },
    });
    expect(projected.steps[1]!.parameters).not.toHaveProperty('target');
    // 生命周期闭包需要知道被创建 Buff 的宿主种类；外层循环继续负责零次或一次执行。
    expect(collectCompiledBuffApplications(projected)).toEqual([
      { buffId: 'test_buff', target: 'enemy' },
    ]);

    const targets = new RuntimeTargetContext();
    const applications: unknown[] = [];
    let matchesTag = false;
    const executor = new TargetContextOperationExecutor('operator', {
      evaluate: condition => {
        expect(condition).toEqual({
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: ['Test/Tag123'],
        });
        return matchesTag;
      },
      execute: (step, context) => {
        expect(step.kind).toBe('applyBuff');
        applications.push(context?.currentTarget);
        return true;
      },
    });
    const runtime = new CombatActionSequenceRuntime(executor, {
      blackboard: new ActionBlackboard(),
      targetContext: targets,
    });
    const compiled = runtime.createSequence(compileActionSequence(projected, 1));

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
            [
              query({
                $type: 'Example.Selector+AllEnemyFinder+Data, Example',
              }),
            ],
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
        new TargetContextOperationExecutor('operator', {
          evaluate: condition => {
            if (condition.kind === 'casterControlled') return controlled;
            expect(condition).toEqual({
              kind: 'contextTargetCountCompare',
              contextKey: group,
              operator: 'greaterOrEqual',
              value: 1,
            });
            // 使用正式 Context 读取；缺少 writer 必须失败，不能将未创建的组默认为空。
            return targets.get(group).length >= 1;
          },
          execute: step => {
            if (step.kind !== 'applyBuff') throw new Error(`unexpected ${step.kind}`);
            applications.push(step.parameters.target);
            return true;
          },
        }),
        { blackboard: new ActionBlackboard(), targetContext: targets },
      );
      for (const scheduled of projected.scheduledSequences) {
        runtime.createSequence(compileActionSequence(scheduled.sequence, 1)).executeInstant({});
      }
      expect(applications).toEqual([controlled ? 'caster' : 'enemy']);
      if (controlled) expect(() => targets.get(group)).toThrow('target context group');
      else expect(targets.get(group)).toEqual([{ kind: 'enemy' }]);
    },
  );
});
