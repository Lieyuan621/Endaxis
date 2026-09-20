/** SkillAffix 引用计数和预施放请求的状态变更。 */
import type { SkillAffixState } from '../state/instanceState';

export function releaseSkillAffixReference(state: SkillAffixState): boolean {
  if (state.disposed) return false;
  return --state.references <= 0;
}

export function prepareSkillAffixRequest(
  state: SkillAffixState,
  skillCastId: number | undefined,
): void {
  if (state.disposed || state.pendingRequest || skillCastId !== state.skillCastId) return;
  state.references++;
  state.pendingRequest = true;
}

/** 返回是否需要由执行端释放等待请求持有的引用。 */
export function startSkillAffixCast(state: SkillAffixState, skillCastId: number): boolean {
  if (state.disposed) return false;
  if (skillCastId === state.skillCastId) {
    if (state.pendingRequest) state.pendingRequest = false;
    else state.references++;
    return false;
  }
  if (!state.pendingRequest) return false;
  state.pendingRequest = false;
  return true;
}
