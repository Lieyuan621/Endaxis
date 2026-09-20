import { describe, expect, it, vi } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatSemanticEventRuntime } from './combatSemanticEventRuntime';
import { CombatSemanticOutputOperationExecutor } from './combatSemanticOutputOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';

describe('CombatSemanticOutputOperationExecutor', () => {
  it('records the evaluated character passive UI value without creating combat state', () => {
    const receipt = new CombatReceiptCollector();
    const delegate = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => false),
    };
    const executor = new CombatSemanticOutputOperationExecutor({
      sourceOperatorId: 'operator',
      resolveTargetId: () => 'operator',
      semanticEvents: new CombatSemanticEventRuntime(),
      clock: new CombatClock(),
      receipt,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'blackboard', key: 'layers' } },
        },
        { blackboard: new ActionBlackboard({ layers: 3 }) },
      ),
    ).toBe(true);
    expect(delegate.execute).not.toHaveBeenCalled();
    expect(receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'CharacterPassiveUiValueChanged',
        sourceId: 'operator',
        targetId: 'operator',
        data: { value: 3 },
      }),
    );
  });
});
