import type { BuffAppliedEvent } from './buffOperationExecutor';

/** CanTerminateBuffContext，每次事件分配独立标志，不进入持久战斗状态。 */
export interface BeforeBuffImmunityEvent extends BuffAppliedEvent {
  readonly termination: { isTerminated: boolean };
}
export interface BeforeBuffImmunityEvents {
  readonly beforeOutput?: (event: BeforeBuffImmunityEvent) => void;
  readonly beforeAdded?: (event: BeforeBuffImmunityEvent) => void;
}

/** 原生先来源后接收；取消来源阶段后不再发布接收阶段，两者都先于免疫及添加冷却。 */
export function publishBeforeBuffImmunity(
  event: BuffAppliedEvent,
  hooks?: BeforeBuffImmunityEvents,
): boolean {
  if (!hooks?.beforeOutput && !hooks?.beforeAdded) return true;
  // CanTerminateBuffContext没有AddBuffContext的isExtra字段。
  const { isExtra: _isExtra, ...info } = event;
  const output: BeforeBuffImmunityEvent = { ...info, termination: { isTerminated: false } };
  hooks?.beforeOutput?.(output);
  if (output.termination.isTerminated) return false;
  const added: BeforeBuffImmunityEvent = { ...info, termination: { isTerminated: false } };
  hooks?.beforeAdded?.(added);
  return !added.termination.isTerminated;
}
