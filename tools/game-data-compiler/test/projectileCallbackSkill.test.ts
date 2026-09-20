import { describe, expect, it } from 'vitest';
import {
  compileImmediateProjectileCallbackSkillSource,
  compileProjectileCallbackSkillSource,
} from '../src/compiler/abilities/projectileRuntimeProjection.ts';
import type { SkillActionGraphSource } from '../src/source/skillActionGraph.ts';
import type { KnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { returnProjectionContext } from './support/avywennaReturnProjection.ts';
import type { NativeActionNodeSource } from '../src/source/controlFlow.ts';
import { parseTargetReferenceSource } from '../src/source/target.ts';
import { targetFixture } from './sourceFixtures.ts';

function callbackNode(
  body: NativeActionNodeSource<KnownNativeActionLeafSource>['body'],
): NativeActionNodeSource<KnownNativeActionLeafSource> {
  return {
    sourcePath: 'fixture.callback',
    metadata: {
      nativeType: 'fixture',
      nativeName: 'fixture',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
    },
    body,
  };
}

function statefulCallback(write: boolean): SkillActionGraphSource<KnownNativeActionLeafSource> {
  const seed = graph(30);
  const scalar = (value: number, blackboardKey: string | null = null) => ({
    value,
    blackboardKey,
    levelValues: null,
  });
  const empty = seed.actionGroup.timelineActions[0]!;
  return {
    ...seed,
    declaredBlackboard: [{ key: 'value', value: 1, isDynamic: true }],
    actionGroup: {
      passiveEvents: [],
      timelineActions: [
        {
          ...empty,
          sequence: {
            ...empty.sequence,
            actions: write
              ? [
                  callbackNode({
                    kind: 'leaf',
                    value: {
                      family: 'blackboardCalculation',
                      action: {
                        kind: 'blackboardCalculation',
                        key: 'value',
                        operation: 'Add',
                        left: scalar(1),
                        right: scalar(1),
                        addend: null,
                      },
                    },
                  }),
                ]
              : [],
          },
        },
        {
          ...empty,
          startFrame: 2,
          endFrame: 3,
          sequence: {
            ...empty.sequence,
            actions: [
              callbackNode({
                kind: 'switch',
                choice: scalar(0, 'value'),
                alwaysNext: true,
                options: [
                  {
                    value: scalar(2),
                    action: {
                      ...empty.sequence,
                      actions: [
                        callbackNode({
                          kind: 'leaf',
                          value: {
                            family: 'finisherSpGain',
                            action: {
                              kind: 'finisherSpGain',
                              factor: scalar(1),
                              source: parseTargetReferenceSource(
                                targetFixture('Source'),
                                'fixture.source',
                              ),
                              target: parseTargetReferenceSource(
                                targetFixture('Target'),
                                'fixture.target',
                              ),
                            },
                          },
                        }),
                      ],
                    },
                  },
                ],
              }),
            ],
          },
        },
      ],
    },
  };
}

function graph(durationFrame: number): SkillActionGraphSource<KnownNativeActionLeafSource> {
  return {
    skillId: 'callback',
    level: 1,
    durationFrame,
    declaredBlackboard: [],
    actionGroup: {
      passiveEvents: [],
      timelineActions: [
        [0, 0],
        [0, 3],
        [0, 10],
        [12, 20],
      ].map(([startFrame, endFrame]) => ({
        startFrame: startFrame!,
        endFrame: endFrame!,
        forceSyncAnimation: { forceSync: false, montageName: '', targetFrame: 0, playbackSpeed: 1 },
        sequence: {
          onlyExecuteWhenSourceIsMainCharacter: false,
          onlyExecuteWhenSourceIsGuard: false,
          actions: [],
        },
      })),
    },
  };
}

describe('complete projectile callback skill source', () => {
  it('does not flatten an immediate write followed by a delayed direct-blackboard read', () => {
    const input = { graph: statefulCallback(true), context: returnProjectionContext };
    // The full program remains representable; only the lossy transitional adapter rejects it.
    expect(compileProjectileCallbackSkillSource(input).timelineActions).toHaveLength(2);
    expect(() =>
      compileImmediateProjectileCallbackSkillSource({
        ...input,
        allowIndependentDelayedBlackboardReads: true,
      }),
    ).toThrow('delayed projectile callback mutates persistent action state');
  });

  it('keeps accepting delayed reads of unchanged callback defaults', () => {
    const result = compileImmediateProjectileCallbackSkillSource({
      graph: statefulCallback(false),
      context: returnProjectionContext,
      allowIndependentDelayedBlackboardReads: true,
    });
    expect(result.delayedSequencesNeedFreshScope).toBe(true);
    expect(result.delayedSequences.map(t => [t.startFrame, t.endFrame])).toEqual([[2, 3]]);
  });

  it('checks nested immediate writes but ignores disabled source actions', () => {
    const source = statefulCallback(true);
    const [immediate, delayed] = source.actionGroup.timelineActions;
    const writer = immediate!.sequence.actions[0]!;
    const project = (enabled: boolean) =>
      compileImmediateProjectileCallbackSkillSource({
        graph: {
          ...source,
          actionGroup: {
            ...source.actionGroup,
            timelineActions: [
              {
                ...immediate!,
                sequence: {
                  ...immediate!.sequence,
                  actions: [
                    callbackNode({
                      kind: 'switch',
                      choice: { value: 0, blackboardKey: 'value', levelValues: null },
                      alwaysNext: true,
                      options: [
                        {
                          value: { value: 2, blackboardKey: null, levelValues: null },
                          action: {
                            ...immediate!.sequence,
                            actions: [{ ...writer, metadata: { ...writer.metadata, enabled } }],
                          },
                        },
                      ],
                    }),
                  ],
                },
              },
              delayed!,
            ],
          },
        },
        context: returnProjectionContext,
        allowIndependentDelayedBlackboardReads: true,
      });
    expect(() => project(true)).toThrow('mutates persistent action state');
    expect(project(false).delayedSequencesNeedFreshScope).toBe(true);
  });
  it('keeps all native action intervals and their order, even when empty after projection', () => {
    const source = graph(900);
    const compiled = compileProjectileCallbackSkillSource({
      graph: source,
      context: returnProjectionContext,
    });
    expect(compiled.naturalDurationFrames).toBe(900);
    expect(compiled.declaredBlackboard).toBe(source.declaredBlackboard);
    expect(compiled.timelineActions.map(t => [t.startFrame, t.endFrame])).toEqual([
      [0, 0],
      [0, 3],
      [0, 10],
      [12, 20],
    ]);
    expect(compiled.timelineActions.every(t => t.sequence.steps.length === 0)).toBe(true);
  });

  it('uses the native minimum one-frame duration, not the last action end', () => {
    const compiled = compileProjectileCallbackSkillSource({
      graph: graph(0),
      context: returnProjectionContext,
    });
    expect(compiled.naturalDurationFrames).toBe(1);
    expect(compiled.timelineActions.at(-1)?.endFrame).toBe(20);
  });

  it.each([-1, 0.5, NaN, Infinity])('rejects invalid native duration %s', duration => {
    expect(() =>
      compileProjectileCallbackSkillSource({
        graph: graph(duration),
        context: returnProjectionContext,
      }),
    ).toThrow('invalid callback durationFrame');
  });
});
