import type {
  GameplayTag,
  GameplayTagMatchType,
} from '../../../../packages/game-data-contract/src/gameplayTags';
import type { CombatObjectType } from '../../../../packages/game-data-contract/src/primitives';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import {
  runtimeTargetEntityId,
  runtimeTargetFromEntityId,
} from '../../game-data/logicalAbilityEntity';
import type { DamageType, SkillType, SkillDefinition } from '../../game-data/operatorDefinition';
import { matchesCombatObjectType, resolveCombatObjectType } from '../abilities/combatObjectType';
import { readRequiredActionNumber } from '../actions/actionBlackboard';
import {
  abilityEventSkillCastInfo,
  abilityEventSourceId,
  buffAbilityEvent,
  buffApplicationEvent,
  characterInflictionAbilityEvent,
  customAbilityEvent,
  damageAbilityEvent,
  healAbilityEvent,
  inflictionAbilityEvent,
  physicalAbilityEvent,
  skillAbilityEvent,
  spellBurstAbilityEvent,
  spGainAbilityEvent,
} from './combatAbilityEvent';
/**
 * 求值依赖当前事件负载的条件。
 *
 * 该执行器只读取当前调用的事件或伤害、治疗、失衡修正临时上下文，不持有事件实例。
 * 技能临时监听器、常驻监听器与同步伤害条件共用；普通技能步骤误用事件条件时会明确失败。
 */
import type { DamageFeature, DamageTag } from '../../game-data/operatorDefinition';
import { compareCombatNumbers } from '../../math/combatNumbers.ts';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { NATIVE_ELEMENT_VALUES, spellBurstElement } from '../infliction/elementalInfliction';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { GameplayTagQueryType } from '../tags/gameplayTags';

export class EventContextConditionExecutor implements CombatOperationExecutor {
  constructor(
    readonly delegate: CombatOperationExecutor,
    readonly isOperatorControlled?: (operatorId: string) => boolean,
    /** SourceFinder 只读取一层 AbilitySystem.source，不追溯到最终干员。 */
    readonly findEntitySourceId?: (entityId: string) => string | undefined,
    readonly matchBuffTags?: (
      targetId: string,
      ownedTags: readonly GameplayTag[],
      requiredTags: readonly GameplayTag[],
      match: GameplayTagQueryType,
    ) => boolean,
    readonly resolveCurrentSkillType?: (
      target: 'caster' | 'buffOwner' | 'controlledOperator',
      context?: CombatOperationContext,
    ) => SkillType | undefined,
    readonly resolveAbilityEntityObjectType?: (instanceId: number) => CombatObjectType,
    /** 按当前技能身份读取定义子类型；非原生战技返回 undefined，不增加事件载荷。 */
    readonly resolveNormalSkillSubType?: (
      target: 'caster' | 'buffOwner' | 'controlledOperator' | 'event',
      context?: CombatOperationContext,
    ) => SkillDefinition['normalSkillSubType'],
  ) {}

  #matchesNormalSkillSubType(
    expected: SkillDefinition['normalSkillSubType'],
    target: 'caster' | 'buffOwner' | 'controlledOperator' | 'event',
    context?: CombatOperationContext,
  ): boolean {
    if (expected === undefined) return true;
    if (this.resolveNormalSkillSubType === undefined)
      throw new Error('normal skill subtype check requires an AbilitySystem resolver');
    const actual = this.resolveNormalSkillSubType(target, context);
    return actual === undefined || actual === expected;
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.delegate.execute(step)
      : this.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'eventTransferredPartTagsMatch') {
      const payload = context?.event?.payload;
      const transfer =
        payload && 'partTransferInfo' in payload ? payload.partTransferInfo : undefined;
      if (transfer === undefined) return false;
      const partId = transfer.mainBodyToPart.get(transfer.currentMainBodyId);
      if (partId === undefined) return false;
      const part = runtimeTargetFromEntityId(partId);
      const matched = this.delegate.evaluate(
        {
          kind: 'entityTagMatch',
          target: 'actionInputTarget',
          tagQueryType: condition.tagQueryType,
          tags: condition.tags,
        },
        { ...context!, actionInputTarget: part },
      );
      if (matched && condition.saveToContextKey !== undefined) {
        if (context?.targetContext === undefined)
          throw new Error('transferred part output requires a target context');
        context.targetContext.set(condition.saveToContextKey, [part]);
      }
      return matched;
    }
    if (condition.kind === 'skillInterruptReasonIn') {
      const event = context?.event === undefined ? undefined : skillAbilityEvent(context.event);
      return (
        event?.event === 'skillInterrupted' && condition.reasons.includes(event.payload.reason)
      );
    }
    if (condition.kind === 'skillDamageTypeIn') {
      const eventSkill =
        context?.event === undefined ? undefined : skillAbilityEvent(context.event);
      const element =
        eventSkill === undefined ? context?.executingSkillElement : eventSkill.payload.element;
      if (
        element === undefined &&
        (eventSkill !== undefined || context?.skillCastInfo !== undefined)
      )
        throw new Error('skill element check is not supported for this skill');
      return element !== undefined && condition.damageTypes.includes(element);
    }
    const modifierContext = context?.modifierContext;
    const modifier = modifierContext?.kind === 'damage' ? modifierContext.input : undefined;
    if (modifier !== undefined) {
      if (condition.kind === 'eventSkillCastMatchesBuffSource') {
        const getAffix =
          modifierContext?.kind === 'damage' ? modifierContext.getBuffAffixSkillCastId : undefined;
        if (getAffix === undefined) {
          throw new Error(
            'damage modifier skill-cast check requires an explicit Buff affix skill cast identity',
          );
        }
        const expected = getAffix();
        if (
          expected !== null &&
          (!Number.isSafeInteger(expected) || expected < 0 || expected > 0xffffffff)
        ) {
          throw new Error('Buff affix skill cast identity must be a UInt32 or null');
        }
        return expected !== null && expected > 0 && expected === modifier.skillCastId;
      }
      if (
        condition.kind === 'eventDamageTypeIn' ||
        condition.kind === 'eventDamageTagsMatch' ||
        condition.kind === 'eventDamageGameplayTagsMatch' ||
        condition.kind === 'eventDamageFeaturesMatch'
      ) {
        return matchDamageCondition(condition, modifier);
      }
    }
    if (modifierContext?.kind === 'heal' && condition.kind === 'eventHealTagsMatch') {
      return matchValues(modifierContext.input.tags, condition.tags, condition.match);
    }
    if (modifierContext?.kind === 'poise') {
      if (condition.kind === 'eventDamageTagsMatch')
        return matchValues(modifierContext.input.tags, condition.tags, condition.match);
      if (condition.kind === 'eventDamageFeaturesMatch')
        return matchValues(modifierContext.input.features, condition.features, condition.match);
    }
    // 原生检查遇到其他修正上下文时返回 false，不读取外层事件或中止模拟。
    if (
      modifierContext !== undefined &&
      (condition.kind === 'eventDamageTypeIn' ||
        condition.kind === 'eventDamageTagsMatch' ||
        condition.kind === 'eventDamageFeaturesMatch' ||
        condition.kind === 'eventDamageGameplayTagsMatch' ||
        condition.kind === 'eventHealTagsMatch' ||
        condition.kind === 'eventSkillCastMatchesBuffSource')
    )
      return false;
    if (
      condition.kind !== 'eventDamageTagsMatch' &&
      condition.kind !== 'eventDamageGameplayTagsMatch' &&
      condition.kind !== 'eventDamageFeaturesMatch' &&
      condition.kind !== 'eventDamageTypeIn' &&
      condition.kind !== 'eventInflictionElementIn' &&
      condition.kind !== 'eventPhysicalInflictionTypeIn' &&
      condition.kind !== 'eventCustomAbilityNameMatch' &&
      condition.kind !== 'currentSkillTypeIn' &&
      condition.kind !== 'eventSkillTypeIn' &&
      condition.kind !== 'originSkillTypeIn' &&
      condition.kind !== 'eventAbilityEntityFinishReasonIn' &&
      condition.kind !== 'eventSkillIdIn' &&
      condition.kind !== 'eventSkillCastMatchesBuffSource' &&
      condition.kind !== 'eventBuffIdMatch' &&
      condition.kind !== 'eventBuffEndedEarly' &&
      condition.kind !== 'eventBuffTagsMatch' &&
      condition.kind !== 'eventHealTagsMatch' &&
      condition.kind !== 'eventSpGainMatch' &&
      condition.kind !== 'eventConsumedBuffLayerCompare' &&
      condition.kind !== 'eventBuffEnhanceLayerCompare' &&
      condition.kind !== 'eventOverheal' &&
      condition.kind !== 'eventSourceMatchesBuffSource' &&
      condition.kind !== 'eventSourceMatchesBuffSourceEntitySource' &&
      condition.kind !== 'actionInputTargetObjectTypeMatch' &&
      condition.kind !== 'actionInputTargetIdentityMatch' &&
      condition.kind !== 'eventProjectilePerfectDodgeCooldownEquals' &&
      condition.kind !== 'eventProjectileIgnoreImmuneLevelCompare'
    ) {
      return context === undefined
        ? this.delegate.evaluate(condition)
        : this.delegate.evaluate(condition, context);
    }
    if (condition.kind === 'eventAbilityEntityFinishReasonIn') {
      const event = context?.event;
      return (
        event !== undefined &&
        'event' in event &&
        (event.event === 'abilityEntityFinished' || event.event === 'abilityEntitySelfFinished') &&
        condition.reasons.includes(event.payload.finishReason)
      );
    }
    if (condition.kind === 'currentSkillTypeIn') {
      if (this.resolveCurrentSkillType === undefined) {
        throw new Error('currentSkillTypeIn requires an AbilitySystem resolver');
      }
      const skillType = this.resolveCurrentSkillType(condition.target, context);
      return (
        skillType !== undefined &&
        condition.skillTypes.includes(skillType) &&
        this.#matchesNormalSkillSubType(condition.normalSkillSubType, condition.target, context)
      );
    }
    if (condition.kind === 'originSkillTypeIn') {
      const event = context?.event;
      // 按当前事件类型取来源；不回退到条件宿主。
      const carriesOrigin =
        event !== undefined &&
        (('payload' in event &&
          (event.event === 'abilityEntitySpawned' ||
            event.event === 'abilityEntityFinished' ||
            event.event === 'abilityEntitySelfFinished' ||
            buffAbilityEvent(event) !== undefined)) ||
          physicalAbilityEvent(event) !== undefined ||
          inflictionAbilityEvent(event) !== undefined ||
          spellBurstAbilityEvent(event) !== undefined ||
          (damageAbilityEvent(event) !== undefined &&
            'event' in event &&
            (event.event === 'beforeDamageAction' ||
              event.event === 'beforeOutputDamage' ||
              event.event === 'outputDamage' ||
              event.event === 'outputCriticalDamage')));
      if (!carriesOrigin) return false;
      const skillCastInfo =
        context?.event !== undefined && 'payload' in context.event
          ? abilityEventSkillCastInfo(context.event)
          : context?.eventSkillCastInfo;
      if (skillCastInfo === undefined) {
        throw new Error('originSkillTypeIn requires an event source skill cast identity');
      }
      if (skillCastInfo === null) return false;
      return (
        skillCastInfo.originSkillType !== undefined &&
        condition.skillTypes.includes(skillCastInfo.originSkillType)
      );
    }
    if (condition.kind === 'actionInputTargetObjectTypeMatch') {
      const target = context?.actionInputTarget;
      if (context === undefined || target === undefined) {
        throw new Error('actionInputTargetObjectTypeMatch requires an action InputTarget');
      }
      if (target.kind === 'spatialPoint') return false;
      return matchesCombatObjectType(
        condition.objectTypes,
        resolveCombatObjectType(target, this.resolveAbilityEntityObjectType),
      );
    }
    if (condition.kind === 'actionInputTargetIdentityMatch') {
      const target = context?.actionInputTarget;
      if (context === undefined || target === undefined) {
        throw new Error('actionInputTargetIdentityMatch requires an action InputTarget');
      }
      const targetId = runtimeTargetEntityId(target);
      const matches =
        condition.other === 'controlledOperator'
          ? (() => {
              if (target.kind !== 'operator') return false;
              if (this.isOperatorControlled === undefined) {
                throw new Error('actionInputTargetIdentityMatch requires control state');
              }
              return this.isOperatorControlled(target.operatorId);
            })()
          : condition.other === 'actionSource'
            ? context.actionSourceId !== undefined && targetId === context.actionSourceId
            : context.actionOwnerId !== undefined && targetId === context.actionOwnerId;
      return condition.operator === 'equal' ? matches : !matches;
    }
    if (context?.event === undefined) {
      throw new Error(`${condition.kind} requires a combat event context`);
    }
    if (condition.kind === 'eventProjectilePerfectDodgeCooldownEquals') {
      return (
        'event' in context.event &&
        context.event.event === 'beforeHitByProjectile' &&
        context.event.payload.isInPerfectDodgeCooldown === condition.value
      );
    }
    if (condition.kind === 'eventProjectileIgnoreImmuneLevelCompare') {
      return (
        'event' in context.event &&
        context.event.event === 'beforeHitByProjectile' &&
        compareCombatNumbers(
          context.event.payload.ignoreImmuneLevel,
          condition.value,
          condition.operator,
        )
      );
    }
    const damage = damageAbilityEvent(context.event);
    if (condition.kind === 'eventSourceMatchesBuffSource') {
      if (context.buffSourceId === undefined) {
        throw new Error('eventSourceMatchesBuffSource requires a Buff source identity');
      }
      if ('payload' in context.event && buffApplicationEvent(context.event) !== undefined)
        return abilityEventSourceId(context.event) === context.buffSourceId;
      if (damage !== undefined) return damage.payload.sourceId === context.buffSourceId;
      return physicalAbilityEvent(context.event)?.payload.sourceId === context.buffSourceId;
    }
    if (condition.kind === 'eventSourceMatchesBuffSourceEntitySource') {
      if (context.buffSourceId === undefined) {
        throw new Error('eventSourceMatchesBuffSourceEntitySource requires a Buff source identity');
      }
      if (this.findEntitySourceId === undefined) {
        throw new Error('eventSourceMatchesBuffSourceEntitySource requires entity provenance');
      }
      const source = this.findEntitySourceId(context.buffSourceId);
      if (source === undefined) throw new Error('SourceFinder requires an entity identity');
      if (damage !== undefined) return damage.payload.sourceId === source;
      return physicalAbilityEvent(context.event)?.payload.sourceId === source;
    }
    if (condition.kind === 'eventSkillTypeIn') {
      const skill = skillAbilityEvent(context.event);
      if (skill === undefined) return false;
      if (skill.payload.skillType === undefined) {
        throw new Error('eventSkillTypeIn requires the current skill player type');
      }
      return (
        condition.skillTypes.includes(skill.payload.skillType) &&
        this.#matchesNormalSkillSubType(condition.normalSkillSubType, 'event', context)
      );
    }
    if (condition.kind === 'eventCustomAbilityNameMatch') {
      const custom = customAbilityEvent(context.event);
      if (custom === undefined || custom.payload.eventName !== condition.eventName) {
        return false;
      }
      if (condition.outputKey !== undefined && condition.outputKey !== '') {
        const old = Math.fround(readRequiredActionNumber(context.blackboard, condition.outputKey));
        const value = Math.fround(custom.payload.eventParam);
        if (!(Math.abs(Math.fround(old - value)) <= Math.fround(0.00001))) {
          context.blackboard.assignDynamicUnconditionally(condition.outputKey, value);
          context.refreshCurrentBuffAttributeModifiers?.();
        }
      }
      return true;
    }
    if (condition.kind === 'eventInflictionElementIn') {
      const event = context.event;
      const burst = spellBurstAbilityEvent(event);
      const element =
        inflictionAbilityEvent(event)?.payload.element ??
        characterInflictionAbilityEvent(event)?.payload.element ??
        (burst === undefined ? undefined : spellBurstElement(burst.payload.burstType));
      if (element === undefined || !condition.elements.includes(element)) return false;
      if (condition.outputKey !== undefined && condition.outputKey !== '') {
        // CheckSpellInflictionType 先严格 GetFloat，再比较 float32 epsilon，最后 AssignDynamic。
        // 不能直接写入：缺声明、direct 遮蔽 entity 及相等时不写都属于可观察语义。
        const old = Math.fround(readRequiredActionNumber(context.blackboard, condition.outputKey));
        const value = NATIVE_ELEMENT_VALUES[element];
        if (!(Math.abs(Math.fround(old - value)) <= Math.fround(0.00001))) {
          context.blackboard.assignDynamicUnconditionally(condition.outputKey, value);
          context.refreshCurrentBuffAttributeModifiers?.();
        }
      }
      return true;
    }
    if (condition.kind === 'eventPhysicalInflictionTypeIn') {
      const type = physicalAbilityEvent(context.event)?.payload.type;
      const matched = type !== undefined && condition.types.includes(type);
      if (matched && condition.outputKey !== undefined) {
        const values = { airborne: 0, knockDown: 1, fracture: 2, crush: 3 } as const;
        const old = Math.fround(readRequiredActionNumber(context.blackboard, condition.outputKey));
        const value = values[type];
        if (!(Math.abs(Math.fround(old - value)) <= Math.fround(0.00001))) {
          context.blackboard.assignDynamicUnconditionally(condition.outputKey, value);
          context.refreshCurrentBuffAttributeModifiers?.();
        }
      }
      return matched;
    }
    if (condition.kind === 'eventSkillIdIn') {
      const skill = skillAbilityEvent(context.event);
      return skill !== undefined && condition.skillIds.includes(skill.payload.skillId);
    }
    if (condition.kind === 'eventSkillCastMatchesBuffSource') {
      // 原生 CheckSkillCastId：Buff 读取 affix 编号，0 直接失败，不回退普通创建来源。
      // 技能动作环境仍读取自身施放编号。
      const isBuff = context.executingBuff !== undefined;
      if (isBuff && context.getCurrentBuffAffixSkillCastId === undefined)
        throw new Error('skill-cast check requires the current Buff affix identity');
      const expected = isBuff
        ? context.getCurrentBuffAffixSkillCastId!()
        : context.skillCastInfo?.skillCastId;
      return (
        expected !== undefined &&
        (!isBuff || expected !== 0) &&
        ('payload' in context.event
          ? abilityEventSkillCastInfo(context.event)
          : context.eventSkillCastInfo
        )?.skillCastId === expected
      );
    }
    if (condition.kind === 'eventBuffIdMatch') {
      const event = eventBuffData(context.event);
      const matched = event !== undefined && condition.buffIds.includes(event.buffId);
      if (matched && condition.buffIdOutputKey !== undefined) {
        context.blackboard.assign({ [condition.buffIdOutputKey]: event.buffId });
      }
      return matched;
    }
    if (condition.kind === 'eventBuffEndedEarly') {
      return (
        'payload' in context.event &&
        (context.event.event === 'finishedBuff' || context.event.event === 'buffEndsEarly') &&
        (context.event.payload.reason === 'ignite' || context.event.payload.reason === 'early')
      );
    }
    if (condition.kind === 'eventBuffTagsMatch') {
      const event = eventBuffData(context.event);
      if (event === undefined) return false;
      const matched =
        this.matchBuffTags === undefined
          ? matchValues(event.buffTags ?? [], condition.buffTags, condition.match)
          : this.matchBuffTags(
              'targetId' in event ? event.targetId : event.buff.owner.ownerId,
              event.buffTags ?? [],
              condition.buffTags,
              condition.match,
            );
      if (matched && condition.buffIdOutputKey !== undefined) {
        context.blackboard.assign({ [condition.buffIdOutputKey]: event.buffId });
      }
      return matched;
    }
    if (condition.kind === 'eventHealTagsMatch') {
      const event = context.event;
      const tags = healAbilityEvent(event)?.payload.tags ?? null;
      return tags !== null && matchValues(tags, condition.tags, condition.match);
    }
    if (condition.kind === 'eventSpGainMatch') {
      const event = spGainAbilityEvent(context.event)?.payload;
      return (
        event !== undefined &&
        (condition.sources === undefined || condition.sources.includes(event.source)) &&
        (condition.gainKinds === undefined || condition.gainKinds.includes(event.gainKind))
      );
    }
    if (
      condition.kind === 'eventConsumedBuffLayerCompare' ||
      condition.kind === 'eventBuffEnhanceLayerCompare'
    ) {
      const event = context.event;
      const layers = !('payload' in event)
        ? undefined
        : condition.kind === 'eventBuffEnhanceLayerCompare'
          ? event.event === 'buffEnhanceChanged' ||
            event.event === 'buffAbsorbedFrameEnd' ||
            event.event === 'buffConsumedFrameEnd'
            ? event.payload.layerCount
            : undefined
          : event.event === 'buffConsumed' || event.event === 'buffAbsorbed'
            ? event.payload.layers
            : undefined;
      if (layers === undefined) return false;
      const matched = compareCombatNumbers(
        layers,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
      if (!matched) return false;
      if (condition.outputKey) {
        const old = Math.fround(readRequiredActionNumber(context.blackboard, condition.outputKey));
        const value = Math.fround(layers);
        if (!(Math.abs(Math.fround(old - value)) <= Math.fround(0.00001))) {
          context.blackboard.assignDynamicUnconditionally(condition.outputKey, value);
        }
      }
      return true;
    }
    if (condition.kind === 'eventOverheal') {
      const event = healAbilityEvent(context.event)?.payload;
      if (event === undefined) return false;
      if (condition.overHealKey) {
        context.blackboard.assignDynamicUnconditionally(
          condition.overHealKey,
          Math.fround(event.requestedHealing - event.actualHealing),
        );
      }
      if (condition.finalHealKey) {
        context.blackboard.assignDynamicUnconditionally(
          condition.finalHealKey,
          Math.fround(event.requestedHealing),
        );
      }
      if (condition.realHealKey) {
        context.blackboard.assignDynamicUnconditionally(
          condition.realHealKey,
          Math.fround(event.actualHealing),
        );
      }
      return event.requestedHealing > event.actualHealing + Math.fround(0.00001);
    }
    const damageEvent = eventDamageProperties(context.event);
    if (damageEvent === null) return false;
    return matchDamageCondition(condition, damageEvent);
  }
}

function matchDamageCondition(
  condition: Extract<
    CompiledCondition,
    {
      kind:
        | 'eventDamageTypeIn'
        | 'eventDamageTagsMatch'
        | 'eventDamageGameplayTagsMatch'
        | 'eventDamageFeaturesMatch';
    }
  >,
  damage: NonNullable<ReturnType<typeof eventDamageProperties>>,
): boolean {
  if (condition.kind === 'eventDamageTypeIn') {
    return damage.damageType !== undefined && condition.damageTypes.includes(damage.damageType);
  }
  if (condition.kind === 'eventDamageGameplayTagsMatch') {
    const tags = damage.gameplayTags;
    return (
      tags !== undefined && tags.length > 0 && matchValues(tags, condition.tags, condition.match)
    );
  }
  return condition.kind === 'eventDamageTagsMatch'
    ? matchValues(damage.tags, condition.tags, condition.match)
    : matchValues(damage.features, condition.features, condition.match);
}

/** 只读取现有事件中的 Buff 数据，不重建或规范化通知对象。 */
function eventBuffData(event: NonNullable<CombatOperationContext['event']>) {
  if ('payload' in event) return buffAbilityEvent(event)?.payload;
  return undefined;
}

function eventDamageProperties(event: NonNullable<CombatOperationContext['event']>): {
  readonly tags: readonly DamageTag[];
  readonly gameplayTags?: readonly GameplayTag[];
  readonly features: readonly DamageFeature[];
  readonly damageType?: DamageType;
} | null {
  if ('event' in event && event.event === 'afterKillEntity') return event.payload;
  const damage = damageAbilityEvent(event);
  if (damage !== undefined) return damage.payload;
  return null;
}

function matchValues<T>(
  actualValues: readonly T[],
  expectedValues: readonly T[],
  match: GameplayTagMatchType,
): boolean {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const hasAny = expectedValues.some(value => actual.has(value));
  const hasAll = expectedValues.every(value => actual.has(value));
  switch (match) {
    case 'exact':
      return actual.size === expected.size && hasAll;
    case 'hasAny':
      return hasAny;
    case 'hasAll':
      return hasAll;
    case 'exceptAny':
      return !hasAny;
    case 'exceptAll':
      return !hasAll;
  }
}
