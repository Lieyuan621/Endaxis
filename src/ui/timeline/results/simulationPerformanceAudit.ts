import type { ScenarioSimulationPerformanceSample } from '../../../application/simulation/scenarioSimulationService';

export const SIMULATION_PERFORMANCE_HISTORY_LIMIT = 60;

export interface SimulationPerformanceSummary {
  readonly sampleCount: number;
  readonly latestMs: number | null;
  readonly p95Ms: number | null;
  readonly maximumMs: number | null;
  readonly cacheHitRate: number | null;
  readonly overBudgetCount: number;
}

export function appendSimulationPerformanceSample(
  samples: readonly ScenarioSimulationPerformanceSample[],
  sample: ScenarioSimulationPerformanceSample,
  limit: number = SIMULATION_PERFORMANCE_HISTORY_LIMIT,
): readonly ScenarioSimulationPerformanceSample[] {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('history limit must be positive');
  return Object.freeze([...samples.slice(-(limit - 1)), sample]);
}

export function summarizeSimulationPerformance(
  samples: readonly ScenarioSimulationPerformanceSample[],
  budgetMs: number,
): SimulationPerformanceSummary {
  if (samples.length === 0) {
    return Object.freeze({
      sampleCount: 0,
      latestMs: null,
      p95Ms: null,
      maximumMs: null,
      cacheHitRate: null,
      overBudgetCount: 0,
    });
  }
  const durations = samples.map(sample => sample.totalMs).sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);
  const cacheHits = samples.filter(sample => sample.cacheHit).length;
  return Object.freeze({
    sampleCount: samples.length,
    latestMs: samples[samples.length - 1]!.totalMs,
    p95Ms: durations[p95Index]!,
    maximumMs: durations[durations.length - 1]!,
    cacheHitRate: cacheHits / samples.length,
    overBudgetCount: samples.filter(sample => sample.totalMs > budgetMs).length,
  });
}
