import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

import { compileEquipmentSuitSourceClosure } from '../src/index.ts';

interface Arguments {
  readonly tablesDirectory: string;
  readonly skillDataDirectory: string;
  readonly buffDataDirectory: string;
  readonly clientVersion: string;
  readonly jsonOutput: string;
  readonly markdownOutput: string;
}

interface GearSetSourceClosureAudit {
  readonly clientVersion: string;
  readonly suitCount: number;
  readonly passiveSkillDefinitionCount: number;
  readonly buffDefinitionCount: number;
  readonly requiredCount: number;
  readonly skillDataClosureSha256: string;
  readonly buffDataClosureSha256: string;
}

const input = parseArguments(process.argv.slice(2));
const equipSuitTable = await readJson(resolve(input.tablesDirectory, 'EquipSuitTable.json'));
const skillPatchTable = await readJson(resolve(input.tablesDirectory, 'SkillPatchTable.json'));
const skillData = await readJsonDirectory(input.skillDataDirectory);
const buffData = await readJsonDirectory(input.buffDataDirectory, new Set(['closure.audit.json']));
const closure = compileEquipmentSuitSourceClosure(
  equipSuitTable,
  skillData.values,
  skillPatchTable,
  buffData.values,
);
const expectedSkillIds = closure.suits.map(suit => suit.skillId).sort();
requireSameIdentities(Object.keys(skillData.values).sort(), expectedSkillIds, 'SkillData');
requireSameIdentities(
  Object.keys(buffData.values).sort(),
  [...closure.buffDefinitionIds],
  'BuffData',
);

const audit = {
  format: 'EndaxisEquipmentSuitSourceClosureAudit',
  version: 1,
  clientVersion: input.clientVersion,
  suitCount: closure.suits.length,
  passiveSkillDefinitionCount: closure.passiveSkillDefinitionCount,
  buffDefinitionCount: closure.buffDefinitionIds.length,
  requiredCount: 3,
  skillDataClosureSha256: skillData.closureSha256,
  buffDataClosureSha256: buffData.closureSha256,
  suits: closure.suits,
  buffDefinitionIds: closure.buffDefinitionIds,
};
await writeAtomic(input.jsonOutput, `${JSON.stringify(audit, null, 2)}\n`);
await writeAtomic(input.markdownOutput, renderMarkdown(audit));
console.log(
  JSON.stringify({
    suitCount: audit.suitCount,
    passiveSkillDefinitionCount: audit.passiveSkillDefinitionCount,
    buffDefinitionCount: audit.buffDefinitionCount,
  }),
);

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

async function readJsonDirectory(directory: string, ignored = new Set<string>()) {
  const values: Record<string, unknown> = {};
  const hash = createHash('sha256');
  for (const file of (await readdir(directory)).sort()) {
    if (!file.endsWith('.json') || ignored.has(file)) continue;
    const content = await readFile(resolve(directory, file));
    const id = basename(file, '.json');
    const value = JSON.parse(content.toString('utf8')) as unknown;
    values[id] = value;
    hash.update(file);
    hash.update('\0');
    // 来源 JSON 的空白格式不是游戏事实；闭包哈希固定在解析后语义内容上。
    hash.update(JSON.stringify(value));
    hash.update('\0');
  }
  return { values, closureSha256: hash.digest('hex') };
}

function requireSameIdentities(
  actual: readonly string[],
  expected: readonly string[],
  kind: string,
) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${kind} directory is not the exact equipment-suit closure`);
  }
}

async function writeAtomic(path: string, content: string): Promise<void> {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.part-${process.pid}`;
  const backup = `${target}.backup-${process.pid}`;
  await writeFile(temporary, content, 'utf8');
  let movedExisting = false;
  try {
    if (await pathExists(target)) {
      await rename(target, backup);
      movedExisting = true;
    }
    await rename(temporary, target);
    if (movedExisting) await rm(backup);
  } catch (error) {
    if (movedExisting && !(await pathExists(target))) await rename(backup, target);
    throw error;
  } finally {
    if (await pathExists(temporary)) await rm(temporary);
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function renderMarkdown(audit: GearSetSourceClosureAudit): string {
  return `# 装备套装来源闭包审计

- 客户端版本：\`${audit.clientVersion}\`
- 套装：${audit.suitCount}
- 被动 SkillData：${audit.passiveSkillDefinitionCount}
- 闭包 BuffData：${audit.buffDefinitionCount}
- 触发阈值：${audit.requiredCount} 件
- SkillData 闭包 SHA256：\`${audit.skillDataClosureSha256}\`
- BuffData 闭包 SHA256：\`${audit.buffDataClosureSha256}\`

全部套装均已沿 \`EquipSuitTable → SkillData → BuffData\` 的活动静态引用闭合；动态、关闭或空引用不参与定义遍历。
`;
}

function parseArguments(values: readonly string[]): Arguments {
  const entries: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (key === undefined || !key.startsWith('--') || value === undefined) {
      throw new Error('expected --key value arguments');
    }
    entries[key] = value;
  }
  for (const required of ['--tables', '--skills', '--buffs', '--client-version']) {
    if (entries[required] === undefined) throw new Error(`missing ${required}`);
  }
  return {
    tablesDirectory: resolve(entries['--tables']!),
    skillDataDirectory: resolve(entries['--skills']!),
    buffDataDirectory: resolve(entries['--buffs']!),
    clientVersion: entries['--client-version']!,
    jsonOutput: resolve(
      entries['--json-output'] ?? 'tmp/game-data-audit/equipment-suit-source-closure.json',
    ),
    markdownOutput: resolve(
      entries['--markdown-output'] ?? 'tmp/game-data-audit/equipment-suit-source-closure.md',
    ),
  };
}
