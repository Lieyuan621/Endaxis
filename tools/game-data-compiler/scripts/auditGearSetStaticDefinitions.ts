import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

import { compileEquipmentSuitStaticDefinitionBatchSource } from '../src/index.ts';

const args = parseArguments(process.argv.slice(2));
const table = async (name: string) =>
  JSON.parse(await readFile(resolve(args.tables, `${name}.json`), 'utf8')) as unknown;
const skillData = await readJsonDirectory(args.skills);
const batch = compileEquipmentSuitStaticDefinitionBatchSource(
  await table('EquipSuitTable'),
  skillData,
  await table('SkillPatchTable'),
);
const modifiers = batch.definitions.flatMap(definition => definition.modifiers);
const audit = {
  format: 'EndaxisEquipmentSuitStaticDefinitionAudit',
  version: 1,
  clientVersion: args.clientVersion,
  definitionCount: batch.definitions.length,
  modifierCount: modifiers.length,
  modifierKindCounts: countBy(modifiers, modifier => modifier.kind),
  scenarioOmissionCount: batch.diagnostics.filter(item => item.status === 'scenario-omitted')
    .length,
  blockedCount: batch.diagnostics.filter(item => item.status === 'blocked').length,
  definitions: batch.definitions,
  runtimeDependencies: batch.runtimeDependencies,
  diagnostics: batch.diagnostics,
};
await writeAtomic(args.jsonOutput, `${JSON.stringify(audit, null, 2)}\n`);
await writeAtomic(
  args.markdownOutput,
  `# 装备套装静态定义审计

- 客户端版本：\`${audit.clientVersion}\`
- 三件套定义候选：${audit.definitionCount}
- 静态修正：${audit.modifierCount}
- 木桩场景明确省略：${audit.scenarioOmissionCount}
- 阻塞：${audit.blockedCount}

${Object.entries(audit.modifierKindCounts)
  .map(([kind, count]) => `- \`${kind}\`：${count}`)
  .join('\n')}

这些候选只包含 CardSkill 中构筑期可确定的静态修正。\`runtimeDependencies\` 单独保留启动 Buff、条件 Buff 与动作图引用；这些依赖闭合前，不得把候选当作完整套装注册。
`,
);
console.log(
  JSON.stringify({
    definitionCount: audit.definitionCount,
    modifierCount: audit.modifierCount,
    scenarioOmissionCount: audit.scenarioOmissionCount,
    blockedCount: audit.blockedCount,
  }),
);

async function readJsonDirectory(directory: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const file of (await readdir(directory)).sort()) {
    if (!file.endsWith('.json')) continue;
    result[basename(file, '.json')] = JSON.parse(
      await readFile(resolve(directory, file), 'utf8'),
    ) as unknown;
  }
  return result;
}

function countBy<T>(values: readonly T[], key: (value: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[key(value)] = (counts[key(value)] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)),
  );
}

async function writeAtomic(path: string, content: string): Promise<void> {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.part-${process.pid}`;
  const backup = `${target}.backup-${process.pid}`;
  await writeFile(temporary, content, 'utf8');
  let moved = false;
  try {
    if (await exists(target)) {
      await rename(target, backup);
      moved = true;
    }
    await rename(temporary, target);
    if (moved) await rm(backup);
  } catch (error) {
    if (moved && !(await exists(target))) await rename(backup, target);
    throw error;
  } finally {
    if (await exists(temporary)) await rm(temporary);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function parseArguments(values: readonly string[]) {
  const entries: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (key === undefined || !key.startsWith('--') || value === undefined) {
      throw new Error('expected --key value arguments');
    }
    entries[key] = value;
  }
  for (const required of ['--tables', '--skills', '--client-version']) {
    if (entries[required] === undefined) throw new Error(`missing ${required}`);
  }
  return {
    tables: resolve(entries['--tables']!),
    skills: resolve(entries['--skills']!),
    clientVersion: entries['--client-version']!,
    jsonOutput: resolve(
      entries['--json-output'] ?? 'tmp/game-data-audit/equipment-suit-static-definitions.json',
    ),
    markdownOutput: resolve(
      entries['--markdown-output'] ?? 'tmp/game-data-audit/equipment-suit-static-definitions.md',
    ),
  };
}
