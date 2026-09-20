/** 从已发布回执找出一次闪避实际产生的可展示效果；只沿明确记录的产生关系归属。 */
import type { CombatObjectRef, CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { combatObjectKey } from '../combat/receipt/combatObjectIdentity';

const visibleEvents = new Set([
  'BuffApplied',
  'BuffStackChanged',
  'SpChanged',
  'UltimateEnergyChanged',
  'TimeDilationStarted',
  'SkillStarted',
  'DamageApplied',
]);

/** 不按帧、操作者或 Buff 定义 ID 猜来源；缺少产生链的事实暂不归入标签。 */
export function projectDodgeMarkerEffects(
  entries: readonly CombatReceiptEntry[],
  operatorId: string,
  dodgeId: string,
): readonly CombatReceiptEntry[] {
  const producerByObject = new Map<string, CombatObjectRef>();
  for (const entry of entries) {
    if (entry.subject !== undefined && entry.producedBy !== undefined) {
      producerByObject.set(combatObjectKey(entry.subject), entry.producedBy);
    }
  }
  const targetKey = combatObjectKey({
    kind: 'action',
    ownerId: operatorId,
    actionId: `dash:${dodgeId}`,
  });
  const belongsToDodge = (producer: CombatObjectRef | undefined): boolean => {
    const visited = new Set<string>();
    while (producer !== undefined) {
      const key = combatObjectKey(producer);
      if (key === targetKey) return true;
      if (visited.has(key)) return false;
      visited.add(key);
      producer = producerByObject.get(key);
    }
    return false;
  };
  return entries.filter(
    entry => visibleEvents.has(entry.event) && belongsToDodge(entry.producedBy),
  );
}
