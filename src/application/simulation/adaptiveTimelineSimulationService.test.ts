import { expect, it, vi } from 'vitest';
import type { ScenarioSimulationPerformanceSample } from './scenarioSimulationService';
import { AdaptiveTimelineSimulationService } from './adaptiveTimelineSimulationService';
import { createEmptyScenario } from '../../core/project/createProject';

function sample(totalMs: number): ScenarioSimulationPerformanceSample {
  return {
    totalMs,
    cacheLookupMs: 0,
    simulationMs: totalMs,
    projectionMs: 0,
    cacheHit: false,
    outcome: 'completed',
    endFrame: 60,
    receiptCount: 0,
  };
}

function backend(label: string) {
  const listeners = new Set<(value: ScenarioSimulationPerformanceSample) => void>();
  return {
    simulate: vi.fn(async () => ({ label })),
    planSkillChain: vi.fn(),
    subscribePerformance: vi.fn(
      (listener: (value: ScenarioSimulationPerformanceSample) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    ),
    clearCache: vi.fn(),
    dispose: vi.fn(),
    publish: (value: ScenarioSimulationPerformanceSample) => {
      for (const listener of listeners) listener(value);
    },
  };
}

it('uses the local simulator for an entire drag when the latest worker run is fast', async () => {
  const worker = backend('worker');
  const local = backend('local');
  const service = new AdaptiveTimelineSimulationService(worker as never, () => local as never);
  const scenario = createEmptyScenario('adaptive:fast', 'fast');

  worker.publish(sample(50));
  service.beginInteractiveSession();
  expect(((await service.simulate(scenario, 60)) as unknown as { label: string }).label).toBe(
    'local',
  );
  local.publish(sample(51));
  expect(((await service.simulate(scenario, 60)) as unknown as { label: string }).label).toBe(
    'local',
  );
  service.endInteractiveSession();

  service.beginInteractiveSession();
  expect(((await service.simulate(scenario, 60)) as unknown as { label: string }).label).toBe(
    'worker',
  );
  service.dispose();
});

it('replaces a slow startup sample after one fast complete run, starting with the next drag', async () => {
  const worker = backend('worker');
  const local = backend('local');
  const service = new AdaptiveTimelineSimulationService(worker as never, () => local as never);
  const scenario = createEmptyScenario('adaptive:startup', 'startup');

  worker.publish(sample(200));
  worker.publish({ ...sample(1), cacheHit: true });
  service.beginInteractiveSession();
  expect(await service.simulate(scenario, 60)).toEqual({ label: 'worker' });
  worker.publish(sample(20));
  expect(await service.simulate(scenario, 60)).toEqual({ label: 'worker' });
  service.endInteractiveSession();

  service.beginInteractiveSession();
  expect(await service.simulate(scenario, 60)).toEqual({ label: 'local' });
  service.endInteractiveSession();

  service.clearCache();
  service.beginInteractiveSession();
  expect(await service.simulate(scenario, 60)).toEqual({ label: 'worker' });
  service.dispose();
});

it('keeps slow and unmeasured scenarios in the worker', async () => {
  const worker = backend('worker');
  const local = backend('local');
  const service = new AdaptiveTimelineSimulationService(worker as never, () => local as never);
  const scenario = createEmptyScenario('adaptive:slow', 'slow');

  service.beginInteractiveSession();
  expect(((await service.simulate(scenario, 60)) as unknown as { label: string }).label).toBe(
    'worker',
  );
  service.endInteractiveSession();
  worker.publish(sample(51));
  service.beginInteractiveSession();
  expect(((await service.simulate(scenario, 60)) as unknown as { label: string }).label).toBe(
    'worker',
  );
  service.dispose();
});
