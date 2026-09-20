import { describe, expect, it } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { TimedMarkerOperationExecutor } from './timedMarkerOperationExecutor';
import { TimedMarkerContainer } from './timedMarkers';
import { LogicalAbilityEntityRuntime } from '../abilities/logicalAbilityEntityRuntime';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { StateStepper } from '../runtime/stateStepper';

const delegate: CombatOperationExecutor = {
  execute: () => false,
  evaluate: () => false,
};

describe('TimedMarkerOperationExecutor', () => {
  it.each(['buffOwner', 'buffSource'] as const)(
    'uses the explicit %s identity instead of the event or caster',
    target => {
      const clock = new CombatClock();
      const owner = new TimedMarkerContainer('receiver', clock);
      const source = new TimedMarkerContainer('sender', clock);
      const executor = new TimedMarkerOperationExecutor({
        resolveTarget: () => {
          throw new Error('must not fall back to caster');
        },
        resolveEventTarget: id => (id === 'receiver' ? owner : source),
        delegate,
      });
      const context = {
        blackboard: new ActionBlackboard(),
        buffOwnerId: 'receiver',
        buffSourceId: 'sender',
      };
      executor.execute(
        {
          kind: 'createTimedMarker',
          parameters: {
            target,
            markerId: 'heal-icd',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
          },
        },
        context,
      );
      expect(
        executor.evaluate({ kind: 'timedMarkerPresent', target, markerId: 'heal-icd' }, context),
      ).toBe(true);
      expect((target === 'buffOwner' ? source : owner).has('heal-icd')).toBe(false);
      expect(() =>
        executor.evaluate({ kind: 'timedMarkerPresent', target, markerId: 'heal-icd' }),
      ).toThrow('Buff identity');
    },
  );
  it('creates, queries, and removes action-scoped markers', () => {
    const clock = new CombatClock();
    const caster = new TimedMarkerContainer('operator', clock);
    const enemy = new TimedMarkerContainer('enemy', clock);
    const executor = new TimedMarkerOperationExecutor({
      resolveTarget: target => (target === 'caster' ? caster : enemy),
      delegate,
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        target: 'caster',
        markerId: 'voice',
        durationSeconds: { kind: 'blackboard', key: 'duration' },
        autoFinishByAction: true,
      },
    };
    const context = { blackboard: new ActionBlackboard({ duration: 5 }) };

    expect(executor.execute(step, context)).toBe(true);
    expect(executor.execute(step, context)).toBe(true);
    expect(
      executor.evaluate({ kind: 'timedMarkerPresent', target: 'caster', markerId: 'voice' }),
    ).toBe(true);
    executor.end(step, context);
    expect(
      executor.evaluate({ kind: 'timedMarkerPresent', target: 'caster', markerId: 'voice' }),
    ).toBe(false);
  });

  it('恢复动作宿主后按标记身份只移除恢复分支实例', () => {
    const originalClock = new CombatClock();
    const originalContainer = new TimedMarkerContainer('operator', originalClock);
    const originalExecutor = new TimedMarkerOperationExecutor({
      resolveTarget: () => originalContainer,
      resolveEventTarget: () => originalContainer,
      delegate,
    });
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        target: 'caster',
        markerId: 'voice',
        durationSeconds: { kind: 'constant', value: 5 },
        autoFinishByAction: true,
      },
    };
    const context = { blackboard: new ActionBlackboard() };
    originalExecutor.execute(step, context);
    const copied = new StateStepper(
      {
        clock: originalClock.runtimeState,
        markers: originalContainer.runtimeState,
        actions: originalExecutor.runtimeState,
      },
      () => undefined,
    ).read();
    const restoredClock = new CombatClock(copied.clock);
    const restoredContainer = new TimedMarkerContainer(
      'operator',
      restoredClock,
      {},
      copied.markers,
    );
    const restoredExecutor = new TimedMarkerOperationExecutor(
      {
        resolveTarget: () => restoredContainer,
        resolveEventTarget: () => restoredContainer,
        delegate,
      },
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(restoredContainer.has('voice')).toBe(false);
    expect(originalContainer.has('voice')).toBe(true);
  });

  it('creates and queries a marker on the active healing event target', () => {
    const clock = new CombatClock();
    const receiver = new TimedMarkerContainer('operator:receiver', clock);
    const executor = new TimedMarkerOperationExecutor({
      resolveTarget: () => new TimedMarkerContainer('unused', clock),
      resolveEventTarget: targetId => {
        expect(targetId).toBe('operator:receiver');
        return receiver;
      },
      delegate,
    });
    const context = {
      blackboard: new ActionBlackboard(),
      event: {
        event: 'receiveHeal' as const,
        payload: {
          sourceId: 'operator:healer',
          targetId: 'operator:receiver',
          requestedHealing: 100,
          actualHealing: 0,
          overhealing: 100,
          tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
        },
      },
    };
    const step: ResolvedCombatOperationStep = {
      kind: 'createTimedMarker',
      parameters: {
        target: 'eventTarget',
        markerId: 'heal-icd',
        durationSeconds: { kind: 'constant', value: 0.1 },
        autoFinishByAction: false,
      },
    };

    expect(executor.execute(step, context)).toBe(true);
    expect(
      executor.evaluate(
        { kind: 'timedMarkerPresent', target: 'eventTarget', markerId: 'heal-icd' },
        context,
      ),
    ).toBe(true);
  });

  it('uses the current ability entity local clock for time-dilated markers', () => {
    const entities = new LogicalAbilityEntityRuntime({ resolveDeltaSeconds: () => 1 / 60 });
    const target = entities.spawn({
      abilityEntityId: 'seal',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    const executor = new TimedMarkerOperationExecutor({
      resolveTarget: () => new TimedMarkerContainer('unused', new CombatClock()),
      resolveAbilityEntityTarget: current => entities.timedMarkers(current),
      delegate,
    });
    const context = { blackboard: new ActionBlackboard(), currentTarget: target };
    const step: ResolvedCombatOperationStep = {
      kind: 'createAbilityEntityTimedMarker',
      parameters: {
        markerId: 'end',
        durationSeconds: { kind: 'constant', value: 1 },
        autoFinishByAction: false,
        timeDomain: 'self',
      },
    };

    expect(executor.execute(step, context)).toBe(true);
    for (let frame = 0; frame < 30; frame += 1) entities.advanceFrame();
    expect(
      executor.evaluate({ kind: 'abilityEntityTimedMarkerPresent', markerId: 'end' }, context),
    ).toBe(true);
    for (let frame = 0; frame < 31; frame += 1) entities.advanceFrame();
    expect(
      executor.evaluate({ kind: 'abilityEntityTimedMarkerPresent', markerId: 'end' }, context),
    ).toBe(false);
  });

  it('keeps global-clock entity markers independent from the entity local clock', () => {
    const globalClock = new CombatClock();
    const entities = new LogicalAbilityEntityRuntime({ resolveDeltaSeconds: () => 1 / 120 });
    const target = entities.spawn({
      abilityEntityId: 'water',
      definition: { lifetime: { kind: 'infinite' } },
      ownerId: 'operator',
      source: { kind: 'operator', operatorId: 'operator' },
    });
    const executor = new TimedMarkerOperationExecutor({
      resolveTarget: () => new TimedMarkerContainer('unused', globalClock),
      resolveAbilityEntityTarget: current => entities.timedMarkers(current),
      globalClock,
      delegate,
    });
    const targetContext = new RuntimeTargetContext();
    targetContext.setSingle('water_group', target);
    const context = {
      blackboard: new ActionBlackboard(),
      currentTarget: target,
      targetContext,
    };
    const globalStep: ResolvedCombatOperationStep = {
      kind: 'createAbilityEntityTimedMarker',
      parameters: {
        markerId: 'global',
        durationSeconds: { kind: 'constant', value: 1 },
        autoFinishByAction: false,
        timeDomain: 'global',
      },
    };
    const selfStep: ResolvedCombatOperationStep = {
      kind: 'createAbilityEntityTimedMarker',
      parameters: {
        markerId: 'self',
        durationSeconds: { kind: 'constant', value: 1 },
        autoFinishByAction: false,
        timeDomain: 'self',
      },
    };

    executor.execute(globalStep, context);
    executor.execute(selfStep, context);
    for (let frame = 0; frame < 31; frame += 1) {
      globalClock.advanceFrame();
      entities.advanceFrame();
    }

    expect(
      executor.evaluate(
        {
          kind: 'abilityEntityTimedMarkerPresent',
          markerId: 'global',
          contextKey: 'water_group',
        },
        context,
      ),
    ).toBe(false);
    expect(
      executor.evaluate(
        {
          kind: 'abilityEntityTimedMarkerPresent',
          markerId: 'self',
          contextKey: 'water_group',
        },
        context,
      ),
    ).toBe(true);
  });
});
