import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import type { EndaxisProjectDocument } from '../../src/core/project/schema.ts';

/** 离线基线：读取完整项目，复用正式模拟入口，不修改原文件或已有落点。 */
const input = process.argv[2];
const repetitions = Number(process.argv[3] ?? 1);
if (!Number.isSafeInteger(repetitions) || repetitions < 1) throw new Error('重复次数必须为正整数');
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
    for (let sample = 0; sample < repetitions * 4; sample++) {
      const offset = sample % 4;
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
      const cloneMs = performance.now() - start;
      const receiptHash = createHash('sha256')
        .update(JSON.stringify(result.receiptEntries))
        .digest('hex');
      const resultHash = createHash('sha256').update(JSON.stringify(result)).digest('hex');
      samples.push({ offsetFrames: offset, timing, cloneMs, receiptHash, resultHash });
    }
    console.log(
      JSON.stringify({
        scenarioId: scenario.id,
        name: scenario.name,
        skillCastCount: scenario.tracks.reduce(
          (count, track) => count + (track?.skillCasts.length ?? 0),
          0,
        ),
        samples,
      }),
    );
  }
} finally {
  await server.close();
}
