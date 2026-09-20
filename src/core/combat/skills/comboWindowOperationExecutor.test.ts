import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { describe, expect, it, vi } from 'vitest';

import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { ComboWindowOperationExecutor } from './comboWindowOperationExecutor';
import { ComboWindowRuntime } from './comboWindowRuntime';
import type { CombatOperationExecutor } from './skillRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { StateStepper } from '../runtime/stateStepper';

describe('ComboWindowOperationExecutor', () => {
  it('reads the first context owner and resolves that character slot without falling back', () => {
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector());
    const resolveSlot = vi.fn(() => 'ownerCombo');
    const executor = new ComboWindowOperationExecutor(
      'teammate',
      windows,
      { execute: () => true, evaluate: () => false },
      resolveSlot,
    );
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const step = {
      kind: 'openComboWindow',
      parameters: {
        nextSkillKeyFromSlot: 'comboSkill',
        ownerContextKey: 'owner',
      },
    } as const;
    targetContext.set('owner', []);
    executor.execute(step, context);
    targetContext.set('owner', [{ kind: 'enemy' }, { kind: 'operator', operatorId: 'owner' }]);
    executor.execute(step, context);
    expect(resolveSlot).not.toHaveBeenCalled();
    expect(windows.first).toBeUndefined();
    targetContext.setSingle('owner', { kind: 'operator', operatorId: 'owner' });
    executor.execute(step, context);
    expect(resolveSlot).toHaveBeenCalledWith('comboSkill', 'owner');
    expect(windows.first).toMatchObject({ operatorId: 'owner', nextSkillKey: 'ownerCombo' });
    expect(() => executor.execute(step)).toThrow('requires target context');
  });
  it('查询本角色候选，不检查队首、槽位、释放资格或暂停状态，消费/过期后变 false', () => {
    const delegate = { execute: vi.fn(() => true), evaluate: vi.fn(() => false) };
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector());
    const resolveSlot = vi.fn(() => 'differentSkill');
    const executor = new ComboWindowOperationExecutor('owner', windows, delegate, resolveSlot);
    const condition = { kind: 'casterComboPending' } as const;
    expect(executor.evaluate(condition)).toBe(false);
    windows.open('other', 'combo');
    expect(executor.evaluate(condition)).toBe(false);
    windows.open('owner', 'combo');
    expect(windows.first?.operatorId).toBe('other');
    expect(executor.evaluate(condition)).toBe(true);
    windows.setGloballyPaused(true);
    windows.advanceFrame();
    expect(executor.evaluate(condition)).toBe(true);
    windows.setGloballyPaused(false);
    windows.tryConsume('other', 'combo');
    windows.tryConsume('owner', 'combo');
    expect(executor.evaluate(condition)).toBe(false);
    const candidate = windows.open('owner', 'combo');
    candidate.remainingFrames = 0;
    expect(executor.evaluate(condition)).toBe(true);
    windows.advanceFrame();
    expect(executor.evaluate(condition)).toBe(false);
    expect(delegate.evaluate).not.toHaveBeenCalled();
    expect(resolveSlot).not.toHaveBeenCalled();
  });
  it('opens the scene queue without forwarding the step', () => {
    const delegate: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => true),
    };
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector());
    const executor = new ComboWindowOperationExecutor('rossi', windows, delegate);
    const step: ResolvedCombatStepForKind<'openComboWindow'> = {
      kind: 'openComboWindow',
      parameters: { nextSkillKey: 'comboSkillStage2' },
    };

    expect(executor.execute(step)).toBe(true);
    expect(windows.first).toMatchObject({
      operatorId: 'rossi',
      nextSkillKey: 'comboSkillStage2',
    });
    expect(delegate.execute).not.toHaveBeenCalled();
  });

  it('resolves TriggerComboSkillAction against the current combo slot at execution time', () => {
    const delegate: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => true),
    };
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector());
    const resolveCurrentSkillKey = vi.fn(() => 'enhancedComboSkill');
    const executor = new ComboWindowOperationExecutor(
      'catcher',
      windows,
      delegate,
      resolveCurrentSkillKey,
    );
    const step: ResolvedCombatStepForKind<'openComboWindow'> = {
      kind: 'openComboWindow',
      parameters: { nextSkillKeyFromSlot: 'comboSkill' },
    };

    expect(executor.execute(step)).toBe(true);
    expect(resolveCurrentSkillKey).toHaveBeenCalledWith('comboSkill', 'catcher');
    expect(windows.first).toMatchObject({
      operatorId: 'catcher',
      nextSkillKey: 'enhancedComboSkill',
    });
  });

  it('恢复动作宿主后按黑板身份注销恢复分支的连携 QTE', () => {
    const originalClock = new CombatClock();
    const originalWindows = new ComboWindowRuntime(originalClock, new CombatReceiptCollector());
    const originalExecutor = new ComboWindowOperationExecutor('rossi', originalWindows, {
      execute: () => false,
      evaluate: () => false,
    });
    const step: ResolvedCombatStepForKind<'showComboRingQte'> = {
      kind: 'showComboRingQte',
      parameters: {
        earlyDurationSeconds: { kind: 'constant', value: 0.5 },
        activeDurationSeconds: { kind: 'constant', value: 0.5 },
      },
    };
    const blackboard = new ActionBlackboard();
    originalExecutor.execute(step, { blackboard });
    const copied = new StateStepper(
      {
        clock: originalClock.runtimeState,
        windows: originalWindows.runtimeState,
        actions: originalExecutor.runtimeState,
        blackboard: blackboard.runtimeState,
      },
      () => undefined,
    ).read();
    const restoredWindows = new ComboWindowRuntime(
      new CombatClock(copied.clock),
      new CombatReceiptCollector(),
      [],
      copied.windows,
    );
    const restoredExecutor = new ComboWindowOperationExecutor(
      'rossi',
      restoredWindows,
      { execute: () => false, evaluate: () => false },
      undefined,
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, {
      blackboard: ActionBlackboard.bindRuntimeState(copied.blackboard),
    });

    expect(restoredWindows.runtimeState.ringQtes.size).toBe(0);
    expect(originalWindows.runtimeState.ringQtes.size).toBe(1);
  });
});
