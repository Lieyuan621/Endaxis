import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { createServer, build, type ViteDevServer } from 'vite';
import { inspectorSchemaPlugin } from './vitePlugin';
import { syncInspectorSchema } from './sync';

const roots: string[] = [];
const servers: ViteDevServer[] = [];
function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), 'endaxis-inspector-test-'));
  roots.push(root);
  mkdirSync(resolve(root, 'packages/game-data-contract/src'), { recursive: true });
  writeFileSync(
    resolve(root, 'packages/game-data-contract/src/equipment.ts'),
    "export type EquipmentModifierDefinition = { kind: 'attribute'; value: number } | { kind: 'panelStat'; value: number }; export interface EquipmentEventHandlerDefinition { key: string }; export interface EquipmentContributionDefinition { blackboard?: Readonly<Record<string, number>> };",
  );
  writeFileSync(
    resolve(root, 'packages/game-data-contract/src/conditions.ts'),
    "export type ActionValueOperand = { kind: 'constant'; value: number }; export type CombatCondition = { kind: 'a'; value: number } | { kind: 'b'; flag: boolean };",
  );
  writeFileSync(
    resolve(root, 'packages/game-data-contract/src/actions.ts'),
    "import type { Value } from './primitives'; export interface CombatStepParameters { sample: { value: Value } } export type CombatEventTrigger = { kind: 'a' } | { kind: 'b'; value: Value }; export interface CombatEventResponseDefinition { key: string }; export interface CombatEventHandlerDefinition { key: string };",
  );
  writeFileSync(
    resolve(root, 'packages/game-data-contract/src/primitives.ts'),
    'export type Value = number;',
  );
  return root;
}
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.close()));
  // 仅删除本测试通过 mkdtemp 创建的临时根目录。
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it('冷启动自动恢复缓存，类型依赖改变后自动刷新元数据', async () => {
  const root = fixture();
  const server = await createServer({
    root,
    configFile: false,
    plugins: [inspectorSchemaPlugin()],
    server: { middlewareMode: true },
    logLevel: 'silent',
  });
  servers.push(server);
  const output = resolve(root, 'src/ui/timeline/definitions/inspector/stepStructure.generated.ts');
  expect(readFileSync(output, 'utf8')).toContain('"type":"number"');
  await server.transformRequest(
    '/src/ui/timeline/definitions/inspector/stepStructure.generated.ts',
  );
  await vi.waitFor(() =>
    expect(
      Object.values(server.watcher.getWatched()).some(files => files.includes('primitives.ts')),
    ).toBe(true),
  );
  writeFileSync(
    resolve(root, 'packages/game-data-contract/src/primitives.ts'),
    'export type Value = string;',
  );
  await vi.waitFor(() => expect(readFileSync(output, 'utf8')).toContain('"type":"text"'), {
    timeout: 10000,
  });
  expect(
    (
      await server.transformRequest(
        '/src/ui/timeline/definitions/inspector/stepStructure.generated.ts',
      )
    )?.code,
  ).toContain('text');
}, 20000);

it('构建不依赖预生成文件；无变化不重写，语法错误保留最后有效缓存', async () => {
  const root = fixture();
  const output = resolve(root, 'src/ui/timeline/definitions/inspector/stepStructure.generated.ts');
  await build({
    root,
    configFile: false,
    plugins: [inspectorSchemaPlugin()],
    logLevel: 'silent',
    build: { write: false, lib: { entry: output, formats: ['es'] } },
  });
  const before = readFileSync(output, 'utf8');
  const time = statSync(output).mtimeMs;
  expect(syncInspectorSchema(root)).toEqual([]);
  expect(statSync(output).mtimeMs).toBe(time);
  writeFileSync(
    resolve(root, 'packages/game-data-contract/src/actions.ts'),
    'export interface CombatStepParameters { sample: ; }',
  );
  expect(() => syncInspectorSchema(root)).toThrow('actions.ts');
  expect(readFileSync(output, 'utf8')).toBe(before);
}, 20000);
