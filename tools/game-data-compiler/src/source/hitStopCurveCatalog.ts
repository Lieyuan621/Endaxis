import { createHash } from 'node:crypto';

export interface HitStopCurveKeySource {
  readonly time: number;
  readonly value: number;
  readonly inTangent: number;
  readonly outTangent: number;
  readonly weightedMode: 0 | 1 | 2 | 3;
  readonly inWeight: number;
  readonly outWeight: number;
}

export interface HitStopCurveCatalogSource {
  readonly curves: Readonly<Record<string, readonly HitStopCurveKeySource[]>>;
  readonly sha256: string;
}

/** 严格读取 AnimeStudio 对 HitStopConfig.hitSopSettings 的 TypeTree 文本投影。 */
export function parseHitStopCurveCatalogDumpSource(
  text: string,
  sourcePath: string,
): HitStopCurveCatalogSource {
  const keysBlock = text.split('\t\tHitSopSetting _valueData', 1)[0];
  if (!keysBlock?.includes('\t\tvector _keyData'))
    throw new Error(`${sourcePath}: HitStopConfig key dictionary not found`);
  const names = [...keysBlock.matchAll(/^\t{4}string data = "([^"]+)"\r?$/gm)].map(
    match => match[1]!,
  );
  const valueBlock = text.slice(text.indexOf('\t\tHitSopSetting _valueData'));
  const declaredCount = Number(/^\t{3}int size = (\d+)\r?$/m.exec(valueBlock)?.[1]);
  if (!Number.isInteger(declaredCount) || declaredCount !== names.length)
    throw new Error(`${sourcePath}: HitStopConfig key/value count mismatch`);
  if (new Set(names).size !== names.length)
    throw new Error(`${sourcePath}: duplicate HitStopConfig curve key`);

  const entryStarts = [...valueBlock.matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}HitSopSetting data\r?$/gm)];
  if (entryStarts.length !== declaredCount)
    throw new Error(`${sourcePath}: expected ${declaredCount} HitSopSetting values`);
  const curves: Record<string, readonly HitStopCurveKeySource[]> = {};
  entryStarts.forEach((entry, index) => {
    if (Number(entry[1]) !== index)
      throw new Error(`${sourcePath}: non-contiguous HitSopSetting value index`);
    const start = entry.index! + entry[0].length;
    const end = entryStarts[index + 1]?.index ?? valueBlock.length;
    const block = valueBlock.slice(start, end);
    const declaredKeys = Number(/^\t{7}int size = (\d+)\r?$/m.exec(block)?.[1]);
    const keyStarts = [...block.matchAll(/^\t{8}\[(\d+)\]\r?\n\t{8}Keyframe data\r?$/gm)];
    if (!Number.isInteger(declaredKeys) || declaredKeys <= 0 || keyStarts.length !== declaredKeys)
      throw new Error(`${sourcePath}.${names[index]}: invalid keyframe count`);
    curves[names[index]!] = keyStarts.map((keyStart, keyIndex) => {
      if (Number(keyStart[1]) !== keyIndex)
        throw new Error(`${sourcePath}.${names[index]}: non-contiguous keyframe index`);
      const keyBlockStart = keyStart.index! + keyStart[0].length;
      const keyBlockEnd = keyStarts[keyIndex + 1]?.index ?? block.length;
      const keyBlock = block.slice(keyBlockStart, keyBlockEnd);
      return {
        time: field(keyBlock, 'float', 'time', sourcePath),
        value: field(keyBlock, 'float', 'value', sourcePath),
        inTangent: field(keyBlock, 'float', 'inSlope', sourcePath),
        outTangent: field(keyBlock, 'float', 'outSlope', sourcePath),
        weightedMode: field(keyBlock, 'int', 'weightedMode', sourcePath) as 0 | 1 | 2 | 3,
        inWeight: field(keyBlock, 'float', 'inWeight', sourcePath),
        outWeight: field(keyBlock, 'float', 'outWeight', sourcePath),
      };
    });
  });
  return {
    curves,
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

export function renderHitStopCurveCatalogModule(source: HitStopCurveCatalogSource): string {
  const encoded = JSON.stringify(
    source.curves,
    (_key, value) =>
      value === Number.POSITIVE_INFINITY
        ? '__POSITIVE_INFINITY__'
        : value === Number.NEGATIVE_INFINITY
          ? '__NEGATIVE_INFINITY__'
          : value,
    2,
  )
    .replaceAll('"__POSITIVE_INFINITY__"', 'Number.POSITIVE_INFINITY')
    .replaceAll('"__NEGATIVE_INFINITY__"', 'Number.NEGATIVE_INFINITY');
  return `/** 由当前版本 HitStopConfig TypeTree dump 生成；不要手工编辑。\n * Source SHA-256: ${source.sha256}\n */\nimport type { TimeScaleCurveKeyDefinition } from '../../core/game-data/operatorDefinition';\n\nexport const HIT_STOP_NAMED_CURVE_DEFINITIONS = Object.freeze(${encoded} satisfies Readonly<Record<string, readonly TimeScaleCurveKeyDefinition[]>>);\n\nexport type HitStopNamedCurveKey = keyof typeof HIT_STOP_NAMED_CURVE_DEFINITIONS;\nexport const HIT_STOP_NAMED_CURVE_KEYS = Object.freeze(Object.keys(HIT_STOP_NAMED_CURVE_DEFINITIONS) as HitStopNamedCurveKey[]);\n`;
}

function field(block: string, type: 'float' | 'int', name: string, sourcePath: string): number {
  const raw = new RegExp(`^\\t{9}${type} ${name} = ([^\\r\\n]+)\\r?$`, 'm').exec(block)?.[1];
  if (raw === undefined) throw new Error(`${sourcePath}: missing ${name}`);
  const value =
    raw === '∞' ? Number.POSITIVE_INFINITY : raw === '-∞' ? Number.NEGATIVE_INFINITY : Number(raw);
  if (Number.isNaN(value)) throw new Error(`${sourcePath}: invalid ${name} '${raw}'`);
  if (name === 'weightedMode' && ![0, 1, 2, 3].includes(value))
    throw new Error(`${sourcePath}: invalid weightedMode ${value}`);
  return value;
}
