/** 一场战斗内所有逻辑实体共用的实例编号分配器。 */
import type { AbilityEntityInstanceIdState } from '../state/environmentState';

/** 在当前分支分配身份；分配器状态必须与实体目录一起保存。 */
export function allocateAbilityEntityInstanceId(state: AbilityEntityInstanceIdState): number {
  const value = state.next;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError('ability entity instance id space is exhausted');
  }
  state.next += 1;
  return value;
}

export class AbilityEntityInstanceIdAllocator {
  readonly runtimeState: AbilityEntityInstanceIdState;

  constructor(restoredState: AbilityEntityInstanceIdState = { next: 1 }) {
    if (!Number.isSafeInteger(restoredState.next) || restoredState.next <= 0) {
      throw new RangeError('next ability entity instance id must be a positive safe integer');
    }
    this.runtimeState = restoredState;
  }

  allocate(): number {
    return allocateAbilityEntityInstanceId(this.runtimeState);
  }
}
