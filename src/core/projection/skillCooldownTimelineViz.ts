import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';

export interface SkillCooldownTimelineSegment {
  readonly operatorId: string;
  readonly skillId: string;
  readonly castId: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly completed: boolean;
}

function stringData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function cooldownKey(operatorId: string, skillId: string): string {
  return `${operatorId}\u0000${skillId}`;
}

/**
 * 把共享技能冷却账本的实际回执投影回发起预占的时间轴技能块。
 *
 * Ready 回执可能由共享账本绑定的另一技能运行实例记录，所以关闭区间时按干员与
 * skillId 匹配，而不是误用 Ready 回执上的 castId。缺少 Ready/Refunded 的区间只画到
 * 本次模拟终点，不用静态冷却值猜测对象级时间膨胀后的现实结束帧。
 */
export function projectSkillCooldownTimelineViz(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): readonly SkillCooldownTimelineSegment[] {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }

  const open = new Map<string, SkillCooldownTimelineSegment>();
  // 清零不抹去展示归属。后续动作重新设置同一技能的冷却，仍挂回最近一次施放。
  const lastCastIds = new Map<string, string>();
  const closed: SkillCooldownTimelineSegment[] = [];

  for (const entry of entries) {
    if (
      entry.event !== 'SkillCooldownReserved' &&
      entry.event !== 'SkillCooldownReady' &&
      entry.event !== 'SkillCooldownRefunded' &&
      entry.event !== 'SkillCooldownAdjusted'
    ) {
      continue;
    }
    const operatorId = entry.sourceId;
    const skillId = stringData(entry.data, 'skillId');
    if (operatorId === undefined || skillId === undefined) continue;
    const key = cooldownKey(operatorId, skillId);

    if (entry.event === 'SkillCooldownReserved') {
      const castId = stringData(entry.data, 'castId');
      if (castId === undefined) continue;
      lastCastIds.set(key, castId);
      const previous = open.get(key);
      if (previous !== undefined) {
        closed.push({ ...previous, endFrame: entry.frame, completed: false });
      }
      open.set(key, {
        operatorId,
        skillId,
        castId,
        startFrame: entry.frame,
        endFrame,
        completed: false,
      });
      continue;
    }

    if (entry.event === 'SkillCooldownAdjusted' && entry.data?.ready !== true) {
      const castId = lastCastIds.get(key);
      if (
        !open.has(key) &&
        castId !== undefined &&
        entry.data?.ready === false &&
        typeof entry.data.remainingFrames === 'number' &&
        entry.data.remainingFrames > 0
      ) {
        open.set(key, {
          operatorId,
          skillId,
          castId,
          startFrame: entry.frame,
          endFrame,
          completed: false,
        });
      }
      continue;
    }

    const active = open.get(key);
    if (active === undefined) continue;
    open.delete(key);
    closed.push({ ...active, endFrame: entry.frame, completed: true });
  }

  return [...closed, ...open.values()].sort(
    (left, right) => left.startFrame - right.startFrame || left.castId.localeCompare(right.castId),
  );
}
