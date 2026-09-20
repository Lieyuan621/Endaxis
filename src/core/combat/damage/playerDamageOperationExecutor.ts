import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { CombatCondition } from '../../game-data/operatorDefinition';
/**
 * 生命伤害与独立失衡步骤进入玩家主动伤害生命周期的装配点。
 * 调用方必须提供同一命中的属性快照和事件端口；此处顺序具有战斗语义，不能随意拆分或并行。
 */
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../packages/game-data-contract/src/conditions';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { ActionValueOperand, SkillType } from '../../game-data/operatorDefinition';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import { attributeModifierValues } from '../attributes/combatAttributes';
import type { CriticalSampleSource } from '../random/criticalSampleSource';
import type { SimulationRandomMode } from '../random/simulationRandom';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { operationProducer } from '../receipt/combatObjectIdentity';
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
import { DAMAGE_SCALE_ZONES } from './damageScale';
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
import {
  PoiseCalculationContext,
  type PoiseModifierSide,
  type PoiseProcessTiming,
} from './poiseModifiers';

type RuntimeOperation = ResolvedCombatOperationStep;
type DamageStep = ResolvedCombatStepForKind<'dealDamage' | 'dealFixedDamage'>;
type StaggerStep = ResolvedCombatStepForKind<'dealStagger'>;
type PoiseStep = DamageStep | StaggerStep;

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
  readonly executingSkillGroupKey?: string;
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
  /** 期望模式把每次直接伤害写成期望值；随机事件仍由均匀序列给出可执行的离散结果。 */
  readonly randomMode?: SimulationRandomMode;
  readonly attackDetail?: AttackReceiptSnapshot;
  /** 场景显式指定的命中覆盖；返回 undefined 才取样，且不污染公式中的原始暴击率。 */
  readonly resolveCriticalOverride?: (step: DamageStep) => boolean | undefined;
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
        attributeDetails.push(
          ...[...(snapshot.modifierDetails ?? []), ...context.appliedDamageModifiers].filter(
            item => item.kind === 'attribute' && item.side === side && item.attribute === attribute,
          ),
        );
      };
      context.setCalculationResult(
        this.#resolveCalculationResult(step, context, operationContext, recordAttribute),
      );
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
          for (const item of [
            ...(snapshot.modifierDetails ?? []),
            ...context.appliedDamageModifiers,
          ]) {
            if (item.kind === 'attribute' && item.side === side && item.attribute === attribute)
              scaleAttributeDetails.push({ ...item, zone });
          }
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
      const criticalOverride = this.dependencies.resolveCriticalOverride?.(step);
      const formulaInput = resolvePlayerActiveDamageInput(
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
              (step.parameters.features ?? []).includes('shatter'),
            appliesPhysicalInflictionDamageMultiplier:
              runtimeSnapshot.appliesPhysicalInflictionDamageMultiplier ||
              (step.parameters.features ?? []).includes('physicalInfliction'),
            criticalSample:
              criticalOverride === undefined && context.attackerAttributes.criticalRate > 0.00001
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
        Math.min(Math.max(context.attackerAttributes.criticalRate, 0), 1) *
          context.attackerAttributes.criticalDamageIncrease;
      const expectedDamage = nonCriticalDamage * criticalExpectationMultiplier;
      const appliedDamageResult =
        this.dependencies.randomMode === 'expected' && criticalOverride === undefined
          ? { ...damageResult, value: expectedDamage }
          : damageResult;
      const standardCalculation =
        step.kind === 'dealDamage' &&
        (step.parameters.calculation === undefined || step.parameters.calculation === 'standard');
      const damageScaleMultiplier = context.damageScales.getFinalValue();
      const attackSnapshot =
        step.kind === 'dealDamage' && step.parameters.takeAttackSnapshot === true
          ? operationContext?.damageCalculationSnapshots?.get(step)
          : undefined;
      const receiptAttack = attackSnapshot?.attack ?? calculationAttackAttributes.attack;
      const unscaledCalculationValue = context.baseValue * damageScaleMultiplier;
      const calculationMultiplier =
        Math.abs(unscaledCalculationValue) <= Number.EPSILON
          ? 1
          : finalAttackValue / unscaledCalculationValue;
      const directDamageMultiplier =
        calculationMultiplier *
        damageResult.weaknessShelterMultiplier *
        damageResult.runtimeExtensionMultiplier *
        damageResult.igniteMultiplier *
        damageResult.physicalInflictionMultiplier;
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
        executingSkillGroupKey: this.dependencies.executingSkillGroupKey,
        sourceId: this.dependencies.sourceOperatorId,
        targetId: this.dependencies.targetId,
        damageType: step.parameters.damageType,
        tags: step.parameters.tags,
        gameplayTags: step.kind === 'dealDamage' ? (step.parameters.gameplayTags ?? []) : [],
        features: step.parameters.features ?? [],
        result: appliedDamageResult,
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
          baseDamage: context.baseValue,
          finalAttackValue,
          standardCalculation,
          ...(standardCalculation && (attackSnapshot !== undefined || receiptAttack !== 0)
            ? {
                skillMultiplierPercent:
                  attackSnapshot === undefined
                    ? (context.baseValue / receiptAttack) * 100
                    : attackSnapshot.attackScale * 100,
              }
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
          damageTakenMultiplier: formulaInput.damageTakenMultiplier,
          weaknessDamageMultiplier: formulaInput.weaknessDamageMultiplier,
          shelterDamageMultiplier: formulaInput.shelterDamageMultiplier,
          directDamageMultiplier,
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
  ): number {
    if (step.kind === 'dealFixedDamage') {
      return this.#resolveActionValue(
        step.parameters.value,
        operationContext,
        'dynamic fixed damage value',
      );
    }
    if (step.parameters.takeAttackSnapshot === true) {
      const snapshot = operationContext?.damageCalculationSnapshots?.get(step);
      if (snapshot === undefined) throw new Error('attack snapshot was not prepared');
      return snapshot.baseValue;
    }
    const attackScale = this.#resolveActionValue(
      step.parameters.attackScale,
      operationContext,
      'dynamic damage scale',
    );
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
      return attributeValue * attackScale + addition;
    }
    for (const attribute of attackReceiptAttributes(context.attackerAttributes.attackDetail))
      recordAttribute('attacker', attribute);
    if (step.parameters.calculation !== 'breakingAttack') {
      return context.attackerAttributes.attack * attackScale;
    }
    return calculateBreakingAttackValue({
      attack: context.attackerAttributes.attack,
      targetDamageTakenMultiplier: context.defenderAttributes.breakingAttackDamageTakenMultiplier,
      calculationMultiplier: step.parameters.calculationMultiplier ?? 1,
      attackScale,
    });
  }

  #executePoise(step: PoiseStep, calculationValue: number): void {
    const multipliers = this.dependencies.resolvePoiseMultipliers(step);
    const poiseContext = new PoiseCalculationContext(
      this.dependencies.sourceOperatorId,
      this.dependencies.targetId,
      step.kind === 'dealStagger' ? [] : step.parameters.tags,
      this.dependencies.isSourceControlled?.() ?? false,
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
    value: number | ActionValueOperand,
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

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }
}
