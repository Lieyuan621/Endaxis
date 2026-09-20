import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatVitals } from './combatVitals';
import { CombatVitalsConditionExecutor } from './combatVitalsConditionExecutor';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';

describe('CombatVitalsConditionExecutor', () => {
  it('compares current health and health ratio against action values', () => {
    const vitals = new CombatVitals({
      health: 400,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget: () => vitals,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const context = { blackboard: new ActionBlackboard({ threshold: 0.5 }) };

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'blackboard', key: 'threshold' },
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: 'enemy',
          valueType: 'current',
          operator: 'greater',
          value: { kind: 'constant', value: 500 },
        },
        context,
      ),
    ).toBe(false);
  });

  it('resolves a dynamic Buff source from the operation context', () => {
    const vitals = new CombatVitals({
      health: 400,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const resolveTarget = vi.fn(() => vitals);
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: 'buffSource',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.5 },
        },
        { blackboard: new ActionBlackboard(), buffSourceId: 'operator:source' },
      ),
    ).toBe(true);
    expect(resolveTarget).toHaveBeenCalledWith('buffSource', 'operator:source');
  });

  it('resolves a saved character-team target without rerunning selection', () => {
    const vitals = new CombatVitals({
      health: 400,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const resolveContextTarget = vi.fn(() => vitals);
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget: vi.fn(),
      resolveContextTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('CureTarget', { kind: 'operator', operatorId: 'ally' });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: 'contextTarget',
          contextKey: 'CureTarget',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      ),
    ).toBe(true);
    expect(resolveContextTarget).toHaveBeenCalledWith('ally');
  });

  it('resolves a saved enemy through the shared enemy vitals ledger', () => {
    const enemyVitals = new CombatVitals({
      health: 0,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const resolveTarget = vi.fn(() => enemyVitals);
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget,
      resolveContextTarget: vi.fn(),
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('smart_target', { kind: 'enemy' });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: 'contextTarget',
          contextKey: 'smart_target',
          valueType: 'current',
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      ),
    ).toBe(true);
    expect(resolveTarget).toHaveBeenCalledWith('enemy', undefined);
  });

  it('resolves the current forEach operator for a health condition', () => {
    const vitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const resolveContextTarget = vi.fn(() => vitals);
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget: vi.fn(),
      resolveContextTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: 'currentTarget',
          valueType: 'ratio',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 0.99 },
        },
        {
          blackboard: new ActionBlackboard(),
          currentTarget: { kind: 'operator', operatorId: 'controlled' },
        },
      ),
    ).toBe(true);
    expect(resolveContextTarget).toHaveBeenCalledWith('controlled');
  });

  it('compares current poise and preserves the native missing-poise fallback', () => {
    const withPoise = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 100,
      poise: 0,
      poiseRecoveryTime: 1,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const withoutPoise = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    let current = withPoise;
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget: () => current,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const condition = {
      kind: 'poiseCompare' as const,
      target: 'enemy' as const,
      returnValueIfMissing: false,
      operator: 'equal' as const,
      value: { kind: 'constant' as const, value: 0 },
    };

    expect(executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toBe(true);
    current = withoutPoise;
    expect(executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toBe(false);
    expect(
      executor.evaluate(
        { ...condition, returnValueIfMissing: true },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);
  });

  it('reads the staggered window from the shared enemy vitals ledger', () => {
    const vitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 10,
      poise: 10,
      poiseRecoveryTime: 1,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const executor = new CombatVitalsConditionExecutor({
      resolveTarget: () => vitals,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const condition = { kind: 'targetStaggered' as const, target: 'enemy' as const };
    const context = { blackboard: new ActionBlackboard() };

    expect(executor.evaluate(condition, context)).toBe(false);
    vitals.applyPoiseDelta(-10);
    vitals.beginPoiseBreakIfZero();
    expect(executor.evaluate(condition, context)).toBe(true);
  });
});
