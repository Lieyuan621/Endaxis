import { expect, it } from 'vitest';
import type { CombatReceiptEntry } from '@/core/combat/receipt/combatReceipt';
import { elementalAttachments } from '@/data/buffs/elementalAttachments';
import { projectOverlayStatusEffects } from './statusEffects';

it('groups actual enemy effects by cast and preserves the recorded conversion output', () => {
  const attachment = elementalAttachments.buffs.find(
    buff => buff.role?.kind === 'elementalAttachment' && buff.role.element === 'heat',
  )!;
  const rows: CombatReceiptEntry[] = [];
  const add = (event: string, data: Record<string, string | number>, targetId = 'enemy') =>
    rows.push({
      sequence: rows.length,
      frame: 30,
      time: 1,
      event,
      targetId,
      data: { castId: 'cast', ...data },
    });
  add('ElementalInflictionApplied', {
    outcomeKind: 'attachmentOnly',
    currentElement: 'heat',
    currentLayers: 1,
  });
  add('ElementalInflictionApplied', {
    outcomeKind: 'attachmentOnly',
    currentElement: 'heat',
    currentLayers: 2,
  });
  add('ElementalInflictionApplied', { outcomeKind: 'burst', requestedElement: 'heat' });
  add('BuffApplied', { buffId: 'buff_physical_airborne', instanceId: 1 });
  add('BuffApplied', { buffId: 'compound', instanceId: 2 });
  add('BuffPresentationStarted', {
    buffId: 'compound-display',
    instanceId: 2,
    iconStyleInSquad: 'SpellAbnormal',
    abnormalColorType: 'Cryst',
  });
  add('ElementalAttachmentConverted', { consumedBuffId: attachment.id, outputInstanceId: 2 });
  add(
    'ElementalInflictionApplied',
    { outcomeKind: 'attachmentOnly', currentElement: 'nature', currentLayers: 1 },
    'operator',
  );
  expect(projectOverlayStatusEffects(rows).get('cast')).toEqual([
    { result: 'heat' },
    { result: 'airborne', from: undefined },
    { result: 'Cryst', from: 'heat' },
  ]);
});
