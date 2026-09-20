import { type ElementalReactionState } from '../state/environmentState';
/**
 * 敌人身上的元素反应状态（感电/腐蚀）。
 *
 * 只记录"敌人当前有什么反应、几级、还剩多久"这些事实，不替游戏定伤害规则。
 * 反应等级上限 4，重复施加会升一级并刷新时长；到期后自然消失。
 */
import type { ElementalReaction } from '../../game-data/operatorDefinition';

/** 反应等级上限；Next 数据中的反应条件按 1 至 4 级判断。 */
export const MAX_REACTION_LEVEL = 4;

/** 一次施加的输入与结果。 */
export interface ApplyElementalReactionInput {
  readonly reaction: ElementalReaction;
  readonly durationSeconds: number;
  readonly sourceId: string;
  /** 当前战斗时钟的秒，用于计算到期时间。 */
  readonly time: number;
}

/** 一次施加后反应的新状态。 */
export interface ApplyElementalReactionResult {
  readonly reaction: ElementalReaction;
  readonly previousLevel: number;
  readonly level: number;
  readonly durationSeconds: number;
}

/** 单敌人模型的反应状态容器；一场模拟一个实例。 */
export class ElementalReactionContainer {
  constructor(readonly runtimeState = new Map<ElementalReaction, ElementalReactionState>()) {}

  /** 施加反应：已有则升一级并刷新时长，没有则新建 1 级。 */
  apply(input: ApplyElementalReactionInput): ApplyElementalReactionResult {
    const current = this.runtimeState.get(input.reaction);
    const previousLevel = this.#isFresh(current, input.time) ? current.level : 0;
    const level = Math.min(MAX_REACTION_LEVEL, previousLevel + 1);
    this.runtimeState.set(input.reaction, {
      reaction: input.reaction,
      level,
      expiresAt: input.time + input.durationSeconds,
      sourceId: input.sourceId,
    });
    return {
      reaction: input.reaction,
      previousLevel,
      level,
      durationSeconds: input.durationSeconds,
    };
  }

  /** 消费反应：清除并返回被消费的等级；敌人身上没有该反应时返回 null。 */
  consume(reaction: ElementalReaction, time: number): { readonly consumedLevel: number } | null {
    const current = this.runtimeState.get(reaction);
    if (!this.#isFresh(current, time)) {
      this.runtimeState.delete(reaction);
      return null;
    }
    this.runtimeState.delete(reaction);
    return { consumedLevel: current.level };
  }

  /** 判断敌人当前是否带着该反应，可要求最低等级。 */
  isActive(reaction: ElementalReaction, minimumLevel: number | undefined, time: number): boolean {
    const current = this.runtimeState.get(reaction);
    if (!this.#isFresh(current, time)) {
      if (current !== undefined) this.runtimeState.delete(reaction);
      return false;
    }
    return minimumLevel === undefined || current.level >= minimumLevel;
  }

  /** 当前仍有效的全部反应状态，按添加顺序返回。 */
  snapshot(time: number): readonly ElementalReactionState[] {
    const active: ElementalReactionState[] = [];
    for (const [reaction, state] of this.runtimeState) {
      if (this.#isFresh(state, time)) active.push(state);
      else this.runtimeState.delete(reaction);
    }
    return active;
  }

  #isFresh(
    state: ElementalReactionState | undefined,
    time: number,
  ): state is ElementalReactionState {
    return state !== undefined && time < state.expiresAt;
  }
}
