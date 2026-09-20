/** 优先级启用与成员计数算法。排序先取成员快照，执行 Enable/Disable 时再读取实时结束状态。 */
import type { BuffStackingState } from '../state/instanceState';

/** 先增加组计数，再执行增强动作；同步事件会看到新的组层数。 */
export function enhanceBuffStacking(state: BuffStackingState, enhance: () => void): void {
  if (state.maxStackCount > 0 && state.currentStackCount >= state.maxStackCount) return;
  state.currentStackCount += 1;
  enhance();
}

export function canGrowBuffStacking(
  state: BuffStackingState,
  id: number,
  timedGrowing: boolean,
  isFinished: () => boolean,
): boolean {
  return (
    timedGrowing &&
    state.members.includes(id) &&
    !isFinished() &&
    (state.maxStackCount <= 0 || state.currentStackCount < state.maxStackCount)
  );
}

/** 定时增长只在仍属于本组且未结束时执行。 */
export function growBuffStacking(
  state: BuffStackingState,
  canGrow: () => boolean,
  enhance: () => void,
): boolean {
  if (!canGrow()) return false;
  state.currentStackCount += 1;
  enhance();
  return true;
}

/** BeforeEnhance 可以同步改变层数，因此上限判定必须在它返回后执行。 */
export function applyTimedBuffEnhancement(
  state: BuffStackingState,
  host: {
    before(): void;
    enhance(): void;
    resetPeriod(): void;
    after(): void;
  },
): void {
  const previousCount = state.currentStackCount;
  host.before();
  enhanceBuffStacking(state, () => host.enhance());
  if (
    previousCount < state.maxStackCount &&
    state.maxStackCount > 0 &&
    state.currentStackCount >= state.maxStackCount
  )
    host.resetPeriod();
  host.after();
}

export interface BuffStackingHost {
  compare(left: number, right: number): number;
  isFinished(id: number): boolean;
  enhanceCount(id: number): number;
  resolve(id: number): {
    isFinished(): boolean;
    enable(): void;
    disable(): void;
  };
}

export function refreshBuffStackingPriority(
  state: BuffStackingState,
  enabledLimit: number,
  host: BuffStackingHost,
): void {
  let enabledCount = 0;
  const members = [...state.members]
    .sort((left, right) => host.compare(left, right))
    .map(id => host.resolve(id));
  for (const member of members) {
    if (member.isFinished()) continue;
    if (enabledCount < enabledLimit) {
      enabledCount += 1;
      member.enable();
    } else member.disable();
  }
}

export function countBuffStackingInstances(
  state: BuffStackingState,
  host: BuffStackingHost,
): number {
  return state.members.filter(id => !host.isFinished(id)).length;
}

export function countBuffStackingEnhancements(
  state: BuffStackingState,
  host: BuffStackingHost,
): number {
  return state.members
    .filter(id => !host.isFinished(id))
    .reduce((count, id) => count + host.enhanceCount(id), 0);
}
