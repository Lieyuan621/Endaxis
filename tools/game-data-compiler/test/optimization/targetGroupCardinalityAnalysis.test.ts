import { parseKnownNativeActionSequenceSource } from '../../src/source/actionLeaf.ts';
import { ownerSpawnedAbilityEntityFindTargetActionFixture } from '../sourceFixtures.ts';
import { describe, expect, it } from 'vitest';
import { propagateGuaranteedSingletonZeroSpaceFacts } from '../../src/compiler/optimization/targetGroupCardinalityAnalysis.ts';

const metadata = {
  nativeType: 'fixture',
  nativeName: 'fixture',
  enabled: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 0,
};

const emptySequence = () => ({
  onlyExecuteWhenSourceIsMainCharacter: false,
  onlyExecuteWhenSourceIsGuard: false,
  actions: [],
});

const countCondition = (key: string) => ({
  ...emptySequence(),
  actions: [
    {
      sourcePath: 'fixture.count',
      metadata,
      body: {
        kind: 'leaf',
        value: {
          family: 'condition',
          action: {
            kind: 'entityCount',
            targetSource: 'Context',
            targetGroupKey: key,
            containsHittableTarget: false,
            excludeDeadEntity: false,
            storeKey: '',
            comparison: 'GE',
            minimumCount: 1,
          },
        },
      },
    },
  ],
});

const write = (targetGroupKey: string, producerType: string, inputKey = '') => ({
  sourcePath: `fixture.${targetGroupKey}`,
  metadata,
  body: {
    kind: 'leaf',
    value: {
      family: 'targetGroup',
      action: {
        targetGroupKey,
        producerType,
        inputTargets:
          inputKey === ''
            ? []
            : [
                {
                  targetSource: 'Context',
                  targetGroupKey: inputKey,
                },
              ],
        pickIndexValue: producerType === 'PickTargetAction' ? 0 : null,
      },
    },
  },
});

const options = {
  atMostOneZeroSpaceKeys: new Set(['candidate']),
  compareKnownNumbers: (left: number, comparison: string, right: number) =>
    comparison === 'GE' ? left >= right : undefined,
  writeProducesSingleton: (
    action: {
      readonly producerType: string;
      readonly inputTargets: readonly { readonly targetGroupKey: string }[];
    },
    state: ReadonlySet<string>,
  ) =>
    action.producerType === 'FixedPointFinder' ||
    (action.producerType === 'PickTargetAction' &&
      state.has(action.inputTargets[0]!.targetGroupKey)),
};

describe('目标组基数控制流分析', () => {
  it('数量守卫后的 Pick 与空分支 FixedPoint 汇合后证明输出必有一个成员', () => {
    const sequence = {
      ...emptySequence(),
      actions: [
        {
          sourcePath: 'fixture.branch',
          metadata,
          body: {
            kind: 'ifElse',
            condition: countCondition('candidate'),
            whenTrue: {
              ...emptySequence(),
              actions: [write('tar', 'PickTargetAction', 'candidate')],
            },
            whenFalse: { ...emptySequence(), actions: [write('tar', 'FixedPointFinder')] },
            alwaysNext: true,
          },
        },
      ],
    };
    const result = propagateGuaranteedSingletonZeroSpaceFacts(
      sequence as never,
      new Set(),
      options as never,
    );
    expect(result.has('tar')).toBe(true);
  });

  it('没有非空守卫时不把 Pick 的至多一个成员误判为必有一个', () => {
    const sequence = {
      ...emptySequence(),
      actions: [write('tar', 'PickTargetAction', 'candidate')],
    };
    const result = propagateGuaranteedSingletonZeroSpaceFacts(
      sequence as never,
      new Set(),
      options as never,
    );
    expect(result.has('tar')).toBe(false);
  });
});

it('固定点仅在中心可解析时建立非空事实，失败的重写保留原有位置', () => {
  const sequence = (center: string, centerContextKey = '') =>
    parseKnownNativeActionSequenceSource(
      {
        actionData: [
          {
            ...ownerSpawnedAbilityEntityFindTargetActionFixture(),
            targetGroupKey: 'point',
            center,
            centerContextKey,
            selectorOwner: 'ActionOwner',
            selectorData: {
              finderData: {
                $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
                positionOffset: { x: 0, y: 0, z: 0 },
                rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
                snapToNavmesh: false,
                sampleRadius: { useBlackboardKey: false, value: 0, blackboardKey: '' },
              },
              validatorData: [],
              postProcessorData: [],
            },
          },
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'point',
      {},
    );
  const proof = {
    atMostOneZeroSpaceKeys: new Set<string>(),
    compareKnownNumbers: () => undefined,
    writeProducesSingleton: () => true,
  };
  const absent = sequence('ContextTarget', 'missing');
  expect(propagateGuaranteedSingletonZeroSpaceFacts(absent, new Set(), proof).has('point')).toBe(
    false,
  );
  const known = propagateGuaranteedSingletonZeroSpaceFacts(
    sequence('ActionOwner'),
    new Set(),
    proof,
  );
  expect(known.has('point')).toBe(true);
  expect(propagateGuaranteedSingletonZeroSpaceFacts(absent, known, proof).has('point')).toBe(true);
});
