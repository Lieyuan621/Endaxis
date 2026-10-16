import { numberInput, conditionInput, stringInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it, vi } from 'vitest';
import { ActionBlackboard } from './actionBlackboard';
import { ActionBlackboardOperationExecutor } from './actionBlackboardOperationExecutor';
import { ExplicitProbabilitySampleSource } from '../random/probabilitySampleSource';
import { CombatVitals } from '../resources/combatVitals';
import { createStateTestSession } from '../../../test/stateTestSession';

const delegate = {
  execute: vi.fn(() => false),
  evaluate: vi.fn(() => false),
};

describe('ActionBlackboardOperationExecutor', () => {
  it('随机整数在执行时读取上下界，保留原生容差、右开边界及等值区间的取样顺序', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      new ExplicitProbabilitySampleSource([0, 0.999999, 0.5, 0]),
    );
    const blackboard = new ActionBlackboard({ min: 1.000001, max: 4.000001 });
    const step = {
      kind: 'storeRandomInteger',
      parameters: {
        key: 'choice',
        minimum: numberInput({ kind: 'blackboard', key: 'min' }),
        maximum: numberInput({ kind: 'blackboard', key: 'max' }),
      },
    } as const;
    expect(executor.execute(step, { blackboard })).toBe(true);
    expect(blackboard.getNumber('choice')).toBe(1);
    executor.execute(step, { blackboard });
    expect(blackboard.getNumber('choice')).toBe(3);
    blackboard.assign({ min: 2, max: 2 });
    executor.execute(step, { blackboard });
    expect(blackboard.getNumber('choice')).toBe(2);
    blackboard.assign({ min: -2.3, max: 1 });
    executor.execute(step, { blackboard });
    expect(blackboard.getNumber('choice')).toBe(-2);
    expect(() => executor.execute(step, { blackboard })).toThrow('exhausted');
  });
  it('固定槽位读取元素编号，空槽写默认值且每次重新读取槽位变量', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        sourceId: 'caster',
        resolve: () => 'electric',
        readSquadSlot: index => (index === 2 ? 'ally' : undefined),
      },
    );
    const blackboard = new ActionBlackboard({ slot: 2 });
    const step = {
      kind: 'storeCharacterTypeBySquadSlot',
      parameters: {
        slotIndex: numberInput({ kind: 'blackboard', key: 'slot' }),
        defaultValue: -1,
        outputKey: 'element',
      },
    } as const;
    expect(executor.execute(step, { blackboard })).toBe(true);
    expect(blackboard.getNumber('element')).toBe(1);
    blackboard.assign({ slot: 1 });
    expect(executor.execute(step, { blackboard })).toBe(true);
    expect(blackboard.getNumber('element')).toBe(-1);
  });
  it('读取角色原生类型，只写成功目标；重复执行和缺失目标不改写语义', () => {
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        sourceId: 'caster',
        resolve: () => 'electric',
        readTypeId: id => (id === 'caster' ? 'Pulse' : undefined),
      },
    );
    const blackboard = new ActionBlackboard();
    const step = {
      kind: 'storeCharacterTypeId',
      parameters: { target: 'caster', outputKey: 'type' },
    } as const;
    expect(executor.execute(step, { blackboard })).toBe(true);
    expect(blackboard.getString('type')).toBe('Pulse');
    expect(executor.execute(step, { blackboard })).toBe(true);
    expect(
      executor.execute(
        { ...step, parameters: { ...step.parameters, target: 'enemy' } },
        { blackboard },
      ),
    ).toBe(false);
    expect(
      executor.execute(
        { ...step, parameters: { ...step.parameters, target: 'currentTarget' } },
        {
          blackboard,
          currentTarget: { kind: 'operator', operatorId: 'unregistered' },
        },
      ),
    ).toBe(false);
    expect(blackboard.getString('type')).toBe('Pulse');
  });

  it('字符串比较保留大小写、空字符串和动态读取，不为缺失变量补默认值', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);
    const blackboard = new ActionBlackboard({ type: 'Pulse' });
    const condition = { kind: 'stringEquals', left: stringInput('type'), right: 'Pulse' } as const;
    expect(executor.evaluate(condition, { blackboard })).toBe(true);
    blackboard.assign({ type: 'pulse' });
    expect(executor.evaluate(condition, { blackboard })).toBe(false);
    blackboard.assign({ type: '' });
    expect(executor.evaluate({ ...condition, right: '' }, { blackboard })).toBe(true);
    expect(() =>
      executor.evaluate({ ...condition, left: stringInput('missing') }, { blackboard }),
    ).toThrow("missing string variable 'missing'");
  });

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
    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'enemy',
      }),
    ).toBe(false);
    expect(executor.evaluate(condition, { blackboard: new ActionBlackboard() })).toBe(false);

    expect(() => new ActionBlackboardOperationExecutor(delegate).evaluate(condition)).toThrow(
      'operatorRoleIn requires an operator registry',
    );
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
              sourceId: 'pogranichnik',
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
            multiplier: numberInput({ kind: 'blackboard', key: 'multiplier' }),
            base: numberInput({ kind: 'blackboard', key: 'base' }),
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
          divisor: numberInput({ kind: 'blackboard', key: 'missing' }),
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
    const queryTargets = vi.fn(() => [
      { kind: 'abilityEntity' as const, instanceId: 7 },
      { kind: 'abilityEntity' as const, instanceId: 8 },
    ]);
    const executor = new ActionBlackboardOperationExecutor(
      delegate,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        queryTargets,
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
            multiplier: numberInput({ kind: 'blackboard', key: 'multiplier' }),
            base: { kind: 'constant', value: 2 },
            targetKey: 'result',
          },
        },
        { blackboard, actionOwnerId: 'enemy' },
      ),
    ).toBe(true);
    expect(blackboard.getNumber('result')).toBe(14);
    expect(reads).toEqual([['enemy', 'currentHealth']]);
    const targeted = {
      kind: 'storeEntityPropertyValue' as const,
      parameters: {
        target: { kind: 'context' as const, key: 'soul_target' },
        property: 'maxHealth' as const,
        useFloor: false,
        divisor: { kind: 'constant' as const, value: 0 },
        multiplier: { kind: 'constant' as const, value: 2 },
        base: { kind: 'constant' as const, value: 1 },
        targetKey: 'result',
      },
    };
    expect(executor.execute(targeted, { blackboard })).toBe(true);
    expect(reads).toEqual([
      ['enemy', 'currentHealth'],
      ['ability-entity:7', 'maxHealth'],
    ]);
    expect(blackboard.getNumber('result')).toBe(35);
    queryTargets.mockReturnValue([]);
    expect(executor.execute(targeted, { blackboard })).toBe(false);
    expect(blackboard.getNumber('result')).toBe(35);
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
        value: numberInput({ kind: 'blackboard' as const, key: 'floor' }),
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
    const copied = createStateTestSession(
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
              left: numberInput({ kind: 'blackboard', key: 'left' }),
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

  it('keeps the executed add-then-multiply multiplier chain without following later writes', () => {
    const blackboard = new ActionBlackboard({ base: 0.4, bonus: 0.1, finalRate: 6 });
    const executor = new ActionBlackboardOperationExecutor(delegate);
    executor.execute(
      {
        kind: 'calculateActionValue',
        parameters: {
          key: 'finalScale',
          operation: 'add',
          left: numberInput({ kind: 'blackboard', key: 'base' }),
          right: numberInput({ kind: 'blackboard', key: 'bonus' }),
        },
      },
      { blackboard },
    );
    executor.execute(
      {
        kind: 'calculateActionValue',
        parameters: {
          key: 'finalScale',
          operation: 'multiply',
          left: numberInput({ kind: 'blackboard', key: 'finalScale' }),
          right: numberInput({ kind: 'blackboard', key: 'finalRate' }),
        },
      },
      { blackboard },
    );
    const calculation = blackboard.getValueCalculation('finalScale');
    expect(calculation).toMatchObject({
      operation: 'multiply',
      leftKey: 'finalScale',
      rightKey: 'finalRate',
      result: 3,
      leftCalculation: { operation: 'add', leftKey: 'base', rightKey: 'bonus', result: 0.5 },
    });
    const saved = structuredClone(blackboard.runtimeState);
    blackboard.assignDynamic('finalScale', 9);
    expect(ActionBlackboard.bindRuntimeState(saved).getValueCalculation('finalScale')).toEqual(
      calculation,
    );
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
            left: numberInput({ kind: 'blackboard', key: 'missing' }),
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
              column: numberInput({ kind: 'blackboard', key: 'evenColumn' }),
              storeKey: 'evenResult',
            },
            {
              values: [10, 20, 30, 40],
              column: numberInput({ kind: 'blackboard', key: 'oddColumn' }),
              storeKey: 'oddResult',
            },
            {
              values: [10, 20, 30, 40],
              column: numberInput({ kind: 'blackboard', key: 'invalid' }),
              storeKey: 'untouched',
            },
          ],
        },
      },
      { blackboard, refreshCurrentBuffAttributeModifiers: refresh },
    );

    expect(blackboard.getNumber('evenResult')).toBe(20);
    expect(blackboard.getNumber('oddResult')).toBe(40);
    expect(blackboard.getValueCalculation('oddResult')).toMatchObject({
      sourceKind: 'skillSetting',
      sourceColumn: 4,
      operation: 'multiply',
      left: 40,
      right: 1,
      result: 40,
    });
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
    expect(blackboard.getArtsIntensityFactor('linear')).toBeCloseTo(1.5);
    expect(blackboard.getArtsIntensityFactor('saturating')).toBeCloseTo(2);
    expect(reads).toEqual(['akekuri', 'party-member']);
  });

  it('保留技能表基础倍率，逐次记录实际乘数，零倍率与切面恢复不需要反除', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate, undefined, {
      sourceId: 'caster',
      read: () => 72,
    });
    const context = { blackboard: new ActionBlackboard() };
    executor.execute(
      {
        kind: 'readSkillSettingData',
        parameters: {
          items: [
            {
              values: [1.6],
              column: { kind: 'constant', value: 1 },
              storeKey: 'scale',
              enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
            },
          ],
        },
      },
      context,
    );
    for (const multiplier of [1.3, 2])
      executor.execute(
        {
          kind: 'calculateActionValue',
          parameters: {
            key: 'scale',
            operation: 'multiply',
            left: numberInput({ kind: 'blackboard', key: 'scale' }),
            right: { kind: 'constant', value: multiplier },
          },
        },
        context,
      );
    expect(context.blackboard.getArtsIntensityDetail('scale')).toMatchObject({
      baseValue: 1.6,
      multiplier: 1.72,
      intensity: 72,
    });
    expect(context.blackboard.getArtsIntensityDetail('scale')?.additionalMultiplier).toBeCloseTo(
      2.6,
    );
    const restored = ActionBlackboard.bindRuntimeState(
      structuredClone(context.blackboard.runtimeState),
    );
    expect(restored.getArtsIntensityDetail('scale')).toEqual(
      context.blackboard.getArtsIntensityDetail('scale'),
    );
    const copied = { blackboard: restored.createLocalScope({}, true) };
    executor.execute(
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'copy',
          operation: 'assign',
          value: numberInput({ kind: 'blackboard', key: 'scale' }),
        },
      },
      copied,
    );
    executor.execute(
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'copy',
          operation: 'multiply',
          value: { kind: 'constant', value: 0 },
        },
      },
      copied,
    );
    expect(copied.blackboard.getNumber('copy')).toBe(0);
    expect(copied.blackboard.getArtsIntensityDetail('copy')).toMatchObject({
      baseValue: 1.6,
      additionalMultiplier: 0,
    });
    executor.execute(
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'copy',
          operation: 'add',
          value: { kind: 'constant', value: 1 },
        },
      },
      copied,
    );
    expect(copied.blackboard.getArtsIntensityDetail('copy')).toBeUndefined();
  });

  it('treats an all-one enhanced skill-setting column as a factor, not the attack scale base', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate, undefined, {
      sourceId: 'mifu',
      read: () => 72,
    });
    const context = { blackboard: new ActionBlackboard({ scale: 6 }) };
    executor.execute(
      {
        kind: 'readSkillSettingData',
        parameters: {
          items: [
            {
              values: [1, 1, 1, 1],
              column: { kind: 'constant', value: 1 },
              storeKey: 'artsFactor',
              enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
            },
          ],
        },
      },
      context,
    );
    expect(context.blackboard.getArtsIntensityDetail('artsFactor')).toMatchObject({
      baseValue: 1,
      multiplier: 1.72,
      unitEnhancementFactor: true,
    });
    executor.execute(
      {
        kind: 'calculateActionValue',
        parameters: {
          key: 'scale',
          operation: 'multiply',
          left: numberInput({ kind: 'blackboard', key: 'scale' }),
          right: numberInput({ kind: 'blackboard', key: 'artsFactor' }),
        },
      },
      context,
    );
    executor.execute(
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'scale',
          operation: 'multiply',
          value: { kind: 'constant', value: 1.5 },
        },
      },
      context,
    );
    expect(context.blackboard.getArtsIntensityDetail('scale')).toMatchObject({
      baseValue: 6,
      multiplier: 1.72,
      additionalMultiplier: 1.5,
      unitEnhancementFactor: false,
    });
  });

  it('reads hit state only from the executing skill', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);
    const condition = { kind: 'skillHasHit' as const };
    const context = {
      blackboard: new ActionBlackboard(),
      skillExecution: { hasOutputDamageBattle: false },
    };
    expect(executor.evaluate(condition, context)).toBe(false);
    context.skillExecution.hasOutputDamageBattle = true;
    expect(executor.evaluate(condition, context)).toBe(true);
    expect(executor.evaluate(condition, { blackboard: context.blackboard })).toBe(false);
  });

  it('compares dynamic action values with native float tolerance', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);
    const context = { blackboard: new ActionBlackboard({ swordCount: 3 }) };

    expect(
      executor.evaluate(
        {
          kind: 'actionValueCompare',
          left: numberInput({ kind: 'blackboard', key: 'swordCount' }),
          operator: 'equal',
          right: { kind: 'constant', value: 3.000009 },
        },
        context,
      ),
    ).toBe(true);
    expect(
      executor.evaluate(
        {
          kind: 'actionValueCompare',
          left: { kind: 'constant', value: 16777216 },
          operator: 'equal',
          right: { kind: 'constant', value: 16777217 },
        },
        context,
      ),
    ).toBe(true);
    // 上一个float加容差后舍入到256；双精度直接相加会错误判为大于。
    expect(
      executor.evaluate(
        {
          kind: 'actionValueCompare',
          left: { kind: 'constant', value: 256 },
          operator: 'greater',
          right: { kind: 'constant', value: 255.99998474121094 },
        },
        context,
      ),
    ).toBe(false);
  });

  it('rejects a missing action value instead of silently choosing a branch', () => {
    const executor = new ActionBlackboardOperationExecutor(delegate);

    expect(() =>
      executor.evaluate(
        {
          kind: 'actionValueCompare',
          left: numberInput({ kind: 'blackboard', key: 'missing' }),
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

    const boundary = new ActionBlackboardOperationExecutor(
      delegate,
      new ExplicitProbabilitySampleSource([0.000020000001313746907, 0.50001002]),
    );
    const context = { blackboard: new ActionBlackboard() };
    // 相邻 float32 值能区分双精度容差和原生单精度相加。
    expect(
      boundary.evaluate(
        {
          kind: 'probability',
          probability: { kind: 'constant', value: 0.000010000000656873453 },
        },
        context,
      ),
    ).toBe(false);
    // 样本进入原生 Dice 比较时也已是 float。
    expect(boundary.evaluate(condition, context)).toBe(true);
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
          probability: numberInput({ kind: 'blackboard', key: 'procChance' }),
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
            conditionInput({
              kind: 'actionValueCompare',
              left: numberInput({ kind: 'blackboard', key: 'swordCount' }),
              operator: 'equal',
              right: { kind: 'constant', value: 3 },
            }),
            conditionInput({
              kind: 'buffStackCompare',
              target: 'enemy',
              tagQueryType: 'hasAny',
              buffTags: ['Test/Tag1'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            }),
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
      {
        sourceId: 'caster',
        resolve: id =>
          id === 'caster'
            ? { strength: 1000, agility: 1000.00002, intellect: 100, will: 100 }
            : id === 'recipient'
              ? { strength: 20, agility: 10, intellect: 50, will: 100 }
              : undefined,
      },
    );

    expect(
      executor.evaluate({
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      }),
    ).toBe(true);
    expect(
      executor.evaluate({
        kind: 'deckAttributeCompare',
        left: 'strength',
        operator: 'less',
        right: 'agility',
      }),
    ).toBe(true);
    const condition = {
      kind: 'deckAttributeCompare' as const,
      left: 'intellect' as const,
      operator: 'greaterOrEqual' as const,
      right: 'will' as const,
    };
    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'recipient',
        buffSourceId: 'caster',
      }),
    ).toBe(false);
    expect(
      executor.evaluate(condition, {
        blackboard: new ActionBlackboard(),
        actionOwnerId: 'enemy',
      }),
    ).toBe(false);
  });

  it('rejects Deck comparisons without a build snapshot', () => {
    expect(() =>
      new ActionBlackboardOperationExecutor(delegate).evaluate({
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      }),
    ).toThrow('deckAttributeCompare requires an operator registry');
  });
});
