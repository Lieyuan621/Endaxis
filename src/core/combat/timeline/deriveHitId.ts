/**
 * 根据技能块 ID 和伤害步骤 key 生成全局唯一的 hitId。
 * 运行时回执、命中标记和连线端点都使用同一结果。
 */
export function deriveHitId(castId: string, stepKey: string): string {
  return JSON.stringify([castId, stepKey]);
}

/**
 * 未显式命名的图伤害身份：编译期调用位置路径 + 编译图节点 ID。
 * 运行时（actionGraphExecution 绑定叶节点）与命中预览（timelineHitProjection）
 * 必须用同一规则分配，模拟后的 DamageApplied 回执才能归因到预览标记。
 */
export function deriveAnonymousDamageStepKey(callSite: string, nodeId: string): string {
  return JSON.stringify([callSite, nodeId]);
}
