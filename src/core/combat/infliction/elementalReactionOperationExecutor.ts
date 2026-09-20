import type { CombatCondition } from '../../game-data/operatorDefinition';
/**
 * 反应步骤与敌人反应状态容器之间的接线。
 *
 * 负责两件事：按步骤顺序读写反应状态并记录回执，以及求值"敌人当前是否带着反应"的条件。
 * 反应状态只描述事实，不在这里附加任何未证实的伤害规则。
 */
import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
} from '../../compiler/combatProgram';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatClock } from '../time/combatClock';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import { resolveActionValueOperand } from '../actions/actionBlackboard';
import {
  ElementalReactionContainer,
  type ApplyElementalReactionResult,
} from './elementalReactionState';

type RuntimeOperation = ResolvedCombatOperationStep;

/** 反应步骤执行所需的端口。 */
export interface ElementalReactionOperationDependencies {
  readonly sourceOperatorId: string;
  /** 存档中的技能释放身份；反应回执凭它与具体施放对应。单元测试程序可能缺失。 */
  readonly castId?: string;
  readonly targetId: string;
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly container: ElementalReactionContainer;
  /** 仅在反应状态写入并记录完成后报告语义事实。 */
  readonly delegate: CombatOperationExecutor;
}

/** 在操作序列指定的位置执行一次反应施加或消费。 */
export class ElementalReactionOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: ElementalReactionOperationDependencies) {}

  execute(step: RuntimeOperation, operationContext?: CombatOperationContext): boolean {
    if (step.kind === 'applyElementalReaction') {
      this.#apply(step, operationContext);
      return true;
    }
    if (step.kind === 'consumeElementalReaction') {
      this.#consume(step);
      return true;
    }
    return operationContext === undefined
      ? this.dependencies.delegate.execute(step)
      : this.dependencies.delegate.execute(step, operationContext);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, operationContext?: CombatOperationContext): boolean {
    if (condition.kind === 'elementalReactionActive') {
      return this.dependencies.container.isActive(
        condition.reaction,
        condition.minimumLevel,
        this.dependencies.clock.time,
      );
    }
    return operationContext === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, operationContext);
  }

  #apply(
    step: ResolvedCombatStepForKind<'applyElementalReaction'>,
    context?: CombatOperationContext,
  ): void {
    const baseDurationSeconds =
      typeof step.parameters.durationSeconds === 'number'
        ? step.parameters.durationSeconds
        : context === undefined
          ? (() => {
              throw new Error('dynamic elemental reaction duration requires an action blackboard');
            })()
          : resolveActionValueOperand(step.parameters.durationSeconds, context.blackboard);
    const durationSeconds = baseDurationSeconds * (step.parameters.durationMultiplier ?? 1);
    const result: ApplyElementalReactionResult = this.dependencies.container.apply({
      reaction: step.parameters.reaction,
      durationSeconds,
      sourceId: this.dependencies.sourceOperatorId,
      time: this.dependencies.clock.time,
    });
    this.dependencies.receipt.record({
      frame: this.dependencies.clock.frame,
      time: this.dependencies.clock.time,
      event: 'ElementalReactionApplied',
      sourceId: this.dependencies.sourceOperatorId,
      targetId: this.dependencies.targetId,
      data: {
        reaction: result.reaction,
        ...(this.dependencies.castId === undefined ? {} : { castId: this.dependencies.castId }),
        previousLevel: result.previousLevel,
        level: result.level,
        durationSeconds: result.durationSeconds,
        effectiveness: step.parameters.effectiveness,
      },
    });
  }

  #consume(step: ResolvedCombatStepForKind<'consumeElementalReaction'>): void {
    const consumed = this.dependencies.container.consume(
      step.parameters.reaction,
      this.dependencies.clock.time,
    );
    this.dependencies.receipt.record({
      frame: this.dependencies.clock.frame,
      time: this.dependencies.clock.time,
      event: 'ElementalReactionConsumed',
      sourceId: this.dependencies.sourceOperatorId,
      targetId: this.dependencies.targetId,
      data: {
        reaction: step.parameters.reaction,
        ...(this.dependencies.castId === undefined ? {} : { castId: this.dependencies.castId }),
        level: consumed === null ? 0 : consumed.consumedLevel,
        // 敌人身上没有该反应时如实记录，不伪造一次消费。
        consumed: consumed !== null,
      },
    });
  }
}
