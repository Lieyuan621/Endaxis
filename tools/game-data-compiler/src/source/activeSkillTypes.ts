import type { NativeSkillType } from '../../../../packages/game-data-contract/src/index.ts';
import {
  requireArray,
  requireInteger,
  requireNonEmptyString,
  requireRecord,
  requireString,
} from './primitives.ts';

const nativeSkillTypes = new Map<number, NativeSkillType>([
  [-1, 'passiveSkill'],
  [0, 'attack'],
  [1, 'breakingAttack'],
  [2, 'normalSkill'],
  [3, 'attachSkill'],
  [5, 'dodge'],
  [6, 'comboSkill'],
  [7, 'ultimateSkill'],
  [8, 'extraActiveSkill'],
]);

function parseNativeSkillType(value: unknown, path: string): NativeSkillType {
  const numeric = requireInteger(value, path);
  const result = nativeSkillTypes.get(numeric);
  if (result === undefined) throw new Error(`${path}: unsupported native SkillType ${numeric}`);
  return result;
}

/** Native AbilitySystem active-list initialization, independent of player input or inherited cast origin. */
export function parseActiveSkillTypesSource(value: unknown, path: string) {
  const bundle = requireRecord(value, path);
  const skillIds = requireArray(bundle.allActiveSkillId, path + '.allActiveSkillId').map(
    (id, index) => requireNonEmptyString(id, path + '.allActiveSkillId[' + index + ']'),
  );
  const normal = requireString(bundle.normalSkillId, path + '.normalSkillId');
  const ultimate = requireString(bundle.ultimateSkillId, path + '.ultimateSkillId');
  const combo = requireString(bundle.comboSkillId, path + '.comboSkillId');
  const dodge = requireString(bundle.dodgeSkillId, path + '.dodgeSkillId');
  const dictionary = requireRecord(
    bundle.activeSkillTypeOverrides,
    path + '.activeSkillTypeOverrides',
  );
  const keys = requireArray(dictionary.keys, path + '.activeSkillTypeOverrides.keys');
  const values = requireArray(dictionary.values, path + '.activeSkillTypeOverrides.values');
  if (keys.length !== values.length)
    throw new Error(path + ': override keys and values length differ');
  const overrides = new Map<string, NativeSkillType>();
  for (const [index, key] of keys.entries()) {
    const id = requireNonEmptyString(key, path + '.activeSkillTypeOverrides.keys[' + index + ']');
    if (overrides.has(id)) throw new Error(path + ': duplicate skill override');
    overrides.set(
      id,
      parseNativeSkillType(values[index], path + '.activeSkillTypeOverrides.values[' + index + ']'),
    );
  }
  const initialNativeSkillTypeById: Record<string, NativeSkillType> = {};
  for (const id of skillIds) {
    // AbilitySystem._InitSkills 0344871F..034487F6: fixed identities precede overrides.
    initialNativeSkillTypeById[id] =
      id === normal
        ? 'normalSkill'
        : id === ultimate
          ? 'ultimateSkill'
          : id === combo
            ? 'comboSkill'
            : id === dodge
              ? 'dodge'
              : (overrides.get(id) ?? 'normalSkill');
  }
  return { skillIds, initialNativeSkillTypeById };
}
