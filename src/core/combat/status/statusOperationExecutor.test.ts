import { describe, expect, it, vi } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import {
  StatusOperationExecutor,
  type CombatStatusOperationTarget,
} from './statusOperationExecutor';

describe('StatusOperationExecutor', () => {
  it('records the actual snapshots returned by an applyStatus owner', () => {
    const receipt = new CombatReceiptCollector();
    const target: CombatStatusOperationTarget = {
      targetId: 'enemy',
      applyStatus: vi.fn(() => ({
        statusKey: 'mark',
        reason: 'applied' as const,
        sourceId: 'operator',
        skillId: 'battleSkill',
        previous: { stacks: 1, remainingFrames: 12 },
        current: { stacks: 3, remainingFrames: 90 },
      })),
      consumeStatus: vi.fn(),
      getStacks: vi.fn(() => 0),
    };
    const executor = new StatusOperationExecutor({
      sourceId: 'operator',
      sourceActionId: 'battleSkill',
      clock: new CombatClock(),
      receipt,
      resolveTarget: () => target,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.execute({
        kind: 'applyStatus',
        parameters: {
          statusKey: 'mark',
          target: 'enemy',
          stacks: 2,
          maxStacks: 4,
          durationFrames: 90,
          modifiers: [],
        },
      }),
    ).toBe(true);
    expect(target.applyStatus).toHaveBeenCalledWith({
      sourceId: 'operator',
      skillId: 'battleSkill',
      parameters: {
        statusKey: 'mark',
        target: 'enemy',
        stacks: 2,
        maxStacks: 4,
        durationFrames: 90,
        modifiers: [],
      },
    });
    expect(receipt.entries[0]).toMatchObject({
      event: 'StatusChanged',
      sourceId: 'operator',
      targetId: 'enemy',
      data: {
        skillId: 'battleSkill',
        statusKey: 'mark',
        reason: 'applied',
        requestedStacks: 2,
        requestedDurationFrames: 90,
        requestedMaxStacks: 4,
        previousStacks: 1,
        previousRemainingFrames: 12,
        currentStacks: 3,
        currentRemainingFrames: 90,
      },
    });
  });

  it('preserves an unspecified consume count instead of inventing an all-stack value', () => {
    const receipt = new CombatReceiptCollector();
    const target: CombatStatusOperationTarget = {
      targetId: 'operator',
      applyStatus: vi.fn(),
      consumeStatus: vi.fn(() => ({
        statusKey: 'ready',
        reason: 'consumed' as const,
        sourceId: 'operator',
        skillId: 'enhancedSkill',
        previous: { stacks: 2, remainingFrames: null },
        current: { stacks: 0, remainingFrames: null },
      })),
      getStacks: vi.fn(() => 2),
    };
    const executor = new StatusOperationExecutor({
      sourceId: 'operator',
      sourceActionId: 'enhancedSkill',
      clock: new CombatClock(),
      receipt,
      resolveTarget: () => target,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.execute({
        kind: 'consumeStatus',
        parameters: { statusKey: 'ready', target: 'caster' },
      }),
    ).toBe(true);
    expect(receipt.entries[0]?.data).toMatchObject({
      reason: 'consumed',
      requestedStacks: null,
      previousStacks: 2,
      currentStacks: 0,
    });
    expect(
      executor.evaluate({
        kind: 'statusActive',
        statusKey: 'ready',
        target: 'caster',
        minimumStacks: 2,
      }),
    ).toBe(true);
  });
});
