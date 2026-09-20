import { describe, expect, it } from 'vitest';
import type { SkillGlobalBuffDefinition } from '../../game-data/operatorDefinition';
import type { ResolvedSkillBuffDefinition } from '../../compiler/combatProgram';
import type { BuffApplicationRequest, BuffOperationTarget } from './buffOperationExecutor';
import { GlobalBuffOperationExecutor, GlobalBuffRuntime } from './globalBuffRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { StateStepper } from '../runtime/stateStepper';
import { finishGlobalBuffInstance } from './globalBuffRuntime';
import {
  SharedSpGainModifierSet,
  SharedSpRecoveryModifierSet,
} from '../resources/sharedSpGainModifiers';

const childDefinition: ResolvedSkillBuffDefinition = { stackingType: 'unlimited' };
const definition: SkillGlobalBuffDefinition = {
  stackingType: 'stack',
  maxStackCount: 2,
  durationSeconds: { blackboardKey: 'duration' },
  blackboard: { duration: 10, scale: 0 },
  children: [
    {
      buffId: 'child',
      blackboardAssignments: { imbue: { kind: 'blackboard', key: 'scale' } },
    },
  ],
};

function target(ownerId: string) {
  const requests: BuffApplicationRequest[] = [];
  const finished: string[] = [];
  const value = {
    ownerId,
    applyScoped(request: BuffApplicationRequest) {
      requests.push(request);
      return {
        isRecycled: false,
        reference: { ownerId, instanceId: requests.length },
        finish(reason: 'early' | 'absorbed' | 'other', source: unknown) {
          expect(source).toBeNull();
          finished.push(reason);
          return true;
        },
      };
    },
  } as unknown as BuffOperationTarget;
  return { value, requests, finished };
}

describe('GlobalBuffRuntime', () => {
  it('keeps the contextual entity source separate from the definition owner', () => {
    const member = target('member');
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
    );
    const executor = new GlobalBuffOperationExecutor({
      sourceId: 'operator',
      runtime,
      delegate: { execute: () => false, evaluate: () => false },
    });
    executor.execute(
      {
        kind: 'createGlobalBuff',
        parameters: {
          globalBuffId: 'from-entity',
          source: 'currentAbilityEntity',
          definition,
        },
      },
      {
        blackboard: new ActionBlackboard(),
        currentTarget: { kind: 'abilityEntity', instanceId: 17 },
      },
    );
    expect(member.requests).toHaveLength(1);
    expect(member.requests[0]).toMatchObject({
      sourceId: 'ability-entity:17',
      definitionOwnerId: 'operator',
    });
  });

  it('keeps action-owned instances separate even when steps have the same key', () => {
    const member = target('member');
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
    );
    const executor = new GlobalBuffOperationExecutor({
      sourceId: 'source',
      runtime,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const first = {
      kind: 'createGlobalBuff' as const,
      key: 'same',
      parameters: {
        globalBuffId: 'global',
        finishByAction: true,
        definition: { ...definition, stackingType: 'unlimited' as const },
      },
    };
    const second = { ...first };
    const context = { blackboard: new ActionBlackboard() };
    executor.execute(first, context);
    executor.execute(second, context);
    expect(() => executor.execute(first, context)).toThrow('already active');
    const session = new StateStepper(
      { actions: executor.runtimeState, global: runtime.runtimeState },
      () => undefined,
    );
    const copied = session.read();
    const held = [...copied.actions.active.values()];
    expect(held[0]![0]).toBe(copied.global.groups.get('global')![0]);
    expect(held[1]![0]).toBe(copied.global.groups.get('global')![1]);
    executor.end(first, context);
    expect(member.finished).toEqual(['other']);
    expect(executor.runtimeState.active.size).toBe(1);
    executor.end(second, context);
    expect(member.finished).toEqual(['other', 'other']);
    expect(executor.runtimeState.active.size).toBe(0);
  });
  it('copies real global Buff data and restores child finishing on a separate branch', () => {
    const member = target('member');
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
    );
    runtime.add({
      id: 'global',
      definition,
      sourceId: 'source',
      blackboardValues: { duration: 10 },
    });
    const session = new StateStepper(
      { global: runtime.runtimeState, ended: [] as string[] },
      step => {
        const instance = step.state.global.groups.get('global')![0]!;
        return finishGlobalBuffInstance(instance, {
          removeGain: () => undefined,
          removeRecovery: () => undefined,
          resolveChild: reference => ({
            finish: () => {
              expect(instance.finished).toBe(true);
              step.state.ended.push(reference.ownerId);
              return true;
            },
          }),
        });
      },
    );
    const root = session.save();
    expect(session.step(undefined)).toBe(true);
    expect(session.step(undefined)).toBe(false);
    expect(session.read().ended).toEqual(['member']);
    session.restore(root);
    expect(session.step(undefined)).toBe(true);
    expect(session.read().ended).toEqual(['member']);
    expect(runtime.runtimeState.groups.get('global')![0]!.finished).toBe(false);
  });
  it('keeps an exact parent layer and removes every squad mirror through one child', () => {
    const first = target('first');
    const second = target('second');
    const runtime = new GlobalBuffRuntime(
      () => [first.value, second.value],
      (_source, id) => (id === 'child' ? childDefinition : undefined),
    );
    runtime.add({
      id: 'global',
      definition,
      sourceId: 'akekuri',
      blackboardValues: { duration: 15, scale: 0.3 },
    });
    expect(first.requests[0]).toMatchObject({
      sourceId: 'akekuri',
      blackboardValues: { imbue: 0.3 },
    });
    expect(second.requests[0]).toMatchObject({ blackboardValues: { imbue: 0.3 } });
    expect(first.requests[0]!.finishParentGlobalBuff?.('early')).toBe(true);
    expect(first.finished).toEqual(['other']);
    expect(second.finished).toEqual(['other']);
    expect(second.requests[0]!.finishParentGlobalBuff?.('early')).toBe(false);
  });

  it('evicts the first unfinished parent instance at the confirmed stack maximum', () => {
    const member = target('member');
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
    );
    for (const scale of [0.1, 0.2, 0.3]) {
      runtime.add({
        id: 'global',
        definition,
        sourceId: 'akekuri',
        blackboardValues: { scale },
      });
    }
    expect(member.finished).toEqual(['other']);
    expect(member.requests.map(request => request.blackboardValues.imbue)).toEqual([0.1, 0.2, 0.3]);
  });

  it('registers native shared-SP modifiers for the exact parent lifetime', () => {
    const member = target('member');
    const gainModifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    const recoveryModifiers = new SharedSpRecoveryModifierSet();
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
      gainModifiers,
      recoveryModifiers,
    );
    runtime.add({
      id: 'global',
      definition: {
        ...definition,
        durationSeconds: 1 / 30,
        sharedSpModifiers: [
          {
            attribute: 'spRecovery',
            operation: 'multiplier',
            value: { kind: 'blackboard', key: 'scale' },
            applyToReturnSpGain: true,
          },
          {
            attribute: 'gainEfficiency',
            operation: 'addition',
            value: { kind: 'constant', value: 0.2 },
            applyToReturnSpGain: false,
          },
        ],
      },
      sourceId: 'akekuri',
      blackboardValues: { scale: -0.5 },
    });

    expect(recoveryModifiers.resolve(10)).toBe(5);
    expect(gainModifiers.resolve('skill', 'gain').totalEfficiency).toBe(1.2);
    runtime.advanceFrame();
    expect(recoveryModifiers.resolve(10)).toBe(10);
    expect(gainModifiers.resolve('skill', 'gain').totalEfficiency).toBe(1);
    expect(member.finished).toEqual(['other']);
  });

  it('恢复父实例时接回既有子 Buff 和共享技力修正而不重新施加', () => {
    const member = target('member');
    const gainModifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    const recoveryModifiers = new SharedSpRecoveryModifierSet();
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
      gainModifiers,
      recoveryModifiers,
    );
    const restorableDefinition: SkillGlobalBuffDefinition = {
      ...definition,
      durationSeconds: 1 / 30,
      sharedSpModifiers: [
        {
          attribute: 'gainEfficiency',
          operation: 'addition',
          value: { kind: 'constant', value: 0.2 },
          applyToReturnSpGain: false,
        },
      ],
    };
    runtime.add({
      id: 'global',
      definition: restorableDefinition,
      sourceId: 'akekuri',
      blackboardValues: {},
    });
    const copied = new StateStepper(
      {
        global: runtime.runtimeState,
        gain: gainModifiers.runtimeState,
        recovery: recoveryModifiers.runtimeState,
      },
      () => undefined,
    ).read();
    const restoredGain = new SharedSpGainModifierSet({ baseGainEfficiency: 1 }, copied.gain);
    const restoredRecovery = new SharedSpRecoveryModifierSet(copied.recovery);
    const childFinished: string[] = [];
    const restored = new GlobalBuffRuntime(
      () => {
        throw new Error('restoration must not apply child Buffs');
      },
      () => childDefinition,
      restoredGain,
      restoredRecovery,
      copied.global,
    );

    restored.bindRestoredInstances({
      resolveDefinition: () => restorableDefinition,
      resolveChild: reference => ({
        isRecycled: false,
        reference,
        finish: reason => {
          childFinished.push(reason);
          return true;
        },
      }),
    });

    expect(restoredGain.resolve('skill', 'gain').totalEfficiency).toBe(1.2);
    restored.advanceFrame();
    expect(childFinished).toEqual(['other']);
    expect(restoredGain.resolve('skill', 'gain').totalEfficiency).toBe(1);
    expect(runtime.runtimeState.groups.get('global')![0]!.finished).toBe(false);
  });

  it('恢复动作宿主后由同一程序槽结束恢复分支的父实例', () => {
    const originalTarget = target('member');
    const originalRuntime = new GlobalBuffRuntime(
      () => [originalTarget.value],
      () => childDefinition,
    );
    const dependencies = {
      sourceId: 'source',
      sourceActionId: 'skill',
      runtime: originalRuntime,
      delegate: { execute: () => false, evaluate: () => false },
    };
    const originalExecutor = new GlobalBuffOperationExecutor(dependencies);
    const step = {
      kind: 'createGlobalBuff' as const,
      key: 'restorable',
      parameters: {
        globalBuffId: 'global',
        finishByAction: true,
        definition: { ...definition, stackingType: 'unlimited' as const },
      },
    };
    const context = { blackboard: new ActionBlackboard() };
    const definitionProgramId = originalExecutor.programs.slot(step);
    originalExecutor.execute(step, context);
    expect(originalRuntime.runtimeState.groups.get('global')![0]!.definitionProgramId).toBe(
      definitionProgramId,
    );
    expect(originalExecutor.programs.resolve(definitionProgramId)).toBe(step);
    const copied = new StateStepper(
      { global: originalRuntime.runtimeState, actions: originalExecutor.runtimeState },
      () => undefined,
    ).read();
    const restoredChildFinishes: string[] = [];
    const restoredRuntime = new GlobalBuffRuntime(
      () => [],
      () => childDefinition,
      null,
      null,
      copied.global,
    );
    const resolvedDefinitionProgramIds: (number | null)[] = [];
    restoredRuntime.bindRestoredInstances({
      resolveDefinition: (_sourceId, _id, _sourceActionOwnerId, _sourceActionId, programId) => {
        resolvedDefinitionProgramIds.push(programId);
        return step.parameters.definition;
      },
      resolveChild: reference => ({
        isRecycled: false,
        reference,
        finish: reason => {
          restoredChildFinishes.push(reason);
          return true;
        },
      }),
    });
    const restoredExecutor = new GlobalBuffOperationExecutor(
      { ...dependencies, runtime: restoredRuntime },
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step, context);

    expect(copied.global.groups.get('global')![0]!.finished).toBe(true);
    expect(resolvedDefinitionProgramIds).toEqual([definitionProgramId]);
    expect(restoredChildFinishes).toEqual(['other']);
    expect(originalRuntime.runtimeState.groups.get('global')![0]!.finished).toBe(false);
  });

  it('finishes every active parent instance for each explicitly named GlobalBuff ID', () => {
    const member = target('member');
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      () => childDefinition,
    );
    for (const id of ['first', 'first', 'second']) {
      runtime.add({ id, definition, sourceId: 'akekuri', blackboardValues: {} });
    }

    expect(runtime.finishAllByIds(['first'], 'other')).toBe(true);
    expect(member.finished).toEqual(['other', 'other']);
    expect(runtime.finishAllByIds(['first'], 'other')).toBe(false);
    expect(runtime.finishAllByIds(['second'], 'early')).toBe(true);
    expect(member.finished).toEqual(['other', 'other', 'other']);
  });

  it('routes battle-owned create and named finish steps through the same runtime directory', () => {
    const member = target('member');
    const recoveryModifiers = new SharedSpRecoveryModifierSet();
    const definitionSources: string[] = [];
    const runtime = new GlobalBuffRuntime(
      () => [member.value],
      (sourceId, buffId) => {
        definitionSources.push(`${sourceId}:${buffId}`);
        return childDefinition;
      },
      null,
      recoveryModifiers,
    );
    const executor = new GlobalBuffOperationExecutor({
      sourceId: 'akekuri',
      runtime,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const context = { blackboard: new ActionBlackboard({ ratio: -1 }) };

    expect(
      executor.execute(
        {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'recovery-stop',
            source: 'battle',
            blackboardAssignments: {
              ratio: { kind: 'blackboard', key: 'ratio' },
            },
            definition: {
              stackingType: 'unlimited',
              blackboard: { ratio: -0.1 },
              sharedSpModifiers: [
                {
                  attribute: 'spRecovery',
                  operation: 'multiplier',
                  value: { kind: 'blackboard', key: 'ratio' },
                  applyToReturnSpGain: true,
                },
              ],
              children: [{ buffId: 'icon', blackboardAssignments: {} }],
            },
          },
        },
        context,
      ),
    ).toBe(true);
    expect(definitionSources).toEqual(['battle:icon']);
    expect(member.requests[0]!.sourceId).toBe('battle');
    expect(member.requests[0]!.definitionOwnerId).toBe('akekuri');
    expect(recoveryModifiers.resolve(10)).toBe(0);

    expect(
      executor.execute({
        kind: 'finishGlobalBuffsById',
        parameters: { globalBuffIds: ['recovery-stop'], reason: 'other' },
      }),
    ).toBe(true);
    expect(recoveryModifiers.resolve(10)).toBe(10);
  });
});
