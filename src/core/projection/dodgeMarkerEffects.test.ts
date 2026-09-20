import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../combat/receipt/combatReceipt';
import { projectDodgeMarkerEffects } from './dodgeMarkerEffects';

describe('闪避效果归属', () => {
  it('只沿明确的对象创建来源归属，不把同帧或同名效果算给闪避', () => {
    const receipts = new CombatReceiptCollector();
    const dodge = { kind: 'action', ownerId: 'operator-a', actionId: 'dash:first' } as const;
    const other = { kind: 'action', ownerId: 'operator-a', actionId: 'skill:other' } as const;
    const ownedBuff = { kind: 'buff', ownerId: 'operator-a', instanceId: 1 } as const;
    const nestedBuff = { kind: 'buff', ownerId: 'operator-a', instanceId: 2 } as const;
    const unrelatedBuff = { kind: 'buff', ownerId: 'operator-a', instanceId: 3 } as const;
    receipts.record({
      event: 'BuffCreated',
      frame: 10,
      time: 1,
      subject: ownedBuff,
      producedBy: dodge,
    });
    receipts.record({
      event: 'BuffCreated',
      frame: 10,
      time: 1,
      subject: nestedBuff,
      producedBy: ownedBuff,
    });
    receipts.record({
      event: 'BuffCreated',
      frame: 10,
      time: 1,
      subject: unrelatedBuff,
      producedBy: other,
    });
    receipts.record({
      event: 'BuffApplied',
      frame: 10,
      time: 1,
      producedBy: nestedBuff,
      data: { buffId: 'shared' },
    });
    receipts.record({
      event: 'BuffApplied',
      frame: 10,
      time: 1,
      producedBy: unrelatedBuff,
      data: { buffId: 'shared' },
    });
    receipts.record({
      event: 'SpChanged',
      frame: 10,
      time: 1,
      producedBy: dodge,
      data: { actualValue: 7 },
    });
    receipts.record({ event: 'SpChanged', frame: 10, time: 1, data: { actualValue: 7 } });

    expect(
      projectDodgeMarkerEffects(receipts.entries, 'operator-a', 'first').map(
        entry => entry.sequence,
      ),
    ).toEqual([3, 5]);
    expect(projectDodgeMarkerEffects(receipts.entries, 'operator-b', 'first')).toEqual([]);
  });
});
