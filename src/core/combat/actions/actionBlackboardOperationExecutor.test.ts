import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from './actionBlackboard';
import { ActionBlackboardOperationExecutor } from './actionBlackboardOperationExecutor';
import { ExplicitProbabilitySampleSource } from '../random/probabilitySampleSource';
import { CombatVitals } from '../resources/combatVitals';
import { StateStepper } from '../runtime/stateStepper';

const delegate = {
  execute: vi.fn(() => false),
  evaluate: vi.fn(() => false),
};

describe('ActionBlackboardOperationExecutor', () => {
  it('checks an exact Buff owner profession through the runtime operator registry', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        sourceId: 'caster',
        resolve: entityId => (entityId === 'gilberta-target' ? 'guard' : undefined),
      },
    );
    const condition = {
      kind: 'operatorRoleIn',
      target: 'buffOwner',
      roles: ['guard', 'supporter', 'caster'],
    } as const;

    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'gilberta-target',
      }),
    ).toBe(true);
    expect(() =>
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'enemy',
      }),
    ).toThrow("operatorRoleIn requires CharacterTable.profession for 'enemy'");
  });

  it('stores the integer frame exposed by the current timeline host', () => {
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor(delegate);

    expect(
      executor.execute(
        { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'music_loop' } },
        { blackboard, getCurrentTimelineFrame: () => 46 },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('music_loop')).toBe(46);
  });

  it('rejects timeline frame reads outside a skill timeline host', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);
    expect(() =>
      executor.execute(
        { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'frame' } },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow('storeCurrentTimelineFrame requires a timeline host');
  });

  it('reads the Buff owner current skill frame and returns false when no skill is active', () => {
    let currentFrame: number | undefined = 45;
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      ownerId => (ownerId === 'operator' ? currentFrame : undefined),
    );
    const blackboard = new ActionBlackboard();
    const step = {
      kind: 'storeCurrentTimelineFrame',
      parameters: { outputKey: 'frame' },
    } as const;

    expect(executor.execute(step, { blackboard, buffOwnerId: 'operator' })).toBe(true);
    expect(blackboard.getNumber('frame')).toBe(45);

    currentFrame = undefined;
    expect(executor.execute(step, { blackboard, buffOwnerId: 'operator' })).toBe(false);
    expect(blackboard.getNumber('frame')).toBe(45);
  });

  it('stores native Value and RealDelta from an sp-gain event independently', () => {
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor(delegate);

    expect(
      executor.execute(
        {
          kind: 'storeEventSpGainAmount',
          parameters: {
            outputKey: 'atb_contain_temp',
            realDeltaOutputKey: 'atb_real_delta',
          },
        },
        {
          blackboard,
          event: {
            event: 'skillSpGained' as const,
            payload: {
              sourceOperatorId: 'pogranichnik',
              source: 'skill',
              gainKind: 'gain',
              requestedAmount: 37,
              amount: 0,
            },
          },
        },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('atb_contain_temp')).toBe(37);
    expect(blackboard.getNumber('atb_real_delta')).toBe(0);
  });

  it.each(['combatActive', 'singleEnemyPresent'] as const)(
    'treats the fixed Endaxis %s invariant as satisfied',
    kind => {
      const executor = new ActionBlackboardOperationExecutor(delegate);

      expect(executor.evaluate({ kind })).toBe(true);
    },
  );

  it('compares the current Buff source and owner identities', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);
    const blackboard = new ActionBlackboard();

    expect(
      executor.evaluate(
        { kind: 'buffSourceMatchesOwner' },
        { blackboard, buffSourceId: 'operator', buffOwnerId: 'operator' },
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'buffSourceMatchesOwner' },
        { blackboard, buffSourceId: 'operator', buffOwnerId: 'abilityEntity:1' },
      ),
    ).toBe(false);
  });

  it('stores a non-converted Buff-source attribute with the native scaling order', () => {
    const reads: unknown[] = [];
    const blackboard = new ActionBlackboard({ multiplier: 2, base: 3 });
    const executor = new ActionBlackboardOperationExecutor(delegate, undefined, {
      sourceId: 'fallback',
      read: (sourceId, request) => {
        reads.push([sourceId, request.attribute, request.stage]);
        return 7.75;
      },
    });

    expect(
      executor.execute(
        {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'cryoAbnormalDamageIncrease' },
            stage: 'finalNonConverted',
            useFloor: true,
            divisor: { kind: 'constant', value: 2 },
            multiplier: { kind: 'blackboard', key: 'multiplier' },
            base: { kind: 'blackboard', key: 'base' },
            targetKey: 'result',
          },
        },
        { blackboard, buffSourceId: 'yvonne' },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('result')).toBe(9);
    expect(reads).toEqual([
      ['yvonne', { kind: 'specific', key: 'cryoAbnormalDamageIncrease' }, 'finalNonConverted'],
    ]);
  });

  it('does not read the divisor when StoreAttributeValue floor mode is disabled', () => {
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor(delegate, undefined, {
      sourceId: 'source',
      read: () => 7.75,
    });

    executor.execute(
      {
        kind: 'storeSourceAttributeValue',
        parameters: {
          attribute: { kind: 'specific', key: 'cryoAbnormalDamageIncrease' },
          stage: 'finalNonConverted',
          useFloor: false,
          divisor: { kind: 'blackboard', key: 'missing' },
          multiplier: { kind: 'constant', value: 2 },
          base: { kind: 'constant', value: 3 },
          targetKey: 'result',
        },
      },
      { blackboard },
    );

    expect(blackboard.getNumber('result')).toBe(18.5);
  });

  it('stores the action owner current entity property using the native formula order', () => {
    const blackboard = new ActionBlackboard({ multiplier: 3 });
    const reads: unknown[] = [];
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        read: (entityId, property) => {
          reads.push([entityId, property]);
          return 17;
        },
      },
    );

    expect(
      executor.execute(
        {
          kind: 'storeEntityPropertyValue',
          parameters: {
            target: 'actionOwner',
            property: 'currentHealth',
            useFloor: true,
            divisor: { kind: 'constant', value: 4 },
            multiplier: { kind: 'blackboard', key: 'multiplier' },
            base: { kind: 'constant', value: 2 },
            targetKey: 'result',
          },
        },
        { blackboard, actionOwnerId: 'enemy' },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('result')).toBe(14);
    expect(reads).toEqual([['enemy', 'currentHealth']]);
  });

  it('registers and removes an action-lifetime health floor', () => {
    const blackboard = new ActionBlackboard({ floor: 0.4 });
    const setHealthFloor = vi.fn(() => 7);
    const removeHealthFloor = vi.fn();
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { read: () => 0, setHealthFloor, removeHealthFloor },
    );
    const step = {
      kind: 'setHealthFloor' as const,
      parameters: {
        target: 'actionOwner' as const,
        mode: 'maxHealthRatio' as const,
        value: { kind: 'blackboard' as const, key: 'floor' },
      },
    };
    const context = { blackboard, actionOwnerId: 'enemy' };

    expect(executor.execute(step, context)).toBe(true);
    expect(setHealthFloor).toHaveBeenCalledWith('enemy', 'maxHealthRatio', 0.4);
    executor.end(step, context);
    expect(removeHealthFloor).toHaveBeenCalledWith('enemy', 7);
  });

  it('恢复动作宿主后只移除恢复分支的生命下限', () => {
    const originalVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      poise: 0,
      maxPoise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const ports = (vitals: CombatVitals) => ({
      read: () => vitals.health,
      setHealthFloor: (_entityId: string, mode: 'absolute' | 'maxHealthRatio', value: number) =>
        vitals.requestHealthFloor(mode === 'maxHealthRatio' ? vitals.maxHealth * value : value),
      removeHealthFloor: (_entityId: string, handle: number) => vitals.removeHealthFloor(handle),
    });
    const originalExecutor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ports(originalVitals),
    );
    const step = {
      kind: 'setHealthFloor' as const,
      parameters: {
        target: 'actionOwner' as const,
        mode: 'absolute' as const,
        value: { kind: 'constant' as const, value: 400 },
      },
    };
    const context = { blackboard: new ActionBlackboard(), actionOwnerId: 'enemy' };
    originalExecutor.execute(step, context);
    const copied = new StateStepper(
      { vitals: originalVitals.runtimeState, actions: originalExecutor.runtimeState },
      () => undefined,
    ).read();
    const restoredVitals = CombatVitals.bindRuntimeState(copied.vitals);
    const restoredExecutor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ports(restoredVitals),
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(restoredVitals.takeDamage(1000).currentHealth).toBe(0);
    expect(originalVitals.takeDamage(1000).currentHealth).toBe(400);
  });

  it('stores final and real heal event values independently', () => {
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor(delegate);
    executor.execute(
      {
        kind: 'storeEventHealValues',
        parameters: { finalHealOutputKey: 'final', realHealOutputKey: 'real' },
      },
      {
        blackboard,
        event: {
          event: 'receiveHeal' as const,
          payload: {
            sourceId: 'operator',
            targetId: 'enemy',
            requestedHealing: 100,
            actualHealing: 25,
            overhealing: 75,
            tags: [],
          },
        },
      },
    );
    expect(blackboard.getNumber('final')).toBe(100);
    expect(blackboard.getNumber('real')).toBe(25);
  });

  it.each([
    ['assign', 9, 3, 3],
    ['add', 9, 3, 12],
    ['multiply', 9, 3, 27],
    ['divide', 9, 3, 3],
    ['divide', 9, 0.00001, 0],
    ['floor', 9, 2.999999, 3],
    ['ceil', 9, 3.000001, 3],
    ['roundToInt', 9, 2.5, 2],
    ['roundToInt', 9, 3.5, 4],
  ] as const)(
    'executes native %s action blackboard semantics',
    (operation, old, value, expected) => {
      const blackboard = new ActionBlackboard({ result: old });
      const executor = new ActionBlackboardOperationExecutor({
        execute: () => false,
        evaluate: () => false,
      });

      expect(
        executor.execute(
          {
            kind: 'modifyActionValue',
            parameters: { key: 'result', operation, value: { kind: 'constant', value } },
          },
          { blackboard },
        ),
      ).toBe(true);
      expect(blackboard.getNumber('result')).toBe(expected);
    },
  );

  it('uses zero when the mutation target key is absent', () => {
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor({
      execute: () => false,
      evaluate: () => false,
    });

    executor.execute(
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'result',
          operation: 'add',
          value: { kind: 'constant', value: 2 },
        },
      },
      { blackboard },
    );

    expect(blackboard.getNumber('result')).toBe(2);
  });

  it('refreshes current Buff attribute modifiers after blackboard writes', () => {
    const refresh = vi.fn();
    const blackboard = new ActionBlackboard({ value: 1 });
    const executor = new ActionBlackboardOperationExecutor(delegate);

    executor.execute(
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'value',
          operation: 'add',
          value: { kind: 'constant', value: 2 },
        },
      },
      { blackboard, refreshCurrentBuffAttributeModifiers: refresh },
    );

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    ['add', 1.1, 2.2, Math.fround(Math.fround(1.1) + Math.fround(2.2))],
    ['multiply', 1.1, 2.2, Math.fround(Math.fround(1.1) * Math.fround(2.2))],
    ['divide', 9, 3, 3],
  ] as const)(
    'calculates two explicit operands with native %s semantics',
    (operation, left, right, expected) => {
      const blackboard = new ActionBlackboard({ left });
      const executor = new ActionBlackboardOperationExecutor(delegate);

      expect(
        executor.execute(
          {
            kind: 'calculateActionValue',
            parameters: {
              key: 'result',
              operation,
              left: { kind: 'blackboard', key: 'left' },
              right: { kind: 'constant', value: right },
            },
          },
          { blackboard },
        ),
      ).toBe(true);
      expect(blackboard.getNumber('result')).toBe(expected);
    },
  );

  it('preserves IEEE division results for two-operand calculations', () => {
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor(delegate);

    executor.execute(
      {
        kind: 'calculateActionValue',
        parameters: {
          key: 'infinity',
          operation: 'divide',
          left: { kind: 'constant', value: 1 },
          right: { kind: 'constant', value: 0 },
        },
      },
      { blackboard },
    );
    executor.execute(
      {
        kind: 'calculateActionValue',
        parameters: {
          key: 'notANumber',
          operation: 'divide',
          left: { kind: 'constant', value: 0 },
          right: { kind: 'constant', value: 0 },
        },
      },
      { blackboard },
    );

    expect(blackboard.getNumber('infinity')).toBe(Number.POSITIVE_INFINITY);
    expect(blackboard.getNumber('notANumber')).toBeNaN();
  });

  it('rejects a missing calculation operand instead of using its serialized fallback', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);

    expect(() =>
      executor.execute(
        {
          kind: 'calculateActionValue',
          parameters: {
            key: 'result',
            operation: 'add',
            left: { kind: 'blackboard', key: 'missing' },
            right: { kind: 'constant', value: 1 },
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow("action blackboard value 'missing' is missing");
  });

  it('reads SkillSetting columns with midpoint-to-even rounding and skips invalid columns', () => {
    const blackboard = new ActionBlackboard({ evenColumn: 2.5, oddColumn: 3.5, invalid: 0 });
    const refresh = vi.fn();
    const executor = new ActionBlackboardOperationExecutor(delegate);

    executor.execute(
      {
        kind: 'readSkillSettingData',
        parameters: {
          items: [
            {
              values: [10, 20, 30, 40],
              column: { kind: 'blackboard', key: 'evenColumn' },
              storeKey: 'evenResult',
            },
            {
              values: [10, 20, 30, 40],
              column: { kind: 'blackboard', key: 'oddColumn' },
              storeKey: 'oddResult',
            },
            {
              values: [10, 20, 30, 40],
              column: { kind: 'blackboard', key: 'invalid' },
              storeKey: 'untouched',
            },
          ],
        },
      },
      { blackboard, refreshCurrentBuffAttributeModifiers: refresh },
    );

    expect(blackboard.getNumber('evenResult')).toBe(20);
    expect(blackboard.getNumber('oddResult')).toBe(40);
    expect(blackboard.getNumber('untouched')).toBeUndefined();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('applies the recovered linear and saturating SkillSetting enhance formulas', () => {
    const reads: string[] = [];
    const blackboard = new ActionBlackboard();
    const executor = new ActionBlackboardOperationExecutor(delegate, undefined, {
      sourceId: 'akekuri',
      read: sourceId => {
        reads.push(sourceId);
        return sourceId === 'akekuri' ? 2 : 3;
      },
    });

    executor.execute(
      {
        kind: 'readSkillSettingData',
        parameters: {
          items: [
            {
              values: [10],
              column: { kind: 'constant', value: 1 },
              storeKey: 'linear',
              enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.25 } },
            },
            {
              values: [10],
              column: { kind: 'constant', value: 1 },
              storeKey: 'saturating',
              enhance: {
                target: 'buffOwner',
                formula: { kind: 'saturating', paramA: 2, paramB: 3 },
              },
            },
          ],
        },
      },
      { blackboard, buffOwnerId: 'party-member' },
    );

    expect(blackboard.getNumber('linear')).toBeCloseTo(15);
    expect(blackboard.getNumber('saturating')).toBeCloseTo(20);
    expect(reads).toEqual(['akekuri', 'party-member']);
  });

  it('compares dynamic action values with native float tolerance', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);
    const context = { blackboard: new ActionBlackboard({ swordCount: 3 }) };

    expect(
      executor.evaluate(
        {
          kind: 'actionValueCompare',
          left: { kind: 'blackboard', key: 'swordCount' },
          operator: 'equal',
          right: { kind: 'constant', value: 3.000009 },
        },
        context,
      ),
    ).toBe(true);
  });

  it('rejects a missing action value instead of silently choosing a branch', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);

    expect(() =>
      executor.evaluate(
        {
          kind: 'actionValueCompare',
          left: { kind: 'blackboard', key: 'missing' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow("action blackboard value 'missing' is missing");
  });

  it('evaluates probability with the native tolerance and an explicit sample stream', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      new ExplicitProbabilitySampleSource([0.500009, 0.50002]),
    );
    const condition = {
      kind: 'probability' as const,
      probability: { kind: 'constant' as const, value: 0.5 },
    };

    expect(executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toBe(true);
    expect(executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toBe(false);
  });

  it('resolves dynamic probabilities from the action blackboard', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      new ExplicitProbabilitySampleSource([0.24]),
    );

    expect(
      executor.evaluate(
        {
          kind: 'probability',
          probability: { kind: 'blackboard', key: 'procChance' },
        },
        { blackboard: new ActionBlackboard({ procChance: 0.25 }) },
      ),
    ).toBe(true);
  });

  it('does not consume a random sample for a zero probability', () => {
    const samples = new ExplicitProbabilitySampleSource([0.2]);
    const executor = new ActionBlackboardOperationExecutor(delegate, samples);
    const context = { blackboard: new ActionBlackboard() };

    expect(
      executor.evaluate(
        { kind: 'probability', probability: { kind: 'constant', value: 0 } },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        { kind: 'probability', probability: { kind: 'constant', value: 0.2 } },
        context,
      ),
    ).toBe(true);
  });

  it('rejects positive probabilities without an explicit sample source', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);

    expect(() =>
      executor.evaluate(
        { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
        { blackboard: new ActionBlackboard() },
      ),
    ).toThrow('probability requires an explicit probability sample source');
  });

  it('recursively evaluates composite conditions through the executor chain', () => {
    const evaluate = vi.fn(condition => condition.kind === 'buffStackCompare');
    const executor = new ActionBlackboardOperationExecutor({
      execute: () => false,
      evaluate,
    });

    expect(
      executor.evaluate(
        {
          kind: 'all',
          conditions: [
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'swordCount' },
              operator: 'equal',
              right: { kind: 'constant', value: 3 },
            },
            {
              kind: 'buffStackCompare',
              target: 'enemy',
              tagQueryType: 'hasAny',
              buffTags: ['Test/Tag1'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
          ],
        },
        { blackboard: new ActionBlackboard({ swordCount: 3 }) },
      ),
    ).toBe(true);
    expect(evaluate).toHaveBeenCalledOnce();
  });

  it('compares the immutable Deck attribute snapshot', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      { strength: 10, agility: 20, intellect: 100, will: 100 },
    );

    expect(
      executor.evaluate({
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      }),
    ).toBe(true);
  });

  it('rejects Deck comparisons without a build snapshot', () => {
    expect(() =>
      new ActionBlackboardOperationExecutor(delegate).evaluate({
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      }),
    ).toThrow('deckAttributeCompare requires source Deck attributes');
  });
});
