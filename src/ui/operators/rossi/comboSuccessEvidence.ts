/**
 * 把原生圆环 QTE 的成功回执绑定到实际按下的时间轴技能块。
 * Buff 可能在后续动作中被重复施加，不能用 Buff 来源反推哪一次输入命中了完美区间。
 */

interface PerfectComboReceiptEntry {
  readonly sequence: number;
  readonly event: string;
  readonly data?: Readonly<Record<string, boolean | number | string | null>>;
}

/** Project timeline cast ids with explicit native-branch success evidence. */
export function projectRossiComboSuccessCastIds(
  entries: readonly PerfectComboReceiptEntry[],
): ReadonlySet<string> {
  const result = new Set<string>();
  for (const entry of entries) {
    if (entry.event !== 'ComboRingQtePressed' || entry.data?.succeeded !== true) continue;
    const castId = entry.data?.sourceActionId;
    if (typeof castId !== 'string' || castId.length === 0) {
      throw new Error(`receipt ${entry.sequence} has invalid ring-QTE sourceActionId`);
    }
    result.add(castId);
  }
  return result;
}
