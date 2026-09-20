/**
 * 根据技能块 ID 和伤害步骤 key 生成全局唯一的 hitId。
 * 运行时回执、命中标记和连线端点都使用同一结果。
 */
export function deriveHitId(castId: string, stepKey: string): string {
  return JSON.stringify([castId, stepKey]);
}
