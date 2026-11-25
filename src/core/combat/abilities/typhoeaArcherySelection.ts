import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { sameRuntimeTarget } from './runtimeTargetContext';

import {
  createTyphoeaArcheryState,
  type TyphoeaArcheryState,
  type TyphoeaArcherySelectionState,
} from '../state/environmentState';

/** 原生 FullPick/FillSlots 的共同集合步骤，不执行空间搜索或每次读取时重新排序。 */
export function reconcileTyphoeaArcherySelection(
  state: TyphoeaArcherySelectionState,
  candidates: readonly RuntimeTargetRef[],
  targetCount: number,
  fullPick: boolean,
): { added: RuntimeTargetRef[]; removed: RuntimeTargetRef[] } {
  if (!Number.isSafeInteger(targetCount) || targetCount < 0)
    throw new Error(`invalid archery target count ${targetCount}`);
  const contains = (targets: readonly RuntimeTargetRef[], target: RuntimeTargetRef) =>
    targets.some(value => sameRuntimeTarget(value, target));
  const previous = state.selected;
  const selected = fullPick ? [] : previous.filter(target => contains(candidates, target));
  for (const candidate of candidates) {
    if (selected.length >= targetCount) break;
    if (!contains(selected, candidate)) selected.push(candidate);
  }
  state.selected = selected;
  return {
    added: selected.filter(target => !contains(previous, target)),
    removed: previous.filter(target => !contains(selected, target)),
  };
}

/** 原生全场注册计数：新增注册更新配置，最后一个注册结束才停止瞄准。 */
export class TyphoeaArcheryRuntime {
  constructor(readonly runtimeState: TyphoeaArcheryState = createTyphoeaArcheryState()) {}

  register(targetCount: number): number {
    if (!Number.isSafeInteger(targetCount) || targetCount < 0)
      throw new Error(`invalid archery target count ${targetCount}`);
    const state = this.runtimeState;
    if (state.registrations.size === 0) state.needsFullPick = true;
    const id = state.nextRegistrationId++;
    state.registrations.add(id);
    state.targetCount = targetCount;
    return id;
  }

  /** 返回需要结束标记的目标；不重复消费同一个动作句柄。 */
  unregister(id: number): readonly RuntimeTargetRef[] {
    const state = this.runtimeState;
    if (!state.registrations.delete(id) || state.registrations.size !== 0) return [];
    const removed = state.selected;
    state.selected = [];
    state.needsFullPick = false;
    state.targetCount = 0;
    return removed;
  }

  update(candidates: readonly RuntimeTargetRef[], requestFullPick = false) {
    const state = this.runtimeState;
    if (state.registrations.size === 0) return { added: [], removed: [] };
    const changes = reconcileTyphoeaArcherySelection(
      state,
      candidates,
      state.targetCount,
      state.needsFullPick || requestFullPick,
    );
    state.needsFullPick = false;
    return changes;
  }
}
