/**
 * 物理异常的显示合并：破防保留真实层数，产生它的异常提供图标。
 * 这些是游戏公共物理状态的身份，不是干员特例；不改变 Buff 生命周期或伤害归属。
 * 关联只读取产生回执，不能把同帧、同来源的两个无关 Buff 猜成一组。
 */
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  projectBuffTimelineViz,
  type BuffTimelineSegment,
  type DisplayBuffTimelineSegment,
} from '../../../core/projection/buffTimelineViz';

const NO_GUARD = 'buff_physical_no_guard';
/** 时间轴和对象来源图的物理异常入口沿用原生 termicon；Buff 自身的原生 presentation 保持原样。 */
const actionIcons: Readonly<Record<string, string>> = {
  airborne: '/icons/icon_term_ba_airborne.webp',
  knockDown: '/icons/icon_term_ba_knockdown.webp',
  crush: '/icons/icon_term_ba_crush.webp',
  fracture: '/icons/icon_term_ba_fracture.webp',
};
const physicalActions: Readonly<Record<string, string>> = {
  buff_physical_airborne: 'airborne',
  buff_physical_knockdown: 'knockDown',
  buff_physical_crushed: 'crush',
  buff_physical_do_fracture: 'fracture',
};

export function physicalStatusIconPath(buffId: string): string | undefined {
  const action = physicalActions[buffId];
  return action === undefined ? undefined : actionIcons[action];
}

/** 这一行仅包含四种物理异常和破防；不按颜色、图标或头顶栏位置判断。 */
export function isPhysicalStatusRowBuff(buff: Pick<BuffTimelineSegment, 'buffId'>): boolean {
  return buff.buffId === NO_GUARD || physicalActions[buff.buffId] !== undefined;
}

export function projectPhysicalStatusDisplay(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): readonly DisplayBuffTimelineSegment[] {
  // 倒地没有头顶栏 presentation，仍是实际创建的 Buff；补充显示元数据，不新增实例。
  const physicalEntries = entries.filter(
    entry =>
      typeof entry.data?.buffId === 'string' &&
      (entry.data.buffId === NO_GUARD || physicalActions[entry.data.buffId] !== undefined),
  );
  const segments = projectBuffTimelineViz(
    physicalEntries.map(entry => {
      const iconPath = physicalStatusIconPath(String(entry.data?.buffId));
      return iconPath === undefined || entry.event !== 'BuffApplied'
        ? entry
        : {
            ...entry,
            data: { ...entry.data, visible: true, abnormalColorType: 'Physical', iconPath },
          };
    }),
    endFrame,
  );
  if (segments.length === 0) return [];
  const bySequence = new Map(physicalEntries.map(entry => [entry.sequence, entry]));
  const actions = segments.filter(segment => physicalActions[segment.buffId] !== undefined);
  const merged = new Set<BuffTimelineSegment>();
  const result: DisplayBuffTimelineSegment[] = [];
  for (const guard of segments.filter(segment => segment.buffId === NO_GUARD)) {
    const fact =
      guard.startSequence === undefined ? undefined : bySequence.get(guard.startSequence);
    // 原生击飞/倒地 Start 直接施加破防。按本次执行者精确合并，无需为显示重建整张来源图。
    const causeRef = fact?.producedBy;
    const action =
      causeRef?.kind !== 'buff'
        ? undefined
        : actions.find(
            action =>
              action.targetId === causeRef.ownerId &&
              action.targetId === guard.targetId &&
              action.instanceId === causeRef.instanceId &&
              action.startFrame <= guard.startFrame &&
              action.endFrame >= guard.startFrame,
          );
    if (action) merged.add(action);
    const inputType = fact?.data?.physicalInflictionType;
    const iconPath =
      action?.iconPath ??
      (typeof inputType === 'string' ? actionIcons[inputType] : undefined) ??
      guard.iconPath;
    const members = action ? [action, guard] : [guard];
    result.push({
      ...guard,
      ...(iconPath === undefined ? {} : { iconPath }),
      members,
      windows: members,
    });
  }
  for (const action of actions) {
    if (merged.has(action)) continue;
    // 消费破防的异常单独保留；角标表示剩余破防，不把异常自身的一层当成破防。
    const layers = segments
      .filter(
        guard =>
          guard.buffId === NO_GUARD &&
          guard.targetId === action.targetId &&
          guard.startFrame <= action.startFrame &&
          guard.endFrame > action.startFrame,
      )
      .reduce((sum, guard) => sum + guard.layers, 0);
    result.push({ ...action, layers, members: [action], windows: [action] });
  }
  result.sort(
    (a, b) => a.startFrame - b.startFrame || (a.startSequence ?? 0) - (b.startSequence ?? 0),
  );
  const nextByTarget = new Map<string, { frame: number; nextFrame: number }>();
  for (let index = result.length - 1; index >= 0; index--) {
    const segment = result[index]!;
    const next = nextByTarget.get(segment.targetId);
    const nextFrame =
      next?.frame === segment.startFrame ? next.nextFrame : (next?.frame ?? Infinity);
    nextByTarget.set(segment.targetId, { frame: segment.startFrame, nextFrame });
    result[index] = {
      ...segment,
      durationEndFrame: Math.min(segment.durationEndFrame ?? segment.endFrame, nextFrame),
    };
  }
  return result;
}
