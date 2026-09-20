import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import type { EndaxisProjectDocument } from '../../src/core/project/schema.ts';

/** 离线基线：读取完整项目，复用正式模拟入口，不修改原文件或已有落点。 */
const input = process.argv[2];
if (!input)
  throw new Error(
    '用法：node --experimental-strip-types tools/performance/benchmark-real-timelines.ts <project.json>',
  );
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true },
});
try {
  const { parseProjectDocument } = await server.ssrLoadModule('/src/core/project/serialization.ts');
  const parsed = parseProjectDocument(readFileSync(resolve(input), 'utf8'));
  if (!parsed.ok) throw new Error(JSON.stringify(parsed));
  const project: EndaxisProjectDocument = parsed.value;
  const { createProjectGameDataRepository } = await server.ssrLoadModule(
    '/src/data/projectGameDataRepository.ts',
  );
  const { createEditorSimulationService } = await server.ssrLoadModule(
    '/src/application/simulation/editorSimulationService.ts',
  );
  const repository = await createProjectGameDataRepository(project);
  const service = createEditorSimulationService(repository);
  let timing: unknown;
  service.subscribePerformance((sample: unknown) => {
    timing = sample;
  });
  for (const scenario of project.scenarios) {
    const samples = [];
    for (let offset = 0; offset < 4; offset++) {
      const candidate = structuredClone(scenario);
      const cast = candidate.tracks
        .flatMap(track => track?.skillCasts ?? [])
        .find(cast => cast.placement.startFrame !== undefined);
      if (cast?.placement.startFrame !== undefined) cast.placement.startFrame += offset;
      const result = await service.simulate(
        candidate,
        candidate.battle.simulationRange?.endFrame ?? candidate.battle.durationFrames,
      );
      const start = performance.now();
      structuredClone(result);
      samples.push({ offsetFrames: offset, timing, cloneMs: performance.now() - start });
    }
    console.log(JSON.stringify({ scenarioId: scenario.id, name: scenario.name, samples }));
  }
} finally {
  await server.close();
}
