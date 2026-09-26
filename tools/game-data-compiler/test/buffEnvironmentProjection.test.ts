import { gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';
import { compileActionNode } from '../src/compiler/actions/combatActionLeafProjection.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it, vi } from 'vitest';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { parseNativeSequenceSource } from '../src/source/controlFlow.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import { readActionGraphChain } from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';
import { compileFlatSteps, compileGraphSequence } from './support/graphSequence.ts';
import { BuffOperationExecutor } from '../../../src/core/combat/buffs/buffOperationExecutor';
import { CombatBuffContainer } from '../../../src/core/combat/buffs/combatBuffs';
import { CombatAttributeSet } from '../../../src/core/combat/attributes/combatAttributes';
import { CombatActionSequenceRuntime } from '../../../src/core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard';
import { GameplayTagRegistry } from '../../../src/core/combat/tags/gameplayTags';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 0 };
const context = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'buffOwner',
} as const;
const tagPath = 'buff/test/crystal';
const tag = gameplayTagIdFromPath(tagPath);
const rawCount = () => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.CheckBuffStackNumAdvanced+Data, Gameplay.Beyond',
  // Environment 不读目标，即使这里残留了未保存的 Context 也应读取当前实例。
  checkTarget: targetFixture('Context', undefined, 'unused'),
  buffSettings: {
    checkType: 'Environment',
    buffIdList: [],
    tagQuery: { queryType: 'HasAny', tags: [] },
  },
  buffStackNumType: 'BuffCount',
  compareType: 'GE',
  value: scalarFixture(999, 'required'),
  limitSkillCastId: false,
});
const rawRead = (target = 'Owner') => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.GetTargetBuffBBAdvanced+Data, Gameplay.Beyond',
  targetSettings: targetFixture(target),
  buffSettings: {
    checkType: 'Tag',
    buffIdList: [],
    tagQuery: { queryType: 'HasAny', tags: [{ tagId: tag }] },
  },
  desiredKey: 'count',
  blackboardKey: 'copied',
});
function project(
  actions: unknown[],
  projectionContext: Omit<CombatActionProjectionContextSource, 'graph'> = context,
) {
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    parseNativeSequenceSource(
      {
        actionData: actions,
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'Buff.actions',
      {},
      (value, path) => parseKnownNativeActionLeafSource(value, path, {}),
    ),
    { ...projectionContext, graph: builder },
  );
  const graph = builder.finish();
  return {
    entry,
    graph,
    steps: readActionGraphChain(graph, entry),
    compiled: () => compileGraphSequence(entry, graph),
  };
}
function createTarget() {
  return new CombatBuffContainer(
    'enemy',
    new CombatAttributeSet(),
    new GameplayTagRegistry([tagPath]),
  );
}

describe('公共 Buff 环境读取：来源到正式执行器', () => {
  it('普通版按 ID 读取，找不到时保留原黑板值并返回失败', () => {
    const projected = project([
      {
        ...meta,
        $type: 'Beyond.Gameplay.Core.GetTargetBuffBBAction+Data, Gameplay.Beyond',
        targetSettings: targetFixture('Owner'),
        buffId: 'buff.last-type',
        desiredKey: 'combotype',
        blackboardKey: 'lastType',
      },
    ]);
    expect(projected.steps).toEqual([
      {
        kind: 'readBuffBlackboard',
        parameters: {
          target: 'buffOwner',
          query: { kind: 'id', buffIds: ['buff.last-type'] },
          desiredKey: 'combotype',
          outputKey: 'lastType',
        },
      },
    ]);
    const owner = createTarget();
    const blackboard = new ActionBlackboard({ lastType: 7 });
    const operations = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => owner,
      resolveEventTarget: () => owner,
      delegate: { execute: () => true, evaluate: () => true },
    });
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard,
      buffOwnerId: 'enemy',
    });
    const sequence = runtime.createSequence(projected.compiled());
    sequence.reset({});
    expect(sequence.tryExecute({})).toBe(false);
    expect(blackboard.getNumber('lastType')).toBe(7);
    owner.add(
      { id: 'buff.last-type', stackingType: 'unlimited', blackboard: { combotype: 2 } },
      'caster',
    );
    sequence.reset({});
    expect(sequence.tryExecute({})).toBe(true);
    expect(blackboard.getNumber('lastType')).toBe(2);
  });

  it('从已证明为唯一敌人的命名 Context 读取 Buff 黑板', () => {
    const parsed = parseKnownNativeActionLeafSource(
      {
        ...rawRead('Context'),
        targetSettings: targetFixture('Context', undefined, 'smart_target'),
      },
      'Skill.readConduct',
      {},
    );
    expect(
      compileActionNode(
        {
          sourcePath: 'Skill.readConduct',
          metadata: {
            enabled: true,
            nativeType: 'Beyond.Gameplay.Core.GetTargetBuffBBAdvanced+Data, Gameplay.Beyond',
            nativeName: 'GetTargetBuffBBAdvanced',
            priorityLevel: 'Default',
            priorityOffset: 0,
            serverActionIndex: 0,
          },
          body: { kind: 'leaf', value: parsed },
        },
        new Set(),
        new Map(),
        {
          ...context,
          actionOwnerTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['smart_target']),
          graph: createActionGraphBuilder<CompiledBuffStepSource>(),
        },
      ),
    ).toEqual([
      {
        kind: 'readBuffBlackboard',
        parameters: {
          target: 'enemy',
          query: { kind: 'tag', tagQueryType: 'hasAny', buffTags: [tagPath] },
          desiredKey: 'count',
          outputKey: 'copied',
        },
      },
    ]);
  });

  it('Environment 精确读取当前实例增强层数，动态阈值和条件短路不丢失', () => {
    const owner = createTarget();
    const current = owner.add(
      { id: 'same', stackingType: 'unlimited', applyTags: [tagPath], blackboard: { count: 3 } },
      'caster',
    )!;
    for (let index = 0; index < 4; index++)
      owner.add({ id: 'same', stackingType: 'unlimited' }, 'other');
    expect(owner.getCountById('same')).toBe(5);
    const reads = vi.fn(() => current.enhanceCount);
    const execute = vi.fn(() => true);
    const operations = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => owner,
      resolveEventTarget: () => owner,
      delegate: {
        execute,
        evaluate: () => {
          throw new Error('unexpected condition');
        },
      },
    });
    const blackboard = new ActionBlackboard({ required: 2 });
    const operationContext = {
      blackboard,
      getCurrentBuffEnhanceCount: reads,
      buffOwnerId: 'enemy',
    };
    const projected = project([rawCount(), rawRead()]);
    expect(projected.steps[0]).toMatchObject({
      parameters: {
        condition: {
          kind: 'currentBuffStackCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'blackboard', key: 'required' },
        },
      },
    });
    const runtime = new CombatActionSequenceRuntime(operations, operationContext);
    const run = () =>
      runtime
        .createSequence(
          compileFlatSteps(
            [
              ...projected.steps,
              {
                kind: 'changeResourceByActionValue',
                parameters: {
                  resource: 'sp',
                  recipient: 'caster',
                  amount: { kind: 'constant', value: 1 },
                },
              },
            ],
            projected.graph,
          ),
        )
        .executeInstant({});
    expect(run()).toBe(false);
    expect(blackboard.getNumber('copied')).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
    blackboard.assignDynamic('required', 1);
    expect(run()).toBe(true);
    expect(blackboard.getNumber('copied')).toBe(3);
    expect(execute).toHaveBeenCalledOnce();
    expect(reads).toHaveBeenCalledTimes(2);
    const condition = {
      kind: 'currentBuffStackCompare',
      operator: 'equal',
      value: { kind: 'blackboard', key: 'required' },
    } as const;
    expect(() => operations.evaluate(condition, { blackboard })).toThrow('Buff operation context');
    expect(() =>
      operations.evaluate(condition, { ...operationContext, blackboard: new ActionBlackboard() }),
    ).toThrow('required');
  });

  it.each([
    { buffStackNumType: 'BuffIdCount' },
    { limitSkillCastId: true },
    { buffSettings: { ...rawCount().buffSettings, buffIdList: ['other'] } },
    {
      buffSettings: {
        ...rawCount().buffSettings,
        tagQuery: { queryType: 'HasAny', tags: [{ tagId: tag }] },
      },
    },
  ])('未证明的 Environment 组合仍失败关闭：%j', patch => {
    expect(() => project([{ ...rawCount(), ...patch }])).toThrow('unsupported Environment');
  });

  it.each(['Owner', 'Source'])('Tag 黑板读取 %s 首个未结束实例，不聚合、不取最后一个', target => {
    const owner = createTarget();
    const add = (id: string, count?: number) =>
      owner.add(
        {
          id,
          stackingType: 'unlimited',
          applyTags: [tagPath],
          blackboard: count === undefined ? {} : { count },
        },
        'caster',
      )!;
    add('ended', 99).finish('other');
    const first = add('first', 2);
    const second = add('second', 4);
    const blackboard = new ActionBlackboard({ copied: -1 });
    const operations = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => owner,
      resolveEventTarget: () => owner,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard,
      buffOwnerId: 'enemy',
    });
    const program = project([rawRead(target)]).compiled();
    const run = () => runtime.createSequence(program).executeInstant({});
    expect(run()).toBe(true);
    expect(blackboard.getNumber('copied')).toBe(2);
    first.finish('other');
    expect(run()).toBe(true);
    expect(blackboard.getNumber('copied')).toBe(4);
    second.finish('other');
    // 没有 Buff 返回 false 且不写；存在 Buff 但没有所需键时才写零。
    expect(run()).toBe(false);
    expect(blackboard.getNumber('copied')).toBe(4);
    add('empty');
    expect(run()).toBe(true);
    expect(blackboard.getNumber('copied')).toBe(0);
  });

  it('Tag 无匹配时截断整个序列，不执行后续行为；未知字段和空查询不放行', () => {
    const owner = createTarget();
    const execute = vi.fn(() => true);
    const operations = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => owner,
      resolveEventTarget: () => owner,
      delegate: { execute, evaluate: () => false },
    });
    const runtime = new CombatActionSequenceRuntime(operations, {
      blackboard: new ActionBlackboard(),
      buffOwnerId: 'enemy',
    });
    const projected = project([rawRead()]);
    const program = compileFlatSteps(
      [
        ...projected.steps,
        {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            recipient: 'caster',
            amount: { kind: 'constant', value: 1 },
          },
        },
      ],
      projected.graph,
    );
    expect(runtime.createSequence(program).executeInstant({})).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    expect(() => project([{ ...rawRead(), guessed: true }])).toThrow('guessed');
    expect(() =>
      project([
        {
          ...rawRead(),
          buffSettings: { ...rawRead().buffSettings, tagQuery: { queryType: 'HasAny', tags: [] } },
        },
      ]),
    ).toThrow('unsupported');
  });
});

describe('当前 Buff 时间暂停投影', () => {
  const rawPause = (isPaused: boolean) => ({
    ...meta,
    $type: 'Beyond.Gameplay.Core.PauseBuffTime+Data, Gameplay.Beyond',
    isPaused,
  });

  it('保留 PauseBuffTime 的暂停与恢复状态', () => {
    expect(project([rawPause(true), rawPause(false)]).steps).toEqual([
      { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
      { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
    ]);
  });

  it('拒绝在没有当前 Buff 实例的主动技能上下文执行', () => {
    expect(() =>
      project([rawPause(true)], {
        ...context,
        actionOwnerTarget: 'caster',
        actionTargetTarget: 'caster',
      }),
    ).toThrow('PauseBuffTime requires a current Buff action owner');
  });
});
