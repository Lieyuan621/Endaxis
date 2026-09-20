/** 护盾吸收计算；余额与次数先更新，耗尽通知最后执行，保持同步结束的原顺序。 */
import type { DamageType } from '../../game-data/operatorDefinition';
import type { BuffShieldState } from '../state/instanceState';

export const SHIELD_EPSILON = 0.00001;

export interface BuffShieldProgram {
  readonly infinityValue: boolean;
  readonly absorbAllDamageWhenConsumed: boolean;
  readonly removeBuffWhenConsumed: boolean;
}

export function refreshShieldConsumed(state: BuffShieldState, infiniteValue: boolean): void {
  state.consumed =
    (state.maxAbsorbCount >= 0 && state.remainingAbsorbCount <= 0) ||
    (!infiniteValue && state.remainingValue <= SHIELD_EPSILON);
}

export function absorbShieldDamage(
  state: BuffShieldState,
  program: BuffShieldProgram,
  damageType: DamageType,
  inputValue: number,
  finishBuff: () => void,
): number {
  if (state.consumed || inputValue <= SHIELD_EPSILON) return inputValue;
  const [ratio, scale] = state.absorptions.get(damageType) ?? [1, 1];
  if (ratio <= SHIELD_EPSILON || scale <= SHIELD_EPSILON) return inputValue;
  const configuredBlocked = ratio * inputValue;
  const cost = configuredBlocked / scale;
  let remaining: number;
  if (!program.infinityValue && state.remainingValue + SHIELD_EPSILON < cost) {
    remaining = inputValue - scale * state.remainingValue;
    state.remainingValue = 0;
  } else {
    if (!program.infinityValue) state.remainingValue -= cost;
    remaining = inputValue - configuredBlocked;
  }
  if (state.maxAbsorbCount >= 0) state.remainingAbsorbCount -= 1;
  refreshShieldConsumed(state, program.infinityValue);
  if (state.consumed && program.absorbAllDamageWhenConsumed) {
    remaining = inputValue - configuredBlocked;
  }
  remaining = Math.max(0, remaining);
  if (state.consumed && program.removeBuffWhenConsumed) finishBuff();
  return remaining;
}
