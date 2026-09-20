import {
  requireArray,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
} from './primitives.ts';

export interface SkillPatchSource {
  readonly levels: readonly number[];
  readonly blackboard: Readonly<Record<string, readonly number[]>>;
  readonly cooldownSeconds: readonly number[];
  readonly costTypes: readonly number[];
  readonly costValues: readonly number[];
}

/** 解析一项 SkillPatch，并证明所有等级提供相同的黑板键集合。 */
export function parseSkillPatchSource(value: unknown, skillId: string): SkillPatchSource {
  const rootPath = `SkillPatchTable.${skillId}`;
  const entry = requireRecord(value, rootPath);
  const bundles = requireArray(entry.SkillPatchDataBundle, `${rootPath}.SkillPatchDataBundle`);
  if (bundles.length === 0) {
    throw new Error(`${rootPath}: expected at least one level`);
  }

  const levels: number[] = [];
  const rows: Array<Record<string, number>> = [];
  const cooldownSeconds: number[] = [];
  const costTypes: number[] = [];
  const costValues: number[] = [];

  bundles.forEach((rawBundle, index) => {
    const path = `${rootPath}[${index}]`;
    const bundle = requireRecord(rawBundle, path);
    levels.push(requireNonNegativeInteger(bundle.level, `${path}.level`));

    const row: Record<string, number> = {};
    requireArray(bundle.blackboard, `${path}.blackboard`).forEach(rawItem => {
      const item = requireRecord(rawItem, `${path}.blackboard[]`);
      const key = requireNonEmptyString(item.key, `${path}.blackboard[].key`);
      const itemValue = requireNumber(item.value, `${path}.blackboard.${key}`);
      if (key in row) {
        if (row[key] !== itemValue) {
          throw new Error(`${path}: conflicting duplicate blackboard key ${key}`);
        }
        return;
      }
      row[key] = itemValue;
    });
    rows.push(row);
    cooldownSeconds.push(readOptionalNumber(bundle.coolDown, `${path}.coolDown`));
    costTypes.push(readOptionalInteger(bundle.costType, `${path}.costType`));
    costValues.push(readOptionalNumber(bundle.costValue, `${path}.costValue`));
  });

  if (levels.some((level, index) => index > 0 && level <= levels[index - 1]!)) {
    throw new Error(`${rootPath}: levels must be unique and ascending`);
  }

  const allKeys = [...new Set(rows.flatMap(row => Object.keys(row)))].sort();
  for (const key of allKeys) {
    if (rows.some(row => !(key in row))) {
      throw new Error(`${rootPath}: blackboard key ${key} is missing at some levels`);
    }
  }
  return {
    levels,
    blackboard: Object.fromEntries(allKeys.map(key => [key, rows.map(row => row[key]!)])),
    cooldownSeconds,
    costTypes,
    costValues,
  };
}

function readOptionalNumber(value: unknown, path: string): number {
  return value === undefined ? 0 : requireNumber(value, path);
}

function readOptionalInteger(value: unknown, path: string): number {
  return value === undefined ? 0 : requireNonNegativeInteger(value, path);
}
