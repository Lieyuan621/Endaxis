import {
  COMBAT_OBJECT_TYPES,
  type CombatObjectTypeSelection,
} from '../../../../packages/game-data-contract/src/primitives.ts';
/** 1.4.4 ObjectType 身份，对应 CombatEntity 与 CheckObjectTypeMatchAction 的类型判断。 */
const OBJECT_TYPES: Readonly<Record<string, number>> = {
  All: -1,
  Invalid: 1,
  Character: 8,
  Enemy: 16,
  Interactive: 32,
  Projectile: 64,
  FactoryRegion: 128,
  Npc: 256,
  AbilityEntity: 512,
  CinematicEntity: 1024,
  RemoteFactoryEntity: 2048,
  Creature: 4096,
  GodEntity: 8192,
  EnemyPart: 16384,
  EnemyAll: 16400,
  SocialBuilding: 32768,
};

/** 出来源边界后只传可读集合。未知位必须阻断，不能静默丢弃。 */
export function projectObjectTypeSelection(
  value: unknown,
  path: string,
): CombatObjectTypeSelection {
  const mask = parseObjectTypeMask(value, path);
  if (mask === -1) return 'all';
  const entries = Object.entries(OBJECT_TYPES).filter(
    ([name]) => name !== 'All' && name !== 'EnemyAll',
  );
  const knownMask = entries.reduce((result, [, bit]) => result | bit, 0);
  if ((mask & ~knownMask) !== 0) throw new Error(`${path}: unknown ObjectType mask bits`);
  return entries.flatMap(([name, bit]) => {
    if ((mask & bit) !== bit) return [];
    const readable = name[0]!.toLowerCase() + name.slice(1);
    const type = COMBAT_OBJECT_TYPES.find(candidate => candidate === readable);
    if (type === undefined) throw new Error(`${path}: missing readable ObjectType '${name}'`);
    return [type];
  });
}

export function parseObjectTypeMask(value: unknown, path: string): number {
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) return value;
  } else if (typeof value === 'string' && value.trim() !== '') {
    if (/^-?\d+$/.test(value.trim())) return parseObjectTypeMask(Number(value), path);
    let mask = 0;
    for (const name of value.split(',').map(part => part.trim())) {
      if (!Object.hasOwn(OBJECT_TYPES, name))
        throw new Error(`${path}: unknown ObjectType '${name}'`);
      mask |= OBJECT_TYPES[name]!;
    }
    return mask;
  }
  throw new Error(`${path}: expected ObjectType names or signed int32 mask`);
}
