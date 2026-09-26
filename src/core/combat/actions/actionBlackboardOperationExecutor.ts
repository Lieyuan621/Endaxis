import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { abilityEventTargetId } from '../events/combatAbilityEvent';
import { spGainAbilityEvent } from '../events/combatAbilityEvent';
import { healAbilityEvent } from '../events/combatAbilityEvent';
/**
 * 处理依赖当前技能动作黑板的条件，并把其余操作继续交给运行时执行器链。
 * 该执行器必须位于技能运行时内部，因为动作黑板不能跨技能实例共享。
 */
import type {
  ActionValueCalculationOperation,
  ActionValueOperation,
  CombatCondition,
  DamageElement,
  OperatorAttribute,
  OperatorRole,
} from '../../game-data/operatorDefinition';
import { resolveActionValueOperand } from './actionBlackboard';
import { compareCombatNumbers } from '../../mechanics/combatNumbers.ts';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { ProbabilitySampleSource } from '../random/probabilitySampleSource';
import type { ResolvedCombatStepParameters } from '../../compiler/combatProgram';
import { CombatOperationPrograms } from './combatOperationPrograms';
import type { ActionBlackboardActionState } from '../state/actionState';

const PROBABILITY_TOLERANCE = 0.00001;

export class ActionBlackboardOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: ActionBlackboardActionState;
  readonly programs: CombatOperationPrograms;
  constructor(
    readonly delegate: CombatOperationExecutor,
    readonly probabilitySamples?: ProbabilitySampleSource,
    readonly sourceAttributes?: {
      readonly sourceId: string;
      readonly read: (
        sourceId: string,
        request: Readonly<ResolvedCombatStepParameters['storeSourceAttributeValue']>,
      ) => number;
    },
    /** Buff 内的 StoreCurSkillExecuteFrame 从 Owner AbilitySystem 读取当前技能，而非 Buff 时间。 */
    readonly resolveOwnerCurrentSkillTimelineFrame?: (ownerId: string) => number | undefined,
    /** 原生 Deck 快照来自构筑完成时的静态四维，不随战斗内 Modifier 改变。 */
    readonly sourceDeckAttributes?: Readonly<Record<OperatorAttribute, number>>,
    /** CharacterTable.charTypeId 的静态一一投影；只有身份条件实际执行时才读取。 */
    readonly characterTypes?: {
      readonly sourceId: string;
      readonly resolve: (entityId: string) => DamageElement | undefined;
    },
    /** CharacterTable.profession 的静态投影；仅职业条件实际执行时读取。 */
    readonly operatorRoles?: {
      readonly sourceId: string;
      readonly resolve: (entityId: string) => OperatorRole | undefined;
    },
    readonly entityProperties?: {
      readonly read: (
        entityId: string,
        property: 'currentHealth' | 'maxHealth' | 'currentPoise',
      ) => number;
      readonly setHealthFloor?: (
        entityId: string,
        mode: 'absolute' | 'maxHealthRatio',
        value: number,
      ) => number;
      readonly removeHealthFloor?: (entityId: string, handle: number) => void;
    },
    restored?: {
      readonly state: ActionBlackboardActionState;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? { healthFloors: new Map() };
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind === 'storeCurrentTimelineFrame') {
      const hostFrame = context?.getCurrentTimelineFrame?.();
      const ownerFrame =
        hostFrame === undefined && context?.buffOwnerId !== undefined
          ? this.resolveOwnerCurrentSkillTimelineFrame?.(context.buffOwnerId)
          : undefined;
      const frame = hostFrame ?? ownerFrame;
      if (frame === undefined) {
        if (
          context?.buffOwnerId !== undefined &&
          this.resolveOwnerCurrentSkillTimelineFrame !== undefined
        ) {
          return false;
        }
        throw new Error('storeCurrentTimelineFrame requires a timeline host');
      }
      context!.blackboard.assignDynamic(step.parameters.outputKey, frame);
      return true;
    }
    if (step.kind === 'storeEventSpGainAmount') {
      const event =
        context?.event === undefined ? undefined : spGainAbilityEvent(context.event)?.payload;
      if (event === undefined) {
        throw new Error('storeEventSpGainAmount requires an spGained event context');
      }
      const { outputKey, realDeltaOutputKey } = step.parameters;
      if (outputKey === undefined && realDeltaOutputKey === undefined) {
        throw new Error('storeEventSpGainAmount requires at least one output key');
      }
      if (outputKey !== undefined) {
        context!.blackboard.assignDynamic(outputKey, event.requestedAmount);
      }
      if (realDeltaOutputKey !== undefined) {
        context!.blackboard.assignDynamic(realDeltaOutputKey, event.amount);
      }
      return true;
    }
    if (step.kind === 'storeEventHealValues') {
      const heal = context?.event && healAbilityEvent(context.event);
      if (context === undefined || heal === undefined) {
        throw new Error('storeEventHealValues requires a native healing event context');
      }
      const { finalHealOutputKey, realHealOutputKey } = step.parameters;
      if (finalHealOutputKey === undefined && realHealOutputKey === undefined) {
        throw new Error('storeEventHealValues requires at least one output key');
      }
      if (finalHealOutputKey !== undefined) {
        context.blackboard.assignDynamic(finalHealOutputKey, heal.payload.requestedHealing);
      }
      if (realHealOutputKey !== undefined) {
        context.blackboard.assignDynamic(realHealOutputKey, heal.payload.actualHealing);
      }
      return true;
    }
    if (step.kind === 'modifyActionValue') {
      if (context === undefined) {
        throw new Error('modifyActionValue requires a combat operation context');
      }
      const operand = Math.fround(
        resolveActionValueOperand(step.parameters.value, context.blackboard),
      );
      const oldValue = Math.fround(context.blackboard.getNumber(step.parameters.key) ?? 0);
      context.blackboard.assignDynamic(
        step.parameters.key,
        evaluateActionValueOperation(step.parameters.operation, oldValue, operand),
      );
      context.refreshCurrentBuffAttributeModifiers?.();
      return true;
    }
    if (step.kind === 'calculateActionValue') {
      if (context === undefined) {
        throw new Error('calculateActionValue requires a combat operation context');
      }
      const left = Math.fround(resolveActionValueOperand(step.parameters.left, context.blackboard));
      const right = Math.fround(
        resolveActionValueOperand(step.parameters.right, context.blackboard),
      );
      context.blackboard.assignDynamic(
        step.parameters.key,
        evaluateActionValueCalculation(step.parameters.operation, left, right),
      );
      context.refreshCurrentBuffAttributeModifiers?.();
      return true;
    }
    if (step.kind === 'storeSourceAttributeValue') {
      if (context === undefined) {
        throw new Error('storeSourceAttributeValue requires a combat operation context');
      }
      if (this.sourceAttributes === undefined) {
        throw new Error('storeSourceAttributeValue requires a source attribute reader');
      }
      const sourceId = context.buffSourceId ?? this.sourceAttributes.sourceId;
      const attributeValue = this.sourceAttributes.read(sourceId, step.parameters);
      const scaledAttribute = step.parameters.useFloor
        ? Math.floor(
            attributeValue / resolveActionValueOperand(step.parameters.divisor, context.blackboard),
          )
        : attributeValue;
      const result =
        resolveActionValueOperand(step.parameters.base, context.blackboard) +
        scaledAttribute * resolveActionValueOperand(step.parameters.multiplier, context.blackboard);
      context.blackboard.assignDynamic(step.parameters.targetKey, result);
      context.refreshCurrentBuffAttributeModifiers?.();
      return true;
    }
    if (step.kind === 'storeEntityPropertyValue') {
      if (context === undefined) {
        throw new Error('storeEntityPropertyValue requires a combat operation context');
      }
      if (this.entityProperties === undefined) {
        throw new Error('storeEntityPropertyValue requires an entity property reader');
      }
      const ownerId = context.actionOwnerId ?? context.buffOwnerId;
      if (ownerId === undefined) {
        throw new Error('storeEntityPropertyValue actionOwner target requires an action owner');
      }
      const propertyValue = this.entityProperties.read(ownerId, step.parameters.property);
      const scaledValue = step.parameters.useFloor
        ? Math.floor(
            propertyValue / resolveActionValueOperand(step.parameters.divisor, context.blackboard),
          )
        : propertyValue;
      const result =
        resolveActionValueOperand(step.parameters.base, context.blackboard) +
        scaledValue * resolveActionValueOperand(step.parameters.multiplier, context.blackboard);
      context.blackboard.assignDynamic(step.parameters.targetKey, result);
      context.refreshCurrentBuffAttributeModifiers?.();
      return true;
    }
    if (step.kind === 'setHealthFloor') {
      if (context === undefined)
        throw new Error('setHealthFloor requires a combat operation context');
      const setHealthFloor = this.entityProperties?.setHealthFloor;
      if (setHealthFloor === undefined) {
        throw new Error('setHealthFloor requires an entity property writer');
      }
      const ownerId = context.actionOwnerId ?? context.buffOwnerId;
      if (ownerId === undefined) throw new Error('setHealthFloor requires an action owner');
      const slot = this.programs.slot(step);
      const existing = this.runtimeState.healthFloors.get(slot);
      if (existing !== undefined) this.#removeHealthFloor(existing.entityId, existing.handle);
      this.runtimeState.healthFloors.set(slot, {
        entityId: ownerId,
        handle: setHealthFloor(
          ownerId,
          step.parameters.mode,
          resolveActionValueOperand(step.parameters.value, context.blackboard),
        ),
      });
      return true;
    }
    if (step.kind === 'readSkillSettingData') {
      if (context === undefined) {
        throw new Error('readSkillSettingData requires a combat operation context');
      }
      for (const item of step.parameters.items) {
        const column = roundToEven(resolveActionValueOperand(item.column, context.blackboard)) - 1;
        if (column < 0 || column >= item.values.length) continue;
        let value = item.values[column]!;
        if (item.enhance !== undefined) {
          if (this.sourceAttributes === undefined) {
            throw new Error('enhanced readSkillSettingData requires a source attribute reader');
          }
          const sourceId =
            item.enhance.target === 'caster'
              ? this.sourceAttributes.sourceId
              : item.enhance.target === 'buffOwner'
                ? context.buffOwnerId
                : context.buffSourceId;
          if (sourceId === undefined) {
            throw new Error(
              `readSkillSettingData target '${item.enhance.target}' requires a Buff context`,
            );
          }
          const enhance = this.sourceAttributes.read(sourceId, {
            attribute: { kind: 'specific', key: 'PhysicalAndSpellInflictionEnhance' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: item.storeKey,
          });
          const formula = item.enhance.formula;
          value *=
            formula.kind === 'linear'
              ? 1 + formula.paramA * enhance
              : 1 + (formula.paramA * enhance) / (formula.paramB + enhance);
        }
        context.blackboard.assignDynamic(item.storeKey, value);
        context.refreshCurrentBuffAttributeModifiers?.();
      }
      return true;
    }
    return context === undefined
      ? this.delegate.execute(step)
      : this.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    const slot = this.programs.slot(step);
    const healthFloor = this.runtimeState.healthFloors.get(slot);
    if (healthFloor !== undefined) {
      this.#removeHealthFloor(healthFloor.entityId, healthFloor.handle);
      this.runtimeState.healthFloors.delete(slot);
    }
    this.delegate.end?.(step, context);
  }

  #removeHealthFloor(entityId: string, handle: number): void {
    const remove = this.entityProperties?.removeHealthFloor;
    if (remove === undefined) {
      throw new Error('restored health floor requires an entity property remover');
    }
    remove(entityId, handle);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'constant') return condition.value;
    if (condition.kind === 'combatActive') return true;
    if (condition.kind === 'singleEnemyPresent') return true;
    if (condition.kind === 'characterTypeIn') {
      const entityId =
        condition.target === 'caster' ? this.characterTypes?.sourceId : context?.buffOwnerId;
      if (entityId === undefined) {
        throw new Error(`characterTypeIn target '${condition.target}' requires an entity identity`);
      }
      const characterType = this.characterTypes?.resolve(entityId);
      if (characterType === undefined) {
        throw new Error(`characterTypeIn requires CharacterTable.charTypeId for '${entityId}'`);
      }
      return condition.characterTypes.includes(characterType);
    }
    if (condition.kind === 'operatorRoleIn') {
      const entityId =
        condition.target === 'caster'
          ? this.operatorRoles?.sourceId
          : condition.target === 'buffOwner'
            ? context?.buffOwnerId
            : context?.event !== undefined && 'payload' in context.event
              ? abilityEventTargetId(context.event)
              : context?.event !== undefined &&
                  'targetId' in context.event &&
                  typeof context.event.targetId === 'string'
                ? context.event.targetId
                : undefined;
      if (entityId === undefined) {
        throw new Error(`operatorRoleIn target '${condition.target}' requires an entity identity`);
      }
      const role = this.operatorRoles?.resolve(entityId);
      if (role === undefined) {
        throw new Error(`operatorRoleIn requires CharacterTable.profession for '${entityId}'`);
      }
      return condition.roles.includes(role);
    }
    if (condition.kind === 'buffSourceMatchesOwner') {
      if (context?.buffSourceId === undefined || context.buffOwnerId === undefined) {
        throw new Error('buffSourceMatchesOwner requires Buff source and owner identities');
      }
      return context.buffSourceId === context.buffOwnerId;
    }
    if (condition.kind === 'not') return !this.evaluate(condition.condition, context);
    if (condition.kind === 'all') {
      return condition.conditions.every(child => this.evaluate(child, context));
    }
    if (condition.kind === 'any') {
      return condition.conditions.some(child => this.evaluate(child, context));
    }
    if (condition.kind === 'actionValueCompare') {
      if (context === undefined) {
        throw new Error('actionValueCompare requires a combat operation context');
      }
      return compareCombatNumbers(
        resolveActionValueOperand(condition.left, context.blackboard),
        resolveActionValueOperand(condition.right, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'deckAttributeCompare') {
      if (this.sourceDeckAttributes === undefined) {
        throw new Error('deckAttributeCompare requires source Deck attributes');
      }
      return compareCombatNumbers(
        Math.fround(this.sourceDeckAttributes[condition.left]),
        Math.fround(this.sourceDeckAttributes[condition.right]),
        condition.operator,
      );
    }
    if (condition.kind === 'probability') {
      if (context === undefined) {
        throw new Error('probability requires a combat operation context');
      }
      const probability = Math.fround(
        resolveActionValueOperand(condition.probability, context.blackboard),
      );
      if (!(probability > PROBABILITY_TOLERANCE)) return false;
      if (this.probabilitySamples === undefined) {
        throw new Error('probability requires an explicit probability sample source');
      }
      const sample = this.probabilitySamples.nextProbabilitySample({
        ...((context.buffSourceId ?? this.sourceAttributes?.sourceId) === undefined
          ? {}
          : { expectedSequenceId: context.buffSourceId ?? this.sourceAttributes?.sourceId }),
        ...(context.skillCastInfo?.originCastId === undefined
          ? {}
          : { castId: context.skillCastInfo.originCastId }),
      });
      if (!Number.isFinite(sample) || sample < 0 || sample > 1) {
        throw new RangeError('probability sample must be a finite value in [0, 1]');
      }
      return Math.fround(probability + PROBABILITY_TOLERANCE) >= sample;
    }
    return context === undefined
      ? this.delegate.evaluate(condition)
      : this.delegate.evaluate(condition, context);
  }
}

function evaluateActionValueCalculation(
  operation: ActionValueCalculationOperation,
  left: number,
  right: number,
): number {
  switch (operation) {
    case 'add':
      return Math.fround(left + right);
    case 'multiply':
      return Math.fround(left * right);
    case 'divide':
      return Math.fround(left / right);
  }
}

const ACTION_VALUE_EPSILON = 0.00001;
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;

function evaluateActionValueOperation(
  operation: ActionValueOperation,
  oldValue: number,
  operand: number,
): number {
  switch (operation) {
    case 'assign':
      return operand;
    case 'add':
      return Math.fround(oldValue + operand);
    case 'multiply':
      return Math.fround(oldValue * operand);
    case 'divide':
      return Math.abs(operand) <= ACTION_VALUE_EPSILON ? 0 : Math.fround(oldValue / operand);
    case 'floor':
      return toUnityInt32(Math.floor(operand + ACTION_VALUE_EPSILON));
    case 'ceil':
      return toUnityInt32(Math.ceil(operand - ACTION_VALUE_EPSILON));
    case 'roundToInt':
      return toUnityInt32(roundToEven(operand));
  }
}

function roundToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

function toUnityInt32(value: number): number {
  if (!Number.isFinite(value) || value < INT32_MIN || value > INT32_MAX) return INT32_MIN;
  return Math.trunc(value);
}
