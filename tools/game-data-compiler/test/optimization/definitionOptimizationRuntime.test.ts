/** 用真实生成定义做新增优化的双路模拟；旧版模拟器不参与结果判定。 */
import { describe, expect, it } from 'vitest';
import { optimizeOperatorDefinitionPrograms } from '../../src/compiler/optimization/definitionProgramOptimization.ts';
import { gameDataRepository } from '../../../../src/data/gameDataRepository.ts';
import {
  createOptimizationRandomSamples,
  optimizationSimulationFacts as facts,
  optimizationSimulationScenario,
  optimizationSimulationService,
} from '../support/definitionOptimizationSimulation.ts';

describe('生成定义优化后的真实模拟', () => {
  it.each(gameDataRepository.getOperators().map(operator => operator.slug))(
    '%s 的等级与潜能组合保持命中、状态、资源、诊断和可见曲线',
    async slug => {
      const operator = gameDataRepository.getOperator(slug)!;
      expect(optimizeOperatorDefinitionPrograms(operator, 'report').operator).toBe(operator);
      const optimized = optimizeOperatorDefinitionPrograms(operator, 'apply');
      expect(optimized.report.before.steps).toBeGreaterThanOrEqual(optimized.report.after.steps);
      expect(optimizeOperatorDefinitionPrograms(optimized.operator, 'apply').operator).toEqual(
        optimized.operator,
      );
      for (const [level, potential] of [
        [1, 0],
        [12, 5],
      ] as const) {
        const scenario = optimizationSimulationScenario(operator, level, potential);
        const originalInput = structuredClone(scenario);
        const originalRandom = createOptimizationRandomSamples();
        const appliedRandom = createOptimizationRandomSamples();
        const original = await optimizationSimulationService(
          gameDataRepository,
          originalRandom,
        ).simulate(scenario, scenario.battle.durationFrames);
        const applied = await optimizationSimulationService(
          {
            ...gameDataRepository,
            getOperator: id =>
              id === slug ? optimized.operator : gameDataRepository.getOperator(id),
          },
          appliedRandom,
        ).simulate(scenario, scenario.battle.durationFrames);
        expect(scenario).toEqual(originalInput);
        expect(
          original.receiptEntries.filter(entry => entry.event === 'DamageApplied').length,
        ).toBeGreaterThan(0);
        expect(facts(applied)).toEqual(facts(original));
        expect(appliedRandom.counts()).toEqual(originalRandom.counts());
      }
    },
    30_000,
  );
});
