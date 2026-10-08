import { valueInputBlackboardKey } from '../../compiler/compiledGraphData';
import type { CompiledCondition, CompiledValueInput } from '../../compiler/compiledGraphData.ts';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';

import type { ActionValueCalculation } from '../state/foundationState';
/**
 * 生命伤害与独立失衡步骤进入玩家主动伤害生命周期的装配点。
 * 调用方必须提供同一命中的属性快照和事件端口；此处顺序具有战斗语义，不能随意拆分或并行。
 */
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../packages/game-data-contract/src/conditions';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { SkillType } from '../../game-data/operatorDefinition';
import {
  limitValueCalculation,
  resolveActionValueOperand,
  resolveSkillSettingFactor,
} from '../actions/actionBlackboard';
import { attributeModifierValues } from '../attributes/combatAttributes';
import type { CriticalSampleSource } from '../random/criticalSampleSource';
import type { SimulationRandomMode } from '../random/simulationRandom';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { operationProducer } from '../receipt/combatObjectIdentity';
import { reactionDamageKind, type ReactionDamageIdentity } from './reactionDamageCritical';
import type { CombatVitals } from '../resources/combatVitals';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { CombatClock } from '../time/combatClock';
import { deriveHitId } from '../timeline/deriveHitId';
import {
  attackReceiptAttributes,
  freezeAttackReceiptDetail,
  type AttackReceiptSnapshot,
} from './attackReceiptDetail';
import { calculateBreakingAttackValue } from './breakingAttackDamage';
import { classifyDamageTags, injectDamageScaleAttributes } from './damageScaleAttributes';
import {
  DAMAGE_SCALE_ZONES,
  type AppliedDamageModifier,
  type DamageScaleZone,
} from './damageScale';
import { executeHealthDamage } from './healthDamage';
import { calculatePlayerActiveDamage } from './playerActiveDamage';
import {
  resolvePlayerActiveDamageInput,
  type PlayerDamageNonRandomRuntimeSnapshot,
} from './playerActiveDamageInput';
import {
  PlayerDamageContext,
  type DamageModifierSide,
  type DamageProcessTiming,
  type InstantAttributeModifierRequest,
  type PlayerDamageAttributeSnapshots,
} from './playerDamageContext';
import { executePoiseDamage, type PoiseDamageEvent, type PoiseDamageModifier } from './poiseDamage';
import { PoiseCalculationContext } from './poiseModifiers';
import {
  type PoiseModifierSide,
  type PoiseProcessTiming,
} from '../../../../packages/game-data-contract/src/modifiers';

type RuntimeOperation = ResolvedCombatOperationStep;
type DamageStep = ResolvedCombatStepForKind<'dealDamage' | 'dealFixedDamage'>;
type StaggerStep = ResolvedCombatStepForKind<'dealStagger'>;
type PoiseStep = DamageStep | StaggerStep;

/** 按原来源顺序追加匹配项，不为每个属性拼接、过滤整份明细。 */
function appendAttributeDetails(
  result: AppliedDamageModifier[],
  items: readonly AppliedDamageModifier[] | undefined,
  side: DamageModifierSide,
  attribute: string,
  zone?: DamageScaleZone,
): void {
  if (items === undefined) return;
  for (const item of items) {
    if (item.kind !== 'attribute' || item.side !== side || item.attribute !== attribute) continue;
    result.push(zone === undefined ? item : { ...item, zone });
  }
}

// 原生 IgniteDamageSet：四种爆发、法术异常初次伤害、燃烧和碎冰。
const IGNITE_DAMAGE_TAGS = new Set<string>([
  'fireBurst',
  'electricBurst',
  'cryoBurst',
  'natureBurst',
  'fireAbnormal',
  'electricAbnormal',
  'cryoAbnormal',
  'natureAbnormal',
]);

export const PLAYER_DAMAGE_PREPARATION_EVENTS = [
  'beforeDamageAction',
  'beforeCalculateDamage',
] as const;
/** 完整伤害公式前用于冻结属性和完成即时修正的准备事件。 */
export type PlayerDamagePreparationEvent = (typeof PLAYER_DAMAGE_PREPARATION_EVENTS)[number];

/** 同一次命中的来源方与目标方失衡倍率。 */
export interface PoiseDamageMultipliers {
  readonly output: number;
  readonly taken: number;
  readonly ignorePoiseImmune?: boolean;
}

/** 玩家伤害执行节点需要由战斗装配层提供的全部状态与事件端口。 */
export interface PlayerDamageOperationDependencies {
  readonly sourceOperatorId: string;
  /** 独立 Buff 伤害保留创建时的技能身份，不伪造技能运行上下文或写入其黑板。 */
  readonly skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo;
  /** 存档中的技能释放身份；伤害回执凭它与具体施放对应。单元测试程序可能缺失。 */
  readonly castId?: string;
  readonly skillId?: string;
  /** 执行程序归属，与继承的 skillCastInfo 独立。 */
  readonly executingSkillId?: string;
  /** 非主动技能的可审计来源，不用于生成轴上技能 castId。 */
  readonly sourceActionId?: string;
  /** 只用于把本次公式已经确定的技能分类写入伤害详情回执。 */
  readonly skillType?: SkillType;
  readonly targetId: string;
  readonly targetVitals: CombatVitals;
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly captureAttributeSnapshots: (step: DamageStep) => PlayerDamageAttributeSnapshots;
  readonly criticalSamples: CriticalSampleSource;
  /** false 表示原生动作明确禁止暴击；暴击率为零不能代替这项许可。 */
  readonly canCritical?: boolean;
  /** 期望模式把伤害写成数学期望，并确定触发允许暴击的后续效果，不推进随机流。 */
  readonly randomMode?: SimulationRandomMode;
  readonly attackDetail?: AttackReceiptSnapshot;
  /** 场景显式指定的命中覆盖；返回 undefined 才取样，且不污染公式中的原始暴击率。 */
  readonly resolveCriticalOverride?: (step: DamageStep) => boolean | undefined;
  readonly resolveReactionCriticalOverride?: (identity: ReactionDamageIdentity) => {
    readonly key: string;
    readonly value: boolean | undefined;
  };
  readonly resolveNonRandomRuntimeSnapshot: (
    step: DamageStep,
  ) => PlayerDamageNonRandomRuntimeSnapshot;
  readonly applyDamageModifiers: (
    timing: DamageProcessTiming,
    side: DamageModifierSide,
    context: PlayerDamageContext,
  ) => void;
  readonly clearInstantAttributeModifiers: (side: DamageModifierSide) => void;
  readonly addInstantAttributeModifier: (
    side: DamageModifierSide,
    request: InstantAttributeModifierRequest,
  ) => void;
  readonly emitPreparationEvent: (
    event: PlayerDamagePreparationEvent,
    context: PlayerDamageContext,
  ) => void;
  readonly resolvePoiseMultipliers: (step: PoiseStep) => PoiseDamageMultipliers;
  readonly applyPoiseModifiers?: (
    timing: PoiseProcessTiming,
    side: PoiseModifierSide,
    context: PoiseCalculationContext,
  ) => void;
  readonly isSourceControlled?: () => boolean;
  readonly emitHealthSourceEvent: Parameters<typeof executeHealthDamage>[0]['emitSourceEvent'];
  readonly emitHealthTargetEvent: Parameters<typeof executeHealthDamage>[0]['emitTargetEvent'];
  readonly absorbHealthDamage?: Parameters<typeof executeHealthDamage>[0]['absorbDamage'];
  readonly consumeFinisherEligibility?: () => void;
  readonly emitPoiseSourceEvent: (event: PoiseDamageEvent, modifier: PoiseDamageModifier) => void;
  readonly emitPoiseTargetEvent: (event: PoiseDamageEvent, modifier: PoiseDamageModifier) => void;
  readonly beforePoiseZero?: (modifier: PoiseDamageModifier) => void;
  readonly delegate: CombatOperationExecutor;
}

/** 执行已确认的标准玩家伤害路径，包括两个修正阶段。 */
export class PlayerDamageOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: PlayerDamageOperationDependencies) {}

  prepare(step: RuntimeOperation, operationContext: CombatOperationContext): void {
    if (step.kind !== 'dealDamage' || step.parameters.takeAttackSnapshot !== true) return;
    const snapshots = operationContext.damageCalculationSnapshots;
    if (snapshots === undefined) throw new Error('attack snapshot requires a stateful action host');
    if (snapshots.has(step)) return;
    if (step.parameters.calculation !== undefined)
      throw new Error('attack snapshot currently requires standard attack-scale damage');
    const attackScale = this.#resolveActionValue(
      step.parameters.attackScale,
      operationContext,
      'snapshot damage scale',
    );
    const attackScaleSourceKey = valueInputBlackboardKey(step.parameters.attackScale);
    const attackScaleCalculation =
      attackScaleSourceKey === undefined
        ? undefined
        : operationContext.blackboard.getValueCalculation(attackScaleSourceKey);
    const attributes = this.dependencies.captureAttributeSnapshots(step).attacker;
    const attackKeys = attackReceiptAttributes(attributes.attackDetail);
    snapshots.set(step, {
      attackModifiers: structuredClone(
        (attributes.modifierDetails ?? []).filter(
          item =>
            item.kind === 'attribute' &&
            item.side === 'attacker' &&
            attackKeys.includes(item.attribute),
        ),
      ),
      attack: attributes.attack,
      ...(attributes.attackDetail === undefined ? {} : { attackDetail: attributes.attackDetail }),
      attackScale,
      ...(attackScaleSourceKey === undefined ? {} : { attackScaleSourceKey }),
      ...(attackScaleCalculation === undefined
        ? {}
        : { attackScaleCalculation: limitValueCalculation(attackScaleCalculation) }),
      skillSettingFactor: resolveSkillSettingFactor(
        step.parameters.attackScale,
        operationContext.blackboard,
      ),
      baseValue: attributes.attack * attackScale,
    });
  }

  execute(step: RuntimeOperation, operationContext?: CombatOperationContext): boolean {
    const skillCastInfo = operationContext?.skillCastInfo ?? this.dependencies.skillCastInfo;
    if (step.kind === 'dealStagger') {
      const value = this.#resolveActionValue(
        step.parameters.value,
        operationContext,
        'dynamic stagger value',
      );
      const multiplier =
        step.parameters.valueMultiplier === undefined
          ? 1
          : Math.fround(
              this.#resolveActionValue(
                step.parameters.valueMultiplier,
                operationContext,
                'dynamic stagger multiplier',
              ),
            );
      this.#executePoise(step, value * multiplier);
      return true;
    }
    if (step.kind !== 'dealDamage' && step.kind !== 'dealFixedDamage') {
      return operationContext === undefined
        ? this.dependencies.delegate.execute(step)
        : this.dependencies.delegate.execute(step, operationContext);
    }

    if (step.kind === 'dealDamage' && step.parameters.attackScalePerStatusStack !== undefined) {
      throw new Error('status-stack attack scale must be resolved by its recovered branch');
    }
    if (step.parameters.damageType === 'lifeDrain') {
      throw new Error('life-drain damage uses a separate native calculation branch');
    }
    const context = new PlayerDamageContext({
      sourceId: this.dependencies.sourceOperatorId,
      targetId: this.dependencies.targetId,
      damageType: step.parameters.damageType,
      targetHealthType: 'normal',
      tags: step.parameters.tags,
      gameplayTags: step.kind === 'dealDamage' ? (step.parameters.gameplayTags ?? []) : [],
      features: step.parameters.features ?? [],
      ...(skillCastInfo === undefined ? {} : { skillCastId: skillCastInfo.skillCastId }),
      skillCastInfo: skillCastInfo ?? null,
      ...(this.dependencies.skillId === undefined ? {} : { skillId: this.dependencies.skillId }),
      ...(this.dependencies.skillType === undefined
        ? {}
        : { skillType: this.dependencies.skillType }),
      ports: {
        captureAttributeSnapshots: () => this.dependencies.captureAttributeSnapshots(step),
        applyModifiers: (timing, side, damageContext) =>
          this.dependencies.applyDamageModifiers(timing, side, damageContext),
        addInstantAttributeModifier: this.dependencies.addInstantAttributeModifier,
        clearInstantAttributeModifiers: this.dependencies.clearInstantAttributeModifiers,
      },
    });
    try {
      this.dependencies.emitPreparationEvent('beforeDamageAction', context);
      this.dependencies.emitPreparationEvent('beforeCalculateDamage', context);
      const executingBuff = operationContext?.executingBuff;
      const directModifierSource = {
        sourceId: operationContext?.actionOwnerId ?? this.dependencies.sourceOperatorId,
        sourceActionId: operationContext?.executionActionId ?? this.dependencies.sourceActionId,
        ...(executingBuff === undefined
          ? {}
          : {
              buffId: executingBuff.buffId,
              buff: {
                ownerId: executingBuff.buffOwnerId,
                instanceId: executingBuff.buffInstanceId,
              },
            }),
      };
      const instantAttributeModifiers =
        step.kind === 'dealDamage' ? (step.parameters.instantAttributeModifiers ?? []) : [];
      for (const modifier of instantAttributeModifiers) {
        const value = this.#resolveActionValue(
          modifier.value,
          operationContext,
          `instant attribute ${modifier.attribute}`,
        );
        const neutral =
          modifier.slot === 'finalMultiplier' || modifier.slot === 'baseFinalMultiplier' ? 1 : 0;
        if (value !== neutral)
          context.appliedDamageModifiers.push({
            kind: 'attribute',
            ...directModifierSource,
            side: modifier.targetSide,
            attribute: modifier.attribute,
            slot: modifier.slot,
            value,
          });
        context.addInstantAttributeModifier(modifier.targetSide, {
          attribute: modifier.attribute,
          // 两个最终乘法槽的单位元是 1，不能用全零对象初始化单槽修正。
          values: attributeModifierValues(modifier.slot, value),
          timing: modifier.attributeTiming,
        });
      }
      context.applyModifiers('beforeCalculation');
      const calculationAttackAttributes = context.attackerAttributes;
      const attributeDetails: import('./damageScale').AppliedDamageModifier[] = [];
      const recordAttribute = (side: DamageModifierSide, attribute: string) => {
        const snapshot =
          side === 'attacker' ? context.attackerAttributes : context.defenderAttributes;
        appendAttributeDetails(attributeDetails, snapshot.modifierDetails, side, attribute);
        appendAttributeDetails(attributeDetails, context.appliedDamageModifiers, side, attribute);
      };
      const calculation = this.#resolveCalculationResult(
        step,
        context,
        operationContext,
        recordAttribute,
      );
      context.setCalculationResult(calculation.value);
      const scaleAttributeDetails: import('./damageScale').AppliedDamageModifier[] = [];
      injectDamageScaleAttributes(
        context.damageScales,
        {
          damageType: step.parameters.damageType,
          classifications: classifyDamageTags(step.parameters.tags, step.parameters.features),
          attacker: context.attackerAttributes,
          defender: context.defenderAttributes,
          defenderStaggered: this.dependencies.targetVitals.hasPoiseBrokenTag,
        },
        (side, zone, attribute) => {
          const snapshot =
            side === 'attacker' ? context.attackerAttributes : context.defenderAttributes;
          appendAttributeDetails(
            scaleAttributeDetails,
            snapshot.modifierDetails,
            side,
            attribute,
            zone,
          );
          appendAttributeDetails(
            scaleAttributeDetails,
            context.appliedDamageModifiers,
            side,
            attribute,
            zone,
          );
        },
      );
      if (step.kind === 'dealDamage') {
        for (const modifier of step.parameters.instantDamageScaleModifiers ?? []) {
          const addition = this.#resolveActionValue(
            modifier.addition,
            operationContext,
            `instant damage scale ${modifier.side}/${modifier.zone}`,
          );
          if (addition !== 0)
            context.appliedDamageModifiers.push({
              kind: 'damageScale',
              ...directModifierSource,
              side: modifier.side,
              zone: modifier.zone,
              addition,
            });
          context.damageScales.modify(modifier.side, modifier.zone, addition);
        }
      }
      const finalAttackValue = context.resolveFinalAttackValue();
      const runtimeSnapshot = this.dependencies.resolveNonRandomRuntimeSnapshot(step);
      const reactionKind = reactionDamageKind(step.parameters.tags, step.parameters.features);
      const reactionOverride =
        reactionKind === undefined
          ? undefined
          : this.dependencies.resolveReactionCriticalOverride?.({
              sourceId: this.dependencies.sourceOperatorId,
              targetId: this.dependencies.targetId,
              castId: skillCastInfo?.originCastId ?? this.dependencies.castId,
              actionId:
                operationContext?.executingBuff?.buffId ??
                this.dependencies.executingSkillId ??
                this.dependencies.sourceActionId ??
                operationContext?.executionActionId,
              stepKey: step.key,
              kind: reactionKind,
            });
      const canCritical = this.dependencies.canCritical !== false;
      const criticalOverride = !canCritical
        ? undefined
        : reactionKind === undefined
          ? this.dependencies.resolveCriticalOverride?.(step)
          : reactionOverride?.value;
      const resolvedFormulaInput = resolvePlayerActiveDamageInput(
        {
          step,
          finalAttackValue,
          attacker: context.attackerAttributes,
          defender: context.defenderAttributes,
          runtime: {
            ...runtimeSnapshot,
            // DamageEnums：Shatter 属于 IgniteDamageSet，不属于 PhysicalInfliction。
            appliesIgniteDamageMultiplier:
              runtimeSnapshot.appliesIgniteDamageMultiplier ||
              step.parameters.tags.some(tag => IGNITE_DAMAGE_TAGS.has(tag)) ||
              (step.parameters.features ?? []).includes('shatter'),
            appliesPhysicalInflictionDamageMultiplier:
              runtimeSnapshot.appliesPhysicalInflictionDamageMultiplier ||
              (step.parameters.features ?? []).includes('physicalInfliction'),
            criticalSample:
              this.dependencies.randomMode !== 'expected' &&
              criticalOverride === undefined &&
              canCritical &&
              context.attackerAttributes.criticalRate > 0.00001
                ? this.dependencies.criticalSamples.nextCriticalSample({
                    expectedSequenceId: this.dependencies.sourceOperatorId,
                    ...(this.dependencies.castId === undefined
                      ? {}
                      : { castId: this.dependencies.castId }),
                  })
                : 0,
          },
        },
        recordAttribute,
      );
      const formulaInput = canCritical
        ? resolvedFormulaInput
        : { ...resolvedFormulaInput, criticalRate: 0, criticalSample: 0 };
      const damageResult = calculatePlayerActiveDamage(
        criticalOverride === undefined
          ? formulaInput
          : {
              ...formulaInput,
              criticalRate: criticalOverride ? 1 : 0,
              criticalSample: criticalOverride ? 0 : 1,
            },
      );
      const nonCriticalDamage = damageResult.value / damageResult.criticalMultiplier;
      const criticalDamage =
        nonCriticalDamage * (1 + context.attackerAttributes.criticalDamageIncrease);
      const criticalExpectationMultiplier =
        1 +
        Math.min(Math.max(formulaInput.criticalRate, 0), 1) *
          context.attackerAttributes.criticalDamageIncrease;
      const expectedDamage = nonCriticalDamage * criticalExpectationMultiplier;
      const appliedDamageResult =
        this.dependencies.randomMode === 'expected' && criticalOverride === undefined
          ? {
              ...damageResult,
              value: expectedDamage,
              isCritical: false,
              criticalMultiplier: criticalExpectationMultiplier,
            }
          : damageResult;
      const triggersCriticalEffects =
        criticalOverride === true ||
        (criticalOverride !== false &&
          canCritical &&
          (this.dependencies.randomMode === 'expected' || damageResult.isCritical));
      const standardCalculation =
        step.kind === 'dealDamage' &&
        (step.parameters.calculation === undefined || step.parameters.calculation === 'standard');
      const damageScaleMultiplier = context.damageScales.getFinalValue();
      const attackSnapshot =
        step.kind === 'dealDamage' && step.parameters.takeAttackSnapshot === true
          ? operationContext?.damageCalculationSnapshots?.get(step)
          : undefined;
      const skillSettingFactor =
        standardCalculation && reactionKind !== undefined
          ? calculation.skillSettingFactor
          : undefined;
      const baseScale = skillSettingFactor?.baseValue ?? calculation.attackScale;
      const multiplierSourceMatches =
        standardCalculation &&
        calculation.attackScale !== undefined &&
        baseScale !== undefined &&
        Math.abs(calculation.attackScale - baseScale) <= 0.00001 * Math.max(1, Math.abs(baseScale));
      const multiplierCalculation =
        calculation.attackScaleCalculation === undefined || baseScale === undefined
          ? undefined
          : multiplierSourceMatches &&
              Math.abs(calculation.attackScaleCalculation.result - baseScale) <=
                0.00001 * Math.max(1, Math.abs(baseScale))
            ? calculation.attackScaleCalculation
            : skillSettingFactor?.baseValue !== undefined
              ? skillSettingBaseCalculation(calculation.attackScaleCalculation, baseScale)
              : undefined;
      const separateScale = skillSettingFactor?.baseValue !== undefined;
      const finisherMultiplier =
        step.kind === 'dealDamage' && step.parameters.calculation === 'breakingAttack'
          ? context.defenderAttributes.breakingAttackDamageTakenMultiplier
          : 1;
      const receiptAttack = attackSnapshot?.attack ?? calculationAttackAttributes.attack;
      const unscaledCalculationValue = context.baseValue * damageScaleMultiplier;
      const calculationMultiplier =
        Math.abs(unscaledCalculationValue) <= Number.EPSILON
          ? 1
          : finalAttackValue / unscaledCalculationValue;
      const directDamageMultiplier =
        calculationMultiplier *
        damageResult.weaknessShelterMultiplier *
        damageResult.runtimeExtensionMultiplier;
      const resistancePercentMultiplier =
        step.parameters.damageType === 'true'
          ? 1
          : Math.max(0, 1 - formulaInput.resistancePercent / 100);
      const attackDetail =
        attackSnapshot === undefined
          ? (calculationAttackAttributes.attackDetail ?? this.dependencies.attackDetail)
          : (attackSnapshot.attackDetail ?? this.dependencies.attackDetail);
      const hitId =
        step.hitId ??
        (this.dependencies.castId === undefined || step.key === undefined
          ? undefined
          : deriveHitId(this.dependencies.castId, step.key));
      executeHealthDamage({
        consumeFinisherEligibility: this.dependencies.consumeFinisherEligibility,
        ...(multiplierCalculation === undefined
          ? {}
          : { skillMultiplierCalculation: multiplierCalculation }),
        producedBy: operationProducer(operationContext, {
          ownerId: this.dependencies.sourceOperatorId,
          actionId: this.dependencies.sourceActionId,
        }),
        appliedDamageModifiers: [
          ...(attackSnapshot?.attackModifiers ?? []),
          // 属性来源在公式实际读取阶段收集，不把完整属性快照当成本次生效加成。
          ...context.appliedDamageModifiers.filter(item => item.kind !== 'attribute'),
          ...attributeDetails,
          ...scaleAttributeDetails,
        ].filter(item =>
          item.kind === 'damageScale'
            ? item.addition !== 0
            : item.kind === 'multiplyValue'
              ? item.multiplier !== 1
              : item.value !==
                (item.slot === 'finalMultiplier' || item.slot === 'baseFinalMultiplier' ? 1 : 0),
        ),
        skillCastInfo: skillCastInfo ?? null,
        executingSkillId: this.dependencies.executingSkillId,
        sourceId: this.dependencies.sourceOperatorId,
        targetId: this.dependencies.targetId,
        damageType: step.parameters.damageType,
        tags: step.parameters.tags,
        gameplayTags: step.kind === 'dealDamage' ? (step.parameters.gameplayTags ?? []) : [],
        features: step.parameters.features ?? [],
        result: appliedDamageResult,
        triggersCriticalEffects,
        detail: {
          ...operationContext?.executingBuff,
          ...(this.dependencies.sourceActionId === undefined
            ? {}
            : { sourceActionId: this.dependencies.sourceActionId }),
          ...(this.dependencies.skillType === undefined
            ? {}
            : { skillType: this.dependencies.skillType }),
          attack: receiptAttack,
          ...freezeAttackReceiptDetail(receiptAttack, attackDetail),
          ...(attackSnapshot === undefined
            ? {}
            : {
                usesAttackSnapshot: true,
                currentAttack: context.attackerAttributes.attack,
              }),
          baseDamage: separateScale
            ? receiptAttack * baseScale!
            : finisherMultiplier === 0
              ? context.baseValue
              : context.baseValue / finisherMultiplier,
          ...(separateScale
            ? {
                artsIntensityMultiplier: skillSettingFactor!.multiplier,
                ...(skillSettingFactor!.intensity === undefined
                  ? {}
                  : { artsIntensity: skillSettingFactor!.intensity }),
                additionalScaleMultiplier: skillSettingFactor!.additionalMultiplier ?? 1,
              }
            : {}),
          ...(finisherMultiplier === 1 ? {} : { finisherMultiplier }),
          ...(reactionKind === undefined ? {} : { reactionDamageKind: reactionKind }),
          ...(reactionOverride === undefined
            ? {}
            : {
                reactionCriticalKey: reactionOverride.key,
                forcedCritical: reactionOverride.value === true,
              }),
          ...(calculationAttackAttributes.level === undefined
            ? {}
            : { sourceLevel: calculationAttackAttributes.level }),
          finalAttackValue,
          standardCalculation,
          ...(standardCalculation && baseScale !== undefined
            ? { skillMultiplierPercent: baseScale * 100 }
            : {}),
          ...(multiplierSourceMatches && calculation.attackScaleSourceKey !== undefined
            ? { skillMultiplierSourceKey: calculation.attackScaleSourceKey }
            : {}),
          calculationMultiplier,
          damageScaleMultiplier,
          ...Object.fromEntries(
            DAMAGE_SCALE_ZONES.map(zone => [
              `damageScale:${zone}`,
              context.damageScales.getZoneValue(zone),
            ]),
          ),
          ...Object.fromEntries(
            DAMAGE_SCALE_ZONES.flatMap(zone =>
              (['attacker', 'defender'] as const).map(side => [
                `damageScale:${zone}:${side}`,
                context.damageScales.getSideValue(side, zone),
              ]),
            ),
          ),
          criticalRate: context.attackerAttributes.criticalRate,
          criticalDamageIncrease: context.attackerAttributes.criticalDamageIncrease,
          criticalExpectationMultiplier,
          nonCriticalDamage,
          criticalDamage,
          expectedDamage,
          enemyDefense: context.defenderAttributes.defense,
          enemyResistancePercent: formulaInput.resistancePercent,
          ...(context.defenderAttributes.baseResistancePercent === undefined
            ? {}
            : { enemyBaseResistancePercent: context.defenderAttributes.baseResistancePercent }),
          damageTakenMultiplier: formulaInput.damageTakenMultiplier,
          weaknessDamageMultiplier: formulaInput.weaknessDamageMultiplier,
          shelterDamageMultiplier: formulaInput.shelterDamageMultiplier,
          directDamageMultiplier,
          ...(formulaInput.appliesIgniteDamageMultiplier ||
          formulaInput.appliesPhysicalInflictionDamageMultiplier
            ? {
                levelCoefficient:
                  damageResult.igniteMultiplier * damageResult.physicalInflictionMultiplier,
              }
            : {}),
          resistancePercentMultiplier,
        },
        target: this.dependencies.targetVitals,
        clock: this.dependencies.clock,
        receipt: this.dependencies.receipt,
        ...(this.dependencies.castId === undefined ? {} : { castId: this.dependencies.castId }),
        ...(step.key === undefined ? {} : { stepKey: step.key }),
        ...(hitId === undefined ? {} : { hitId }),
        emitSourceEvent: this.dependencies.emitHealthSourceEvent,
        emitTargetEvent: this.dependencies.emitHealthTargetEvent,
        ...(this.dependencies.absorbHealthDamage === undefined
          ? {}
          : { absorbDamage: this.dependencies.absorbHealthDamage }),
      });
      operationContext?.blackboard.assignDynamic(NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY, 1);

      if (
        step.parameters.stagger !== undefined &&
        (!step.parameters.staggerOnlyWhenCasterControlled ||
          (this.dependencies.isSourceControlled?.() ?? false))
      ) {
        const stagger = this.#resolveActionValue(
          step.parameters.stagger,
          operationContext,
          'dynamic stagger value',
        );
        const staggerMultiplier =
          step.parameters.staggerMultiplier === undefined
            ? 1
            : Math.fround(
                this.#resolveActionValue(
                  step.parameters.staggerMultiplier,
                  operationContext,
                  'dynamic stagger multiplier',
                ),
              );
        this.#executePoise(step, stagger * staggerMultiplier);
      }
      return true;
    } finally {
      context.dispose();
    }
  }

  /** 只选择原生基础值计算分支；所有分支完成后仍共享同一伤害修正和最终公式。 */
  #resolveCalculationResult(
    step: DamageStep,
    context: PlayerDamageContext,
    operationContext: CombatOperationContext | undefined,
    recordAttribute: (side: DamageModifierSide, attribute: string) => void,
  ): {
    readonly value: number;
    readonly attackScale?: number;
    readonly skillSettingFactor?: import('../state/foundationState').ArtsIntensityFactor;
    readonly attackScaleSourceKey?: string;
    readonly attackScaleCalculation?: import('../state/foundationState').ActionValueCalculation;
  } {
    if (step.kind === 'dealFixedDamage') {
      return {
        value: this.#resolveActionValue(
          step.parameters.value,
          operationContext,
          'dynamic fixed damage value',
        ),
      };
    }
    if (step.parameters.takeAttackSnapshot === true) {
      const snapshot = operationContext?.damageCalculationSnapshots?.get(step);
      if (snapshot === undefined) throw new Error('attack snapshot was not prepared');
      return {
        value: snapshot.baseValue,
        attackScale: snapshot.attackScale,
        attackScaleSourceKey: snapshot.attackScaleSourceKey,
        attackScaleCalculation: snapshot.attackScaleCalculation,
        skillSettingFactor: snapshot.skillSettingFactor,
      };
    }
    const skillSettingFactor =
      operationContext === undefined
        ? undefined
        : resolveSkillSettingFactor(step.parameters.attackScale, operationContext.blackboard);
    const attackScale = this.#resolveActionValue(
      step.parameters.attackScale,
      operationContext,
      'dynamic damage scale',
    );
    const attackScaleSourceKey = valueInputBlackboardKey(step.parameters.attackScale);
    const attackScaleCalculation =
      attackScaleSourceKey === undefined
        ? undefined
        : operationContext?.blackboard.getValueCalculation(attackScaleSourceKey);
    if (step.parameters.calculation === 'attribute') {
      const attributeValue = context.attackerAttributes.calculationAttributeValue;
      if (attributeValue === undefined) {
        throw new Error(
          `damage calculation attribute '${step.parameters.calculationAttribute ?? ''}' is missing`,
        );
      }
      const addition = this.#resolveActionValue(
        step.parameters.calculationAddition ?? 0,
        operationContext,
        'dynamic damage calculation addition',
      );
      if (step.parameters.calculationAttribute !== undefined)
        recordAttribute('attacker', step.parameters.calculationAttribute);
      return { value: attributeValue * attackScale + addition, attackScale };
    }
    for (const attribute of attackReceiptAttributes(context.attackerAttributes.attackDetail))
      recordAttribute('attacker', attribute);
    if (step.parameters.calculation !== 'breakingAttack') {
      return {
        value: context.attackerAttributes.attack * attackScale,
        attackScale,
        skillSettingFactor,
        attackScaleSourceKey,
        attackScaleCalculation,
      };
    }
    return {
      value: calculateBreakingAttackValue({
        attack: context.attackerAttributes.attack,
        targetDamageTakenMultiplier: context.defenderAttributes.breakingAttackDamageTakenMultiplier,
        calculationMultiplier: step.parameters.calculationMultiplier ?? 1,
        attackScale,
      }),
      attackScale,
    };
  }

  #executePoise(step: PoiseStep, calculationValue: number): void {
    const multipliers = this.dependencies.resolvePoiseMultipliers(step);
    const poiseContext = new PoiseCalculationContext(
      this.dependencies.sourceOperatorId,
      this.dependencies.targetId,
      step.kind === 'dealStagger' ? [] : step.parameters.tags,
      step.kind === 'dealStagger' ? [] : (step.parameters.features ?? []),
      multipliers.output,
      multipliers.taken,
    );
    for (const timing of ['beforeCalculation', 'afterCalculation'] as const) {
      this.dependencies.applyPoiseModifiers?.(timing, 'attacker', poiseContext);
      this.dependencies.applyPoiseModifiers?.(timing, 'defender', poiseContext);
    }
    executePoiseDamage({
      sourceId: this.dependencies.sourceOperatorId,
      targetId: this.dependencies.targetId,
      target: this.dependencies.targetVitals,
      calculationValue,
      outputMultiplier: poiseContext.outputMultiplier,
      takenMultiplier: poiseContext.takenMultiplier,
      ignorePoiseImmune: multipliers.ignorePoiseImmune,
      clock: this.dependencies.clock,
      receipt: this.dependencies.receipt,
      emitSourceEvent: this.dependencies.emitPoiseSourceEvent,
      emitTargetEvent: this.dependencies.emitPoiseTargetEvent,
      beforePoiseZero: this.dependencies.beforePoiseZero,
    });
  }

  #resolveActionValue(
    value: number | CompiledValueInput,
    operationContext: CombatOperationContext | undefined,
    missingContextMessage: string,
  ): number {
    if (typeof value === 'number') return value;
    if (operationContext === undefined)
      throw new Error(`${missingContextMessage} requires an action blackboard`);
    return resolveActionValueOperand(value, operationContext.blackboard);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }
}

/** 技艺强度已单列显示时，只追溯技能表原值，不把强化后的倍率冒充基础倍率。 */
function skillSettingBaseCalculation(
  calculation: ActionValueCalculation,
  baseScale: number,
): ActionValueCalculation | undefined {
  if (
    calculation.sourceKind === 'skillSetting' &&
    Math.abs(calculation.left - baseScale) <= 0.00001 * Math.max(1, Math.abs(baseScale))
  ) {
    return {
      operation: 'multiply',
      left: baseScale,
      right: 1,
      result: baseScale,
      sourceKind: 'skillSetting',
      sourceColumn: calculation.sourceColumn,
    };
  }
  return (
    (calculation.leftCalculation === undefined
      ? undefined
      : skillSettingBaseCalculation(calculation.leftCalculation, baseScale)) ??
    (calculation.rightCalculation === undefined
      ? undefined
      : skillSettingBaseCalculation(calculation.rightCalculation, baseScale))
  );
}
