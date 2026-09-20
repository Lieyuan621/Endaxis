import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createServer } from 'vite';

if (process.argv.length !== 3) {
  throw new Error(
    '用法：node --experimental-strip-types tools/legacy-timeline/auditSimulation.ts <project.json>',
  );
}
const content = await readFile(resolve(process.argv[2]!), 'utf8');
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true },
});
try {
  const { parseProjectDocument } = await server.ssrLoadModule('/src/core/project/serialization.ts');
  const parsed = parseProjectDocument(content);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed));
  const { createEditorSimulationService } = await server.ssrLoadModule(
    '/src/application/simulation/editorSimulationService.ts',
  );
  const { auditScenarioSimulation } = await server.ssrLoadModule(
    '/tools/legacy-timeline/simulationAudit.ts',
  );
  const project = parsed.value;
  const { createProjectGameDataRepository } = await server.ssrLoadModule(
    '/src/data/projectGameDataRepository.ts',
  );
  const { createProjectGameDataIndex } = await server.ssrLoadModule(
    '/src/core/project/projectDefinitionLibrary.ts',
  );
  const repository = await createProjectGameDataRepository(project);
  const service = createEditorSimulationService(
    createProjectGameDataIndex(repository, project.definitionLibrary),
  );
  const scenarios = [];
  for (const scenario of project.scenarios)
    scenarios.push(await auditScenarioSimulation(service, scenario));
  console.log(
    JSON.stringify(
      {
        projectSha256: createHash('sha256').update(content).digest('hex'),
        fps: project.fps,
        metric:
          'All DamageApplied.expectedDamage emitted by each run; no castId or display-range filtering',
        scenarios,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
