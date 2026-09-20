import type { SkillCastIdState } from '../state/environmentState';

/** 为单场模拟按技能实际启动顺序分配确定性施法序号。 */
export class SkillCastIdAllocator {
  readonly runtimeState: SkillCastIdState;

  constructor(restoredState: SkillCastIdState = { nextId: 1 }) {
    if (!Number.isSafeInteger(restoredState.nextId) || restoredState.nextId <= 0) {
      throw new RangeError('next skill cast id must be a positive safe integer');
    }
    this.runtimeState = restoredState;
  }

  allocate(): number {
    return allocateSkillCastId(this.runtimeState);
  }
}

export function allocateSkillCastId(state: SkillCastIdState): number {
  const result = state.nextId;
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new RangeError('skill cast id space is exhausted');
  }
  state.nextId += 1;
  return result;
}
