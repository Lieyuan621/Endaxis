/** 最后命中读数保留恰好结束于取样时刻的可见段，与旧版摘要的端点规则一致。
 * 仅用于 UI 读数；不作为模拟中 Buff 是否有效的判断。
 */
export function summarizeLastHitBuffs<
  T extends {
    readonly buffId: string;
    readonly startFrame: number;
    readonly endFrame: number;
    readonly layers: number;
  },
>(buffs: readonly T[], frame: number | null): { buffs: readonly T[]; overflow: number } {
  if (frame === null) return { buffs: [], overflow: 0 };
  const byId = new Map<string, T>();
  for (const buff of buffs) {
    if (buff.endFrame <= buff.startFrame || buff.startFrame > frame || buff.endFrame < frame)
      continue;
    const previous = byId.get(buff.buffId);
    if (previous === undefined || buff.layers > previous.layers) byId.set(buff.buffId, buff);
  }
  const unique = [...byId.values()].sort((a, b) => a.buffId.localeCompare(b.buffId));
  return { buffs: unique.slice(0, 8), overflow: Math.max(0, unique.length - 8) };
}
