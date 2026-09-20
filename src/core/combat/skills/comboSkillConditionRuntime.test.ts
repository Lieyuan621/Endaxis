import { describe, expect, it, vi } from 'vitest';
import {
  ComboSkillConditionRuntime,
  type ComboConditionRegistration,
  type PendingComboCondition,
} from './comboSkillConditionRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { ActionBlackboardOperationExecutor } from '../actions/actionBlackboardOperationExecutor';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import {
  ELEMENTAL_INFLICTION_EVENTS,
  type ElementalInflictionEvent,
} from '../infliction/elementalInflictionOperationExecutor';
import type { CombatOperationContext } from './skillRuntime';
import { compileActionSequence } from '../../compiler/compileSkill';
import type { ActionSequenceDefinition } from '../../game-data/operatorDefinition';
import { validateSkillDefinition } from '../../game-data/validateSkillDefinition';
import { parseComboSkillConditionsSource } from '../../../../tools/game-data-compiler/src/source/comboSkillConditions.ts';
import { compilePendingComboConditionSource } from '../../../../tools/game-data-compiler/src/compiler/conditions/comboSkillConditions.ts';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';

function event(
  event: ElementalInflictionEvent = 'beforeTakeInfliction',
  element: 'heat' | 'electric' | 'cryo' | 'nature' = 'electric',
) {
  return {
    event,
    payload: {
      sourceId: 'ally',
      targetId: 'enemy',
      skillId: 'skill',
      element,
      isExtra: false,
      skillCastInfo: null,
    },
  };
}
function physicalEvent() {
  return {
    event: 'afterTakePhysicalInfliction' as const,
    payload: {
      sourceId: 'ally',
      targetId: 'enemy',
      type: 'knockDown' as const,
      isExtra: false,
      fromAirborne: false as const,
      skillCastInfo: {
        skillCastId: 7,
        originSkillId: 'battleSkill',
        originSkillType: 'battleSkill' as const,
        nonReturnedSpCost: 0,
      },
    },
  };
}
function addedBuffEvent() {
  return {
    event: 'addedBuff' as const,
    payload: {
      sourceId: 'ally',
      targetId: 'enemy',
      buffId: 'buff.spell-burst',
      buffTags: ['Skill/Character/Common/SpellBurst'],
    },
  };
}
function takeDamageEvent() {
  return {
    event: 'takeDamage' as const,
    payload: {
      sourceId: 'ally',
      targetId: 'enemy',
      damageType: 'cryo' as const,
      tags: ['cryoBurst'] as const,
      features: [] as const,
      result: {
        value: 1,
        isCritical: false,
        criticalMultiplier: 1,
        defenseMultiplier: 1,
        resistanceMultiplier: 1,
        weaknessShelterMultiplier: 1,
        runtimeExtensionMultiplier: 1,
        igniteMultiplier: 1,
        physicalInflictionMultiplier: 1,
      },
    },
  };
}
function beforeOutputDamageEvent() {
  return {
    event: 'beforeOutputDamage' as const,
    payload: {
      ...takeDamageEvent().payload,
      targetId: 'enemy',
      sourceId: 'ally',
    },
  };
}
const operations = new ActionBlackboardOperationExecutor(
  new EventContextConditionExecutor({
    execute: () => {
      throw new Error('unexpected operation');
    },
    evaluate: () => {
      throw new Error('unexpected condition');
    },
  }),
);
function options(overrides: Partial<ComboConditionRegistration> = {}): ComboConditionRegistration {
  return {
    event: 'beforeTakeInfliction',
    ownerId: 'owner',
    sourceId: 'source',
    sequence: { steps: [] },
    entityBlackboard: new ActionBlackboard(),
    initialValues: {},
    operations,
    isOwnerAlive: () => true,
    isOwnerSilenced: () => false,
    currentComboCooldown: () => ({ oneReady: true, maxPassedTime: 0, startCdFrame: 30 }),
    resolveTarget: id => {
      if (id === 'enemy') return { kind: 'enemy' };
      if (id === 'ally') return { kind: 'operator', operatorId: id };
      throw new Error(`unknown target '${id}'`);
    },
    onPending: () => {},
    ...overrides,
  };
}
function compileElementCondition(mask: number, savedKey = '') {
  const source = parseComboSkillConditionsSource(
    [
      {
        comboSkillEvent: 121,
        comboSkillConditionImmediately: false,
        comboSkillCheckAction: {
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
          actionData: [
            {
              $type:
                'Beyond.Gameplay.Core.Conditions.CheckSpellInflictionType+Data, Gameplay.Beyond',
              isEnable: true,
              priorityLevel: 'Default',
              priorityOffset: 0,
              serverActionIndex: 1013,
              mask,
              savedKey,
            },
          ],
        },
      },
    ],
    'character.combo.conditions',
    {},
  )[0]!;
  const projected = compilePendingComboConditionSource(source, {
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'eventTarget',
  }).sequence;
  expect(
    validateSkillDefinition({
      key: 'combo',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: projected }],
    }),
  ).toEqual([]);
  return compileActionSequence(projected as ActionSequenceDefinition, 1);
}

describe('原生连携条件注册环境', () => {
  it('无目标事件保留空 trigger，并以发布者作为 InputTarget', () => {
    const runtime = new ComboSkillConditionRuntime();
    const pending = vi.fn();
    runtime.registerPendingCondition(
      options({
        event: 'weaknessSet',
        sequence: { steps: [] },
        resolveTarget: id => {
          if (id === 'enemy') return { kind: 'enemy' };
          throw new Error(`unknown target '${id}'`);
        },
        onPending: pending,
      }),
    );

    runtime.onAbilityEvent({
      event: 'weaknessSet',
      payload: { sourceId: 'enemy' },
    });

    expect(pending).toHaveBeenCalledWith(
      expect.objectContaining({
        inputTarget: { kind: 'enemy' },
        triggerTarget: null,
      }),
    );
  });

  it('输出伤害事件同时向条件树提供 InputTarget 与 trigger 命名组', () => {
    const runtime = new ComboSkillConditionRuntime();
    const pending = vi.fn();
    const targetOperations = new TargetContextOperationExecutor(
      'owner',
      new EventContextConditionExecutor(
        {
          execute: () => false,
          evaluate: () => false,
        },
        id => id === 'ally',
      ),
      id => id,
      {
        listOperatorIds: () => ['ally'],
        isOperatorControlled: id => id === 'ally',
        resolveVitals: () => {
          throw new Error('identity-only condition must not query vitals');
        },
      },
    );
    runtime.registerPendingCondition(
      options({
        event: 'beforeOutputDamage',
        operations: targetOperations,
        sequence: compileActionSequence(
          {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'actionInputTargetObjectTypeMatch',
                    objectTypes: ['enemy'],
                  },
                },
                whenTrue: {
                  steps: [
                    {
                      kind: 'conditional',
                      parameters: {
                        condition: {
                          kind: 'contextTargetIdentityMatch',
                          contextKey: 'trigger',
                          other: 'controlledOperator',
                          operator: 'equal',
                        },
                      },
                      whenTrue: { steps: [] },
                    },
                  ],
                },
              },
            ],
          },
          1,
        ),
        onPending: pending,
      }),
    );

    runtime.onAbilityEvent(beforeOutputDamageEvent());

    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        inputTarget: { kind: 'enemy' },
        triggerTarget: { kind: 'operator', operatorId: 'ally' },
      }),
    );
  });

  it.each(ELEMENTAL_INFLICTION_EVENTS)('%s 保留物理来源，并独立绑定 InputTarget/trigger', type => {
    const runtime = new ComboSkillConditionRuntime();
    const pending = vi.fn();
    let context: CombatOperationContext | undefined;
    runtime.registerPendingCondition(
      options({
        event: type,
        onPending: pending,
        sequence: compileElementCondition(15),
        operations: {
          ...operations,
          execute: (step, ctx) => operations.execute(step, ctx),
          evaluate: (condition, ctx) => {
            context = ctx;
            return operations.evaluate(condition, ctx);
          },
        },
      }),
    );
    const published = event(type);
    runtime.onAbilityEvent(published);
    const output = type.includes('Output');
    const inputTarget = output ? { kind: 'enemy' } : { kind: 'operator', operatorId: 'ally' };
    const triggerTarget = output ? { kind: 'operator', operatorId: 'ally' } : { kind: 'enemy' };
    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ inputTarget, triggerTarget }),
    );
    expect(context).toMatchObject({
      actionOwnerId: 'owner',
      actionSourceId: 'source',
      actionInputTarget: inputTarget,
      event: { event: type, payload: { sourceId: 'ally', targetId: 'enemy' } },
      eventSkillCastInfo: null,
    });
    expect(context?.event).toBe(published);
    expect(context?.targetContext?.getOptional('trigger')).toBeUndefined();
  });

  it.each([0, 1, 2, 4, 8, 15])('纯尾条件 mask=%s 的真假结果不会被删成无条件 Pending', mask => {
    const runtime = new ComboSkillConditionRuntime();
    const pending = vi.fn();
    runtime.registerPendingCondition(
      options({ sequence: compileElementCondition(mask), onPending: pending }),
    );
    for (const element of ['heat', 'electric', 'cryo', 'nature'] as const)
      runtime.onAbilityEvent(event(undefined, element));
    expect(pending).toHaveBeenCalledTimes(mask === 0 ? 0 : mask === 15 ? 4 : 1);
  });

  it('afterTakePhysicalInfliction 使用同一 Pending 环境并保留事件来源技能', () => {
    const runtime = new ComboSkillConditionRuntime();
    const pending = vi.fn();
    runtime.registerPendingCondition(
      options({
        event: 'afterTakePhysicalInfliction',
        sequence: compileActionSequence(
          {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'eventPhysicalInflictionTypeIn',
                    types: ['knockDown'],
                    outputKey: 'physicalType',
                  },
                },
                whenTrue: { steps: [] },
              },
            ],
          },
          1,
        ),
        initialValues: { physicalType: -1 },
        onPending: pending,
      }),
    );
    runtime.onAbilityEvent(physicalEvent());
    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        inputTarget: { kind: 'operator', operatorId: 'ally' },
        triggerTarget: { kind: 'enemy' },
        assignPairs: { physicalType: 1 },
        event: expect.objectContaining({
          payload: expect.objectContaining({ skillCastInfo: expect.any(Object) }),
        }),
      }),
    );
  });

  it.each([
    {
      name: 'OnAddedBuff',
      event: addedBuffEvent(),
      condition: {
        kind: 'eventBuffTagsMatch' as const,
        match: 'hasAny' as const,
        buffTags: ['Skill/Character/Common/SpellBurst'],
      },
    },
    {
      name: 'OnTakeDamage',
      event: takeDamageEvent(),
      condition: {
        kind: 'eventDamageTagsMatch' as const,
        match: 'hasAny' as const,
        tags: ['cryoBurst'] as const,
      },
    },
  ])('$name 与普通事件响应共用条件上下文投影', ({ event, condition }) => {
    const runtime = new ComboSkillConditionRuntime();
    const pending = vi.fn();
    runtime.registerPendingCondition(
      options({
        event: event.event,
        sequence: compileActionSequence(
          {
            steps: [
              {
                kind: 'conditional',
                parameters: { condition },
                whenTrue: { steps: [] },
              },
            ],
          },
          1,
        ),
        onPending: pending,
      }),
    );

    runtime.onAbilityEvent(event);

    expect(pending).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        inputTarget: { kind: 'operator', operatorId: 'ally' },
        triggerTarget: { kind: 'enemy' },
      }),
    );
  });

  it('每条注册独享 direct 板，连续事件保持写入，Pending 快照不随之后写入改变', () => {
    const runtime = new ComboSkillConditionRuntime();
    const entity = new ActionBlackboard({ EntityBB_value: 99 });
    const snapshots: PendingComboCondition[] = [];
    const directBoards = new Set<ActionBlackboard>();
    for (const initial of [0, 10])
      runtime.registerPendingCondition(
        options({
          entityBlackboard: entity,
          initialValues: { value: initial, label: 'local' },
          sequence: compileActionSequence(
            {
              steps: [
                {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'value',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
              ],
            },
            1,
          ),
          operations: {
            execute: (step, ctx) => {
              directBoards.add(ctx!.blackboard);
              expect(ctx!.blackboard.getNumber('EntityBB_value')).toBe(99);
              return operations.execute(step, ctx);
            },
            evaluate: (cond, ctx) => operations.evaluate(cond, ctx),
          },
          onPending: p => snapshots.push(p),
        }),
      );
    runtime.onAbilityEvent(event());
    runtime.onAbilityEvent(event());
    expect(directBoards.size).toBe(2);
    expect(snapshots.map(p => p.assignPairs)).toEqual([
      { value: 1, label: 'local' },
      { value: 11, label: 'local' },
      { value: 2, label: 'local' },
      { value: 12, label: 'local' },
    ]);
    expect(Object.isFrozen(snapshots[0]!.assignPairs)).toBe(true);
  });

  it('启用空板与禁用板不同；实体写入共享但不复制进 Pending', () => {
    const runtime = new ComboSkillConditionRuntime();
    const entity = new ActionBlackboard({ EntityBB_type: 0 });
    const pending: PendingComboCondition[] = [];
    for (const initialValues of [null, {}])
      runtime.registerPendingCondition(
        options({
          entityBlackboard: entity,
          initialValues,
          sequence: compileElementCondition(15, 'EntityBB_type'),
          onPending: p => pending.push(p),
        }),
      );
    runtime.onAbilityEvent(event(undefined, 'nature'));
    expect(entity.snapshot()).toEqual({ EntityBB_type: 3 });
    expect(pending.map(p => p.assignPairs)).toEqual([null, {}]);
  });

  it.each(['disabled', 'dead', 'silenced', 'cooldown'] as const)(
    '%s 门禁先于任何条件副作用',
    gate => {
      const runtime = new ComboSkillConditionRuntime();
      runtime.disableTriggerComboSkill = gate === 'disabled';
      const cooldown = vi.fn(() => ({ oneReady: false, maxPassedTime: 1, startCdFrame: 30 }));
      const pending = vi.fn();
      const entity = new ActionBlackboard({ EntityBB_type: 0 });
      runtime.registerPendingCondition(
        options({
          entityBlackboard: entity,
          isOwnerAlive: () => gate !== 'dead',
          isOwnerSilenced: () => gate === 'silenced',
          currentComboCooldown: cooldown,
          sequence: compileElementCondition(15, 'EntityBB_type'),
          onPending: pending,
        }),
      );
      runtime.onAbilityEvent(event());
      expect(entity.getNumber('EntityBB_type')).toBe(0);
      expect(pending).not.toHaveBeenCalled();
      expect(cooldown).toHaveBeenCalledTimes(gate === 'cooldown' ? 1 : 0);
    },
  );

  it.each([
    [false, 0.5, 1],
    [false, 1, 0],
    [false, 1.5, 0],
    [true, 1.5, 1],
  ] as const)(
    '冷却 gate oneReady=%s passed=%s → %s，并每次读取当前槽位',
    (oneReady, maxPassedTime, count) => {
      const runtime = new ComboSkillConditionRuntime();
      const pending = vi.fn();
      let cooldown: { oneReady: boolean; maxPassedTime: number; startCdFrame: number } = {
        oneReady,
        maxPassedTime,
        startCdFrame: 30,
      };
      runtime.registerPendingCondition(
        options({ currentComboCooldown: () => cooldown, onPending: pending }),
      );
      runtime.onAbilityEvent(event());
      expect(pending).toHaveBeenCalledTimes(count);
      cooldown = { oneReady: true, maxPassedTime: 3, startCdFrame: 0 };
      runtime.onAbilityEvent(event());
      expect(pending).toHaveBeenCalledTimes(count + 1);
    },
  );

  it('缺计时器严格失败；未匹配事件不求值；dispose 幂等且不影响其他注册', () => {
    const runtime = new ComboSkillConditionRuntime();
    const handle = runtime.registerPendingCondition(options({ currentComboCooldown: () => null }));
    expect(() => runtime.onAbilityEvent(event('afterTakeInfliction'))).not.toThrow();
    expect(() => runtime.onAbilityEvent(event())).toThrow('current ComboSkill cooldown');
    const pending = vi.fn();
    runtime.registerPendingCondition(options({ onPending: pending }));
    handle.dispose();
    handle.dispose();
    runtime.onAbilityEvent(event());
    expect(pending).toHaveBeenCalledTimes(1);
  });

  it('异常移除临时 trigger，但保留同一条件的其他组与黑板，后续检查可继续', () => {
    const runtime = new ComboSkillConditionRuntime();
    let first = true;
    let context: CombatOperationContext | undefined;
    const pending = vi.fn();
    runtime.registerPendingCondition(
      options({
        sequence: compileElementCondition(15),
        onPending: pending,
        operations: {
          execute: () => true,
          evaluate: (_condition, ctx) => {
            context = ctx;
            expect(ctx!.targetContext!.get('trigger')).toEqual([{ kind: 'enemy' }]);
            if (first) {
              first = false;
              ctx!.targetContext!.setSingle('saved', { kind: 'enemy' });
              ctx!.blackboard.assignDynamic('value', 7);
              throw new Error('condition failed');
            }
            expect(ctx!.targetContext!.get('saved')).toEqual([{ kind: 'enemy' }]);
            expect(ctx!.blackboard.getNumber('value')).toBe(7);
            return true;
          },
        },
      }),
    );
    expect(() => runtime.onAbilityEvent(event())).toThrow('condition failed');
    expect(context!.targetContext!.getOptional('trigger')).toBeUndefined();
    runtime.onAbilityEvent(event());
    expect(pending).toHaveBeenCalledTimes(1);
  });
});
