import { PROJECT_SCHEMA_VERSION, type JsonObject } from './schema';

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** 每个步骤只转换相邻版本，输入与输出均由读取边界管理。 */
const upgrades = new Map<number, (input: JsonObject) => JsonObject>([
  [
    2,
    input => {
      if (!Array.isArray(input.scenarios)) throw new Error('expected scenarios array');
      return {
        ...input,
        schemaVersion: 3,
        scenarios: input.scenarios.map(value => {
          if (
            !isObject(value) ||
            !isObject(value.mechanics) ||
            !Array.isArray(value.mechanics.selections)
          )
            throw new Error('version 2 scenario requires mechanic selections');
          return {
            ...value,
            mechanics: {
              ...value.mechanics,
              selections: value.mechanics.selections.map(upgradeContractPreview),
            },
          };
        }),
      };
    },
  ],
  [
    1,
    input => {
      if (!Array.isArray(input.scenarios)) throw new Error('expected scenarios array');
      return {
        ...input,
        schemaVersion: 2,
        scenarios: input.scenarios.map(value => {
          if (!isObject(value) || !isObject(value.enemy))
            throw new Error('version 1 scenario requires an enemy');
          const { enemy, ...scenario } = value;
          return {
            ...scenario,
            level: { kind: 'singleEnemy', enemy: { id: 'enemy', enemy } },
          };
        }),
      };
    },
  ],
]);

function upgradeContractPreview(value: unknown): JsonObject {
  if (!isObject(value)) throw new Error('expected mechanic selection');
  const bindings: Readonly<Record<string, string>> = {
    'contingency-contract:tag:200001': '113502',
    'contingency-contract:tag:200002': '110302',
    'contingency-contract:tag:200003': '110703',
    'contingency-contract:tag:200004': '110901',
  };
  const binding = typeof value.mechanicId === 'string' ? bindings[value.mechanicId] : undefined;
  if (!binding) return value;
  return {
    ...value,
    mechanicId: `contingency-contract:tag:${binding}`,
    parameters: {},
  };
}

export function canUpgradeProjectVersion(version: number): boolean {
  if (!Number.isSafeInteger(version) || version > PROJECT_SCHEMA_VERSION) return false;
  for (let next = version; next < PROJECT_SCHEMA_VERSION; next++) {
    if (!upgrades.has(next)) return false;
  }
  return true;
}

export function upgradeProjectDocument(input: JsonObject): JsonObject {
  if (typeof input.schemaVersion !== 'number' || !canUpgradeProjectVersion(input.schemaVersion))
    throw new Error('unsupported project schema version');
  let result = input;
  for (let version = input.schemaVersion; version < PROJECT_SCHEMA_VERSION; version++) {
    const upgrade = upgrades.get(version);
    if (!upgrade) throw new Error(`missing project upgrade ${version} -> ${version + 1}`);
    result = upgrade(result);
    if (result.schemaVersion !== version + 1) throw new Error('invalid project upgrade result');
  }
  return result;
}
