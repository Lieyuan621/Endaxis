import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it } from 'vitest';
import { createKillEvent } from './killEventTestFixture';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { EventContextConditionExecutor } from './eventContextConditionExecutor';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';

const terminal = {
  execute: () => true,
  evaluate: () => false,
};

describe('EventContextConditionExecutor', () => {
  it('checks the event transferred part and writes its target only after a match', () => {
    let matches = true;
    const inspected: RuntimeTargetRef[] = [];
    const executor = new EventContextConditionExecutor({
      execute: () => true,
      evaluate: (condition, context) => {
        expect(condition).toEqual({
          kind: 'entityTagMatch',
          target: 'actionInputTarget',
          tagQueryType: 'hasAny',
          tags: ['Soul'],
        });
        inspected.push(context!.actionInputTarget!);
        return matches;
      },
    });
    const condition = {
      kind: 'eventTransferredPartTagsMatch',
      tagQueryType: 'hasAny',
      tags: ['Soul'],
      saveToContextKey: 'part',
    } as const;
    const targetContext = new RuntimeTargetContext();
    const event = createKillEvent();
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
      partTransferInfo: {
        currentMainBodyId: 'enemy',
        mainBodyToPart: new Map([['enemy', 'ability-entity:99']]),
      },
      event: {
        ...event,
        payload: {
          ...event.payload,
          partTransferInfo: {
            currentMainBodyId: 'enemy',
            mainBodyToPart: new Map([['enemy', 'ability-entity:2']]),
          },
        },
      },
    };
    expect(executor.evaluate(condition, context)).toBe(true);
    expect(inspected).toEqual([{ kind: 'abilityEntity', instanceId: 2 }]);
    expect(targetContext.get('part')).toEqual(inspected);
    matches = false;
    targetContext.set('part', [{ kind: 'enemy' }]);
    expect(executor.evaluate(condition, context)).toBe(false);
    expect(targetContext.get('part')).toEqual([{ kind: 'enemy' }]);
    expect(executor.evaluate(condition, { ...context, event })).toBe(false);
    expect(executor.evaluate(condition, { ...context, event: undefined })).toBe(false);
    expect(inspected).toHaveLength(2);
  });
  it('结束原因只读取当前能力实体事件，不把其他事件当成普通结束', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = {
      kind: 'eventAbilityEntityFinishReasonIn',
      reasons: ['soulMainBodyDied'],
    } as const;
    for (const event of ['abilityEntityFinished', 'abilityEntitySelfFinished'] as const) {
      const context = {
        blackboard: new ActionBlackboard(),
        event: {
          event,
          payload: {
            sourceId: 'entity',
            targetId: 'entity',
            finishReason: 'soulMainBodyDied' as const,
          },
        },
      };
      expect(executor.evaluate(condition, context)).toBe(true);
      expect(executor.evaluate({ ...condition, reasons: ['lifetime'] }, context)).toBe(false);
    }
    expect(
      executor.evaluate(
        { ...condition, reasons: ['other'] },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(false);
  });
  it('战技子类型按被检查的技能查询，非战技跳过子类型筛选', () => {
    let subtype: 'normal' | 'additionalNormalSkill' | undefined = 'additionalNormalSkill';
    const reads: string[] = [];
    const executor = new EventContextConditionExecutor(
      terminal,
      undefined,
      undefined,
      undefined,
      () => 'battleSkill',
      undefined,
      target => {
        reads.push(target);
        return subtype;
      },
    );
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'skillEnd' as const,
        payload: {
          sourceId: 'owner',
          targetId: 'enemy',
          skillId: 'additional',
          skillCastId: 1,
          skillType: 'battleSkill' as const,
        },
      },
    };
    for (const condition of [
      { kind: 'eventSkillTypeIn' as const, skillTypes: ['battleSkill' as const] },
      {
        kind: 'currentSkillTypeIn' as const,
        target: 'buffOwner' as const,
        skillTypes: ['battleSkill' as const],
      },
      {
        kind: 'currentSkillTypeIn' as const,
        target: 'controlledOperator' as const,
        skillTypes: ['battleSkill' as const],
      },
    ]) {
      subtype = 'additionalNormalSkill';
      expect(
        executor.evaluate({ ...condition, normalSkillSubType: 'additionalNormalSkill' }, context),
      ).toBe(true);
      expect(executor.evaluate({ ...condition, normalSkillSubType: 'normal' }, context)).toBe(
        false,
      );
      subtype = 'normal';
      expect(
        executor.evaluate({ ...condition, normalSkillSubType: 'additionalNormalSkill' }, context),
      ).toBe(false);
      // 原生运行类型改为其他类型时，定义上的 AdditionalNormalSkill 不再参与筛选。
      subtype = undefined;
      expect(
        executor.evaluate({ ...condition, normalSkillSubType: 'additionalNormalSkill' }, context),
      ).toBe(true);
    }
    expect(new Set(reads)).toEqual(new Set(['event', 'buffOwner', 'controlledOperator']));
  });
  it('中断原因只读取当前事件载荷，切换技能与闪避分别判断', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = {
      kind: 'skillInterruptReasonIn' as const,
      reasons: ['castNextSkill'] as const,
    };
    const blackboard = new ActionBlackboard();
    expect(executor.evaluate(condition, { blackboard })).toBe(false);
    for (const reason of ['default', 'dash', 'castNextSkill'] as const) {
      expect(
        executor.evaluate(condition, {
          blackboard,
          event: {
            event: 'skillInterrupted',
            payload: {
              sourceId: 'operator',
              targetId: 'operator',
              skillId: 'attack',
              skillCastId: 1,
              reason,
            },
          },
        }),
      ).toBe(reason === 'castNextSkill');
    }
  });

  it('技能属性读取事件技能，再回退执行技能，不读取命中属性', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = { kind: 'skillDamageTypeIn' as const, damageTypes: ['heat'] as const };
    const context = {
      blackboard: new ActionBlackboard(),
      executingSkillElement: 'heat' as const,
    };
    expect(executor.evaluate(condition, context)).toBe(true);
    expect(executor.evaluate(condition, { blackboard: context.blackboard })).toBe(false);
    const event = {
      event: 'beforeCastSkill' as const,
      payload: {
        sourceId: 'operator',
        targetId: 'operator',
        skillId: 'other',
        skillCastId: 1,
        element: 'electric' as const,
      },
    };
    expect(executor.evaluate(condition, { ...context, event })).toBe(false);
    expect(() =>
      executor.evaluate(condition, {
        ...context,
        event: { ...event, payload: { ...event.payload, element: undefined } },
      }),
    ).toThrow('skill element check is not supported');
    expect(
      executor.evaluate(condition, {
        ...context,
        event: {
          ...event,
          payload: { ...event.payload, element: 'heat' },
        },
      }),
    ).toBe(true);
  });

  it('伤害 GameplayTag 为空时排除查询也失败，不把无标签解释为匹配', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const input = {
      side: 'attacker' as const,
      sourceId: 'a',
      targetId: 'enemy',
      skillCastId: null,
      damageType: 'physical' as const,
      tags: [],
      features: [],
      gameplayTags: [] as string[],
    };
    const context = {
      blackboard: new ActionBlackboard(),
      modifierContext: { kind: 'damage' as const, input },
    };
    const check = {
      kind: 'eventDamageGameplayTagsMatch' as const,
      match: 'exceptAny' as const,
      tags: ['Damage/Excluded'],
    };
    expect(executor.evaluate(check, context)).toBe(false);
    input.gameplayTags = ['Damage/Other'];
    expect(executor.evaluate(check, context)).toBe(true);
  });

  it('输入目标检查不要求事件回调，修正条件按当前输入目标判断', () => {
    const executor = new EventContextConditionExecutor(terminal, id => id === 'controlled');
    const context = {
      blackboard: new ActionBlackboard(),
      actionInputTarget: { kind: 'operator' as const, operatorId: 'controlled' },
      actionSourceId: 'caster',
    };
    expect(
      executor.evaluate(
        { kind: 'actionInputTargetIdentityMatch', other: 'controlledOperator', operator: 'equal' },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'actionInputTargetIdentityMatch', other: 'actionSource', operator: 'equal' },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['character'] },
        context,
      ),
    ).toBe(true);
  });

  it('伤害检查不能读取治疗修正上下文，也不能导致模拟失败', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      modifierContext: {
        kind: 'heal' as const,
        input: { side: 'healer' as const, healerId: 'a', receiverId: 'b', tags: ['heal'] },
      },
    };
    expect(
      executor.evaluate({ kind: 'eventDamageTypeIn', damageTypes: ['physical'] }, context),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalAttackLastCombo'] },
        context,
      ),
    ).toBe(false);
    expect(executor.evaluate({ kind: 'eventSkillCastMatchesBuffSource' }, context)).toBe(false);
    expect(
      executor.evaluate({ kind: 'eventHealTagsMatch', match: 'hasAny', tags: ['heal'] }, context),
    ).toBe(true);
  });

  it('物理异常事件按 Buff 的 affix 编号匹配，不能拿普通创建来源代替', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const cast = {
      skillCastId: 42,
      originSkillId: 'combo',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 0,
    };
    const context = {
      blackboard: new ActionBlackboard(),
      executingBuff: { buffId: 'listener', buffOwnerId: 'owner', buffInstanceId: 1 },
      skillCastInfo: { ...cast, skillCastId: 99 },
      event: {
        event: 'afterOutputPhysicalInfliction' as const,
        payload: {
          sourceId: 'owner',
          targetId: 'enemy',
          type: 'airborne' as const,
          skillCastInfo: cast,
        },
      },
    };
    const condition = { kind: 'eventSkillCastMatchesBuffSource' as const };
    expect(
      executor.evaluate(condition, { ...context, getCurrentBuffAffixSkillCastId: () => 42 }),
    ).toBe(true);
    expect(
      executor.evaluate(condition, { ...context, getCurrentBuffAffixSkillCastId: () => 99 }),
    ).toBe(false);
    expect(
      executor.evaluate(condition, {
        ...context,
        skillCastInfo: cast,
        getCurrentBuffAffixSkillCastId: () => 0,
      }),
    ).toBe(false);
    expect(() => executor.evaluate(condition, context)).toThrow('current Buff affix identity');
  });
  it('实体技能事件不能借来源分类参与玩家技能类型判断', () => {
    const executor = new EventContextConditionExecutor(terminal);
    expect(() =>
      executor.evaluate(
        { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
        {
          blackboard: new ActionBlackboard(),
          skillCastInfo: {
            skillCastId: 42,
            originSkillId: 'origin',
            originSkillType: 'comboSkill',
            nonReturnedSpCost: 0,
          },
          event: {
            event: 'skillEnd',
            payload: {
              sourceId: 'ability-entity:1',
              targetId: 'ability-entity:1',
              skillId: 'callback',
              skillCastId: 42,
            },
          },
        },
      ),
    ).toThrow('eventSkillTypeIn requires the current skill player type');
  });
  it.each(['abilityEntitySpawned', 'abilityEntityFinished'] as const)(
    '%s 来源条件读取控制器保存的来源，不回退宿主',
    event => {
      const executor = new EventContextConditionExecutor(terminal);
      const skillCastInfo = {
        skillCastId: 42,
        originSkillId: 'origin',
        originSkillType: 'comboSkill' as const,
        nonReturnedSpCost: 17,
      };
      const context = {
        blackboard: new ActionBlackboard(),
        skillCastInfo: { ...skillCastInfo, originSkillType: 'battleSkill' as const },
      };
      const condition = { kind: 'originSkillTypeIn' as const, skillTypes: ['comboSkill' as const] };
      for (const origin of [skillCastInfo, null, undefined]) {
        const payload = {
          finishReason: 'other' as const,
          sourceId: 'owner',
          targetId: 'entity',
          skillCastInfo: origin,
          entity: {
            instanceId: 1,
            onReset: () => {
              throw new Error('condition must not subscribe to reset');
            },
          },
        };
        const evaluate = () =>
          executor.evaluate(condition, {
            ...context,
            event: event === 'abilityEntitySpawned' ? { event, payload } : { event, payload },
          });
        if (origin === undefined)
          expect(evaluate).toThrow('requires an event source skill cast identity');
        else expect(evaluate()).toBe(origin !== null);
      }
    },
  );
  it('同步伤害条件读取临时包，不借环境中残留的 AbilitySystem 事件', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'outputDamage' as const,
        payload: {
          ...createKillEvent().payload,
          sourceId: 'old',
          targetId: 'old',
          damageType: 'heat' as const,
          tags: ['ultimateSkill'] as const,
          features: [],
        },
      },
      modifierContext: {
        kind: 'damage' as const,
        input: {
          side: 'attacker' as const,
          sourceId: 'operator',
          targetId: 'enemy',
          skillCastId: 42,
          damageType: 'physical' as const,
          tags: ['normalSkill'] as const,
          gameplayTags: ['Damage/TyphoeaSkill/FloatingHit_Weak'] as const,
          features: ['dot'] as const,
        },
      },
    };
    expect(
      executor.evaluate({ kind: 'eventDamageTypeIn', damageTypes: ['physical'] }, context),
    ).toBe(true);
    expect(executor.evaluate({ kind: 'eventDamageTypeIn', damageTypes: ['heat'] }, context)).toBe(
      false,
    );
    expect(
      executor.evaluate(
        { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['ultimateSkill'] },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'eventDamageFeaturesMatch', match: 'hasAll', features: ['dot'] },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'eventDamageGameplayTagsMatch',
          match: 'hasAny',
          tags: ['Damage/TyphoeaSkill/FloatingHit_Weak'],
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalSkill'] },
        context,
      ),
    ).toBe(true);
  });

  it('按公共 Action Context 查询 InputTarget 的对象类型与主控身份', () => {
    const executor = new EventContextConditionExecutor(
      terminal,
      operatorId => operatorId === 'controlled',
    );
    const context = {
      blackboard: new ActionBlackboard(),
      actionInputTarget: { kind: 'operator' as const, operatorId: 'controlled' },
      actionSourceId: 'listener',
      actionOwnerId: 'listener',
      event: {
        event: 'takeDamage' as const,
        payload: {
          ...createKillEvent().payload,
          sourceId: 'controlled',
          targetId: 'listener',
          tags: [] as const,
          features: [] as const,
        },
      },
    };
    expect(
      executor.evaluate(
        { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['character'] },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'actionInputTargetIdentityMatch',
          other: 'controlledOperator',
          operator: 'equal',
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'actionInputTargetIdentityMatch',
          other: 'actionSource',
          operator: 'equal',
        },
        context,
      ),
    ).toBe(false);
  });

  it('输入目标与来源、宿主比较保留实体身份，位置不等于敌人', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const targets: readonly [RuntimeTargetRef, string | undefined][] = [
      [{ kind: 'operator', operatorId: 'caster' }, 'caster'],
      [{ kind: 'enemy' }, 'enemy'],
      [{ kind: 'godEntity' }, 'god-entity'],
      [{ kind: 'abilityEntity', instanceId: 7 }, 'ability-entity:7'],
      [{ kind: 'spatialPoint', pointId: 1 }, undefined],
    ];
    for (const [actionInputTarget, identity] of targets) {
      for (const other of ['actionSource', 'actionOwner'] as const) {
        for (const entityId of ['caster', 'enemy', 'god-entity', 'ability-entity:7']) {
          const context = {
            blackboard: new ActionBlackboard(),
            actionInputTarget,
            actionSourceId: entityId,
            actionOwnerId: entityId,
          };
          expect(
            executor.evaluate(
              { kind: 'actionInputTargetIdentityMatch', other, operator: 'equal' },
              context,
            ),
          ).toBe(identity === entityId);
          expect(
            executor.evaluate(
              { kind: 'actionInputTargetIdentityMatch', other, operator: 'notEqual' },
              context,
            ),
          ).toBe(identity !== entityId);
        }
      }
    }
  });

  it('matches a custom ability event name exactly', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'customAbilityEvent' as const,
        payload: {
          sourceId: 'liino',
          targetId: 'liino',
          eventName: 'liino_comboskill_end',
          eventParam: 0,
        },
      },
    };
    expect(
      executor.evaluate(
        { kind: 'eventCustomAbilityNameMatch', eventName: 'liino_comboskill_end' },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'eventCustomAbilityNameMatch', eventName: 'Liino_ComboSkill_End' },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'eventCustomAbilityNameMatch', eventName: 'wrong', outputKey: 'saved' },
        context,
      ),
    ).toBe(false);
    expect(context.blackboard.getNumber('saved')).toBeUndefined();
    const published = { ...context.event, payload: { ...context.event.payload, eventParam: 2.5 } };
    expect(() =>
      executor.evaluate(
        {
          kind: 'eventCustomAbilityNameMatch',
          eventName: 'liino_comboskill_end',
          outputKey: 'saved',
        },
        { ...context, event: published },
      ),
    ).toThrow("action blackboard value 'saved' is missing");
    context.blackboard.assign({ saved: Number.NaN });
    expect(
      executor.evaluate(
        {
          kind: 'eventCustomAbilityNameMatch',
          eventName: 'liino_comboskill_end',
          outputKey: 'saved',
        },
        { ...context, event: published },
      ),
    ).toBe(true);
    expect(context.blackboard.getNumber('saved')).toBe(2.5);
  });

  it('queries the current AbilitySystem skill without requiring an event payload', () => {
    const terminal: CombatOperationExecutor = {
      execute: () => false,
      evaluate: () => false,
    };
    const executor = new EventContextConditionExecutor(
      terminal,
      undefined,
      undefined,
      undefined,
      (target, context) =>
        target === 'buffOwner' && context?.buffOwnerId === 'liino' ? 'battleSkill' : undefined,
    );

    expect(
      executor.evaluate(
        {
          kind: 'currentSkillTypeIn',
          target: 'buffOwner',
          skillTypes: ['battleSkill'],
        },
        { blackboard: new ActionBlackboard(), buffOwnerId: 'liino' },
      ),
    ).toBe(true);
  });

  it('比较新 Buff 施加者与监听 Buff 来源，不比较接收敌人与施加者', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      buffSourceId: 'holder',
      buffOwnerId: 'enemy',
      event: {
        event: 'addedBuff' as const,
        payload: {
          sourceId: 'holder',
          targetId: 'enemy',
          buffId: 'freeze',
          buffTags: [],
        },
      },
    };
    expect(executor.evaluate({ kind: 'eventSourceMatchesBuffSource' }, context)).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'eventSourceMatchesBuffSource' },
        {
          ...context,
          event: { ...context.event, payload: { ...context.event.payload, sourceId: 'teammate' } },
        },
      ),
    ).toBe(false);
    expect(() =>
      executor.evaluate(
        { kind: 'eventSourceMatchesBuffSource' },
        { ...context, buffSourceId: undefined },
      ),
    ).toThrow('Buff source');
  });
  it('matches the event origin, never the listening Buff origin or damage tags', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      skillCastInfo: {
        skillCastId: 3,
        originSkillId: 'weapon-source',
        originSkillType: 'battleSkill' as const,
        nonReturnedSpCost: 0,
      },
      eventSkillCastInfo: {
        skillCastId: 4,
        originSkillId: 'current-combo',
        originSkillType: 'comboSkill' as const,
        nonReturnedSpCost: 0,
      },
      event: {
        event: 'beforeOutputDamage' as const,
        payload: {
          ...createKillEvent().payload,
          skillCastInfo: {
            skillCastId: 4,
            originSkillId: 'current-combo',
            originSkillType: 'comboSkill' as const,
            nonReturnedSpCost: 0,
          },
          sourceId: 'operator',
          targetId: 'enemy',
          tags: ['normalSkill'] as const,
          features: [],
        },
      },
    };

    expect(
      executor.evaluate({ kind: 'originSkillTypeIn', skillTypes: ['battleSkill'] }, context),
    ).toBe(false);
    expect(
      executor.evaluate({ kind: 'originSkillTypeIn', skillTypes: ['comboSkill'] }, context),
    ).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'originSkillTypeIn', skillTypes: ['comboSkill'] },
        {
          ...context,
          event: { ...context.event, payload: { ...context.event.payload, skillCastInfo: null } },
        },
      ),
    ).toBe(false);
    expect(() =>
      executor.evaluate(
        { kind: 'originSkillTypeIn', skillTypes: ['comboSkill'] },
        {
          ...context,
          event: {
            ...context.event,
            payload: { ...context.event.payload, skillCastInfo: undefined },
          },
        },
      ),
    ).toThrow('requires an event source skill cast identity');
    expect(
      executor.evaluate(
        { kind: 'originSkillTypeIn', skillTypes: ['comboSkill'] },
        {
          ...context,
          event: { ...context.event, event: 'takeDamage' },
        },
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'originSkillTypeIn', skillTypes: ['comboSkill'] },
        {
          ...context,
          event: {
            event: 'beforeCastSkill',
            payload: {
              sourceId: 'operator',
              targetId: 'enemy',
              skillId: 'current-combo',
              skillType: 'comboSkill',
              skillCastId: 4,
            },
          },
        },
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'originSkillTypeIn', skillTypes: ['battleSkill'] },
        {
          blackboard: context.blackboard,
          skillCastInfo: context.skillCastInfo,
        },
      ),
    ).toBe(false);
  });

  it('matches the physical-infliction type carried by a source output event', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'beforeOutputPhysicalInfliction' as const,
        payload: {
          sourceId: 'operator',
          targetId: 'enemy',
          type: 'fracture' as const,
        },
      },
    };

    expect(
      executor.evaluate(
        { kind: 'eventPhysicalInflictionTypeIn', types: ['fracture', 'crush'] },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate({ kind: 'eventPhysicalInflictionTypeIn', types: ['knockDown'] }, context),
    ).toBe(false);
  });

  it('物理异常类型匹配后按原生枚举值写入动作黑板', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const blackboard = new ActionBlackboard({ physicalType: -1 });
    const context = {
      blackboard,
      event: {
        event: 'afterTakePhysicalInfliction' as const,
        payload: {
          sourceId: 'operator',
          targetId: 'enemy',
          type: 'fracture' as const,
        },
      },
    };
    expect(
      executor.evaluate(
        {
          kind: 'eventPhysicalInflictionTypeIn',
          types: ['fracture'],
          outputKey: 'physicalType',
        },
        context,
      ),
    ).toBe(true);
    expect(blackboard.getNumber('physicalType')).toBe(2);
    expect(
      executor.evaluate(
        {
          kind: 'eventPhysicalInflictionTypeIn',
          types: ['knockDown'],
          outputKey: 'physicalType',
        },
        context,
      ),
    ).toBe(false);
    expect(blackboard.getNumber('physicalType')).toBe(2);
  });

  it.each([
    ['Fire', false, -1],
    ['Pulse', false, -1],
    ['Cryst', true, 2],
    ['Natural', true, 3],
    ['unknown', false, -1],
  ] as const)(
    '爆发 %s 复用原生附着 Context 的元素条件和 savedKey',
    (burstType, expected, value) => {
      const executor = new EventContextConditionExecutor(terminal);
      const blackboard = new ActionBlackboard({ saved: -1 });
      const event = {
        event: 'beforeOutputSpellBurst' as const,
        payload: { sourceId: 'source', targetId: 'enemy', burstType },
      };
      const condition = {
        kind: 'eventInflictionElementIn' as const,
        elements: ['cryo', 'nature'] as const,
        outputKey: 'saved',
      };
      expect(executor.evaluate(condition, { blackboard, event })).toBe(expected);
      expect(blackboard.getNumber('saved')).toBe(value);
      if (expected)
        expect(() =>
          executor.evaluate(condition, { blackboard: new ActionBlackboard(), event }),
        ).toThrow('saved');
      else
        expect(executor.evaluate(condition, { blackboard: new ActionBlackboard(), event })).toBe(
          false,
        );
    },
  );

  it('matches only the requested element on an enemy infliction event', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = {
      kind: 'eventInflictionElementIn',
      elements: ['cryo', 'nature'],
    } as const;
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'beforeTakeInfliction' as const,
        payload: {
          skillId: 'skill',
          isExtra: false,
          sourceId: 'fluorite',
          targetId: 'enemy',
          element: 'nature' as const,
        },
      },
    };

    expect(executor.evaluate(condition, context)).toBe(true);
    expect(
      executor.evaluate(condition, {
        ...context,
        event: {
          ...context.event,
          payload: { ...context.event.payload, element: 'electric' as const },
        },
      }),
    ).toBe(false);
  });

  it('matches an explicitly typed external operator hit and rejects an unspecified type', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = { kind: 'eventDamageTypeIn', damageTypes: ['heat'] } as const;

    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        event: {
          event: 'takeDamage',
          payload: {
            external: true,
            sourceId: 'enemy',
            targetId: 'operator',
            damageType: 'heat',
            tags: [],
            features: [],
          },
        },
      }),
    ).toBe(true);
    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        event: {
          event: 'takeDamage',
          payload: {
            external: true,
            sourceId: 'enemy',
            targetId: 'operator',
            tags: [],
            features: [],
          },
        },
      }),
    ).toBe(false);
  });
  it('resolves SourceFinder through the Buff-source AbilityEntity provenance', () => {
    const executor = new EventContextConditionExecutor(terminal, undefined, entityId =>
      entityId === 'ability-entity:7' ? 'ability-entity:8' : 'pogranichnik',
    );
    const condition = { kind: 'eventSourceMatchesBuffSourceEntitySource' } as const;
    const context = {
      blackboard: new ActionBlackboard(),
      buffSourceId: 'ability-entity:7',
      event: {
        event: 'beforeTakePhysicalInfliction' as const,
        payload: {
          sourceId: 'ability-entity:8',
          targetId: 'ability-entity:7',
        },
      },
    };

    expect(executor.evaluate(condition, context)).toBe(true);
    expect(
      executor.evaluate(condition, {
        ...context,
        event: {
          ...context.event,
          payload: { ...context.event.payload, sourceId: 'pogranichnik' },
        },
      }),
    ).toBe(false);
  });

  it('matches the Buff identity carried by an application event', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'addedBuff' as const,
        payload: {
          targetId: 'operator',
          buffId: 'buff:matched',
          sourceId: 'enemy',
          buffTags: ['Test/Tag101', 'Test/Tag202'],
        },
      },
    };

    expect(
      executor.evaluate({ kind: 'eventBuffIdMatch', buffIds: ['buff:matched'] }, context),
    ).toBe(true);
    expect(executor.evaluate({ kind: 'eventBuffIdMatch', buffIds: ['buff:other'] }, context)).toBe(
      false,
    );
    expect(
      executor.evaluate(
        { kind: 'eventBuffTagsMatch', match: 'hasAny', buffTags: ['Test/Tag202'] },
        context,
      ),
    ).toBe(true);
  });

  it('matches an applied Buff child tag through the versioned GameplayTag hierarchy', () => {
    const parentPath = 'Skill/Character/Common/PhysicalStatus';
    const childPath = `${parentPath}/FractureStatus`;
    const registry = new GameplayTagRegistry([parentPath, childPath]);
    const executor = new EventContextConditionExecutor(
      terminal,
      undefined,
      undefined,
      (_targetId, ownedTags, requiredTags, match) => registry.query(ownedTags, requiredTags, match),
    );

    expect(
      executor.evaluate(
        {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [parentPath],
        },
        {
          blackboard: new ActionBlackboard(),
          event: {
            event: 'addedBuff' as const,
            payload: {
              targetId: 'enemy',
              sourceId: 'operator',
              buffId: 'buff_physical_do_fracture',
              buffTags: [childPath],
            },
          },
        },
      ),
    ).toBe(true);
  });

  it.each([
    ['ignite', true],
    ['early', true],
    ['absorbed', false],
    ['other', false],
  ] as const)('classifies finished Buff reason %s', (reason, expected) => {
    const executor = new EventContextConditionExecutor(terminal);
    expect(
      executor.evaluate(
        { kind: 'eventBuffEndedEarly' },
        {
          blackboard: new ActionBlackboard(),
          event: {
            event: 'finishedBuff' as const,
            payload: {
              buff: createEventBuff(),
              targetId: 'enemy',
              buffId: 'seal',
              sourceId: 'operator',
              buffTags: [],
              reason,
            },
          },
        },
      ),
    ).toBe(expected);
  });

  it('uses the same Buff-tag condition for applied and finished Ability events', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = {
      kind: 'eventBuffTagsMatch',
      match: 'hasAny',
      buffTags: ['Skill/Character/Common/SpellStatus'],
    } as const;
    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        event: {
          event: 'finishedBuff' as const,
          payload: {
            buff: createEventBuff(),
            sourceId: 'enemy',
            targetId: 'enemy',
            buffId: 'spell-status',
            buffTags: ['Skill/Character/Common/SpellStatus'],
            reason: 'early',
          },
        },
      }),
    ).toBe(true);
  });

  it.each([
    ['exact', ['comboSkill'], true],
    ['exact', ['comboSkill', 'powerAttack'], false],
    ['hasAny', ['normalSkill', 'comboSkill'], true],
    ['hasAll', ['comboSkill', 'powerAttack'], false],
    ['exceptAny', ['normalSkill'], true],
    ['exceptAll', ['comboSkill', 'powerAttack'], true],
  ] as const)('evaluates %s against damage tags', (match, tags, expected) => {
    const executor = new EventContextConditionExecutor(terminal);
    expect(
      executor.evaluate(
        { kind: 'eventDamageTagsMatch', match, tags },
        {
          blackboard: new ActionBlackboard(),
          event: createKillEvent(),
        },
      ),
    ).toBe(expected);
  });

  it('rejects use outside an event response and returns false for unrelated events', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const condition = {
      kind: 'eventDamageTagsMatch',
      match: 'hasAny',
      tags: ['comboSkill'],
    } as const;
    expect(() => executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toThrow(
      'requires a combat event context',
    );
    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        event: {
          event: 'skillSpGained',
          payload: {
            sourceId: 'operator',
            source: 'skill',
            gainKind: 'gain',
            requestedAmount: 1,
            amount: 1,
          },
        },
      }),
    ).toBe(false);
  });

  it('evaluates damage features independently from skill tags', () => {
    const executor = new EventContextConditionExecutor(terminal);
    expect(
      executor.evaluate(
        {
          kind: 'eventDamageFeaturesMatch',
          match: 'hasAll',
          features: ['airborne', 'canBreakWeakness'],
        },
        {
          blackboard: new ActionBlackboard(),
          event: {
            event: 'takeDamage',
            payload: {
              external: true,
              sourceId: 'enemy',
              targetId: 'operator',
              tags: ['ultimateSkill'],
              features: ['airborne', 'canBreakWeakness'],
            },
          },
        },
      ),
    ).toBe(true);
  });

  it('matches heal tags and writes native overheal outputs before returning', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const blackboard = new ActionBlackboard();
    const context = {
      blackboard,
      event: {
        event: 'receiveHeal' as const,
        payload: {
          sourceId: 'operator:healer',
          targetId: 'operator:receiver',
          requestedHealing: 216,
          actualHealing: 0,
          overhealing: 216,
          tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
        },
      },
    };

    expect(
      executor.evaluate(
        {
          kind: 'eventHealTagsMatch',
          match: 'hasAny',
          tags: ['Skill/Character/Common/Heal/NormalSkillHeal', 'Test/Tag1'],
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'eventOverheal',
          overHealKey: 'over',
          finalHealKey: 'final',
          realHealKey: 'real',
        },
        context,
      ),
    ).toBe(true);
    expect(blackboard.snapshot()).toMatchObject({ over: 216, final: 216, real: 0 });
    blackboard.assign({ over: 0, final: 1, real: 1 });
    const smallHeal = {
      ...context,
      event: {
        ...context.event,
        payload: {
          ...context.event.payload,
          requestedHealing: 1.000001,
          actualHealing: 1,
          overhealing: 0.000001,
        },
      },
    };
    expect(
      executor.evaluate(
        { kind: 'eventOverheal', overHealKey: 'over', finalHealKey: 'final', realHealKey: 'real' },
        smallHeal,
      ),
    ).toBe(false);
    expect(blackboard.getNumber('over')).toBe(Math.fround(1.000001 - 1));
    expect(blackboard.getNumber('final')).toBe(Math.fround(1.000001));
    expect(
      executor.evaluate(
        {
          kind: 'eventOverheal',
          overHealKey: 'shared',
          finalHealKey: 'shared',
          realHealKey: 'shared',
        },
        smallHeal,
      ),
    ).toBe(false);
    expect(blackboard.getNumber('shared')).toBe(1);
  });

  it('matches consumed Buff tags and writes the event Buff identity', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const blackboard = new ActionBlackboard({ buffid: '' });
    expect(
      executor.evaluate(
        {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/SpellStatus/Conduct',
            'Skill/Character/Common/SpellStatus/Corrupt',
          ],
          buffIdOutputKey: 'buffid',
        },
        {
          blackboard,
          event: {
            event: 'buffConsumed' as const,
            payload: {
              buff: createEventBuff(),
              sourceId: 'operator',
              targetId: 'enemy',
              buffId: 'buff:conduct',
              layers: 3,
              buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
              blackboardValues: { count: 3 },
            },
          },
        },
      ),
    ).toBe(true);
    expect(blackboard.getString('buffid')).toBe('buff:conduct');
  });

  it('按 OnObtainAtb 的来源和获得方式筛选技力事件，并允许未勾选维度作为通配符', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'skillSpGained' as const,
        payload: {
          sourceId: 'operator',
          source: 'skill' as const,
          gainKind: 'gain' as const,
          requestedAmount: 10,
          amount: 10,
        },
      },
    };

    expect(
      executor.evaluate(
        { kind: 'eventSpGainMatch', sources: ['skill'], gainKinds: ['gain'] },
        context,
      ),
    ).toBe(true);
    expect(executor.evaluate({ kind: 'eventSpGainMatch', gainKinds: ['refund'] }, context)).toBe(
      false,
    );
    expect(executor.evaluate({ kind: 'eventSpGainMatch' }, context)).toBe(true);
  });

  it('compares the consumed layer snapshot and writes the configured output key', () => {
    const executor = new EventContextConditionExecutor(terminal);
    const blackboard = new ActionBlackboard({ count: 0 });
    const context = {
      blackboard,
      event: {
        event: 'buffConsumed' as const,
        payload: {
          buff: createEventBuff(),
          buffTags: [],
          sourceId: 'operator',
          targetId: 'enemy',
          buffId: 'buff:test',
          layers: 3,
        },
      },
    };

    expect(
      executor.evaluate(
        {
          kind: 'eventConsumedBuffLayerCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          outputKey: 'count',
        },
        context,
      ),
    ).toBe(true);
    expect(blackboard.getNumber('count')).toBe(3);
    const condition = {
      kind: 'eventConsumedBuffLayerCompare',
      operator: 'greaterOrEqual',
      value: numberInput({ kind: 'blackboard', key: 'count' }),
      outputKey: 'count',
    } as const;
    blackboard.assign({ count: 4 });
    expect(executor.evaluate(condition, context)).toBe(false);
    expect(blackboard.getNumber('count')).toBe(4);
    blackboard.assign({ count: 2 });
    expect(executor.evaluate(condition, context)).toBe(true);
    expect(blackboard.getNumber('count')).toBe(3);
    blackboard.assign({ count: Number.NaN });
    expect(
      executor.evaluate({ ...condition, value: { kind: 'constant', value: 1 } }, context),
    ).toBe(true);
    expect(blackboard.getNumber('count')).toBe(3);
    expect(() =>
      executor.evaluate(
        { ...condition, value: { kind: 'constant', value: 1 }, outputKey: 'missing' },
        context,
      ),
    ).toThrow('missing');
    expect(
      executor.evaluate(
        { ...condition, value: { kind: 'constant', value: 4 }, outputKey: 'missing' },
        context,
      ),
    ).toBe(false);
  });

  it.each(['buffEnhanceChanged', 'buffAbsorbedFrameEnd', 'buffConsumedFrameEnd'] as const)(
    '%s compares signed layer changes and only writes after a match',
    eventName => {
      const executor = new EventContextConditionExecutor(terminal);
      const blackboard = new ActionBlackboard({ count: 7 });
      const context = {
        blackboard,
        event: {
          event: eventName,
          payload: {
            buff: createEventBuff(),
            buffTags: [],
            sourceId: 'operator',
            targetId: 'enemy',
            buffId: 'buff:test',
            layerCount: -2,
          },
        },
      };
      const condition = {
        kind: 'eventBuffEnhanceLayerCompare' as const,
        operator: 'greaterOrEqual' as const,
        value: { kind: 'constant' as const, value: 1 },
        outputKey: 'count',
      };
      expect(executor.evaluate(condition, context)).toBe(false);
      expect(blackboard.getNumber('count')).toBe(7);
      expect(executor.evaluate({ ...condition, operator: 'less' }, context)).toBe(true);
      expect(blackboard.getNumber('count')).toBe(-2);
      expect(
        executor.evaluate({ ...condition, kind: 'eventConsumedBuffLayerCompare' }, context),
      ).toBe(false);
    },
  );
});
import { createEventBuff } from './buffEventTestFixture';
