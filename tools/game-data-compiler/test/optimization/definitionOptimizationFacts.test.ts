/** 对照摘要必须保留资源限制与随机流等可影响后续战斗的状态。 */
import { describe, expect, it } from 'vitest';
import { gameDataRepository } from '../../../../src/data/gameDataRepository.ts';
import {
  createOptimizationRandomSamples,
  encodeOptimizationFacts,
  optimizationSimulationFacts,
  optimizationSimulationScenario,
  optimizationSimulationService,
} from '../support/definitionOptimizationSimulation.ts';

describe('优化对照的事实摘要', () => {
  it('区分无限制、禁止全部、允许指定标签；同一集合的插入顺序不影响摘要', async () => {
    const scenario = optimizationSimulationScenario(gameDataRepository.getOperators()[0]!, 1, 0);
    const run = await optimizationSimulationService().simulate(scenario, 0);
    expect(run.finalResources.squad).toHaveLength(1);
    const facts = (allowedUltimateEnergyRecoveryTags: ReadonlySet<string> | null) =>
      optimizationSimulationFacts({
        ...run,
        finalResources: {
          ...run.finalResources,
          squad: run.finalResources.squad.map(member => ({
            ...member,
            allowedUltimateEnergyRecoveryTags,
          })),
        },
      });
    const unrestricted = facts(null);
    const denied = facts(new Set());
    const allowed = facts(new Set(['Recovery.Skill', 'Recovery.Buff']));
    expect(denied).not.toEqual(unrestricted);
    expect(allowed).not.toEqual(denied);
    expect(encodeOptimizationFacts(allowed)).toEqual(
      encodeOptimizationFacts(facts(new Set(['Recovery.Buff', 'Recovery.Skill']))),
    );
    const unsupportedRun = { ...run, futureSnapshotType: new Date() };
    expect(() => optimizationSimulationFacts(unsupportedRun)).toThrow('尚未支持的对象类型');
  });

  it('稳定编码保留普通 JSON 会丢失的值，且不同类型不能串成同一结果', () => {
    const values = [
      undefined,
      null,
      NaN,
      Infinity,
      -Infinity,
      -0,
      0,
      '0',
      {},
      [],
      new Array(1),
      [undefined],
      new Set(),
      new Map(),
    ];
    expect(new Set(values.map(encodeOptimizationFacts)).size).toBe(values.length);
    expect(encodeOptimizationFacts({ a: 1, b: undefined })).toBe(
      encodeOptimizationFacts({ b: undefined, a: 1 }),
    );
    expect(
      encodeOptimizationFacts(
        new Map([
          ['a', 1],
          ['b', 2],
        ]),
      ),
    ).toBe(
      encodeOptimizationFacts(
        new Map([
          ['b', 2],
          ['a', 1],
        ]),
      ),
    );
  });

  it('随机流可复现且变化，一次额外抽样会改变计数及后续样本', () => {
    const a = createOptimizationRandomSamples();
    const b = createOptimizationRandomSamples();
    const values = Array.from({ length: 8 }, () => a.probabilitySamples.nextProbabilitySample());
    expect(new Set(values).size).toBe(8);
    expect(Array.from({ length: 8 }, () => b.probabilitySamples.nextProbabilitySample())).toEqual(
      values,
    );
    expect(a.counts()).toEqual(b.counts());
    b.probabilitySamples.nextProbabilitySample();
    expect(a.counts()).not.toEqual(b.counts());
    expect(a.probabilitySamples.nextProbabilitySample()).not.toBe(
      b.probabilitySamples.nextProbabilitySample(),
    );
  });
});
