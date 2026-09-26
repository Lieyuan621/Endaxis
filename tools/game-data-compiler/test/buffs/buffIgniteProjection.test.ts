import { fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { parseKnownNativeActionLeafSource } from '../../src/source/actionLeaf.ts';
import { parseNativeSequenceSource } from '../../src/source/controlFlow.ts';
import { compileCombatActionSequenceSource } from '../../src/compiler/buffs/buffRuntimeProjection.ts';
import { targetFixture } from '../sourceFixtures.ts';
import { createActionGraphBuilder } from '../../src/compiler/actions/actionGraphBuilder.ts';
import { readActionGraphChain } from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../../src/compiler/actions/combatActionProjectionTypes.ts';
import { compileGraphSequence } from '../support/graphSequence.ts';
import { BuffOperationExecutor } from '../../../../src/core/combat/buffs/buffOperationExecutor';
import { CombatBuffContainer } from '../../../../src/core/combat/buffs/combatBuffs';
import { CombatAttributeSet } from '../../../../src/core/combat/attributes/combatAttributes';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../../../../src/core/combat/actions/actionBlackboard';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 0 };
const rawIgnite = () => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.IgniteAction+Data, Gameplay.Beyond',
  igniteSource: targetFixture('Source'),
  targetSettings: targetFixture('Owner'),
  igniteType: 'PhysicalStatus',
  successTargetContextKey: '',
});
const context = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'buffOwner',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'buffOwner',
} as const;
function project(
  actions: unknown[],
  projectionContext: Omit<
    Parameters<typeof compileCombatActionSequenceSource>[1],
    'graph'
  > = context,
) {
  const source = parseNativeSequenceSource(
    {
      actionData: actions,
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
    },
    'Buff.actions',
    {},
    (value, path) => parseKnownNativeActionLeafSource(value, path, {}),
  );
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(source, { ...projectionContext, graph: builder });
  const graph = builder.finish();
  return {
    entry,
    graph,
    steps: readActionGraphChain(graph, entry),
    compiled: () => compileGraphSequence(entry, graph),
  };
}

describe('公共 Buff 点燃投影', () => {
  it('保留点燃而只省略关卡统计通知；Owner/Target 都绑定当前 Buff 持有者', () => {
    const result = project([
      { ...meta, $type: 'Beyond.Gameplay.Core.OnPhysicalNoGuardStart+Data, Gameplay.Beyond' },
      { ...rawIgnite(), igniteSource: targetFixture('Target'), igniteType: 'NoGuard' },
    ]);
    expect(result.steps).toEqual([
      {
        kind: 'igniteBuffs',
        parameters: { target: 'buffOwner', source: 'buffOwner', igniteType: 'NoGuard' },
      },
    ]);
  });

  it('来源到正式运行时保留施法信息；没有匹配响应仍是成功动作', () => {
    const source = new CombatBuffContainer('caster', new CombatAttributeSet());
    const owner = new CombatBuffContainer('enemy', new CombatAttributeSet());
    const cast = {
      skillCastId: 31,
      originSkillId: 'battle',
      originSkillType: 'battleSkill' as const,
      nonReturnedSpCost: 0,
    };
    const calls: unknown[] = [];
    owner.add(
      {
        id: 'listener',
        stackingType: 'unique',
        actions: {
          ignite: (_buff, type, sourceId, skillCastInfo) => {
            calls.push({ type, sourceId, skillCastInfo });
            return false;
          },
        },
      },
      'other',
    );
    const executor = new BuffOperationExecutor({
      sourceId: 'caster',
      resolveTarget: () => source,
      resolveEventTarget: id => {
        expect(id).toBe('enemy');
        return owner;
      },
      delegate: {
        execute: () => {
          throw new Error('unexpected delegate');
        },
        evaluate: () => false,
      },
    });
    const runtime = new CombatActionSequenceRuntime(executor, {
      blackboard: new ActionBlackboard(),
      buffOwnerId: 'enemy',
      buffSourceId: 'caster',
      skillCastInfo: cast,
    });
    expect(runtime.createSequence(project([rawIgnite()]).compiled()).executeInstant({})).toBe(true);
    expect(calls).toEqual([{ type: 'PhysicalStatus', sourceId: 'caster', skillCastInfo: cast }]);
  });

  it('Target 复用当前动作输入目标，忽略不参与原生解析的序列化组名', () => {
    const result = project(
      [
        {
          ...rawIgnite(),
          targetSettings: targetFixture('Target', undefined, 'stale_targets'),
        },
      ],
      { ...context, actionTargetTarget: 'enemy' },
    );
    expect(result.steps).toEqual([
      {
        kind: 'igniteBuffs',
        parameters: { target: 'enemy', source: 'caster', igniteType: 'PhysicalStatus' },
      },
    ]);
  });

  it('未知字段和未支持的成功目标回写继续阻断', () => {
    expect(() => project([{ ...rawIgnite(), guessed: true }])).toThrow('guessed');
    expect(() => project([{ ...rawIgnite(), successTargetContextKey: 'success' }])).toThrow(
      'success target context',
    );
    expect(() =>
      project([{ ...rawIgnite(), targetSettings: targetFixture('Context', undefined, 'unknown') }]),
    ).toThrow('unsupported Ignite');
  });
});
