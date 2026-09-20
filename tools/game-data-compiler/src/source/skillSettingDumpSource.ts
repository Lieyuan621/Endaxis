import { createHash } from 'node:crypto';
import type { SkillSettingResources } from '../../../../packages/game-data-contract/src/skillSettingResources.ts';

/** Native resource scalars, kept separate from the infliction lookup table. */
export type SkillSettingResourceSource = SkillSettingResources;

export function parseSkillSettingResourceSource(
  text: string,
  sourcePath: string,
): SkillSettingResourceSource {
  const read = (name: keyof SkillSettingResourceSource) => {
    const matches = [...text.matchAll(new RegExp(`^\\tfloat ${name} = ([^\\r\\n]+)\\r?$`, 'gm'))];
    if (matches.length !== 1)
      throw new Error(`${sourcePath}.${name}: expected exactly one root float`);
    const raw = matches[0]![1]!.trim();
    if (raw.length === 0) throw new Error(`${sourcePath}.${name}: empty resource value`);
    const value = finiteNumber(raw, `${sourcePath}.${name}`);
    if (value < 0) throw new Error(`${sourcePath}.${name}: expected non-negative value`);
    return value;
  };
  return {
    atbRecoverInterval: read('atbRecoverInterval'),
    atbGainEfficiency: read('atbGainEfficiency'),
    atbConsumedDefaultUspGainSelf: read('atbConsumedDefaultUspGainSelf'),
    atbConsumedDefaultUspGainOther: read('atbConsumedDefaultUspGainOther'),
  };
}

export interface SkillSettingDumpSource {
  readonly resources: SkillSettingResources;
  readonly data: readonly {
    readonly key: string;
    readonly values: readonly number[];
    readonly enhanceFormulaKey: string;
  }[];
  readonly enhanceFormulas: readonly {
    readonly key: string;
    readonly formulaType: 'none' | 'linear' | 'saturating';
    readonly paramA: number;
    readonly paramB: number;
  }[];
  readonly sha256: string;
}

/** 严格读取 Unity TypeTree 中实际参与元素附着计算的 SkillSetting 子集。 */
export function parseSkillSettingDumpSource(
  text: string,
  sourcePath: string,
): SkillSettingDumpSource {
  const dataStart = text.indexOf('\tSpellInflictionData spellInflictionDataList');
  const formulaStart = text.indexOf(
    '\tPhysicalAndSpellInflictionEnhanceFormula physicalAndSpellInflictionEnhanceFormulaList',
  );
  if (dataStart < 0 || formulaStart <= dataStart)
    throw new Error(`${sourcePath}: SkillSetting infliction sections not found`);

  const dataBlock = text.slice(dataStart, formulaStart);
  const dataCount = declaredSize(dataBlock, sourcePath, 'spell infliction', 2);
  const dataStarts = [
    ...dataBlock.matchAll(/^\t{3}\[(\d+)\]\r?\n\t{3}SpellInflictionData data\r?$/gm),
  ];
  if (dataCount === 0 || dataStarts.length !== dataCount)
    throw new Error(`${sourcePath}: SkillSetting spell infliction count mismatch`);
  const data = dataStarts.map((entry, index) => {
    if (Number(entry[1]) !== index)
      throw new Error(`${sourcePath}: non-contiguous SkillSetting data index`);
    const block = dataBlock.slice(
      entry.index! + entry[0].length,
      dataStarts[index + 1]?.index ?? dataBlock.length,
    );
    const key = stringField(block, 'key', sourcePath, 4, false);
    stringField(block, 'desc', sourcePath, 4, true);
    const valueCount = declaredSize(block, `${sourcePath}.${key}`, 'value', 5);
    const valueEntries = [
      ...block.matchAll(/^\t{6}\[(\d+)\]\r?\n\t{6}float data = ([^\r\n]+)\r?$/gm),
    ];
    if (valueCount !== 4 || valueEntries.length !== valueCount)
      throw new Error(`${sourcePath}.${key}: expected four SkillSetting columns`);
    const values = valueEntries.map((value, column) => {
      if (Number(value[1]) !== column)
        throw new Error(`${sourcePath}.${key}: non-contiguous value index`);
      return finiteNumber(value[2]!, `${sourcePath}.${key}.values[${column}]`);
    });
    return {
      key,
      values,
      enhanceFormulaKey: stringField(block, 'enhanceFormulaKey', sourcePath, 4, true),
    };
  });
  requireUnique(
    data.map(item => item.key),
    sourcePath,
    'SkillSetting data key',
  );

  const formulaBlock = text.slice(formulaStart);
  const formulaCount = declaredSize(formulaBlock, sourcePath, 'enhance formula', 2);
  const formulaStarts = [
    ...formulaBlock.matchAll(
      /^\t{3}\[(\d+)\]\r?\n\t{3}PhysicalAndSpellInflictionEnhanceFormula data\r?$/gm,
    ),
  ];
  if (formulaStarts.length !== formulaCount)
    throw new Error(`${sourcePath}: SkillSetting enhance formula count mismatch`);
  const enhanceFormulas = formulaStarts.map((entry, index) => {
    if (Number(entry[1]) !== index)
      throw new Error(`${sourcePath}: non-contiguous SkillSetting formula index`);
    const block = formulaBlock.slice(
      entry.index! + entry[0].length,
      formulaStarts[index + 1]?.index ?? formulaBlock.length,
    );
    const formulaType = integerField(block, 'formulaType', sourcePath, 4);
    if (![0, 1, 2].includes(formulaType))
      throw new Error(`${sourcePath}: unsupported SkillSetting formula type ${formulaType}`);
    return {
      key: stringField(block, 'key', sourcePath, 4, false),
      formulaType: (formulaType === 0 ? 'none' : formulaType === 1 ? 'linear' : 'saturating') as
        'none' | 'linear' | 'saturating',
      paramA: numberField(block, 'double', 'paramA', sourcePath, 4),
      paramB: numberField(block, 'double', 'paramB', sourcePath, 4),
    };
  });
  requireUnique(
    enhanceFormulas.map(item => item.key),
    sourcePath,
    'SkillSetting formula key',
  );
  const formulaKeys = new Set(enhanceFormulas.map(item => item.key));
  for (const entry of data) {
    if (entry.enhanceFormulaKey !== '' && !formulaKeys.has(entry.enhanceFormulaKey))
      throw new Error(`${sourcePath}.${entry.key}: missing formula ${entry.enhanceFormulaKey}`);
  }
  return {
    data,
    enhanceFormulas,
    resources: parseSkillSettingResourceSource(text, sourcePath),
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

export function renderSkillSettingDocument(
  source: SkillSettingDumpSource,
  revision: string,
): string {
  if (revision.length === 0) throw new Error('SkillSetting revision must not be empty');
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      revision,
      data: source.data,
      enhanceFormulas: source.enhanceFormulas,
      resources: source.resources,
    },
    null,
    2,
  )}\n`;
}

function declaredSize(
  block: string,
  sourcePath: string,
  name: string,
  indentation: number,
): number {
  const raw = new RegExp(`^\\t{${indentation}}int size = (\\d+)\\r?$`, 'm').exec(block)?.[1];
  const value = raw === undefined ? Number.NaN : Number(raw);
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${sourcePath}: invalid ${name} count`);
  return value;
}

function stringField(
  block: string,
  name: string,
  sourcePath: string,
  indentation: number,
  allowEmpty: boolean,
): string {
  const value = new RegExp(`^\\t{${indentation}}string ${name} = "([^"]*)"\\r?$`, 'm').exec(
    block,
  )?.[1];
  if (value === undefined || (!allowEmpty && value.length === 0))
    throw new Error(`${sourcePath}: invalid ${name}`);
  return value;
}

function integerField(
  block: string,
  name: string,
  sourcePath: string,
  indentation: number,
): number {
  const value = numberField(block, 'int', name, sourcePath, indentation);
  if (!Number.isInteger(value)) throw new Error(`${sourcePath}: invalid integer ${name}`);
  return value;
}

function numberField(
  block: string,
  type: 'int' | 'double',
  name: string,
  sourcePath: string,
  indentation: number,
): number {
  const raw = new RegExp(`^\\t{${indentation}}${type} ${name} = ([^\\r\\n]+)\\r?$`, 'm').exec(
    block,
  )?.[1];
  if (raw === undefined) throw new Error(`${sourcePath}: missing ${name}`);
  return finiteNumber(raw, `${sourcePath}.${name}`);
}

function finiteNumber(raw: string, sourcePath: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${sourcePath}: invalid finite number '${raw}'`);
  return value;
}

function requireUnique(values: readonly string[], sourcePath: string, name: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${sourcePath}: duplicate ${name}`);
}
