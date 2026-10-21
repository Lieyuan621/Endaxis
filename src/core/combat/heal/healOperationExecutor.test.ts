import { describe, expect, it } from 'vitest';
import { numberInput } from '../../../test/compiledGraphInputs';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import { HealOperationExecutor, type HealOperationDependencies } from './healOperationExecutor';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import type { CombatStepParameters } from '../../../../packages/game-data-contract/src/actions';

const terminal = { execute: () => false, evaluate: () => false };
const definite = {
  kind: 'heal',
  parameters: {
    target: { kind: 'context', key: 'receivers' },
    healer: { kind: 'source' },
    amount: 100,
    tags: [],
  },
} as const;

function fixture(
  initialHealth: Record<string, number>,
  overrides: Partial<HealOperationDependencies> = {},
) {
  const vitals = new Map(
    Object.entries(initialHealth).map(([id, health]) => [
      id,
      new CombatVitals({
        health,
        maxHealth: 1000,
        maxPoise: 0,
        poise: 0,
        poiseRecoveryTime: 0,
        poiseRecoveryTimeMultiplier: 1,
        poiseBrokenEndTime: 0,
        poiseImmune: false,
      }),
    ]),
  );
  const receipt = new CombatReceiptCollector();
  const first = Object.keys(initialHealth)[0]!;
  const queries = new TargetContextOperationExecutor('caster', terminal, {
    listOperatorIds: () => [...vitals.keys()],
    isOperatorControlled: id => id === first,
    resolveVitals: id => vitals.get(id)!,
  });
  const targetContext = new RuntimeTargetContext();
  targetContext.set(
    'receivers',
    [...vitals.keys()].map(operatorId => ({ kind: 'operator', operatorId })),
  );
  const context = {
    blackboard: new ActionBlackboard(),
    targetContext,
    actionSourceId: 'healer',
    actionOwnerId: 'owner',
    actionInputTarget: { kind: 'operator' as const, operatorId: 'input' },
    buffSourceId: 'unrelated-buff-source',
    buffOwnerId: 'unrelated-buff-owner',
  };
  const executor = new HealOperationExecutor({
    clock: new CombatClock(),
    receipt,
    queryTargets: queries.queryTargets.bind(queries),
    resolveEntity: entityId => ({ entityId, vitals: vitals.get(entityId)! }),
    resolveSourceAttribute: () => 100,
    delegate: terminal,
    ...overrides,
  });
  return { executor, context, receipt, vitals, targetContext };
}

describe('原生治疗目标和结算', () => {
  it('逐目标治疗，保留重复项和查询顺序，跳过空间点', () => {
    const events: string[] = [];
    const f = fixture(
      { first: 500, second: 800 },
      {
        emitSuccessfulHeal: event => events.push(`${event.event}:${event.payload.targetId}`),
      },
    );
    f.targetContext.set('receivers', [
      { kind: 'operator', operatorId: 'first' },
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'operator', operatorId: 'second' },
      { kind: 'operator', operatorId: 'first' },
    ]);
    expect(f.executor.execute(definite, f.context)).toBe(true);
    expect(f.vitals.get('first')!.health).toBe(700);
    expect(f.vitals.get('second')!.health).toBe(900);
    expect(f.receipt.entries.map(entry => entry.targetId)).toEqual(['first', 'second', 'first']);
    expect(events).toEqual([
      'outputHeal:first',
      'receiveHeal:first',
      'outputHeal:second',
      'receiveHeal:second',
      'outputHeal:first',
      'receiveHeal:first',
    ]);
  });

  it('空接收组和无有效治疗者不求值；只在 alwaysNext 时强制返回成功', () => {
    const f = fixture({ receiver: 500 });
    const step = {
      ...definite,
      parameters: {
        ...definite.parameters,
        amount: numberInput({ kind: 'blackboard', key: 'missing' }),
        healer: { kind: 'context' as const, key: 'healers' },
      },
    };
    f.targetContext.set('receivers', []);
    expect(f.executor.execute(step, f.context)).toBe(false);
    f.targetContext.setSingle('receivers', { kind: 'operator', operatorId: 'receiver' });
    expect(f.executor.execute(step, f.context)).toBe(false);
    f.targetContext.set('healers', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'operator', operatorId: 'healer' },
    ]);
    expect(f.executor.execute(step, f.context)).toBe(false);
    expect(
      f.executor.execute(
        { ...step, parameters: { ...step.parameters, alwaysNext: true } },
        f.context,
      ),
    ).toBe(true);
    expect(f.receipt.entries).toHaveLength(0);
    expect(f.vitals.get('receiver')!.health).toBe(500);
  });

  it.each<readonly [CombatStepParameters['heal']['healer'], string]>([
    [{ kind: 'source' }, 'healer'],
    [{ kind: 'owner' }, 'owner'],
    [{ kind: 'inputTarget' }, 'input'],
    [{ kind: 'context', key: 'healers' }, 'selected'],
    [{ kind: 'mainCharacter' }, 'receiver'],
    [{ kind: 'currentTarget' }, 'receiver'],
  ])('治疗者按独立 ActionTarget 解析 %j', (healer, expected) => {
    const f = fixture({ receiver: 500 });
    f.targetContext.set('healers', [
      { kind: 'operator', operatorId: 'selected' },
      { kind: 'operator', operatorId: 'ignored' },
    ]);
    f.executor.execute({ ...definite, parameters: { ...definite.parameters, healer } }, f.context);
    expect(f.receipt.entries[0]).toMatchObject({ sourceId: expected, targetId: 'receiver' });
  });

  it('CurrentTarget 在每次治疗循环中绑定接收者，不读取外层当前目标', () => {
    const f = fixture({ first: 500, second: 500 });
    f.executor.execute(
      { ...definite, parameters: { ...definite.parameters, healer: { kind: 'currentTarget' } } },
      {
        ...f.context,
        currentTarget: { kind: 'operator', operatorId: 'unrelated' },
      },
    );
    expect(f.receipt.entries.map(entry => [entry.sourceId, entry.targetId])).toEqual([
      ['first', 'first'],
      ['second', 'second'],
    ]);
  });

  it('属性公式、两侧修正与治疗效率依原生顺序结算，再钳制生命', () => {
    const stages: string[] = [];
    const f = fixture(
      { receiver: 700 },
      {
        applyHealModifiers: (timing, side, calculation) => {
          stages.push(`${timing}:${side}`);
          if (timing === 'afterCalculation') calculation.value *= side === 'healer' ? 1.1 : 1.2;
        },
        resolveHealingIncrease: side => (side === 'healer' ? 0.2 : 0.3),
      },
    );
    f.context.blackboard.assign({ scale: 1.5 });
    f.executor.execute(
      {
        kind: 'heal',
        parameters: {
          target: definite.parameters.target,
          healer: { kind: 'source' },
          tags: [],
          attribute: 'will',
          multiplier: numberInput({ kind: 'blackboard', key: 'scale' }),
          addition: 10,
        },
      },
      f.context,
    );
    expect(stages).toEqual([
      'beforeCalculation:healer',
      'beforeCalculation:receiver',
      'afterCalculation:healer',
      'afterCalculation:receiver',
    ]);
    expect(f.vitals.get('receiver')!.health).toBe(1000);
    expect(f.receipt.entries[0]!.data?.requestedHealing).toBeCloseTo(316.8);
    expect(f.receipt.entries[0]!.data?.actualHealing).toBe(300);
    expect(f.receipt.entries[0]!.data?.overhealing).toBeCloseTo(16.8);
  });

  it.each([undefined, 'target'] as const)('MaxHp 公式读取正确一侧：%s', attributeSource => {
    const f = fixture(
      { receiver: 700 },
      {
        resolveSourceAttribute: (_id, attribute) => (attribute === 'maxHealth' ? 1800 : 0),
        resolveTargetAttribute: (id, attribute) => {
          expect(id).toBe('receiver');
          expect(attribute).toBe('maxHealth');
          return 1000;
        },
      },
    );
    f.executor.execute(
      {
        kind: 'heal',
        parameters: {
          target: definite.parameters.target,
          healer: { kind: 'source' },
          tags: [],
          attribute: 'maxHealth',
          attributeSource,
          multiplier: 0.12,
          addition: 0,
        },
      },
      f.context,
    );
    expect(f.receipt.entries[0]!.data?.requestedHealing).toBeCloseTo(attributeSource ? 120 : 216);
  });

  it('固定治疗不读取来源属性，满血也发布两侧事件', () => {
    const events: string[] = [];
    const f = fixture(
      { receiver: 1000 },
      {
        resolveSourceAttribute: () => {
          throw new Error('definite healing must not read attributes');
        },
        emitSuccessfulHeal: event =>
          events.push(
            `${event.event}:${event.payload.requestedHealing}:${event.payload.actualHealing}`,
          ),
      },
    );
    f.context.blackboard.assign({ value: 240 });
    f.executor.execute(
      {
        ...definite,
        parameters: {
          ...definite.parameters,
          amount: numberInput({ kind: 'blackboard', key: 'value' }),
        },
      },
      f.context,
    );
    expect(f.receipt.entries[0]!.data).toMatchObject({
      requestedHealing: 240,
      actualHealing: 0,
      overhealing: 240,
    });
    expect(events).toEqual(['outputHeal:240:0', 'receiveHeal:240:0']);
  });
});
