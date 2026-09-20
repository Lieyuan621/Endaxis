import { expect, it } from 'vitest';
import { CombatReceiptCollector } from '../combat/receipt/combatReceipt';
import { projectAbilityEntityCountStatus } from './abilityEntityCountStatus';
import { CombatObjectOrigins } from './combatObjectOrigins';

it('tracks actual instances through replacement and ignores other owners and Buff changes', () => {
  const receipts = new CombatReceiptCollector();
  const spawn = (frame: number, id: number, sourceId = 'operator', abilityEntityId = 'crystal') =>
    receipts.record({
      frame,
      time: frame / 30,
      event: 'AbilityEntitySpawned',
      sourceId,
      targetId: `ability-entity:${id}`,
      subject: { kind: 'abilityEntity', instanceId: id },
      producedBy: { kind: 'operator', operatorId: sourceId },
      data: { abilityEntityId },
    });
  const finish = (frame: number, id: number) =>
    receipts.record({
      frame,
      time: frame / 30,
      event: 'AbilityEntityFinished',
      targetId: `ability-entity:${id}`,
    });
  spawn(1, 1);
  spawn(2, 2, 'other');
  spawn(2, 3, 'operator', 'other-kind');
  receipts.record({
    frame: 3,
    time: 0.1,
    event: 'BuffStackChanged',
    targetId: 'ability-entity:1',
    data: { layers: 2 },
  });
  finish(4, 1);
  spawn(4, 4);
  spawn(5, 5);
  finish(6, 4);
  finish(7, 5);
  const result = projectAbilityEntityCountStatus(receipts.entries, 8, 'operator', 'crystal');
  expect(
    result.segments.map(segment => [
      segment.startFrame,
      segment.endFrame,
      segment.entities.map(ref => ref.instanceId),
    ]),
  ).toEqual([
    [1, 4, [1]],
    [4, 5, [4]],
    [5, 6, [4, 5]],
    [6, 7, [5]],
  ]);
  expect(result.entities).toEqual([]);
  expect(
    projectAbilityEntityCountStatus(receipts.entries, 5, 'operator', 'crystal').entities.map(
      ref => ref.instanceId,
    ),
  ).toEqual([4, 5]);
  const origins = new CombatObjectOrigins(receipts.entries);
  for (const segment of result.segments)
    for (const entity of segment.entities) {
      const node = origins.get(entity);
      expect(node.fact?.event).toBe('AbilityEntitySpawned');
      expect(origins.relations(node, receipts.entries.at(-1)!.sequence)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            relation: 'producedBy',
            target: expect.objectContaining({ ref: { kind: 'operator', operatorId: 'operator' } }),
          }),
        ]),
      );
    }
});
