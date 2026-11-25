import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { describe, expect, it, vi } from 'vitest';

import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { ComboWindowOperationExecutor } from './comboWindowOperationExecutor';
import { ComboWindowRuntime } from './comboWindowRuntime';
import type { CombatOperationExecutor } from './skillRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { resolveDirectActionTargets } from '../abilities/targetContextOperationExecutor';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';

describe('ComboWindowOperationExecutor', () => {
  it('原生动作只读首个Owner，按当前槽及冷却门禁入队，并冻结输入与独立触发目标', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const windows = new ComboWindowRuntime(clock, receipt, 5);
    const targets = new RuntimeTargetContext();
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: targets,
      actionOwnerId: 'buff-owner',
      actionSourceId: 'different-source',
    };
    let current = 'first-combo';
    let ready = false;
    const resolveSlot = vi.fn(() => current);
    const query = vi.fn((q: Parameters<NonNullable<CombatOperationExecutor['queryTargets']>>[0]) =>
      q.kind === 'battleMainTarget'
        ? [{ kind: 'enemy' as const, enemyId: 'enemy:secondary' }]
        : resolveDirectActionTargets(q, context, 'different-source')!,
    );
    const executor = new ComboWindowOperationExecutor(
      'different-source',
      windows,
      { execute: () => false, evaluate: () => false },
      resolveSlot,
      query,
      () => ready,
    );
    const step = {
      kind: 'openComboWindow' as const,
      parameters: {
        nextSkillKeyFromSlot: 'comboSkill' as const,
        owner: { kind: 'context' as const, key: 'owners' },
        target: { kind: 'context' as const, key: 'target' },
        trigger: { kind: 'battleMainTarget' as const },
      },
    };
    targets.set('owners', [
      { kind: 'enemy', enemyId: 'enemy' },
      { kind: 'operator', operatorId: 'owner' },
    ]);
    expect(executor.execute(step, context)).toBe(false);
    expect(resolveSlot).not.toHaveBeenCalled();
    targets.set('owners', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'operator', operatorId: 'owner' },
    ]);
    expect(executor.execute(step, context)).toBe(false);
    expect(query.mock.calls.at(-1)?.[0]).toEqual(step.parameters.owner);
    ready = true;
    targets.setSingle('target', { kind: 'operator', operatorId: 'input-target' });
    expect(executor.execute(step, context)).toBe(true);
    expect(windows.first).toMatchObject({
      operatorId: 'owner',
      nextSkillKey: 'first-combo',
      nativeCondition: {
        inputTargets: [{ kind: 'operator', operatorId: 'input-target' }],
        triggerTargets: [{ kind: 'enemy', enemyId: 'enemy:secondary' }],
        assignPairs: null,
      },
    });
    current = 'replacement-combo';
    const withoutTrigger = { ...step, parameters: { ...step.parameters, trigger: undefined } };
    query.mockClear();
    executor.execute(withoutTrigger, context);
    expect(query.mock.calls.map(([q]) => q)).not.toContainEqual({ kind: 'battleMainTarget' });
    const restored = new ComboWindowRuntime(
      clock,
      receipt,
      5,
      [],
      structuredClone(windows.runtimeState),
    );
    targets.setSingle('target', { kind: 'enemy', enemyId: 'enemy' });
    expect(restored.first).toMatchObject({
      nextSkillKey: 'replacement-combo',
      nativeCondition: {
        inputTargets: [{ kind: 'operator', operatorId: 'input-target' }],
        triggerTargets: null,
      },
    });
  });

  it.each([0, 2])('目标组长度 %s 原样复制为一个候选', count => {
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
    const allTargets: RuntimeTargetRef[] = [
      { kind: 'enemy', enemyId: 'enemy' },
      { kind: 'operator', operatorId: 'other' },
    ];
    const group = allTargets.slice(0, count);
    const executor = new ComboWindowOperationExecutor(
      'owner',
      windows,
      { execute: () => false, evaluate: () => false },
      () => 'combo',
      query => (query.kind === 'owner' ? [{ kind: 'operator', operatorId: 'owner' }] : group),
      () => true,
    );
    expect(
      executor.execute(
        {
          kind: 'openComboWindow',
          parameters: {
            nextSkillKeyFromSlot: 'comboSkill',
            owner: { kind: 'owner' },
            target: { kind: 'inputTarget' },
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
    expect(windows.pending).toHaveLength(1);
    expect(windows.first?.nativeCondition?.inputTargets).toEqual(group);
    group.push({ kind: 'enemy', enemyId: 'enemy:later' });
    expect(windows.first?.nativeCondition?.inputTargets).toHaveLength(count);
  });
  it('reads the first context owner and resolves that character slot without falling back', () => {
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
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
    targetContext.set('owner', [
      { kind: 'enemy', enemyId: 'enemy' },
      { kind: 'operator', operatorId: 'owner' },
    ]);
    executor.execute(step, context);
    expect(resolveSlot).not.toHaveBeenCalled();
    expect(windows.first).toBeUndefined();
    targetContext.set('owner', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'operator', operatorId: 'owner' },
    ]);
    executor.execute(step, context);
    expect(resolveSlot).toHaveBeenCalledWith('comboSkill', 'owner');
    expect(windows.first).toMatchObject({ operatorId: 'owner', nextSkillKey: 'ownerCombo' });
    expect(() => executor.execute(step)).toThrow('requires target context');
  });
  it('查询本角色候选，不检查队首、槽位、释放资格或暂停状态，消费/过期后变 false', () => {
    const delegate = { execute: vi.fn(() => true), evaluate: vi.fn(() => false) };
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
    const resolveSlot = vi.fn(() => 'differentSkill');
    const targetContext = new RuntimeTargetContext();
    targetContext.set('candidate', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'operator', operatorId: 'owner' },
    ]);
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const executor = new ComboWindowOperationExecutor('other', windows, delegate, resolveSlot, () =>
      targetContext.get('candidate'),
    );
    const condition = {
      kind: 'comboSkillPending',
      target: { kind: 'context', key: 'candidate' },
    } as const;
    expect(executor.evaluate(condition, context)).toBe(false);
    windows.open('other', 'combo');
    expect(executor.evaluate(condition, context)).toBe(false);
    windows.open('owner', 'combo');
    expect(windows.first?.operatorId).toBe('other');
    expect(executor.evaluate(condition, context)).toBe(true);
    windows.setGloballyPaused(true);
    windows.advanceFrame();
    expect(executor.evaluate(condition, context)).toBe(true);
    windows.setGloballyPaused(false);
    windows.tryConsume('other', 'combo');
    windows.tryConsume('owner', 'combo');
    expect(executor.evaluate(condition, context)).toBe(false);
    const candidate = windows.open('owner', 'combo');
    candidate.remainingFrames = 0;
    expect(executor.evaluate(condition, context)).toBe(true);
    windows.advanceFrame();
    expect(executor.evaluate(condition, context)).toBe(false);
    expect(delegate.evaluate).not.toHaveBeenCalled();
    expect(resolveSlot).not.toHaveBeenCalled();
  });
  it('opens the scene queue without forwarding the step', () => {
    const delegate: CombatOperationExecutor = {
      execute: vi.fn(() => true),
      evaluate: vi.fn(() => true),
    };
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
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
    const windows = new ComboWindowRuntime(new CombatClock(), new CombatReceiptCollector(), 5);
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
});
