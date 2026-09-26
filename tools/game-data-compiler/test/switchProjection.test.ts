import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it, vi } from 'vitest';
import { parseNativeSequenceSource } from '../src/source/controlFlow.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import {
  ownerSpawnedAbilityEntityFindTargetActionFixture,
  scalarFixture,
  targetFixture,
} from './sourceFixtures.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';
import { readActionGraphChain } from '../src/compiler/actions/actionGraphBuilder.ts';
import { compileGraphSequence } from './support/graphSequence.ts';
import { CombatActionSequenceRuntime } from '../../../src/core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard';
import { renderCommonBuffDefinitionsSource } from '../src/domains/operator/definitionSourceRenderer.ts';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 0 };
const sequence = (actionData: unknown[]) => ({
  actionData,
  onlyExecuteWhenSourceIsMainChar: false,
  onlyExecuteWhenSourceIsGuard: false,
});
const option = (value: number, actions: unknown[]) => ({
  value: scalarFixture(value),
  actionData: sequence(actions),
});
const select = (options: unknown[], alwaysNext = true) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.SwitchAction+Data, Gameplay.Beyond',
  choice: scalarFixture(99, 'choice'),
  options,
  alwaysNext,
});
const read = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.GetTargetBuffBBAdvanced+Data, Gameplay.Beyond',
  targetSettings: targetFixture('Source'),
  desiredKey: 'count',
  blackboardKey: 'out',
  buffSettings: {
    checkType: 'Id',
    buffIdList: ['buff'],
    tagQuery: { queryType: 'HasAny', tags: [] },
  },
};
const count = (key: string) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.CheckEntityNum+Data, Gameplay.Beyond',
  checkTarget: targetFixture('Context', undefined, key),
  minNum: 1,
  compareType: 'GE',
  containsHittableTarget: false,
  excludeDeadEntity: false,
  storeKey: '',
});
function project(
  actions: unknown[],
  context: Omit<CombatActionProjectionContextSource, 'graph'> = {
    gameplayTagRegistry: fixtureGameplayTagRegistry,
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
  },
) {
  const source = parseNativeSequenceSource(sequence(actions), 'fixture', {}, (value, path) =>
    parseKnownNativeActionLeafSource(value, path, {}),
  );
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(
    source,
    { ...context, graph: builder },
    new Set(),
    {
      resolveTimeDilationPriority: id => {
        if (id !== -693798243) throw new Error('unknown priority');
        return 20;
      },
    },
  );
  const graph = builder.finish();
  return {
    entry,
    graph,
    /** 入口同层动作；分支内容仍需按 {$sequence} 显式读取。 */
    steps: readActionGraphChain(graph, entry),
    /** 编译当前图入口，供执行断言。 */
    compiled: () => compileGraphSequence(entry, graph),
  };
}

describe('公共 Switch 投影', () => {
  it('保留动态 choice、重复标签、空分支和嵌套 Switch；格式输出不丢 options', () => {
    const result = project([
      select([option(2, []), option(2, [read]), option(3, [select([option(3, [read])])])]),
    ]);
    const selected = result.steps[0];
    if (selected?.kind !== 'switch') throw new Error('missing switch');
    expect(selected.parameters.choice).toEqual({ kind: 'blackboard', key: 'choice' });
    // 空分支、重复标签值与嵌套 Switch 均按显式引用保留。
    expect(selected.options[0]?.value).toEqual({ kind: 'constant', value: 2 });
    expect(readActionGraphChain(result.graph, selected.options[0]!.sequence)).toEqual([]);
    expect(selected.options[1]?.value).toEqual({ kind: 'constant', value: 2 });
    expect(readActionGraphChain(result.graph, selected.options[1]!.sequence)).toHaveLength(1);
    const nested = readActionGraphChain(result.graph, selected.options[2]!.sequence);
    expect(nested[0]?.kind).toBe('switch');
    const execute = vi.fn(() => true);
    const runtime = new CombatActionSequenceRuntime(
      { execute, evaluate: () => true },
      { blackboard: new ActionBlackboard({ choice: 2 }) },
    );
    expect(runtime.createSequence(result.compiled()).executeInstant({})).toBe(true);
    expect(execute).not.toHaveBeenCalled();
    const rendered = renderCommonBuffDefinitionsSource({
      buff: {
        id: 'buff',
        lifecycleSequences: { start: result.entry },
        actionGraph: { main: result.graph, macros: {} },
      },
    });
    expect(rendered.match(/"kind"\s*:\s*"switch"/g)).toHaveLength(2);
    expect(rendered).toMatch(/"options"\s*:/);
  });

  it.each([false, true])(
    'alwaysNext=%s 不得让尾条件消失；假条件的选中序列仍返回 false',
    alwaysNext => {
      const result = project([select([option(0, [count('missing')])], alwaysNext), read]);
      const selected = result.steps[0];
      if (selected?.kind !== 'switch') throw new Error('missing switch');
      const branch = readActionGraphChain(result.graph, selected.options[0]!.sequence);
      expect(branch.map(step => step.kind)).toEqual(['conditional']);
      const execute = vi.fn(() => true);
      const runtime = new CombatActionSequenceRuntime(
        { execute, evaluate: () => false },
        { blackboard: new ActionBlackboard({ choice: 0 }) },
      );
      expect(runtime.createSequence(result.compiled()).executeInstant({})).toBe(alwaysNext);
      expect(execute).toHaveBeenCalledTimes(alwaysNext ? 1 : 0);
    },
  );

  it('分支继承入口目标组，分支内写入不污染其他分支或外层', () => {
    const find = (key: string) => ({
      ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
      targetGroupKey: key,
      selectorData: {
        finderData: { $type: 'Example.Selector+CharacterTeamFinder+Data, Example' },
        validatorData: [{ $type: 'Example.Selector+MainCharacterValidator+Data, Example' }],
        postProcessorData: [],
      },
    });
    const result = project([
      find('shared'),
      select([
        option(0, [find('private'), count('shared'), count('private')]),
        option(1, [count('private')]),
      ]),
      count('private'),
      read,
    ]);
    const selected = result.steps.find(step => step.kind === 'switch');
    if (selected?.kind !== 'switch') throw new Error('missing switch');
    const branchContent = (index: number) =>
      JSON.stringify(readActionGraphChain(result.graph, selected.options[index]!.sequence));
    expect(branchContent(0)).not.toContain('contextTargetCountCompare');
    expect(branchContent(0)).toContain('actionValueCompare');
    expect(branchContent(1)).toContain('contextTargetCountCompare');
    expect(JSON.stringify(result.steps.at(-1))).toContain('contextTargetCountCompare');
  });

  it('结晶破坏形状：Owner+Source 实体冻屏使用命名曲线，忽略未启用内嵌曲线', () => {
    const dilation = {
      ...meta,
      $type: 'Beyond.Gameplay.Core.TimeDilationAction+Data, Gameplay.Beyond',
      layer: 'Entity',
      slot: { tagId: 1464849466 },
      timeDilationPriority: { tagId: -693798243 },
      duration: scalarFixture(0.1),
      useCurveKey: true,
      curveKey: 'interrupt_weakness',
      timeScaleCurve: [
        {
          time: 0,
          value: 9,
          inTangent: 0,
          outTangent: 0,
          inWeight: 0,
          outWeight: 0,
          weightedMode: 4,
        },
      ],
      finishByAction: false,
      ignoreTargets: [],
      effectTargets: [targetFixture('Owner'), targetFixture('Source')],
      useTimeScaleForSkillCdTick: false,
      influenceSkillCdTime: scalarFixture(0),
    };
    const context = {
      gameplayTagRegistry: fixtureGameplayTagRegistry,
      actionOwnerTarget: 'buffOwner',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'buffOwner',
      fixedBuffOwnerTarget: 'enemy',
    } as const;
    const result = project([select([option(0, [dilation])])], context);
    const selected = result.steps[0];
    if (selected?.kind !== 'switch') throw new Error('missing switch');
    const branch = readActionGraphChain(result.graph, selected.options[0]!.sequence);
    expect(branch[0]).toMatchObject({
      kind: 'startTimeDilation',
      parameters: {
        scope: 'entity',
        targets: ['enemy', 'caster'],
        curve: { kind: 'named', key: 'interrupt_weakness' },
        priority: 20,
      },
    });
    expect(() =>
      project([select([option(0, [dilation])])], { ...context, fixedBuffOwnerTarget: undefined }),
    ).toThrow('entity time-dilation');
    expect(() =>
      project([select([option(0, [{ ...dilation, useCurveKey: false, curveKey: '' }])])], context),
    ).toThrow('weightedMode');
  });

  it('未知字段、未支持子动作和分支角色守卫不能被 Switch 隐藏', () => {
    expect(() => project([{ ...select([]), guessed: true }])).toThrow('guessed');
    expect(() => project([select([{ ...option(0, []), guessed: true }])])).toThrow('guessed');
    expect(() =>
      project([select([option(0, [{ ...meta, $type: 'Example.UnknownAction+Data, Example' }])])]),
    ).toThrow();
    expect(() =>
      project([
        select([
          { ...option(0, []), actionData: { ...sequence([]), onlyExecuteWhenSourceIsGuard: true } },
        ]),
      ]),
    ).toThrow();
  });
});
