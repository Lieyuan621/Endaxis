/**
 * Compiler-only provenance for CreateBuffAction.passTargetGroupsToBuff.
 * Symbol keys survive the in-memory closure pass but are intentionally absent
 * from rendered game data; the compiled Buff body has already collapsed these
 * native Context identities into the fixed Endaxis scenario targets.
 */
export const COMPILED_BUFF_CAPTURED_TARGET_GROUPS = Symbol('compiledBuffCapturedTargetGroups');

/** 仅供 Buff 闭包推断宿主种类；运行时仍执行原生查询，不能用种类证明替换目标身份。 */
export const COMPILED_BUFF_TARGET_KINDS = Symbol('compiledBuffTargetKinds');

export interface CompiledBuffCapturedTargetGroupsSource {
  readonly enemyKeys: readonly string[];
  readonly zeroSpaceKeys: readonly string[];
}
