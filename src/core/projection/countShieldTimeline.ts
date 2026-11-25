import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import type { BuffTimelineSegment } from './buffTimelineViz';

/** 显示身份不冒充某个实际 Buff；多个原生 Buff 可以共同驱动一个宿主的次数盾 UI。 */
export const COUNT_SHIELD_DISPLAY_ID = 'ui:countShield';

export function projectCountShieldTimeline(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
): BuffTimelineSegment[] {
  const active = new Map<string, BuffTimelineSegment>();
  const result: BuffTimelineSegment[] = [];
  const close = (targetId: string, frame: number, sequence?: number) => {
    const previous = active.get(targetId);
    if (!previous) return;
    if (frame > previous.startFrame)
      result.push({ ...previous, endFrame: frame, endSequence: sequence });
    active.delete(targetId);
  };
  for (const entry of entries) {
    if (entry.frame > endFrame || !entry.targetId) continue;
    if (entry.event === 'EnemyLifecycleChanged' && entry.data?.current === 'dead') {
      close(entry.targetId, entry.frame, entry.sequence);
      continue;
    }
    if (entry.event !== 'CountShieldUiChanged') continue;
    const current = entry.data?.current;
    const maximum = entry.data?.maximum;
    if (typeof current !== 'number' || typeof maximum !== 'number')
      throw new Error('count shield receipt requires numeric counts');
    const previous = active.get(entry.targetId);
    if (previous?.displayCount === current && previous.maxStackCount === maximum) continue;
    close(entry.targetId, entry.frame, entry.sequence);
    if (current <= 0) continue;
    active.set(entry.targetId, {
      targetId: entry.targetId,
      buffId: COUNT_SHIELD_DISPLAY_ID,
      instanceId: -1,
      startFrame: entry.frame,
      startSequence: entry.sequence,
      endFrame,
      enabled: true,
      enhanceCount: 0,
      layers: current,
      displayCount: current,
      maxStackCount: maximum,
      placement: 'upper',
      icon: 'endaxis:icons/icon_battle_shield',
      showInHeadBarCommon: true,
      showInSquadIcon: false,
    });
  }
  for (const id of [...active.keys()]) close(id, endFrame);
  return result;
}
