import { describe, expect, it } from 'vitest';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import { HealOperationExecutor } from './healOperationExecutor';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';

const terminal = {
  execute: () => false,
  evaluate: () => false,
};

function vitals(health: number) {
  return new CombatVitals({
    health,
    maxHealth: 1000,
    maxPoise: 0,
    poise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 0,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
}

describe('HealOperationExecutor', () => {
  it('uses the Buff owner and target attribute for an enemy self-heal', () => {
    const enemy = vitals(400);
    const events: Array<{ sourceId: string; targetId: string }> = [];
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:caster',
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      resolveSourceAttribute: () => {
        throw new Error('target-sourced healing must not read the caster panel');
      },
      resolveTargetAttribute: (targetId, attribute) => {
        expect(targetId).toBe('enemy');
        expect(attribute).toBe('maxHealth');
        return enemy.maxHealth;
      },
      resolveTarget: target => {
        expect(target).toBe('enemy');
        return { operatorId: 'enemy', vitals: enemy };
      },
      emitSuccessfulHeal: event =>
        events.push({ sourceId: event.payload.sourceId, targetId: event.payload.targetId }),
      delegate: terminal,
    });
    const blackboard = new ActionBlackboard({ eny_heal_ratio: 0.05 });

    expect(
      executor.execute(
        {
          kind: 'heal',
          parameters: {
            target: 'enemy',
            source: 'buffOwner',
            attribute: 'maxHealth',
            attributeSource: 'target',
            multiplier: { kind: 'blackboard', key: 'eny_heal_ratio' },
            addition: 0,
            tags: [],
          },
        },
        { blackboard, buffOwnerId: 'enemy' },
      ),
    ).toBe(true);
    expect(enemy.health).toBe(450);
    expect(events).toEqual([
      { sourceId: 'enemy', targetId: 'enemy' },
      { sourceId: 'enemy', targetId: 'enemy' },
    ]);
  });

  it('heals the operator identity saved in Context without reselecting', () => {
    const savedTarget = vitals(600);
    const otherTarget = vitals(100);
    const targetContext = new RuntimeTargetContext();
    targetContext.set('CureTarget', [{ kind: 'operator', operatorId: 'operator:saved' }]);
    const resolved: string[] = [];
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:ember',
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      resolveSourceAttribute: () => 100,
      resolveTarget: () => {
        throw new Error('context healing must not run a role selector');
      },
      resolveContextTarget: operatorId => {
        resolved.push(operatorId);
        return {
          operatorId,
          vitals: operatorId === 'operator:saved' ? savedTarget : otherTarget,
        };
      },
      delegate: terminal,
    });

    expect(
      executor.execute(
        {
          kind: 'heal',
          parameters: {
            target: 'contextTarget',
            contextKey: 'CureTarget',
            amount: 200,
            tags: [],
          },
        },
        { blackboard: new ActionBlackboard(), targetContext },
      ),
    ).toBe(true);
    expect(resolved).toEqual(['operator:saved']);
    expect(savedTarget.health).toBe(800);
    expect(otherTarget.health).toBe(100);
  });

  it('preserves alwaysNext when a context query saved no target', () => {
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:ember',
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      resolveSourceAttribute: () => 0,
      resolveTarget: () => {
        throw new Error('context healing must not run a role selector');
      },
      resolveContextTarget: () => {
        throw new Error('empty context must not resolve an operator');
      },
      delegate: terminal,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.set('CureTarget', []);
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext,
    };
    const step = {
      kind: 'heal' as const,
      parameters: {
        target: 'contextTarget' as const,
        contextKey: 'CureTarget',
        amount: 200,
        tags: [],
      },
    };
    expect(executor.execute(step, context)).toBe(false);
    expect(
      executor.execute({ ...step, parameters: { ...step.parameters, alwaysNext: true } }, context),
    ).toBe(true);
  });

  it('resolves attribute formula and records actual plus overhealing', () => {
    const target = vitals(900);
    const receipt = new CombatReceiptCollector();
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:healer',
      clock: new CombatClock(),
      receipt,
      resolveSourceAttribute: (_sourceId, attribute) => (attribute === 'will' ? 100 : 0),
      resolveTarget: () => ({ operatorId: 'operator:target', vitals: target }),
      delegate: terminal,
    });

    expect(
      executor.execute(
        {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            attribute: 'will',
            multiplier: { kind: 'blackboard', key: 'scale' },
            addition: 10,
            tags: ['Test/TagNegative1'],
          },
        },
        { blackboard: new ActionBlackboard({ scale: 1.5 }) },
      ),
    ).toBe(true);
    expect(target.health).toBe(1000);
    expect(receipt.entries[0]).toMatchObject({
      event: 'HealingApplied',
      sourceId: 'operator:healer',
      targetId: 'operator:target',
      data: {
        requestedHealing: 160,
        actualHealing: 100,
        overhealing: 60,
      },
    });
  });

  it('records a full-health heal instead of suppressing it', () => {
    const target = vitals(1000);
    const receipt = new CombatReceiptCollector();
    const events: string[] = [];
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:healer',
      clock: new CombatClock(),
      receipt,
      resolveSourceAttribute: () => 100,
      resolveTarget: () => ({ operatorId: 'operator:target', vitals: target }),
      emitSuccessfulHeal: event => {
        events.push(
          `${event.event}:${event.payload.sourceId}->${event.payload.targetId}:${event.payload.requestedHealing}:${event.payload.actualHealing}`,
        );
      },
      delegate: terminal,
    });

    executor.execute({
      kind: 'heal',
      parameters: {
        target: 'caster',
        attribute: 'will',
        multiplier: 1,
        addition: 0,
        tags: [],
      },
    });

    expect(receipt.entries[0]?.data).toMatchObject({
      requestedHealing: 100,
      actualHealing: 0,
      overhealing: 100,
    });
    expect(events).toEqual([
      'outputHeal:operator:healer->operator:target:100:0',
      'receiveHeal:operator:healer->operator:target:100:0',
    ]);
  });

  it('uses the source maximum health for native MaxHp healing formulas', () => {
    const target = vitals(700);
    const receipt = new CombatReceiptCollector();
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:healer',
      clock: new CombatClock(),
      receipt,
      resolveSourceAttribute: (_sourceId, attribute) => (attribute === 'maxHealth' ? 1800 : 0),
      resolveTarget: () => ({ operatorId: 'operator:target', vitals: target }),
      delegate: terminal,
    });

    executor.execute(
      {
        kind: 'heal',
        parameters: {
          target: 'caster',
          attribute: 'maxHealth',
          multiplier: { kind: 'blackboard', key: 'heal' },
          addition: 0,
          tags: [],
        },
      },
      { blackboard: new ActionBlackboard({ heal: 0.12 }) },
    );

    expect(receipt.entries[0]?.data).toMatchObject({
      attribute: 'maxHealth',
      attributeValue: 1800,
      requestedHealing: 216,
      actualHealing: 216,
    });
  });

  it('passes the current Buff source identity to a buffSource heal target', () => {
    const target = vitals(800);
    const reached: Array<[string, string | undefined]> = [];
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:runtime',
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      resolveSourceAttribute: () => 100,
      resolveTarget: (role, buffSourceId) => {
        reached.push([role, buffSourceId]);
        return { operatorId: buffSourceId ?? '<missing>', vitals: target };
      },
      delegate: terminal,
    });

    executor.execute(
      {
        kind: 'heal',
        parameters: {
          target: 'buffSource',
          attribute: 'will',
          multiplier: 1,
          addition: 0,
          alwaysNext: false,
          tags: [],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        buffSourceId: 'operator:original-source',
      },
    );

    expect(reached).toEqual([['buffSource', 'operator:original-source']]);
    expect(target.health).toBe(900);
  });

  it('passes the current Buff owner identity to a buffOwner heal target', () => {
    const target = vitals(800);
    const reached: Array<[string, string | undefined, string | undefined]> = [];
    const receipt = new CombatReceiptCollector();
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:runtime',
      clock: new CombatClock(),
      receipt,
      resolveSourceAttribute: sourceId => (sourceId === 'operator:source' ? 100 : 1),
      resolveTarget: (role, buffSourceId, buffOwnerId) => {
        reached.push([role, buffSourceId, buffOwnerId]);
        return { operatorId: buffOwnerId ?? '<missing>', vitals: target };
      },
      delegate: terminal,
    });

    executor.execute(
      {
        kind: 'heal',
        parameters: {
          target: 'buffOwner',
          attribute: 'will',
          multiplier: 1,
          addition: 0,
          alwaysNext: false,
          tags: [],
        },
      },
      {
        blackboard: new ActionBlackboard(),
        buffSourceId: 'operator:source',
        buffOwnerId: 'operator:aura-recipient',
      },
    );

    expect(reached).toEqual([['buffOwner', 'operator:source', 'operator:aura-recipient']]);
    expect(target.health).toBe(900);
    expect(receipt.entries[0]).toMatchObject({
      sourceId: 'operator:source',
      targetId: 'operator:aura-recipient',
    });
  });

  it('applies both heal-modifier sides before writing the health ledger', () => {
    const target = vitals(700);
    const stages: string[] = [];
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:healer',
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      resolveSourceAttribute: () => 100,
      resolveTarget: () => ({ operatorId: 'operator:target', vitals: target }),
      applyHealModifiers: (timing, side, context) => {
        stages.push(`${timing}:${side}`);
        if (timing === 'afterCalculation') context.value *= side === 'healer' ? 1.1 : 1.2;
      },
      resolveHealingIncrease: side => (side === 'healer' ? 0.2 : 0.3),
      delegate: terminal,
    });

    executor.execute({
      kind: 'heal',
      parameters: {
        target: 'caster',
        attribute: 'will',
        multiplier: 1,
        addition: 0,
        alwaysNext: true,
        tags: [],
      },
    });

    expect(stages).toEqual([
      'beforeCalculation:healer',
      'beforeCalculation:receiver',
      'afterCalculation:healer',
      'afterCalculation:receiver',
    ]);
    expect(target.health).toBeCloseTo(898);
  });

  it('applies a definite blackboard amount without reading an attribute', () => {
    const target = vitals(700);
    const receipt = new CombatReceiptCollector();
    const executor = new HealOperationExecutor({
      sourceOperatorId: 'operator:healer',
      clock: new CombatClock(),
      receipt,
      resolveSourceAttribute: () => {
        throw new Error('definite healing must not read an attribute');
      },
      resolveTarget: () => ({ operatorId: 'operator:target', vitals: target }),
      delegate: terminal,
    });

    executor.execute(
      {
        kind: 'heal',
        parameters: {
          target: 'controlledOperator',
          amount: { kind: 'blackboard', key: 'final_heal_value' },
          tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
        },
      },
      { blackboard: new ActionBlackboard({ final_heal_value: 240 }) },
    );

    expect(target.health).toBe(940);
    expect(receipt.entries[0]?.data).toMatchObject({
      attribute: 'definite',
      requestedHealing: 240,
      actualHealing: 240,
    });
  });
});
