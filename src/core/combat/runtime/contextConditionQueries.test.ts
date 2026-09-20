import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { BuffOperationExecutor } from '../buffs/buffOperationExecutor';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';

const terminal = {
  execute: () => false,
  evaluate: () => {
    throw new Error('unsupported');
  },
};
describe('Context 条件查询', () => {
  it('以同一命名 Context 比较 trigger 与主控、ActionSource 身份', () => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
      actionSourceId: 'source',
    };
    context.targetContext.setSingle('trigger', { kind: 'operator', operatorId: 'source' });
    const executor = new TargetContextOperationExecutor('owner', terminal, id => id, {
      listOperatorIds: () => ['source'],
      isOperatorControlled: id => id === 'source',
      resolveVitals: () => {
        throw new Error('identity queries must not read vitals');
      },
    });
    expect(
      executor.evaluate(
        {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'controlledOperator',
          operator: 'equal',
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'contextTargetIdentityMatch',
          contextKey: 'trigger',
          other: 'actionSource',
          operator: 'equal',
        },
        context,
      ),
    ).toBe(true);
  });

  it('从命名 Context 首目标查询实体标签', () => {
    const tag = 'Character/Enemy/Boss';
    const buffs = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet(),
      new GameplayTagRegistry([tag]),
    );
    buffs.addEntityTags([tag]);
    const executor = new BuffOperationExecutor({
      sourceId: 'owner',
      resolveTarget: () => buffs,
      resolveEventTarget: () => buffs,
      delegate: terminal,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    context.targetContext.setSingle('trigger', { kind: 'enemy' });
    expect(
      executor.evaluate(
        {
          kind: 'contextTargetEntityTagMatch',
          contextKey: 'trigger',
          tagQueryType: 'hasAny',
          tags: [tag],
        },
        context,
      ),
    ).toBe(true);
  });

  it.each([
    [['enemy'], { kind: 'enemy' }, true],
    [['enemy'], { kind: 'operator', operatorId: 'ally' }, false],
    [['character'], { kind: 'operator', operatorId: 'ally' }, true],
    [['abilityEntity'], { kind: 'abilityEntity', instanceId: 1 }, true],
    [[], { kind: 'enemy' }, false],
    ['all', { kind: 'enemy' }, true],
  ] as const)('mask=%s 查询 %j → %s', (mask, target, expected) => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    context.targetContext.setSingle('trigger', target as RuntimeTargetRef);
    expect(
      new TargetContextOperationExecutor(
        'owner',
        terminal,
        undefined,
        undefined,
        undefined,
        () => 'abilityEntity',
      ).evaluate(
        { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: mask },
        context,
      ),
    ).toBe(expected);
  });
  it('对象类型检查是任一对象匹配；缺失/空组不凭木桩假设补敌人', () => {
    const executor = new TargetContextOperationExecutor('owner', terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const condition = {
      kind: 'contextTargetObjectTypeMatch' as const,
      contextKey: 'trigger',
      objectTypes: ['enemy'] as const,
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    context.targetContext.set('trigger', []);
    expect(executor.evaluate(condition, context)).toBe(false);
    context.targetContext.set('trigger', [
      { kind: 'operator', operatorId: 'ally' },
      { kind: 'enemy' },
    ]);
    expect(executor.evaluate(condition, context)).toBe(true);
  });
  it('ByTag 只读取首目标增强层数；空组不求值缺失阈值，非空组严格读取黑板', () => {
    const path = 'test/tag';
    const tag = path;
    const buffs = new CombatBuffContainer(
      'ally',
      new CombatAttributeSet(),
      new GameplayTagRegistry([path]),
    );
    for (let i = 0; i < 3; i++)
      buffs.add({ id: 'buff', stackingType: 'enhance', applyTags: [tag] }, 'owner');
    const resolve = vi.fn((id: string) => {
      expect(id).toBe('ally');
      return buffs;
    });
    const executor = new BuffOperationExecutor({
      sourceId: 'owner',
      resolveTarget: () => buffs,
      resolveEventTarget: resolve,
      delegate: terminal,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const condition = {
      kind: 'contextTargetBuffStackCompare' as const,
      contextKey: 'trigger',
      tagQueryType: 'hasAny' as const,
      buffTags: [tag],
      operator: 'equal' as const,
      value: { kind: 'blackboard' as const, key: 'threshold' },
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    expect(resolve).not.toHaveBeenCalled();
    context.targetContext.set('trigger', [
      { kind: 'operator', operatorId: 'ally' },
      { kind: 'enemy' },
    ]);
    expect(() => executor.evaluate(condition, context)).toThrow('threshold');
    context.blackboard.assign({ threshold: 3 });
    expect(executor.evaluate(condition, context)).toBe(true);
    context.blackboard.assign({ threshold: 1 });
    expect(executor.evaluate(condition, context)).toBe(false);
    buffs.finishByIds(['buff'], 'other');
    context.blackboard.assign({ threshold: 0 });
    expect(executor.evaluate(condition, context)).toBe(true);
  });
  it('Advanced(Id) 复用同一 Buff 容器并按 ID 汇总首目标增强层数', () => {
    const buffs = new CombatBuffContainer(
      'ally',
      new CombatAttributeSet(),
      new GameplayTagRegistry([]),
    );
    buffs.add({ id: 'buff-a', stackingType: 'enhance', applyTags: [] }, 'owner');
    buffs.add({ id: 'buff-a', stackingType: 'enhance', applyTags: [] }, 'owner');
    buffs.add({ id: 'buff-b', stackingType: 'enhance', applyTags: [] }, 'owner');
    const executor = new BuffOperationExecutor({
      sourceId: 'owner',
      resolveTarget: () => buffs,
      resolveEventTarget: id => {
        expect(id).toBe('ally');
        return buffs;
      },
      delegate: terminal,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    const condition = {
      kind: 'contextTargetBuffIdStackCompare' as const,
      contextKey: 'trigger',
      buffIds: ['buff-a'],
      operator: 'equal' as const,
      value: { kind: 'constant' as const, value: 2 },
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    context.targetContext.setSingle('trigger', { kind: 'operator', operatorId: 'ally' });
    expect(executor.evaluate(condition, context)).toBe(true);
    expect(
      executor.evaluate(
        { ...condition, buffIds: ['buff-a', 'buff-b'], value: { kind: 'constant', value: 3 } },
        context,
      ),
    ).toBe(true);
  });
  it.each([16, '16', ['64'], ['unknown'], null])('正式定义拒绝非法 mask %j', objectTypes => {
    expect(
      validateSkillDefinition({
        key: 'test',
        timelineBlockFrames: 1,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'conditional',
                  parameters: {
                    condition: {
                      kind: 'contextTargetObjectTypeMatch',
                      contextKey: 'trigger',
                      objectTypes,
                    },
                  },
                  whenTrue: { steps: [] },
                },
              ],
            },
          },
        ],
      }),
    ).not.toEqual([]);
  });
});
