import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import type { EnemyEffectMarker } from '../../../core/projection/enemyEffectViz';
import { isPhysicalStatusRowBuff } from './physicalStatusDisplay';

const physicalIconPriority: Readonly<Record<string, number>> = {
  buff_physical_do_fracture: 500,
  buff_physical_airborne: 400,
  buff_physical_knockdown: 300,
  buff_physical_crushed: 200,
  buff_physical_no_guard: 100,
};

/** 原生明确排除头顶两栏的内部效果不画敌方持续条；无路由元数据的自定义段仍保留。 */
export function isEnemyTimelineBuffVisible(buff: BuffTimelineSegment): boolean {
  return !(buff.showInHeadBarCommon === false && buff.showInHeadBarAttached === false);
}

/** 展示分区，不推导战斗状态。四种物理异常和破防使用明确的系统身份，附着身份来自 role。
 * 分区顺序：物理异常与破防、附着、法术异常、普通状态。
 * 未识别的状态保留在普通区，不能按图标或名称猜测。
 */
export function layoutEnemyStatusRows<T extends BuffTimelineSegment>(
  buffs: readonly T[],
  markers: readonly EnemyEffectMarker[],
  attachmentIds: ReadonlySet<string>,
) {
  const lanes = new Map<T, number>();
  const groups: T[][] = [[], [], [], []];
  for (const buff of buffs) {
    const group = attachmentIds.has(buff.buffId)
      ? 1
      : isPhysicalStatusRowBuff(buff)
        ? 0
        : buff.iconStyleInSquad === 'SpellAbnormal'
          ? 2
          : 3;
    groups[group]!.push(buff);
  }
  let offset = 0;
  let attachmentRow = 1;
  let anomalyRow = 2;
  for (let group = 0; group < groups.length; group++) {
    if (group === 1) attachmentRow = offset;
    if (group === 2) anomalyRow = offset;
    const ends: number[] = [];
    for (const buff of groups[group]!.sort((a, b) => a.startFrame - b.startFrame)) {
      // 物理异常与破防共用一行；单一附着槽也固定在同一行。
      let lane = group <= 1 ? 0 : ends.findIndex(end => end <= buff.startFrame);
      if (lane < 0) lane = ends.length;
      ends[lane] = buff.durationEndFrame ?? buff.endFrame;
      lanes.set(buff, offset + lane);
    }
    // 空物理、附着、异常区也保留一行，与旧版分区顺序一致。
    offset += Math.max(group < 3 ? 1 : 0, ends.length);
  }
  // 旧版同一分区同一时刻的瞬时图标横向错开，不另挤出垂直行。
  const slots = new Map<string, number>();
  // 新版持续段与瞬时回执是独立展示身份。先为同帧开始的段保留第一个图标位，
  // 只偏移瞬时图标；段起点、持续条终点和伤害入口仍使用真实帧坐标。
  for (const buff of buffs) {
    slots.set(`${lanes.get(buff)}:${buff.startFrame}`, 1);
  }
  const markerPositions = markers.map(marker => {
    const row = marker.kind === 'reactionConsumed' ? anomalyRow : attachmentRow;
    const key = `${row}:${marker.frame}`;
    const slot = slots.get(key) ?? 0;
    slots.set(key, slot + 1);
    return { row, slot };
  });
  const iconSlots = new Map<T, number>();
  const hiddenIcons = new Set<T>();
  const physicalGroups = new Map<string, T[]>();
  for (const buff of groups[0]!) {
    const key = `${buff.targetId}:${buff.startFrame}`;
    const values = physicalGroups.get(key) ?? [];
    values.push(buff);
    physicalGroups.set(key, values);
  }
  // main 会把同帧物理异常归一成一个代表图标，并隐藏同帧持续段的重复图标。
  // v3 的回执投影仍保留全部真实 Buff 段，只在展示层选出相同的代表图标；
  // 这样不会丢失伤害归属和详情数据，也不会把多个图标横向挤到时间轴末端之外。
  for (const values of physicalGroups.values()) {
    const representative = [...values].sort(
      (left, right) =>
        (physicalIconPriority[right.buffId] ?? 0) - (physicalIconPriority[left.buffId] ?? 0),
    )[0]!;
    for (const buff of values) {
      iconSlots.set(buff, 0);
      if (buff !== representative) hiddenIcons.add(buff);
    }
  }
  return { lanes, iconSlots, hiddenIcons, markerPositions, attachmentRow, rowCount: offset };
}
