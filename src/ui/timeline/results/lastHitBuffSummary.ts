/** 最后命中读数优先使用取样时刻的新阶段；只有没有后继时才保留生命周期末端。
 * 启停、叠层和改值切段不是生命周期末端，不能让旧层数覆盖当前状态。
 * 输入已经按生效成员聚合；本处只选择阶段，不重新推测层数。
 */
export function summarizeLastHitBuffs<
  T extends {
    readonly buffId: string;
    readonly startFrame: number;
    readonly endFrame: number;
    readonly startSequence?: number;
    readonly endReason?: string;
    readonly layers: number;
  },
>(buffs: readonly T[], frame: number | null): { buffs: readonly T[]; overflow: number } {
  if (frame === null) return { buffs: [], overflow: 0 };
  const byId = new Map<string, T>();
  for (const buff of buffs) {
    if (buff.endFrame <= buff.startFrame || buff.startFrame > frame || buff.endFrame < frame)
      continue;
    if (
      buff.endFrame === frame &&
      (buff.endReason === 'enabledChanged' ||
        buff.endReason === 'stackChanged' ||
        buff.endReason === 'modifierChanged' ||
        buff.endReason === 'reapplied')
    )
      continue;
    const previous = byId.get(buff.buffId);
    const currentIsOpen = buff.endFrame > frame;
    const previousIsOpen = previous !== undefined && previous.endFrame > frame;
    if (
      previous === undefined ||
      (currentIsOpen && !previousIsOpen) ||
      (currentIsOpen === previousIsOpen &&
        (buff.startFrame > previous.startFrame ||
          (buff.startFrame === previous.startFrame &&
            (buff.startSequence ?? -1) > (previous.startSequence ?? -1))))
    )
      byId.set(buff.buffId, buff);
  }
  const unique = [...byId.values()].sort((a, b) => a.buffId.localeCompare(b.buffId));
  return { buffs: unique.slice(0, 8), overflow: Math.max(0, unique.length - 8) };
}
