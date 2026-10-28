import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { ActionBlackboardOperationExecutor } from '../actions/actionBlackboardOperationExecutor';
import { lastRiteChr_0026_lastrite_combo_skillActionGraph } from '../../../data/operators/last-rite.generated';
import fluorite from '../../../data/operators/fluorite.generated';
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
    expect(resolveTarget).toHaveBeenCalledWith(
      { kind: 'operator', operatorId: 'operator:source' },
      'currentHealth',
    );
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
    expect(resolveContextTarget).toHaveBeenCalledWith(
      { kind: 'operator', operatorId: 'ally' },
      'currentHealth',
    );
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
    ).toBe(false);
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
    expect(resolveContextTarget).toHaveBeenCalledWith(
      { kind: 'operator', operatorId: 'controlled' },
      'currentHealth',
    );
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
      resolveVitals: target => (target.kind === 'enemy' ? current : withoutPoise),
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

function zeroHealthFixture(health = 0) {
  const vitals = new CombatVitals({
    health,
    maxHealth: 1000,
    maxPoise: 0,
    poise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 1,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
  const execute = vi.fn((_step: ResolvedCombatOperationStep) => true);
  const resolveVitals = vi.fn((): CombatVitals | undefined => vitals);
  const executor = new CombatVitalsConditionExecutor({
    queryTargets: (query, context) => resolveDirectActionTargets(query, context) ?? [],
    resolveTarget: () => vitals,
    resolveVitals,
    delegate: {
      execute,
      evaluate: () => {
        throw new Error('unexpected condition');
      },
    },
  });
  const targetContext = new RuntimeTargetContext();
  targetContext.setSingle('smart_target', { kind: 'enemy' });
  const context = {
    blackboard: new ActionBlackboard({ threshold: 0, recover_usp: 0, usp: 15, infliction_num: 1 }),
    targetContext,
    actionInputTarget: { kind: 'enemy' } as RuntimeTargetRef,
    requestTimelineJump: vi.fn(),
  };
  return { vitals, executor, execute, resolveVitals, context };
}

it.each(['current', 'ratio'] as const)(
  'keeps enemy %s zero-health checks on the living side without changing other comparisons',
  valueType => {
    const condition = {
      kind: 'healthCompare' as const,
      target: { kind: 'inputTarget' as const },
      valueType,
      operator: 'lessOrEqual' as const,
      value: numberInput({ kind: 'blackboard', key: 'threshold' }),
    };
    for (const health of [0, 100]) {
      const f = zeroHealthFixture(health);
      expect(f.executor.evaluate(condition, f.context)).toBe(false);
      expect(f.executor.evaluate({ ...condition, operator: 'greater' }, f.context)).toBe(true);
      expect(f.vitals.health).toBe(health);
    }
    const f = zeroHealthFixture();
    for (const target of [
      { kind: 'operator', operatorId: 'ally' },
      { kind: 'abilityEntity', instanceId: 1 },
    ] as const) {
      f.context.actionInputTarget = target;
      expect(f.executor.evaluate(condition, f.context)).toBe(true);
    }
    f.context.actionInputTarget = { kind: 'enemy' };
    expect(
      f.executor.evaluate({ ...condition, value: { kind: 'constant', value: 0.5 } }, f.context),
    ).toBe(true);
    expect(f.executor.evaluate({ ...condition, operator: 'equal' }, f.context)).toBe(true);
    expect(f.executor.evaluate({ ...condition, operator: 'less' }, f.context)).toBe(false);

    // A resolved enemy without a ledger and an empty query keep their previous fallback semantics.
    f.resolveVitals.mockReturnValue(undefined);
    expect(f.executor.evaluate(condition, f.context)).toBe(valueType === 'current');
    f.context.targetContext.set('smart_target', []);
    expect(
      f.executor.evaluate(
        { ...condition, target: { kind: 'context', key: 'smart_target' } },
        f.context,
      ),
    ).toBe(valueType === 'current');
  },
);

it('runs both generated Last Rite zero-health branches on the living side while retaining shared cleanup', () => {
  const compilation = createActionGraphCompilation(
    lastRiteChr_0026_lastrite_combo_skillActionGraph,
    1,
    'last-rite-zero-health',
  );
  for (const target of [{ kind: 'enemy' }, { kind: 'operator', operatorId: 'control' }] as const) {
    const f = zeroHealthFixture();
    f.context.actionInputTarget = target;
    f.context.targetContext.setSingle('smart_target', target);
    const runtime = new CombatActionSequenceRuntime(
      new ActionBlackboardOperationExecutor(f.executor),
      f.context,
    );
    runtime
      .createSequence(compilation.compileEntry({ $sequence: 'ifElse_5' }, 'energy'))
      .executeInstant({});
    expect(f.execute.mock.calls.length).toBe(target.kind === 'enemy' ? 0 : 1);
    expect(f.context.blackboard.getNumber('recover_usp')).toBe(target.kind === 'enemy' ? 0 : 1);
    f.execute.mockClear();
    runtime
      .createSequence(compilation.compileEntry({ $sequence: 'ifElse_14' }, 'infliction'))
      .executeInstant({});
    expect(f.execute.mock.calls.map(call => call[0].kind)).toEqual(
      target.kind === 'enemy'
        ? ['finishBuffsByTag']
        : ['triggerCustomAbilityEvent', 'finishBuffsByTag'],
    );
    expect(f.vitals.health).toBe(0);
  }
});

it('keeps the generated Fluorite bomb timeline when its ordinary enemy reaches zero HP', () => {
  const skill =
    fluorite.abilityEntityDefinitions!.abilityentity_chr_0022_bounda_normal_skill!.childSkill!;
  const compilation = createActionGraphCompilation(skill.actionGraph!, 1, 'fluorite-zero-health');
  for (const target of [{ kind: 'enemy' }, { kind: 'abilityEntity', instanceId: 1 }] as const) {
    const f = zeroHealthFixture();
    f.context.actionInputTarget = target;
    const runtime = new CombatActionSequenceRuntime(f.executor, f.context);
    runtime
      .createSequence(compilation.compileEntry({ $sequence: 'jumpTimeline_25' }, 'bomb'))
      .executeInstant({});
    if (target.kind === 'enemy') expect(f.context.requestTimelineJump).not.toHaveBeenCalled();
    else expect(f.context.requestTimelineJump).toHaveBeenCalledWith(89);
    expect(f.vitals.health).toBe(0);
  }
});
