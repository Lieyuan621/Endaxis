import { describe, expect, it } from 'vitest';
import { createNativeEventFixture } from '../events/nativeEventTestFixture';
import type { CompiledOperatorUpgradeEventProgram } from '../../compiler/combatProgram';
import { OperatorUpgradeEventRuntime } from './operatorUpgradeEventRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../events/combatAbilityEvent';

const PROGRAM: CompiledOperatorUpgradeEventProgram = {
  key: 'potential:attackAfterSpGain:0',
  event: { kind: 'spGained' },
  initialBlackboard: {},
  sequence: {
    steps: [
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'attack-up',
          target: 'caster',
          definition: {
            stackingType: 'enhanceAndRefresh',
            maxStackCount: 2,
            durationSeconds: 5,
            attributeModifiers: [{ attribute: 'Atk', slot: 'baseMultiplier', value: 0.2 }],
          },
        },
      },
    ],
  },
};

describe('OperatorUpgradeEventRuntime', () => {
  it('executes a matching upgrade event with event-local state and disposes symmetrically', () => {
    const { semanticEvents: events, dispatcher } = createNativeEventFixture();
    const executed: string[] = [];
    const operationContexts: unknown[] = [];
    const executor: CombatOperationExecutor = {
      execute: (step, context) => {
        executed.push(step.kind);
        operationContexts.push(context?.event);
        return true;
      },
      evaluate: () => false,
    };
    const runtime = new OperatorUpgradeEventRuntime(
      events,
      'operator:perlica',
      [PROGRAM],
      context => {
        expect(context.programKey).toBe(PROGRAM.key);
        return executor;
      },
    );

    const event = {
      event: 'skillSpGained' as const,
      payload: {
        sourceOperatorId: 'operator:perlica',
        source: 'skill' as const,
        gainKind: 'gain' as const,
        requestedAmount: 1,
        amount: 1,
      },
    };
    dispatcher.dispatch(event, []);
    expect(executed).toEqual(['applyBuff']);
    expect(operationContexts).toEqual([event]);

    runtime.dispose();
    dispatcher.dispatch(event, []);
    expect(executed).toEqual(['applyBuff']);
  });

  it('restores semantic subscriptions by saved identity without allocating a new registration', () => {
    const program = PROGRAM;
    const originalDispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >();
    const originalEvents = new CombatSemanticEventRuntime(
      (_owner, _scope, event, _phase, priority, handle) =>
        originalDispatcher.registerAction(event, priority, handle),
    );
    let originalExecutions = 0;
    const original = new OperatorUpgradeEventRuntime(
      originalEvents,
      'operator:perlica',
      [program],
      () => ({
        execute: () => {
          originalExecutions += 1;
          return true;
        },
        evaluate: () => true,
      }),
    );
    const copied = structuredClone({
      upgrade: original.runtimeState,
      events: originalEvents.runtimeState,
      native: originalDispatcher.runtimeState,
    });
    const restoredDispatcher = new AbilityEventDispatcher<
      keyof AbilityEventPayloadMap,
      AbilityEventPayloadMap
    >(copied.native);
    const restoredEvents = new CombatSemanticEventRuntime(undefined, {
      state: copied.events,
      bindNative: (reference, receive) =>
        restoredDispatcher.bindSubscriptionFor('skillSpGained', reference, event =>
          receive({ event }),
        ),
    });
    let restoredExecutions = 0;
    const restored = new OperatorUpgradeEventRuntime(
      restoredEvents,
      'operator:perlica',
      [program],
      () => ({
        execute: () => {
          restoredExecutions += 1;
          return true;
        },
        evaluate: () => true,
      }),
      copied.upgrade,
    );
    restoredDispatcher.dispatch(
      {
        event: 'skillSpGained',
        payload: {
          sourceOperatorId: 'operator:perlica',
          source: 'skill',
          gainKind: 'gain',
          requestedAmount: 1,
          amount: 1,
        },
      },
      [],
    );

    expect(restoredExecutions).toBe(1);
    expect(originalExecutions).toBe(0);
    expect(copied.native.nextRegistrationId).toBe(
      originalDispatcher.runtimeState.nextRegistrationId,
    );
    restored.dispose();
    original.dispose();
  });

  it('seeds the native consumed-layer store key for attachment-consumption handlers', () => {
    const { semanticEvents: events, emitConsumedBuff } = createNativeEventFixture();
    let consumedLayers: number | undefined;
    const program: CompiledOperatorUpgradeEventProgram = {
      key: 'talent:consumed-infliction:0',
      event: { kind: 'elementalAttachmentConsumed' },
      initialBlackboard: { crystal_up: 0.04 },
      sequence: {
        steps: [
          {
            kind: 'calculateActionValue',
            parameters: {
              key: 'result',
              operation: 'multiply',
              left: { kind: 'blackboard', key: 'infliction_num' },
              right: { kind: 'constant', value: 0.04 },
            },
          },
        ],
      },
    };
    new OperatorUpgradeEventRuntime(events, 'operator:last-rite', [program], () => ({
      execute: (_step, context) => {
        consumedLayers = context?.blackboard.getNumber('infliction_num');
        return true;
      },
      evaluate: () => false,
    }));

    emitConsumedBuff({
      sourceId: 'operator:last-rite',
      buff: createEventBuff(),
      targetId: 'enemy',
      buffId: 'attachment:heat',
      buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
      layers: 3,
    });

    expect(consumedLayers).toBe(3);
  });

  it('seeds the declared consumed Buff layer key for OnConsumeBuff handlers', () => {
    const { semanticEvents: events, emitConsumedBuff } = createNativeEventFixture();
    let consumedLayers: number | undefined;
    const program: CompiledOperatorUpgradeEventProgram = {
      key: 'talent:no-guard-consumed:0',
      event: { kind: 'buffConsumed', buffIds: ['buff_physical_no_guard'] },
      initialBlackboard: { dmg_up: 0.06 },
      sequence: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'physical-up',
              target: 'caster',
              count: { kind: 'blackboard', key: 'consumedLayer' },
            },
          },
        ],
      },
    };
    new OperatorUpgradeEventRuntime(events, 'operator:dapan', [program], () => ({
      execute: (_step, context) => {
        consumedLayers = context?.blackboard.getNumber('consumedLayer');
        return true;
      },
      evaluate: () => false,
    }));

    emitConsumedBuff({
      buffTags: [],
      buff: createEventBuff(),
      sourceId: 'operator:dapan',
      targetId: 'enemy',
      buffId: 'buff_physical_no_guard',
      layers: 4,
    });

    expect(consumedLayers).toBe(4);
  });
});
import { createEventBuff } from '../events/buffEventTestFixture';
