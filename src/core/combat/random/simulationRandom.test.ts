import { describe, expect, it } from 'vitest';
import { createSimulationRandomState } from '../state/environmentState';
import {
  SimulationRandomSource,
  submitSimulationCastSeed,
  type SimulationRandomSettings,
} from './simulationRandom';

function createSource(settings: SimulationRandomSettings): SimulationRandomSource {
  const state = createSimulationRandomState();
  return new SimulationRandomSource(settings, () => state);
}

function createSourceWithCastSeed(globalSeed: number, castId: string, seed: number) {
  const state = createSimulationRandomState();
  submitSimulationCastSeed(state, castId, seed);
  return new SimulationRandomSource({ mode: 'sampled', globalSeed }, () => state);
}

describe('SimulationRandomSource', () => {
  it('截面后提交不同种子，不改过去、不推进全局流，恢复保留已提交选择', () => {
    let state = createSimulationRandomState();
    const settings = { mode: 'sampled' as const, globalSeed: 123 };
    const source = new SimulationRandomSource(settings, () => state);
    source.nextCriticalSample();
    const saved = structuredClone(state);
    const globalAfterPrefix = new Map(state.streams);
    submitSimulationCastSeed(state, 'candidate', 7);
    expect(state.streams).toEqual(globalAfterPrefix);
    const submitted = structuredClone(state);
    const first = [
      source.nextCriticalSample({ castId: 'candidate' }),
      source.nextProbabilitySample({ castId: 'candidate' }),
    ];
    const firstState = structuredClone(state);
    state = structuredClone(saved);
    submitSimulationCastSeed(state, 'candidate', 99);
    const second = [
      source.nextCriticalSample({ castId: 'candidate' }),
      source.nextProbabilitySample({ castId: 'candidate' }),
    ];
    expect(second).not.toEqual(first);
    expect(state.streams.get('critical:global')).toBe(globalAfterPrefix.get('critical:global'));
    state = structuredClone(submitted);
    const restored = new SimulationRandomSource(settings, () => state);
    expect([
      restored.nextCriticalSample({ castId: 'candidate' }),
      restored.nextProbabilitySample({ castId: 'candidate' }),
    ]).toEqual(first);
    expect(state).toEqual(firstState);
    expect(() => submitSimulationCastSeed(state, 'candidate', 99)).toThrow(
      'cannot change submitted',
    );
  });

  it('提交未指定种子的施放使用全局流，登记时就固定该选择', () => {
    const state = createSimulationRandomState();
    const source = new SimulationRandomSource({ mode: 'sampled', globalSeed: 123 }, () => state);
    submitSimulationCastSeed(state, 'cast');
    expect(() => submitSimulationCastSeed(state, 'cast', 7)).toThrow('cannot change submitted');
    expect(state.streams.size).toBe(0);
    const reference = createSource({ mode: 'sampled', globalSeed: 123 });
    expect(source.nextCriticalSample({ castId: 'cast' })).toBe(reference.nextCriticalSample());
    expect(state.streams.has('critical:cast:cast')).toBe(false);
  });

  it('输入提交后的技能块种子逐项保持既有随机序列', () => {
    const source = createSourceWithCastSeed(123, 'cast-a', 7);
    expect(Array.from({ length: 5 }, () => source.nextCriticalSample())).toEqual([
      0.920615452574566, 0.48073568590916693, 0.7334760089870542, 0.9312194793019444,
      0.015476783737540245,
    ]);
    expect(
      Array.from({ length: 5 }, () => source.nextCriticalSample({ castId: 'cast-a' })),
    ).toEqual([
      0.7268687353935093, 0.06759811472147703, 0.545253983931616, 0.20232562767341733,
      0.14300074707716703,
    ]);
  });

  it.each(['expected', 'sampled'] as const)(
    '%s：取样端口每次解析当前数据，不继续消费已离开的分支',
    mode => {
      let state = createSimulationRandomState();
      const source = new SimulationRandomSource({ mode, globalSeed: 123 }, () => state);
      source.nextCriticalSample();
      const saved = structuredClone(state);
      const expected = [source.nextCriticalSample(), source.nextProbabilitySample()];
      const abandoned = state;
      const abandonedCopy = structuredClone(abandoned);
      state = structuredClone(saved);
      expect([source.nextCriticalSample(), source.nextProbabilitySample()]).toEqual(expected);
      expect(abandoned).toEqual(abandonedCopy);
    },
  );

  it('uses stable evenly distributed streams in expected mode', () => {
    const source = createSource({ mode: 'expected', globalSeed: 99 });

    expect([source.nextCriticalSample(), source.nextCriticalSample()]).toEqual([0.5, 0.25]);
    expect([source.nextProbabilitySample(), source.nextProbabilitySample()]).toEqual([0.5, 0.25]);
  });

  it('keeps unrelated expected-mode sources on independent even sequences', () => {
    const source = createSource({ mode: 'expected', globalSeed: 99 });

    expect(source.nextCriticalSample({ expectedSequenceId: 'operator-a' })).toBe(0.5);
    expect(source.nextCriticalSample({ expectedSequenceId: 'operator-b' })).toBe(0.5);
    expect(source.nextCriticalSample({ expectedSequenceId: 'operator-a' })).toBe(0.25);
    expect(source.nextProbabilitySample({ expectedSequenceId: 'operator-a' })).toBe(0.5);
  });

  it('replays sampled mode from the same seed and separates random categories', () => {
    const first = createSource({ mode: 'sampled', globalSeed: 123 });
    const second = createSource({ mode: 'sampled', globalSeed: 123 });

    expect([
      first.nextCriticalSample(),
      first.nextProbabilitySample(),
      first.nextCriticalSample(),
    ]).toEqual([
      second.nextCriticalSample(),
      second.nextProbabilitySample(),
      second.nextCriticalSample(),
    ]);
  });

  it('lets a cast seed isolate one skill block from the global stream', () => {
    const withLocalCast = createSourceWithCastSeed(123, 'cast-a', 7);
    const sameLocalCast = createSourceWithCastSeed(999, 'cast-a', 7);

    expect(withLocalCast.nextCriticalSample({ castId: 'cast-a' })).toBe(
      sameLocalCast.nextCriticalSample({ castId: 'cast-a' }),
    );
    expect(withLocalCast.nextCriticalSample()).not.toBe(sameLocalCast.nextCriticalSample());
  });

  it('期望模式中技能块种子隔离同一干员先前的取样，并改变本块序列起点', () => {
    const firstState = createSimulationRandomState();
    const secondState = createSimulationRandomState();
    submitSimulationCastSeed(firstState, 'cast-a', 2);
    submitSimulationCastSeed(secondState, 'cast-a', 2);
    const first = new SimulationRandomSource({ mode: 'expected', globalSeed: 1 }, () => firstState);
    const second = new SimulationRandomSource(
      { mode: 'expected', globalSeed: 999 },
      () => secondState,
    );
    first.nextCriticalSample({ expectedSequenceId: 'operator-a' });
    first.nextCriticalSample({ expectedSequenceId: 'operator-a' });
    const seededSamples = [
      first.nextCriticalSample({ castId: 'cast-a' }),
      first.nextCriticalSample({ castId: 'cast-a' }),
    ];
    expect(seededSamples).toEqual([
      second.nextCriticalSample({ castId: 'cast-a' }),
      second.nextCriticalSample({ castId: 'cast-a' }),
    ]);
    const changedState = createSimulationRandomState();
    submitSimulationCastSeed(changedState, 'cast-a', 1000);
    const changed = new SimulationRandomSource(
      { mode: 'expected', globalSeed: 1 },
      () => changedState,
    );
    expect(changed.nextCriticalSample({ castId: 'cast-a' })).not.toBe(seededSamples[0]);
  });

  it('恢复时固定全局配置和已消费施放种子，但允许修改未来施放种子', () => {
    const state = createSimulationRandomState();
    submitSimulationCastSeed(state, 'cast-a', 7);
    const original = new SimulationRandomSource({ mode: 'sampled', globalSeed: 123 }, () => state);
    original.nextCriticalSample({ castId: 'cast-a' });
    const saved = structuredClone(state);

    const restored = structuredClone(saved);
    expect(
      () => new SimulationRandomSource({ mode: 'sampled', globalSeed: 123 }, () => restored),
    ).not.toThrow();
    expect(() => submitSimulationCastSeed(restored, 'cast-b', 99)).not.toThrow();
    expect(() => submitSimulationCastSeed(restored, 'cast-a', 8)).toThrow(
      'cannot change submitted',
    );
    expect(
      () =>
        new SimulationRandomSource({ mode: 'sampled', globalSeed: 124 }, () =>
          structuredClone(saved),
        ),
    ).toThrow('random configuration does not match');
    const conflicting = structuredClone(saved);
    conflicting.submittedCastSeeds.set('cast-a', 8);
    expect(
      () => new SimulationRandomSource({ mode: 'sampled', globalSeed: 123 }, () => conflicting),
    ).toThrow("consumed cast 'cast-a' does not match");
  });

  it.each([-1, 0x100000000, 1.5])('rejects invalid seed %s', seed => {
    expect(() => createSource({ mode: 'sampled', globalSeed: seed })).toThrow(
      '32-bit unsigned integer',
    );
  });
});
