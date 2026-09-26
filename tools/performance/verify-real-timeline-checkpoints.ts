/**
 * 用真实项目验证模拟保存点。
 *
 * 同一场景分别走完整排程、逐帧提交，以及从事件边界保存后分支续算三条路径。
 * 三条路径的最终状态、回执和结果必须完全一致。项目文件只读，报告写到标准输出。
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createServer } from 'vite';

const input = process.argv[2];
if (input === undefined) {
  throw new Error(
    '用法：node --experimental-strip-types tools/performance/verify-real-timeline-checkpoints.ts <project.json> [scenario-index] [seed]',
  );
}
const scenarioIndex = Number(process.argv[3] ?? 0);
const seed = Number(process.argv[4] ?? 123);
if (!Number.isSafeInteger(scenarioIndex) || scenarioIndex < 0) {
  throw new Error('scenario-index 必须是从 0 开始的整数');
}
if (!Number.isSafeInteger(seed)) throw new Error('seed 必须是整数');

const digest = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const digestText = (value: string): string => createHash('sha256').update(value).digest('hex');

function damageSummary(receipts: readonly { event: string; data?: { expectedDamage?: number } }[]) {
  const hits = receipts.filter(entry => entry.event === 'DamageApplied');
  return {
    hits: hits.length,
    expectedDamage: hits.reduce((sum, entry) => sum + (entry.data?.expectedDamage ?? 0), 0),
  };
}

function chooseCheckpointFrames(
  receipts: readonly { event: string; frame: number; data?: Record<string, unknown> }[],
  endFrame: number,
) {
  const selected = new Map<number, Set<string>>();
  const add = (frame: number, label: string) => {
    if (frame < 0 || frame >= endFrame) return;
    const labels = selected.get(frame) ?? new Set<string>();
    labels.add(label);
    selected.set(frame, labels);
  };
  const eventKinds = [
    'TimeDilationStarted',
    'TimeDilationEnded',
    'BuffDamageApplied',
    'AbilityEntitySpawned',
    'AbilityEntityChildSkillRequested',
    'AbilityEntityFinished',
  ];
  for (const event of eventKinds) {
    const entry = receipts.find(candidate => candidate.event === event && candidate.frame > 0);
    if (entry === undefined) continue;
    add(entry.frame - 1, `${event}:before`);
    add(entry.frame, `${event}:after`);
  }
  if (selected.size === 0) {
    for (const ratio of [1 / 3, 1 / 2, 2 / 3]) add(Math.floor(endFrame * ratio), 'fallback');
  }
  return [...selected.entries()]
    .sort(([left], [right]) => left - right)
    .map(([frame, labels]) => ({ frame, events: [...labels] }));
}

function assertSame(label: string, actual: unknown, expected: unknown): void {
  if (isDeepStrictEqual(actual, expected)) return;
  const actualArray = Array.isArray(actual) ? actual : [];
  const expectedArray = Array.isArray(expected) ? expected : [];
  const firstDifferentIndex = actualArray.findIndex(
    (entry, index) => !isDeepStrictEqual(entry, expectedArray[index]),
  );
  throw new Error(
    JSON.stringify({
      label,
      firstDifferentIndex,
      actualLength: actualArray.length || undefined,
      expectedLength: expectedArray.length || undefined,
      actualEntry: firstDifferentIndex < 0 ? undefined : actualArray[firstDifferentIndex],
      expectedEntry: firstDifferentIndex < 0 ? undefined : expectedArray[firstDifferentIndex],
    }),
  );
}

function withoutInputPlan(state: Record<string, unknown>): Record<string, unknown> {
  const { inputs: _inputs, ...combatState } = state;
  return canonicalizeProgramRevisions(combatState) as Record<string, unknown>;
}

// 程序修订号是编译顺序身份（compiled-program:N），不是行为事实；预排程与逐帧两种模式
// 编译顺序不同，比较运行状态前先归一化，回执与数值状态不受影响。
function canonicalizeProgramRevisions(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('["compiled-program:')) {
      return value.replace(/"compiled-program:\d+"/g, '"compiled-program:#"');
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalizeProgramRevisions);
  if (value instanceof Map)
    return new Map([...value].map(([k, item]) => [k, canonicalizeProgramRevisions(item)]));
  if (value instanceof Set) return new Set([...value].map(canonicalizeProgramRevisions));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        canonicalizeProgramRevisions(item),
      ]),
    );
  }
  return value;
}

const projectPath = resolve(input);
const projectSource = readFileSync(projectPath, 'utf8');
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  server: { middlewareMode: true, watch: null, hmr: false },
  optimizeDeps: { noDiscovery: true },
});

try {
  const { parseProjectDocument } = await server.ssrLoadModule('/src/core/project/serialization.ts');
  const { createProjectGameDataRepository } = await server.ssrLoadModule(
    '/src/data/projectGameDataRepository.ts',
  );
  const { createEditorSimulationService } = await server.ssrLoadModule(
    '/src/application/simulation/editorSimulationService.ts',
  );
  const { CombatInputSchedule } = await server.ssrLoadModule(
    '/src/application/simulation/combatInputSchedule.ts',
  );
  const parsed = parseProjectDocument(projectSource);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed));
  const project = parsed.value;
  const sourceScenario = project.scenarios[scenarioIndex];
  if (sourceScenario === undefined) throw new Error(`项目不存在方案 ${scenarioIndex}`);
  const repository = await createProjectGameDataRepository(project);
  const service = createEditorSimulationService(repository);

  for (const mode of ['expected', 'sampled'] as const) {
    const scenario = structuredClone(sourceScenario);
    scenario.battle.random = { mode, globalSeed: seed };
    const endFrame = scenario.battle.durationFrames;
    const schedule = service.compileInputSchedule(scenario);

    const scheduled = service.createCombatSession(scenario);
    scheduled.advanceToFrame(endFrame);
    const scheduledState = scheduled.runtime.readState();
    const scheduledReceipts = scheduled.runtime.readHistory().toArray();
    const scheduledResult = scheduled.collectResult();

    const live = new CombatInputSchedule(
      service.createInputCombatSession(
        scenario,
        Math.min(0, ...schedule.inputs.map((input: { frame: number }) => input.frame)),
      ),
      schedule.inputs,
      schedule.groups,
      schedule.customSkillPrograms,
    );
    live.advanceToFrame(endFrame);
    assertSame('逐帧提交回执', live.session.runtime.readHistory().toArray(), scheduledReceipts);
    assertSame(
      '逐帧提交战斗状态',
      withoutInputPlan(live.session.runtime.readState()),
      withoutInputPlan(scheduledState),
    );
    assertSame('逐帧提交结果', live.session.collectResult(), scheduledResult);

    const checkpoints = chooseCheckpointFrames(scheduledReceipts, endFrame);
    for (const checkpoint of checkpoints) {
      const parent = new CombatInputSchedule(
        service.createInputCombatSession(
          scenario,
          Math.min(0, ...schedule.inputs.map((input: { frame: number }) => input.frame)),
        ),
        schedule.inputs,
        schedule.groups,
        schedule.customSkillPrograms,
      );
      parent.advanceToFrame(checkpoint.frame);
      const saved = parent.save();
      const branch = parent.fork(saved);
      assertSame(
        '保存后立即恢复的状态',
        branch.session.runtime.readState(),
        parent.session.runtime.readState(),
      );
      assertSame(
        '保存后立即恢复的回执',
        branch.session.runtime.readHistory().toArray(),
        parent.session.runtime.readHistory().toArray(),
      );
      parent.advanceToFrame(endFrame);
      branch.advanceToFrame(endFrame);
      assertSame(
        '分支续算状态',
        branch.session.runtime.readState(),
        parent.session.runtime.readState(),
      );
      assertSame('分支续算回执', branch.session.runtime.readHistory().toArray(), scheduledReceipts);
      assertSame('分支续算结果', branch.session.collectResult(), scheduledResult);
      parent.discardCheckpoint(saved);
    }

    console.log(
      JSON.stringify({
        projectPath,
        projectSha256: digestText(projectSource),
        scenarioIndex,
        scenarioName: scenario.name,
        mode,
        seed,
        endFrame,
        inputs: schedule.inputs.length,
        groups: schedule.groups.length,
        checkpoints,
        receipts: scheduledReceipts.length,
        receiptSha256: digest(scheduledReceipts),
        ...damageSummary(scheduledReceipts),
      }),
    );
  }
} finally {
  await server.close();
}
