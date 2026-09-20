import { describe, expect, it, vi } from 'vitest';
import {
  SimulationPipeline,
  type PipelineStage,
  type VersionedArtifact,
} from './simulationPipeline';

function stage<Input, Output>(
  id: string,
  execute: (input: VersionedArtifact<Input>) => VersionedArtifact<Output>,
): PipelineStage<Input, Output> {
  return {
    id,
    revision: '1',
    execute: vi.fn(async input => execute(input)),
  };
}

describe('SimulationPipeline', () => {
  it('reuses deterministic stage results for the same input revision', async () => {
    const resolve = stage<number, number>('resolve', input => ({
      revision: `resolved:${input.revision}`,
      data: input.data + 1,
    }));
    const compile = stage<number, number>('compile', input => ({
      revision: `compiled:${input.revision}`,
      data: input.data * 2,
    }));
    const simulate = stage<number, number>('simulate', input => ({
      revision: `run:${input.revision}`,
      data: input.data + 3,
    }));
    const pipeline = new SimulationPipeline({
      resolveScenario: resolve,
      compileCombatProgram: compile,
      runCombat: simulate,
    });
    const input = { revision: 'project:1', data: 10 };

    const first = await pipeline.run(input);
    const second = await pipeline.run(input);

    expect(second).toEqual(first);
    expect(resolve.execute).toHaveBeenCalledTimes(1);
    expect(compile.execute).toHaveBeenCalledTimes(1);
    expect(simulate.execute).toHaveBeenCalledTimes(1);
  });

  it('invalidates downstream stages when the input revision changes', async () => {
    const resolve = stage<number, number>('resolve', input => ({
      revision: `resolved:${input.revision}`,
      data: input.data,
    }));
    const compile = stage<number, number>('compile', input => ({
      revision: `compiled:${input.revision}`,
      data: input.data,
    }));
    const simulate = stage<number, number>('simulate', input => ({
      revision: `run:${input.revision}`,
      data: input.data,
    }));
    const pipeline = new SimulationPipeline({
      resolveScenario: resolve,
      compileCombatProgram: compile,
      runCombat: simulate,
    });

    await pipeline.run({ revision: 'project:1', data: 10 });
    await pipeline.run({ revision: 'project:2', data: 10 });

    expect(resolve.execute).toHaveBeenCalledTimes(2);
    expect(compile.execute).toHaveBeenCalledTimes(2);
    expect(simulate.execute).toHaveBeenCalledTimes(2);
  });

  it('computes projections lazily and independently', async () => {
    const pipeline = new SimulationPipeline({
      resolveScenario: stage<number, number>('resolve', input => input),
      compileCombatProgram: stage<number, number>('compile', input => input),
      runCombat: stage<number, number>('simulate', input => input),
    });
    const combatRun = (await pipeline.run({ revision: 'run:1', data: 10 })).combatRun;
    const damageProjection = stage<number, string>('damage-projection', input => ({
      revision: `damage:${input.revision}`,
      data: `damage:${input.data}`,
    }));
    const resourceProjection = stage<number, string>('resource-projection', input => ({
      revision: `resource:${input.revision}`,
      data: `resource:${input.data}`,
    }));

    await pipeline.project(combatRun, damageProjection);
    await pipeline.project(combatRun, damageProjection);
    await pipeline.project(combatRun, resourceProjection);

    expect(damageProjection.execute).toHaveBeenCalledTimes(1);
    expect(resourceProjection.execute).toHaveBeenCalledTimes(1);
  });

  it('evicts the least recently used completed result when bounded', async () => {
    const resolve = stage<number, number>('resolve', input => ({
      revision: `resolved:${input.revision}`,
      data: input.data,
    }));
    const pipeline = new SimulationPipeline(
      {
        resolveScenario: resolve,
        compileCombatProgram: stage<number, number>('compile', input => input),
        runCombat: stage<number, number>('simulate', input => input),
      },
      { maxEntries: 3 },
    );

    await pipeline.run({ revision: 'project:1', data: 1 });
    await pipeline.run({ revision: 'project:2', data: 2 });
    await pipeline.run({ revision: 'project:1', data: 1 });

    expect(resolve.execute).toHaveBeenCalledTimes(3);
  });

  it('does not cache a stage result when cancellation is observed', async () => {
    const controller = new AbortController();
    const resolve = stage<number, number>('resolve', input => {
      controller.abort('cancelled');
      return input;
    });
    const pipeline = new SimulationPipeline({
      resolveScenario: resolve,
      compileCombatProgram: stage<number, number>('compile', input => input),
      runCombat: stage<number, number>('simulate', input => input),
    });

    await expect(
      pipeline.run({ revision: 'project:1', data: 1 }, { signal: controller.signal }),
    ).rejects.toBe('cancelled');
    expect(resolve.execute).toHaveBeenCalledTimes(1);
  });
});
