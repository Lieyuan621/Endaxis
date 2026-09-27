import { describe, expect, it } from 'vitest';
import type { ScenarioSimulationPerformanceSample } from '../../../application/simulation/scenarioSimulationService';
import {
  appendSimulationPerformanceSample,
  summarizeSimulationPerformance,
} from './simulationPerformanceAudit';

function sample(totalMs: number): ScenarioSimulationPerformanceSample {
  return {
    totalMs,
    simulationMs: totalMs,
    projectionMs: 0,
    outcome: 'completed',
    endFrame: 30,
    receiptCount: 0,
  };
}

describe('simulationPerformanceAudit', () => {
  it('只保留最新的性能样本窗口', () => {
    const samples = [sample(1), sample(2)];
    expect(
      appendSimulationPerformanceSample(samples, sample(3), 2).map(item => item.totalMs),
    ).toEqual([2, 3]);
  });

  it('计算最近值、nearest-rank P95 与超预算次数', () => {
    const samples = Array.from({ length: 20 }, (_, index) => sample(index + 1));

    expect(summarizeSimulationPerformance(samples, 15)).toEqual({
      sampleCount: 20,
      latestMs: 20,
      p95Ms: 19,
      maximumMs: 20,
      overBudgetCount: 5,
    });
  });
});
