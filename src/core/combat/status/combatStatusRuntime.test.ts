import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatStatusContainer } from './combatStatuses';
import { CombatClock } from '../time/combatClock';
import { CombatStatusRuntime } from './combatStatusRuntime';

function createRuntime() {
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const container = new CombatStatusContainer('operator', [
    {
      statusKey: 'mark',
      applyStacks: 1,
      maxStacks: 2,
      durationFrames: 2,
      durationStacking: 'refresh',
      consumeStacks: 'all',
    },
  ]);
  return { clock, receipt, container, runtime: new CombatStatusRuntime(container, clock, receipt) };
}

describe('CombatStatusRuntime', () => {
  it('records natural expiration at the frame where the owner removes the status', () => {
    const { clock, receipt, runtime } = createRuntime();
    runtime.applyStatus({
      sourceId: 'operator',
      skillId: 'battleSkill',
      parameters: { statusKey: 'mark', target: 'caster' },
    });

    clock.advanceFrame();
    runtime.advanceFrame();
    expect(receipt.entries).toHaveLength(0);
    clock.advanceFrame();
    runtime.advanceFrame();

    expect(receipt.entries[0]).toMatchObject({
      frame: 2,
      time: 2 / 30,
      event: 'StatusChanged',
      sourceId: 'operator',
      targetId: 'operator',
      data: {
        skillId: 'battleSkill',
        statusKey: 'mark',
        reason: 'expired',
        requestedStacks: null,
        requestedDurationFrames: null,
        requestedMaxStacks: null,
        previousStacks: 1,
        previousRemainingFrames: 1,
        currentStacks: 0,
        currentRemainingFrames: null,
      },
    });
  });

  it('rejects status modifiers until their execution path is implemented', () => {
    const { runtime } = createRuntime();
    expect(() =>
      runtime.applyStatus({
        sourceId: 'operator',
        skillId: 'battleSkill',
        parameters: {
          statusKey: 'mark',
          target: 'caster',
          modifiers: [{ kind: 'slowed' }],
        },
      }),
    ).toThrow("status 'mark' modifiers require a dedicated runtime executor");
  });
});
