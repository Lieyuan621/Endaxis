import type { CombatReceiptEntry } from '@/core/combat/receipt/combatReceipt';
import { CombatObjectOrigins } from '@/core/projection/combatObjectOrigins';
import { PHYSICAL_INFLICTION_BUFFS } from '@/core/combat/status/physicalInfliction';
import { elementalAttachments } from '@/data/buffs/elementalAttachments';
import type { OverlayCast } from './plan';

const attachments = new Map(
  elementalAttachments.buffs.flatMap(buff =>
    buff.role?.kind === 'elementalAttachment' ? [[buff.id, buff.role.element] as const] : [],
  ),
);
const physical = new Map<string, string>(
  Object.entries(PHYSICAL_INFLICTION_BUFFS).map(([type, id]) => [id, type]),
);
physical.set('buff_physical_do_fracture', 'fracture');

/** 只汇总实际落到敌人身上的效果，按施放身份归属，不以时间相邻推测来源。 */
export function projectOverlayStatusEffects(entries: readonly CombatReceiptEntry[]) {
  const result = new Map<string, NonNullable<OverlayCast['statusEffects']>>();
  const origins = new CombatObjectOrigins(entries);
  const presentations = new Map<string, string>();
  const conversions = new Map<string, string>();
  const key = (target: string | undefined, instance: unknown) => target + ':' + instance;
  for (const entry of entries) {
    const data = entry.data;
    if (!data) continue;
    if (data.iconStyleInSquad === 'SpellAbnormal' && typeof data.abnormalColorType === 'string')
      presentations.set(key(entry.targetId, data.instanceId), data.abnormalColorType);
    if (entry.event === 'ElementalAttachmentConverted' && typeof data.consumedBuffId === 'string') {
      const from = attachments.get(data.consumedBuffId);
      if (from) conversions.set(key(entry.targetId, data.outputInstanceId), from);
    }
  }
  for (const entry of entries) {
    if (entry.targetId !== 'enemy' || !entry.data) continue;
    const data = entry.data;
    let effect: NonNullable<OverlayCast['statusEffects']>[number] | undefined;
    if (entry.event === 'ElementalInflictionApplied') {
      if (
        data.outcomeKind === 'attachmentOnly' &&
        typeof data.currentElement === 'string' &&
        Number(data.currentLayers) > 0
      )
        effect = { result: data.currentElement };
    } else if (entry.event === 'BuffApplied' || entry.event === 'BuffPresentationStarted') {
      const id = typeof data.buffId === 'string' ? data.buffId : '';
      const status =
        presentations.get(key(entry.targetId, data.instanceId)) ??
        physical.get(id) ??
        attachments.get(id);
      if (status)
        effect = { result: status, from: conversions.get(key(entry.targetId, data.instanceId)) };
    }
    if (!effect) continue;
    let castId = typeof data.castId === 'string' ? data.castId : undefined;
    if (!castId) {
      const ancestor = origins.findAncestor(
        origins.get({ kind: 'receipt', sequence: entry.sequence }),
        node => node.ref.kind === 'action',
        { relations: ['producedBy', 'originCast'], throughSequence: Infinity },
      );
      if (ancestor.status === 'found' && ancestor.node.ref.kind === 'action')
        castId = ancestor.node.ref.actionId;
    }
    if (!castId && typeof data.sourceActionId === 'string') castId = data.sourceActionId;
    if (!castId) continue;
    const list = result.get(castId) ?? [];
    if (!list.some(item => item.result === effect.result && item.from === effect.from))
      list.push(effect);
    result.set(castId, list);
  }
  return result;
}
