import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { format, resolveConfig } from 'prettier';

import {
  checkEquipmentDefinitionFiles,
  writeEquipmentDefinitionFiles,
} from '../src/domains/equipment/writeFormalDefinitions.ts';
import {
  compileEquipmentDefinitionBatchSource,
  type CompiledEquipmentDefinitionBatchSource,
} from '../src/domains/equipment/formalDefinition.ts';
import { parseEquipmentItemSources } from '../src/source/equipmentAttributeModifiers.ts';
import { renderEquipmentDefinitionFiles } from '../src/domains/equipment/renderFormalDefinitions.ts';

export interface GearGenerationArguments {
  readonly tablesDirectory: string;
  readonly outputDirectory: string;
  readonly check: boolean;
}

/** 单件装备的 CLI 与隔离重建共用同一个生成入口；不读取任何现存生成定义。 */
export async function generateGearDefinitions(argumentsValue: GearGenerationArguments) {
  const batch = await compileGearDefinitionsFromFiles(argumentsValue.tablesDirectory);
  const rendered = await renderGearDefinitionsFromCompiled(batch);
  if (argumentsValue.check) {
    checkEquipmentDefinitionFiles(argumentsValue.outputDirectory, rendered.files);
  } else {
    await writeEquipmentDefinitionFiles(argumentsValue.outputDirectory, rendered.files);
  }
  return {
    outputDirectory: argumentsValue.outputDirectory,
    ...rendered.summary,
  };
}

/** 从同批两张原始表编译全部单件装备，不渲染或写盘，不读取现存生成定义。 */
export async function compileGearDefinitionsFromFiles(tablesDirectory: string) {
  const equipTable = await readJson(resolve(tablesDirectory, 'EquipTable.json'));
  const itemTable = await readJson(resolve(tablesDirectory, 'ItemTable.json'));
  if (!isRecord(equipTable)) throw new Error('EquipTable.json: expected an object');

  const equipmentIds = Object.keys(equipTable).sort((left, right) => left.localeCompare(right));
  const equipment = parseEquipmentItemSources(
    equipTable,
    itemTable,
    equipmentIds,
    'EquipTable',
    'ItemTable',
  );
  const batch = compileEquipmentDefinitionBatchSource(equipment);
  // 原入口在渲染时拒绝这类缺项批次；只取编译结果的调用方也必须经过相同门禁。
  const blocked = batch.diagnostics.filter(diagnostic => diagnostic.status === 'blocked');
  if (blocked.length > 0)
    throw new Error(
      `cannot render equipment definitions with ${blocked.length} blocked diagnostics`,
    );
  return batch;
}

/** 只读规划供生成、确定性检查与应用层候选验证共用；不会导入现有装备定义。 */
export async function planGearDefinitions(tablesDirectory: string) {
  const batch = await compileGearDefinitionsFromFiles(tablesDirectory);
  const { files } = await renderGearDefinitionsFromCompiled(batch);
  return { batch, files };
}

/** 只把同批编译结果变成文件内容，来源目录不再参与本阶段。 */
export async function renderGearDefinitionsFromCompiled(
  batch: CompiledEquipmentDefinitionBatchSource,
) {
  // 渲染器保留 blocked 门禁，不能把缺项批次变成可发布文件。
  const rendered = renderEquipmentDefinitionFiles(batch);
  const prettierConfig = (await resolveConfig(resolve('.prettierrc.json'))) ?? {};
  const files = await Promise.all(
    rendered.map(async file => ({
      ...file,
      content: file.relativePath.endsWith('.ts')
        ? await format(file.content, { ...prettierConfig, parser: 'typescript' })
        : file.content,
    })),
  );
  return {
    files,
    summary: {
      definitionCount: batch.definitions.length,
      fileCount: files.length,
      scenarioOmittedDiagnosticCount: batch.diagnostics.filter(
        diagnostic => diagnostic.status === 'scenario-omitted',
      ).length,
      definitionIds: batch.definitions.map(definition => definition.slug),
      diagnostics: batch.diagnostics,
    },
  };
}

function parseArguments(values: readonly string[]): GearGenerationArguments {
  let tablesDirectory: string | undefined;
  let outputDirectory = resolve('src/data/equipment/generated');
  let check = false;
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (key === '--check') {
      check = true;
      continue;
    }
    const value = values[index + 1];
    if (
      (key !== '--tables' && key !== '--output') ||
      value === undefined ||
      value.startsWith('--')
    ) {
      throw new Error(
        'usage: node generateGearDefinitions.ts --tables <directory> [--output <directory>] [--check]',
      );
    }
    if (key === '--tables') tablesDirectory = resolve(value);
    else outputDirectory = resolve(value);
    index += 1;
  }
  if (tablesDirectory === undefined || !isAbsolute(tablesDirectory)) {
    throw new Error('--tables must resolve to an absolute directory');
  }
  return { tablesDirectory, outputDirectory, check };
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const {
    definitionIds: _ids,
    diagnostics: _diagnostics,
    ...summary
  } = await generateGearDefinitions(parseArguments(process.argv.slice(2)));
  console.log(JSON.stringify(summary));
}
