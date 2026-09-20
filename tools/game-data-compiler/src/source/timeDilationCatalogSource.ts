import { createHash } from 'node:crypto';
import type { HitStopCurveKeySource } from './hitStopCurveCatalog.ts';
import { GameplayTagRegistry } from './nativeGameplayTags.ts';

export interface TimeDilationCatalogSource {
  readonly priorities: readonly { readonly tagId: number; readonly value: number }[];
  readonly curves: Readonly<Record<string, readonly HitStopCurveKeySource[]>>;
  readonly slotSpecialConfigs: readonly {
    readonly globalSlotId: number;
    readonly entitySlotId: number;
    readonly influencesDuration: boolean;
  }[];
  readonly sha256: string;
}

/** 严格读取 Unity TypeTree 对 TimeDilationConfig 的文本投影。 */
export function parseTimeDilationCatalogDumpSource(
  text: string,
  sourcePath: string,
): TimeDilationCatalogSource {
  const priorityStart = text.indexOf('\tSerializeFieldDictionary`2 priorityMap');
  const curveStart = text.indexOf('\tSerializeFieldDictionary`2 curveMap');
  const specialStart = text.indexOf('\tSlotSpecialConfig slotSpecialConfig');
  if (priorityStart < 0 || curveStart <= priorityStart || specialStart <= curveStart)
    throw new Error(`${sourcePath}: TimeDilationConfig sections not found`);

  const priorityBlock = text.slice(priorityStart, curveStart);
  const priorityValueStart = priorityBlock.indexOf('\t\tvector _valueData');
  if (priorityValueStart < 0)
    throw new Error(`${sourcePath}: TimeDilation priority value section not found`);
  const priorityKeyBlock = priorityBlock.slice(0, priorityValueStart);
  const priorityValueBlock = priorityBlock.slice(priorityValueStart);
  const priorityKeySize = declaredSize(priorityKeyBlock, sourcePath, 'priority key', 3);
  const priorityValueSize = declaredSize(priorityValueBlock, sourcePath, 'priority value', 3);
  const priorityKeys = [
    ...priorityKeyBlock.matchAll(
      /^\t{4}\[(\d+)\]\r?\n\t{4}GameplayTag data\r?\n\t{5}int tagId = (-?\d+)\r?$/gm,
    ),
  ];
  const priorityValues = [
    ...priorityValueBlock.matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}int data = (-?\d+)\r?$/gm),
  ];
  if (
    priorityKeySize === 0 ||
    priorityKeySize !== priorityValueSize ||
    priorityKeys.length !== priorityKeySize ||
    priorityValues.length !== priorityValueSize
  )
    throw new Error(`${sourcePath}: TimeDilation priority key/value count mismatch`);
  const priorityIds = priorityKeys.map((match, index) => {
    if (Number(match[1]) !== index)
      throw new Error(`${sourcePath}: non-contiguous TimeDilation priority key index`);
    return Number(match[2]);
  });
  const priorityData = priorityValues.map((match, index) => {
    if (Number(match[1]) !== index)
      throw new Error(`${sourcePath}: non-contiguous TimeDilation priority value index`);
    return Number(match[2]);
  });
  if (new Set(priorityIds).size !== priorityIds.length)
    throw new Error(`${sourcePath}: duplicate TimeDilation priority tag`);

  const curveBlock = text.slice(curveStart, specialStart);
  const namesBlock = curveBlock.split('\t\tvector _valueData', 1)[0]!;
  const names = [...namesBlock.matchAll(/^\t{4}string data = "([^"]+)"\r?$/gm)].map(
    match => match[1]!,
  );
  if (names.length === 0 || new Set(names).size !== names.length)
    throw new Error(`${sourcePath}: invalid TimeDilation curve names`);
  const valueBlock = curveBlock.slice(curveBlock.indexOf('\t\tvector _valueData'));
  const declaredCurveCount = Number(/^\t{3}int size = (\d+)\r?$/m.exec(valueBlock)?.[1]);
  const curveStarts = [
    ...valueBlock.matchAll(/^\t{4}\[(\d+)\]\r?\n\t{4}AnimationCurve data\r?$/gm),
  ];
  if (declaredCurveCount !== names.length || curveStarts.length !== names.length)
    throw new Error(`${sourcePath}: TimeDilation curve key/value count mismatch`);
  const curves: Record<string, readonly HitStopCurveKeySource[]> = {};
  curveStarts.forEach((entry, curveIndex) => {
    if (Number(entry[1]) !== curveIndex)
      throw new Error(`${sourcePath}: non-contiguous TimeDilation curve index`);
    const start = entry.index! + entry[0].length;
    const end = curveStarts[curveIndex + 1]?.index ?? valueBlock.length;
    const block = valueBlock.slice(start, end);
    const declaredKeys = Number(/^\t{6}int size = (\d+)\r?$/m.exec(block)?.[1]);
    const keyStarts = [...block.matchAll(/^\t{7}\[(\d+)\]\r?\n\t{7}Keyframe data\r?$/gm)];
    if (!Number.isInteger(declaredKeys) || declaredKeys <= 0 || keyStarts.length !== declaredKeys)
      throw new Error(`${sourcePath}.${names[curveIndex]}: invalid keyframe count`);
    curves[names[curveIndex]!] = keyStarts.map((keyStart, keyIndex) => {
      if (Number(keyStart[1]) !== keyIndex)
        throw new Error(`${sourcePath}.${names[curveIndex]}: non-contiguous keyframe index`);
      const keyBlockStart = keyStart.index! + keyStart[0].length;
      const keyBlockEnd = keyStarts[keyIndex + 1]?.index ?? block.length;
      const keyBlock = block.slice(keyBlockStart, keyBlockEnd);
      const weightedMode = field(keyBlock, 'int', 'weightedMode', sourcePath, 8);
      if (![0, 1, 2, 3].includes(weightedMode))
        throw new Error(`${sourcePath}: invalid weightedMode ${weightedMode}`);
      return {
        time: field(keyBlock, 'float', 'time', sourcePath, 8),
        value: field(keyBlock, 'float', 'value', sourcePath, 8),
        inTangent: field(keyBlock, 'float', 'inSlope', sourcePath, 8),
        outTangent: field(keyBlock, 'float', 'outSlope', sourcePath, 8),
        weightedMode: weightedMode as 0 | 1 | 2 | 3,
        inWeight: field(keyBlock, 'float', 'inWeight', sourcePath, 8),
        outWeight: field(keyBlock, 'float', 'outWeight', sourcePath, 8),
      };
    });
  });

  const specialBlock = text.slice(specialStart);
  const declaredSpecialCount = Number(/^\t{2}int size = (\d+)\r?$/m.exec(specialBlock)?.[1]);
  const specialStarts = [
    ...specialBlock.matchAll(/^\t{3}\[(\d+)\]\r?\n\t{3}SlotSpecialConfig data\r?$/gm),
  ];
  if (!Number.isInteger(declaredSpecialCount) || specialStarts.length !== declaredSpecialCount)
    throw new Error(`${sourcePath}: invalid TimeDilation slot-special count`);
  const slotSpecialConfigs = specialStarts.map((entry, index) => {
    if (Number(entry[1]) !== index)
      throw new Error(`${sourcePath}: non-contiguous slot-special index`);
    const start = entry.index! + entry[0].length;
    const end = specialStarts[index + 1]?.index ?? specialBlock.length;
    const block = specialBlock.slice(start, end);
    const ids = [...block.matchAll(/^\t{5}int tagId = (-?\d+)\r?$/gm)].map(match =>
      Number(match[1]),
    );
    const influence = /^\t{4}UInt8 isInfluenceDuration = ([01])\r?$/m.exec(block)?.[1];
    if (ids.length !== 2 || influence === undefined)
      throw new Error(`${sourcePath}.slotSpecialConfig[${index}]: invalid fields`);
    return {
      globalSlotId: ids[0]!,
      entitySlotId: ids[1]!,
      influencesDuration: influence === '1',
    };
  });

  return {
    priorities: priorityIds.map((tagId, index) => ({ tagId, value: priorityData[index]! })),
    curves,
    slotSpecialConfigs,
    sha256: createHash('sha256').update(text).digest('hex'),
  };
}

function declaredSize(
  block: string,
  sourcePath: string,
  fieldName: string,
  indentation: number,
): number {
  const raw = new RegExp(`^\\t{${indentation}}int size = (\\d+)\\r?$`, 'm').exec(block)?.[1];
  const value = raw === undefined ? Number.NaN : Number(raw);
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${sourcePath}: invalid ${fieldName} count`);
  return value;
}

export function renderTimeDilationCatalogModule(
  source: TimeDilationCatalogSource,
  gameplayTagPaths: readonly string[],
): string {
  const registry = new GameplayTagRegistry(gameplayTagPaths);
  const priorities = source.priorities.map(item => ({
    tagPath: registry.resolve(item.tagId, 'TimeDilationConfig.priorityMap'),
    value: item.value,
  }));
  for (const priority of priorities) {
    if (!priority.tagPath.startsWith('TimeDilation/Priority/'))
      throw new Error(`TimeDilationConfig: invalid priority path ${priority.tagPath}`);
  }
  const slots = gameplayTagPaths
    .filter(path => /^TimeDilation\/Layer\/(Global|Entity)\/[^/]+$/.test(path))
    .map(path => ({
      id: path,
      name: path,
      scope: path.startsWith('TimeDilation/Layer/Global/') ? 'global' : 'entity',
    }));
  if (slots.length === 0) throw new Error('TimeDilationConfig: no leaf slot tags found');
  const slotSpecialConfigs = source.slotSpecialConfigs.map(item => ({
    globalSlot: registry.resolve(item.globalSlotId, 'TimeDilationConfig.slotSpecialConfig'),
    entitySlot: registry.resolve(item.entitySlotId, 'TimeDilationConfig.slotSpecialConfig'),
    influencesDuration: item.influencesDuration,
  }));
  for (const item of slotSpecialConfigs) {
    if (!slots.some(slot => slot.scope === 'global' && slot.id === item.globalSlot))
      throw new Error(`TimeDilationConfig: invalid global slot ${item.globalSlot}`);
    if (!slots.some(slot => slot.scope === 'entity' && slot.id === item.entitySlot))
      throw new Error(`TimeDilationConfig: invalid entity slot ${item.entitySlot}`);
  }
  const encoded = encode({ priorities, slots, curves: source.curves, slotSpecialConfigs });
  return `/** 由当前版本 TimeDilationConfig TypeTree dump 与同批 GameplayTag 目录生成；不要手工编辑。
 * Source SHA-256: ${source.sha256}
 */
import type { TimeScaleCurveKeyDefinition } from '../../core/game-data/operatorDefinition';
import type { TimeDilationPriorityDefinition, TimeDilationSlotDefinition, TimeDilationSlotSpecialConfigDefinition } from './timeDilationCatalog';

export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze(${encoded.priorities} as const satisfies readonly TimeDilationPriorityDefinition[]);
export const TIME_DILATION_SLOT_DEFINITIONS = Object.freeze(${encoded.slots} as const satisfies readonly TimeDilationSlotDefinition[]);
export const TIME_DILATION_NAMED_CURVE_DEFINITIONS = Object.freeze(${encoded.curves} satisfies Readonly<Record<string, readonly TimeScaleCurveKeyDefinition[]>>);
export const TIME_DILATION_SLOT_SPECIAL_CONFIGS = Object.freeze(${encoded.slotSpecialConfigs} as const satisfies readonly TimeDilationSlotSpecialConfigDefinition[]);
`;
}

function encode(value: {
  priorities: unknown;
  slots: unknown;
  curves: unknown;
  slotSpecialConfigs: unknown;
}) {
  const stringify = (item: unknown) =>
    JSON.stringify(
      item,
      (_key, nested) =>
        nested === Number.POSITIVE_INFINITY
          ? '__POSITIVE_INFINITY__'
          : nested === Number.NEGATIVE_INFINITY
            ? '__NEGATIVE_INFINITY__'
            : nested,
      2,
    )
      .replaceAll('"__POSITIVE_INFINITY__"', 'Number.POSITIVE_INFINITY')
      .replaceAll('"__NEGATIVE_INFINITY__"', 'Number.NEGATIVE_INFINITY');
  return {
    priorities: stringify(value.priorities),
    slots: stringify(value.slots),
    curves: stringify(value.curves),
    slotSpecialConfigs: stringify(value.slotSpecialConfigs),
  };
}

function field(
  block: string,
  type: 'float' | 'int',
  name: string,
  sourcePath: string,
  indentation: number,
): number {
  const raw = new RegExp(`^\\t{${indentation}}${type} ${name} = ([^\\r\\n]+)\\r?$`, 'm').exec(
    block,
  )?.[1];
  if (raw === undefined) throw new Error(`${sourcePath}: missing ${name}`);
  const value =
    raw === '∞' ? Number.POSITIVE_INFINITY : raw === '-∞' ? Number.NEGATIVE_INFINITY : Number(raw);
  if (Number.isNaN(value)) throw new Error(`${sourcePath}: invalid ${name} '${raw}'`);
  return value;
}
