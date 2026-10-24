import type { OverlayCast } from './plan';

export interface FeedbackInput {
  type: 'battleSkill' | 'ultimate' | 'comboSkill' | 'switch' | 'attack';
  trackIndex?: number;
  at: number;
  pressed?: boolean;
}

/** 攻击和连携按队列消费，其他操作匹配对应槽位最近的一次；不推断施放结果。 */
export function matchFeedbackInput(
  casts: readonly OverlayCast[],
  input: FeedbackInput,
  time: number,
  consumed: ReadonlySet<string>,
  tolerance = 0.25,
): OverlayCast | undefined {
  const candidates = casts.filter(
    cast =>
      (input.type === 'attack'
        ? ['basicAttack', 'dive', 'finisher'].includes(cast.type)
        : cast.type === input.type) &&
      !consumed.has(cast.id) &&
      (input.type === 'comboSkill' ||
        input.type === 'attack' ||
        cast.trackIndex === input.trackIndex) &&
      Math.abs(cast.start - time) <= tolerance,
  );
  candidates.sort(
    input.type === 'comboSkill' || input.type === 'attack'
      ? (a, b) => a.start - b.start || a.trackIndex - b.trackIndex
      : (a, b) => Math.abs(a.start - time) - Math.abs(b.start - time) || a.start - b.start,
  );
  return candidates[0];
}
