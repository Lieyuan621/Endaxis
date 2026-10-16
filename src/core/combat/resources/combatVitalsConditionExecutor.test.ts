import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatVitals } from './combatVitals';
import { CombatVitalsConditionExecutor } from './combatVitalsConditionExecutor';
import { resolveDirectActionTargets } from '../abilities/targetContextOperationExecutor';
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget: () => vitals,
      resolveVitals: () => vitals,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const context = { blackboard: new ActionBlackboard({ threshold: 0.5 }) };

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: { kind: 'fixed', target: 'enemy' },
          valueType: 'ratio',
          operator: 'less',
          value: numberInput({ kind: 'blackboard', key: 'threshold' }),
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: { kind: 'fixed', target: 'enemy' },
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget,
      resolveVitals: resolveTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: { kind: 'source' },
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.5 },
        },
        { blackboard: new ActionBlackboard(), actionSourceId: 'operator:source' },
      ),
    ).toBe(true);
    expect(resolveTarget).toHaveBeenCalledWith({ kind: 'operator', operatorId: 'operator:source' }, 'currentHealth');
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget: vi.fn(),
      resolveVitals: resolveContextTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('CureTarget', [{ kind: 'operator', operatorId: 'ally' }, { kind: 'enemy' }]);

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: { kind: 'context', key: 'CureTarget' },
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'constant', value: 0.99 },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      ),
    ).toBe(true);
    expect(resolveContextTarget).toHaveBeenCalledWith({ kind: 'operator', operatorId: 'ally' }, 'currentHealth');
    targetContext.set('CureTarget', []);
    const emptyTargetCondition = {
      kind: 'healthCompare' as const,
      target: { kind: 'context' as const, key: 'CureTarget' },
      valueType: 'current' as const,
      operator: 'equal' as const,
      value: { kind: 'constant' as const, value: 0 },
    };
    const context = { blackboard: new ActionBlackboard(), targetContext };
    expect(executor.evaluate(emptyTargetCondition, context)).toBe(true);
    expect(executor.evaluate({ ...emptyTargetCondition, valueType: 'ratio' }, context)).toBe(false);
    expect(() =>
      executor.evaluate(
        {
          ...emptyTargetCondition,
          value: numberInput({ kind: 'blackboard', key: 'missing' }),
        },
        context,
      ),
    ).toThrow();
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget,
      resolveVitals: resolveTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('smart_target', { kind: 'enemy' });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: { kind: 'context', key: 'smart_target' },
          valueType: 'current',
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      ),
    ).toBe(true);
    expect(resolveTarget).toHaveBeenCalledWith({ kind: 'enemy' }, 'currentHealth');
    const positiveHealthCondition = {
      kind: 'healthCompare' as const,
      target: { kind: 'context' as const, key: 'smart_target' },
      valueType: 'current' as const,
      operator: 'greater' as const,
      value: { kind: 'constant' as const, value: 0 },
    };
    const context = { blackboard: new ActionBlackboard(), targetContext };
    expect(executor.evaluate(positiveHealthCondition, context)).toBe(true);
    expect(executor.evaluate({ ...positiveHealthCondition, valueType: 'ratio' }, context)).toBe(
      true,
    );
    expect(
      executor.evaluate(
        { ...positiveHealthCondition, value: { kind: 'constant', value: 1 } },
        context,
      ),
    ).toBe(false);
    expect(enemyVitals.health).toBe(0);
    targetContext.set('smart_target', []);
    expect(executor.evaluate(positiveHealthCondition, context)).toBe(false);
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget: vi.fn(),
      resolveVitals: resolveContextTarget,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });

    expect(
      executor.evaluate(
        {
          kind: 'healthCompare',
          target: { kind: 'inputTarget' },
          valueType: 'ratio',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 0.99 },
        },
        {
          blackboard: new ActionBlackboard(),
          actionInputTarget: { kind: 'operator', operatorId: 'controlled' },
        },
      ),
    ).toBe(true);
    expect(resolveContextTarget).toHaveBeenCalledWith({ kind: 'operator', operatorId: 'controlled' }, 'currentHealth');
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget: () => current,
      resolveVitals: target => target.kind === 'enemy' ? current : withoutPoise,
      delegate: { execute: vi.fn(() => false), evaluate: vi.fn(() => false) },
    });
    const condition = {
      kind: 'poiseCompare' as const,
      target: { kind: 'fixed' as const, target: 'enemy' as const },
      returnValueIfMissing: false,
      operator: 'equal' as const,
      value: { kind: 'constant' as const, value: 0 },
    };

    expect(executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toBe(true);
    // 修正器的 Target 是本次计算的对方；对干员检查时不能误读敌人的失衡值。
    expect(
      executor.evaluate(
        { ...condition, target: { kind: 'inputTarget' } },
        {
          blackboard: new ActionBlackboard(),
          actionInputTarget: { kind: 'operator', operatorId: 'attacker' },
        },
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { ...condition, target: { kind: 'inputTarget' } },
        {
          blackboard: new ActionBlackboard(),
          actionInputTarget: { kind: 'enemy' },
        },
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        { ...condition, target: { kind: 'inputTarget' } },
        {
          blackboard: new ActionBlackboard(),
          actionInputTarget: { kind: 'operator', operatorId: 'attacker' },
        },
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { ...condition, target: { kind: 'inputTarget' } },
        {
          blackboard: new ActionBlackboard(),
        },
      ),
    ).toBe(true);
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
      queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
      resolveTarget: () => vitals,
      resolveVitals: () => vitals,
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
