/**
 * Compiler-only provenance for CreateBuffAction.passTargetGroupsToBuff.
 * Symbol keys survive the in-memory closure pass but are intentionally absent
 * from rendered game data. They prove possible entity kinds for Buff closure
 * compilation; runtime Context queries and their actual members remain intact.
 */
export const COMPILED_BUFF_CAPTURED_TARGET_GROUPS = Symbol('compiledBuffCapturedTargetGroups');

/** 仅供 Buff 闭包推断宿主种类；运行时仍执行原生查询，不能用种类证明替换目标身份。 */
export const COMPILED_BUFF_TARGET_KINDS = Symbol('compiledBuffTargetKinds');

export interface CompiledBuffCapturedTargetGroupsSource {
  readonly enemyKeys: readonly string[];
  readonly zeroSpaceKeys: readonly string[];
  readonly enemyOrSpatialKeys?: readonly string[];
}
