/**
 * Compiler-only provenance for CreateBuffAction.passTargetGroupsToBuff.
 * Symbol keys survive the in-memory closure pass but are intentionally absent
 * from rendered game data; the compiled Buff body has already collapsed these
 * native Context identities into the fixed Endaxis scenario targets.
 */
export const COMPILED_BUFF_CAPTURED_TARGET_GROUPS = Symbol('compiledBuffCapturedTargetGroups');

export interface CompiledBuffCapturedTargetGroupsSource {
  readonly enemyKeys: readonly string[];
  readonly zeroSpaceKeys: readonly string[];
}

export interface CompiledBuffCapturedTargetGroupsCarrier {
  readonly [COMPILED_BUFF_CAPTURED_TARGET_GROUPS]?: CompiledBuffCapturedTargetGroupsSource;
}
