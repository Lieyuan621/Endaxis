import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
import { resolveDirectActionTargets } from '../abilities/targetContextOperationExecutor';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type { SpGainSource } from '../../game-data/operatorDefinition';
/**
 * 技能操作执行链中的资源职责节点。
 * 只消费已闭环的资源步骤，其他步骤必须显式委托；未知步骤不能被吞掉或视作成功。
 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { CombatClock } from '../time/combatClock';
import type { CombatResources, SpChange, UltimateEnergyChange } from './combatResources';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';

import type { AbilitySpGainPayload } from '../events/combatAbilityEvent';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import type { SkillResourceActionState } from '../state/actionState';
import { operationProducer } from '../receipt/combatObjectIdentity';

type RuntimeOperation = ResolvedCombatOperationStep;

/** 资源执行节点所需的来源身份、账本、回执和后继执行器。 */
export interface SkillResourceOperationDependencies {
  readonly sourceOperatorId: string;
  /** 技能 key 或配装事件来源 key；仅用于当前兼容回执中的 `skillId` 字段。 */
  readonly sourceActionId: string;
  readonly clock: CombatClock;
  readonly resources: CombatResources;
  readonly receipt: CombatReceiptSink;
  readonly getNonReturnedSpCost: () => number;
  /** 当前敌人的处决技力回复基础值；技能步骤只保存自身倍率。 */
  readonly finisherSpRecovery: number;
  readonly onSpGained?: (event: AbilitySpGainPayload) => void;
  readonly onPerfectDodge?: (sourceOperatorId: string) => void;
  readonly delegate: CombatOperationExecutor;
}

/** 处理已还原的技能资源操作，并将其他操作继续委托。 */
export class SkillResourceOperationExecutor implements CombatOperationExecutor {
  readonly runtimeState: SkillResourceActionState;
  readonly programs: CombatOperationPrograms;

  constructor(
    readonly dependencies: SkillResourceOperationDependencies,
    restored?: {
      readonly state: SkillResourceActionState;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.runtimeState = restored?.state ?? { ultimateRecoveryRestrictionHandles: new Map() };
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  execute(step: RuntimeOperation, context?: CombatOperationContext): boolean {
    if (step.kind === 'restrictUltimateEnergyRecovery') {
      const handle = this.dependencies.resources.requestUltimateEnergyRecoveryRestriction(
        this.dependencies.sourceOperatorId,
        new Set(step.parameters.allowedRecoveryTags),
      );
      this.runtimeState.ultimateRecoveryRestrictionHandles.set(this.programs.slot(step), handle);
      return true;
    }
    if (step.kind === 'recoverDashEnergy') {
      if (context === undefined)
        throw new Error('recoverDashEnergy requires a combat operation context');
      const amount = Math.fround(
        resolveActionValueOperand(step.parameters.amount, context.blackboard),
      );
      const change = this.dependencies.resources.recoverDashEnergy(
        amount,
        step.parameters.canRecoverWhenOverdraft,
      );
      this.dependencies.receipt.record({
        frame: this.dependencies.clock.frame,
        time: this.dependencies.clock.time,
        event: 'DashEnergyChanged',
        sourceId: this.dependencies.sourceOperatorId,
        producedBy: operationProducer(context),
        data: { skillId: this.dependencies.sourceActionId, ...change },
      });
      return true;
    }
    if (step.kind === 'recordPerfectDodge') {
      this.dependencies.onPerfectDodge?.(this.dependencies.sourceOperatorId);
      this.dependencies.receipt.record({
        frame: this.dependencies.clock.frame,
        time: this.dependencies.clock.time,
        event: 'PerfectDodgeSucceeded',
        sourceId: this.dependencies.sourceOperatorId,
        producedBy: operationProducer(context),
        data: { skillId: this.dependencies.sourceActionId },
      });
      return true;
    }
    if (step.kind === 'changeResource') {
      const p = step.parameters;
      if (context === undefined) throw new Error('resource change requires an action context');
      const query = (selection: typeof p.source) => {
        const direct = resolveDirectActionTargets(
          selection,
          context,
          this.dependencies.sourceOperatorId,
        );
        if (direct !== undefined) return direct;
        if (!this.dependencies.delegate.queryTargets)
          throw new Error('resource target query is unavailable');
        return this.dependencies.delegate.queryTargets(selection, context);
      };
      const source = query(p.source)[0];
      if (!source) return false;
      const sourceId = runtimeTargetEntityId(source);
      if (sourceId === undefined) return false;
      const targets = query(p.targets);
      if (
        p.resource === 'sp' &&
        p.onlyMainOperator &&
        (source.kind !== 'operator' ||
          !this.dependencies.delegate.evaluate(
            {
              kind: 'actionInputTargetIdentityMatch',
              other: 'controlledOperator',
              operator: 'equal',
            },
            { ...context, actionInputTarget: source },
          ))
      )
        return true;
      const read = (value: typeof p.amount): number => {
        if (typeof value === 'number') return value;
        if (context === undefined)
          throw new Error('dynamic resource amount requires an action context');
        return Math.fround(resolveActionValueOperand(value, context.blackboard));
      };
      const amount = read(p.amount);
      const coefficient = p.coefficient === undefined ? undefined : read(p.coefficient);
      for (const target of targets) {
        if (target.kind === 'spatialPoint') continue;
        if (p.resource === 'sp') {
          const change = this.dependencies.resources.gainSp(
            Math.fround(amount * (coefficient ?? 1)),
            p.spGainKind,
            p.spGainSource ?? 'default',
          );
          this.#recordSpChange(change, p.spGainSource ?? 'default', context, sourceId);
        } else {
          if (target.kind !== 'operator')
            throw new Error('ultimate energy recipient requires an operator');
          const change = this.dependencies.resources.changeUltimateEnergy(
            target.operatorId,
            Math.fround(amount),
            {
              coefficient,
              isPercentValue: p.isPercentValue,
              recoveryTag: p.ultimateRecoveryTag,
              ignoreGainMultiplier: p.ignoreUltimateEnergyGainMultiplier,
            },
          );
          this.#recordUltimateEnergyChange(change, context, sourceId);
        }
      }
      return true;
    }

    if (step.kind === 'gainFinisherSp') {
      const baseValue = Math.fround(this.dependencies.finisherSpRecovery * step.parameters.factor);
      const change = this.dependencies.resources.gainSp(baseValue, 'gain', 'powerAttack');
      this.#recordSpChange(change, 'powerAttack', context);
      return true;
    }

    if (step.kind !== 'gainSquadUltimateEnergyFromSkillCost') {
      return context === undefined
        ? this.dependencies.delegate.execute(step)
        : this.dependencies.delegate.execute(step, context);
    }

    const changes = this.dependencies.resources.gainSquadUltimateEnergyFromSkillCost(
      this.dependencies.sourceOperatorId,
      this.dependencies.getNonReturnedSpCost(),
      step.parameters.coefficient,
    );
    for (const change of changes) this.#recordUltimateEnergyChange(change, context);
    return true;
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    if (step.kind === 'restrictUltimateEnergyRecovery') {
      const slot = this.programs.slot(step);
      const handle = this.runtimeState.ultimateRecoveryRestrictionHandles.get(slot);
      if (handle !== undefined) {
        const clearChange = this.dependencies.resources.revertUltimateEnergyRecoveryRestriction(
          handle,
          step.parameters.clearUltimateEnergyOnEnd,
        );
        if (clearChange !== null) this.#recordUltimateEnergyChange(clearChange, context);
        this.runtimeState.ultimateRecoveryRestrictionHandles.delete(slot);
      }
      return;
    }
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }

  #recordSpChange(
    change: SpChange,
    source: SpGainSource,
    context?: CombatOperationContext,
    sourceId = this.dependencies.sourceOperatorId,
  ): void {
    this.dependencies.receipt.record({
      frame: this.dependencies.clock.frame,
      time: this.dependencies.clock.time,
      event: 'SpChanged',
      sourceId,
      producedBy: operationProducer(context),
      data: {
        skillId: this.dependencies.sourceActionId,
        recipient: 'team',
        baseValue: change.baseValue,
        requestedValue: change.requestedValue,
        actualValue: change.actualValue,
        previousValue: change.previousValue,
        currentValue: change.currentValue,
        gainKind: change.gainKind,
        spGainSource: source,
      },
    });
    // 原生 OnObtainAtb 以 Value（效率结算后的请求量）决定是否发布；即使技力已满、
    // RealDelta 为 0，Pogranichnik 等监听器仍需观察这次技能产出。
    if (change.requestedValue > 0) {
      this.dependencies.onSpGained?.({
        sourceId,
        source,
        gainKind: change.gainKind,
        requestedAmount: change.requestedValue,
        amount: change.actualValue,
      });
    }
  }

  #recordUltimateEnergyChange(
    change: UltimateEnergyChange,
    context?: CombatOperationContext,
    sourceId = this.dependencies.sourceOperatorId,
  ): void {
    this.dependencies.receipt.record({
      frame: this.dependencies.clock.frame,
      time: this.dependencies.clock.time,
      event: 'UltimateEnergyChanged',
      sourceId,
      producedBy: operationProducer(context),
      targetId: change.operatorId,
      data: {
        skillId: this.dependencies.sourceActionId,
        recipient: 'operator',
        baseValue: change.baseValue,
        requestedValue: change.requestedValue,
        applied: change.applied,
        actualValue: change.actualValue,
        previousValue: change.previousValue,
        currentValue: change.currentValue,
      },
    });
  }
}
