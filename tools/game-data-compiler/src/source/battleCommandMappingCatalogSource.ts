import { createHash } from 'node:crypto';

export interface BattleCommandMappingCatalogSource {
  readonly defaultCacheTimes: readonly number[];
  readonly dashOffsetCacheTime: number;
  readonly skillOffsetCacheTime: number;
  readonly jumpOffsetCacheTime: number;
  readonly attackCacheTimeInDash: number;
  readonly blockAttackTimeInDash: number;
  readonly allowAttackTimeAfterDash: number;
  readonly attackCacheTimeInPerfectDodge: number;
  readonly blockAttackTimeInPerfectDodge: number;
  readonly allowAttackTimeAfterPerfectDodge: number;
  readonly allowDashInPerfectDodge: number;
  readonly sha256: string;
}

/** 严格读取 Unity TypeTree 对 BattleCommandMappingConfig 的文本投影。 */
export function parseBattleCommandMappingCatalogDumpSource(
  text: string,
  sourcePath: string,
): BattleCommandMappingCatalogSource {
  const mapStart = text.indexOf('\tSerializeFieldDictionary`2 defaultCacheTimeMap');
  const scalarStart = text.indexOf('\tfloat dashOffsetCacheTime');
  if (mapStart < 0 || scalarStart <= mapStart)
    throw new Error(`${sourcePath}: BattleCommandMappingConfig sections not found`);
  const mapBlock = text.slice(mapStart, scalarStart);
  const valueStart = mapBlock.indexOf('\t\tvector _valueData');
  if (valueStart < 0) throw new Error(`${sourcePath}: default cache value section not found`);
  const keys = [
    ...mapBlock.slice(0, valueStart).matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}int data = (-?\d+)\r?$/gm),
  ];
  const values = [
    ...mapBlock
      .slice(valueStart)
      .matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}float data = ([^\r\n]+)\r?$/gm),
  ];
  const sizes = [...mapBlock.matchAll(/^\t{3}int size = (\d+)\r?$/gm)].map(match =>
    Number(match[1]),
  );
  if (
    sizes.length !== 2 ||
    sizes[0] !== 6 ||
    sizes[1] !== 6 ||
    keys.length !== 6 ||
    values.length !== 6
  )
    throw new Error(`${sourcePath}: expected six default cache key/value pairs`);
  const defaultCacheTimes = keys.map((key, index) => {
    if (Number(key[1]) !== index || Number(key[2]) !== index || Number(values[index]![1]) !== index)
      throw new Error(`${sourcePath}: default cache keys must match BattleCommandType 0..5`);
    return finiteNonNegative(
      Number(values[index]![2]),
      sourcePath,
      `defaultCacheTimeMap[${index}]`,
    );
  });
  const scalar = (name: string) => {
    const raw = new RegExp(`^\\tfloat ${name} = ([^\\r\\n]+)\\r?$`, 'm').exec(text)?.[1];
    if (raw === undefined) throw new Error(`${sourcePath}: missing ${name}`);
    return finiteNonNegative(Number(raw), sourcePath, name);
  };
  return {
    defaultCacheTimes,
    dashOffsetCacheTime: scalar('dashOffsetCacheTime'),
    skillOffsetCacheTime: scalar('skillOffsetCacheTime'),
    jumpOffsetCacheTime: scalar('jumpOffsetCacheTime'),
    attackCacheTimeInDash: scalar('attackCacheTimeInDash'),
    blockAttackTimeInDash: scalar('blockAttackTimeInDash'),
    allowAttackTimeAfterDash: scalar('allowAttackTimeAfterDash'),
    attackCacheTimeInPerfectDodge: scalar('attackCacheTimeInPerfectDodge'),
    blockAttackTimeInPerfectDodge: scalar('blockAttackTimeInPerfectDodge'),
    allowAttackTimeAfterPerfectDodge: scalar('allowAttackTimeAfterPerfectDodge'),
    allowDashInPerfectDodge: scalar('allowDashInPerfectDodge'),
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

function finiteNonNegative(value: number, sourcePath: string, field: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${sourcePath}: invalid ${field}`);
  return value;
}

export function renderBattleCommandMappingCatalogModule(
  source: BattleCommandMappingCatalogSource,
): string {
  const { sha256, ...config } = source;
  return `/** 由当前版本 BattleCommandMappingConfig TypeTree dump 生成；不要手工编辑。\n * Source SHA-256: ${sha256}\n */\nexport const BATTLE_COMMAND_MAPPING_CONFIG = ${JSON.stringify(config, null, 2)} as const;\n`;
}
