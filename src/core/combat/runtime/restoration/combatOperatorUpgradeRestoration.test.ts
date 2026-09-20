import { expect, it } from 'vitest';
import type { CompiledOperatorUpgradeEventProgram } from '../../../compiler/combatProgram';
import { bindRestoredCombatOperatorUpgradeEvents } from './combatOperatorSourceRestoration';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { AbilityEventDispatcher } from '../../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../../events/combatAbilityEvent';
import { OperatorUpgradeEventRuntime } from '../../abilities/operatorUpgradeEventRuntime';

const program: CompiledOperatorUpgradeEventProgram = {
  key: 'potential:event',
  event: { kind: 'spGained' },
  initialBlackboard: {},
  sequence: {
    steps: [
      {
        kind: 'changeResource',
        parameters: { resource: 'sp', amount: 1, recipient: 'team' },
      },
    ],
  },
};

it('恢复潜能事件时复用原订阅身份且只由当前分支处理函数响应', () => {
  const originalDispatcher = new AbilityEventDispatcher<
    keyof AbilityEventPayloadMap,
    AbilityEventPayloadMap
  >();
  const originalEvents = new CombatSemanticEventRuntime(
    (_owner, _scope, event, _phase, priority, handle) =>
      originalDispatcher.registerAction(event, priority, handle),
  );
  let originalExecutions = 0;
  const original = new OperatorUpgradeEventRuntime(originalEvents, 'operator', [program], () => ({
    execute: () => {
      originalExecutions += 1;
      return true;
    },
    evaluate: () => true,
  }));
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
  const restored = bindRestoredCombatOperatorUpgradeEvents({
    operatorId: 'operator',
    programs: [program],
    state: copied.upgrade,
    semanticEvents: restoredEvents,
    createExecutor: () => ({
      execute: () => {
        restoredExecutions += 1;
        return true;
      },
      evaluate: () => true,
    }),
  });
  restoredDispatcher.dispatch(
    {
      event: 'skillSpGained',
      payload: {
        sourceOperatorId: 'operator',
        source: 'skill',
        gainKind: 'gain',
        requestedAmount: 1,
        amount: 1,
      },
    },
    [],
  );

  expect(restored.runtimeState).toBe(copied.upgrade);
  expect(copied.native.nextRegistrationId).toBe(originalDispatcher.runtimeState.nextRegistrationId);
  expect(restoredExecutions).toBe(1);
  expect(originalExecutions).toBe(0);
  restored.dispose();
  original.dispose();
});
