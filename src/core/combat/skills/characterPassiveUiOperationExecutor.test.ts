import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CharacterPassiveUiOperationExecutor } from './characterPassiveUiOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';

describe('CharacterPassiveUiOperationExecutor', () => {
  it('records the evaluated character passive UI value without creating combat state', () => {
    const receipt = new CombatReceiptCollector();
    const delegate = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => false),
    };
    const executor = new CharacterPassiveUiOperationExecutor({
      sourceOperatorId: 'operator',
      queryTargets: () => [
        { kind: 'operator', operatorId: 'operator' },
        { kind: 'enemy', enemyId: 'enemy:second' },
      ],
      clock: new CombatClock(),
      receipt,
      delegate,
    });

    expect(
      executor.execute(
        {
          kind: 'setCharacterPassiveUiValue',
          parameters: {
            target: { kind: 'source' },
            value: numberInput({ kind: 'blackboard', key: 'layers' }),
          },
        },
        { blackboard: new ActionBlackboard({ layers: 3 }) },
      ),
    ).toBe(true);
    expect(delegate.execute).not.toHaveBeenCalled();
    expect(receipt.entries).toHaveLength(1);
    expect(receipt.entries).toContainEqual(
      expect.objectContaining({
        event: 'CharacterPassiveUiValueChanged',
        sourceId: 'operator',
        targetId: 'operator',
        data: { value: 3 },
      }),
    );
  });
  it('空目标仍成功，不读取缺失的数值或写入其他对象', () => {
    const receipt = new CombatReceiptCollector();
    const executor = new CharacterPassiveUiOperationExecutor({
      sourceOperatorId: 'operator',
      queryTargets: () => [],
      clock: new CombatClock(),
      receipt,
      delegate: { execute: () => false, evaluate: () => false },
    });
    expect(
      executor.execute(
        {
          kind: 'setCharacterPassiveUiValue',
          parameters: {
            target: { kind: 'context', key: 'victims' },
            value: numberInput({ kind: 'blackboard', key: 'missing' }),
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(receipt.entries).toHaveLength(0);
  });
});
