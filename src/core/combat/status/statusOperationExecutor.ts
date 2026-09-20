import type { CombatCondition } from '../../game-data/operatorDefinition';
import type { CombatOperationContext } from '../skills/skillRuntime';
/**
 * 把语义状态动作接到具体状态所有者，并在状态所有者完成结算后记录前后快照。
 * 本适配器不定义叠层、刷新或到期规则；这些规则必须由目标状态所有者实现。
 */
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { ResolvedCombatStepParameters } from '../../compiler/combatProgram';
import type { CombatTarget } from '../../game-data/operatorDefinition';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatStatusChangeReason, CombatStatusTransition } from './combatStatuses';
import type { CombatClock } from '../time/combatClock';
import type { CombatOperationExecutor } from '../skills/skillRuntime';

type RuntimeOperation = ResolvedCombatOperationStep;
export interface StatusActionRequest<K extends 'applyStatus' | 'consumeStatus'> {
  readonly sourceId: string;
  readonly skillId: string;
  readonly parameters: Readonly<ResolvedCombatStepParameters[K]>;
}

/**
 * 语义状态的运行时所有者端口。
 * 调用方只传递编译后的原始参数；默认层数、上限、刷新和消费语义均由实现方负责。
 */
export interface CombatStatusOperationTarget {
  readonly targetId: string;
  applyStatus(request: StatusActionRequest<'applyStatus'>): CombatStatusTransition;
  consumeStatus(request: StatusActionRequest<'consumeStatus'>): CombatStatusTransition;
  getStacks(statusKey: string): number;
}

export interface StatusOperationDependencies {
  readonly sourceId: string;
  /** 技能 key 或配装事件来源 key；状态协议后续应改为中性的 sourceActionId。 */
  readonly sourceActionId: string;
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly resolveTarget: (target: CombatTarget) => CombatStatusOperationTarget;
  readonly delegate: CombatOperationExecutor;
}

/** 记录 applyStatus 与 consumeStatus 的结算事实；自然到期必须由状态所有者另行记录。 */
export class StatusOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: StatusOperationDependencies) {}

  execute(step: RuntimeOperation, context?: CombatOperationContext): boolean {
    if (step.kind === 'applyStatus') {
      const target = this.dependencies.resolveTarget(step.parameters.target);
      const transition = target.applyStatus({
        sourceId: this.dependencies.sourceId,
        skillId: this.dependencies.sourceActionId,
        parameters: step.parameters,
      });
      recordStatusTransition(
        this.dependencies.receipt,
        this.dependencies.clock,
        target.targetId,
        transition,
        {
          requestedStacks: step.parameters.stacks ?? null,
          requestedDurationFrames: step.parameters.durationFrames ?? null,
          requestedMaxStacks: step.parameters.maxStacks ?? null,
        },
      );
      return true;
    }

    if (step.kind === 'consumeStatus') {
      const target = this.dependencies.resolveTarget(step.parameters.target);
      const transition = target.consumeStatus({
        sourceId: this.dependencies.sourceId,
        skillId: this.dependencies.sourceActionId,
        parameters: step.parameters,
      });
      recordStatusTransition(
        this.dependencies.receipt,
        this.dependencies.clock,
        target.targetId,
        transition,
        {
          requestedStacks: step.parameters.stacks ?? null,
          requestedDurationFrames: null,
          requestedMaxStacks: null,
        },
      );
      return true;
    }

    return context === undefined
      ? this.dependencies.delegate.execute(step)
      : this.dependencies.delegate.execute(step, context);
  }

  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'statusActive') {
      const stacks = this.dependencies
        .resolveTarget(condition.target)
        .getStacks(condition.statusKey);
      return stacks >= (condition.minimumStacks ?? 1);
    }
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }
}

/** 状态动作与自然到期共享的唯一回执写入边界。 */
export function recordStatusTransition(
  receipt: CombatReceiptSink,
  clock: CombatClock,
  targetId: string,
  transition: CombatStatusTransition & { readonly reason: CombatStatusChangeReason },
  request: {
    readonly requestedStacks: number | null;
    readonly requestedDurationFrames: number | null;
    readonly requestedMaxStacks: number | null;
  },
): void {
  receipt.record({
    frame: clock.frame,
    time: clock.time,
    event: 'StatusChanged',
    sourceId: transition.sourceId,
    targetId,
    data: {
      skillId: transition.skillId,
      statusKey: transition.statusKey,
      reason: transition.reason,
      ...request,
      previousStacks: transition.previous.stacks,
      previousRemainingFrames: transition.previous.remainingFrames,
      currentStacks: transition.current.stacks,
      currentRemainingFrames: transition.current.remainingFrames,
    },
  });
}
