/**
 * 还原旧版 d248cf30 加载早期存档时的身份解析和实例补建规则。
 * 默认值快照取自该版本的数据表；不使用新版默认养成，不把轨道派生属性当成构筑输入。
 * 这里只补旧格式，后续仍通过已有映射转换到新版定义。无法识别的变体保留原身份供诊断。
 */
import catalog from './legacyLoadDefaults.json';
import type { ConversionMappings, LegacySkillIdentity } from './sourcePreparation';

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
const operators = new Map(Object.entries(catalog.operators));
const weapons = new Map(Object.entries(catalog.weapons));
const gears = new Map(Object.entries(catalog.gears));

/** 同旧版数据入口：干员 gameId、slug 均可作为身份。未知身份不猜测。 */
export function resolveLegacyOperator(id: string): string {
  const matches = [...operators].filter(
    ([slug, data]) => normalize(slug) === normalize(id) || normalize(data.gameId) === normalize(id),
  );
  return matches.length === 1 ? matches[0]![0] : id;
}

function resolveEquipment(id: string, mappings: Record<string, string> | undefined): string {
  const matches = Object.entries(mappings ?? {}).filter(
    ([slug, target]) => normalize(slug) === normalize(id) || normalize(target) === normalize(id),
  );
  return matches.length === 1 ? matches[0]![0] : id;
}

/** 只识别旧版标准技能 ID；时间戳变体不按名称或技能大类猜成普通技能。 */
export function normalizeLegacySkill(
  operator: string,
  action: LegacySkillIdentity & {
    id?: string;
    attackSegmentIndex?: number;
    comboSegmentIndex?: number;
  },
): LegacySkillIdentity {
  if (action.skillId !== undefined || action.sourceSkillKey !== undefined) return action;
  const data = operators.get(operator);
  const typeMap: Record<string, string> = {
    attack: 'basicAttack',
    skill: 'battleSkill',
    link: 'comboSkill',
    ultimate: 'ultimate',
    execution: 'finisher',
    dive: 'dive',
  };
  const key = typeMap[action.type ?? ''];
  if (!data || !key) return action;
  // 旧版普攻与多段连携使用不同的段号字段，不能只读取普攻段号。
  const segment =
    action.segmentIndex ??
    (action.type === 'link' ? action.comboSegmentIndex : action.attackSegmentIndex);
  const expected = `${data.gameId}_${action.type}${segment === undefined ? '' : `_seg${segment}`}`;
  if (action.id !== expected) return action;
  return {
    skillId: key,
    sourceSkillKey: key,
    type: key,
    segmentIndex: segment,
    variantKey: action.variantKey,
  };
}

/**
 * 旧版 createDodgeSkill 生成的标准空技能块。旧格式没有保存方向或极限闪避成功事实；
 * 只有身份与所属干员完全匹配时，才可转换成普通 Dash 输入。
 */
export function isLegacyDodgeAction(
  operator: string,
  action: { readonly id?: string; readonly type?: string },
): boolean {
  const data = operators.get(operator);
  return data !== undefined && action.type === 'dodge' && action.id === `${data.gameId}_dodge`;
}

interface LegacyTrack {
  id?: string | null;
  operatorInstanceId?: string;
  weaponId?: string | null;
  weaponInstanceId?: string;
  equipArmorId?: string | null;
  equipArmorInstanceId?: string;
  equipArmorRefineTier?: number;
  equipGlovesId?: string | null;
  equipGlovesInstanceId?: string;
  equipGlovesRefineTier?: number;
  equipAccessory1Id?: string | null;
  equipAccessory1InstanceId?: string;
  equipAccessory1RefineTier?: number;
  equipAccessory2Id?: string | null;
  equipAccessory2InstanceId?: string;
  equipAccessory2RefineTier?: number;
}
interface LegacyArmory {
  operators?: { id?: string }[];
  weapons?: { id?: string }[];
  gears?: { id?: string }[];
}

/** 缺实例时按旧版 hydrateTrackInstances 补建；已有实例不覆盖。 */
export function hydrateLegacyTrack(
  track: LegacyTrack,
  armory: LegacyArmory,
  mappings: ConversionMappings,
  trackIndex: number,
): void {
  function add<T extends { id?: string }>(
    rows: { id?: string }[],
    value: T,
    category: string,
  ): string {
    let id = `legacy-load:${category}:${trackIndex}`;
    while (rows.some(row => row.id === id)) id += ':';
    rows.push({ ...value, id });
    return id;
  }
  const operator = track.id ? resolveLegacyOperator(track.id) : undefined;
  const defaults = operator === undefined ? undefined : operators.get(operator);
  if (
    defaults &&
    !(armory.operators ?? []).some(
      row => row.id === track.operatorInstanceId && row.id !== undefined,
    )
  ) {
    armory.operators ??= [];
    track.operatorInstanceId = add(
      armory.operators,
      {
        id: '',
        operatorSlug: operator,
        level: 90,
        promoted: true,
        trustLevel: 4,
        potential: defaults.potential,
        skillLevels: { ...defaults.skillLevels },
        talentStates: { ...defaults.talentStates },
      },
      'operator',
    );
  }
  if (
    track.weaponId &&
    !(armory.weapons ?? []).some(row => row.id === track.weaponInstanceId && row.id !== undefined)
  ) {
    const slug = resolveEquipment(track.weaponId, mappings.weapons);
    const potential = weapons.get(slug);
    if (potential !== undefined) {
      armory.weapons ??= [];
      track.weaponInstanceId = add(
        armory.weapons,
        {
          id: '',
          weaponSlug: slug,
          level: 90,
          tuned: true,
          potential,
          skill1Level: 9,
          skill2Level: 9,
          skill3Level: 4 + potential,
        },
        'weapon',
      );
    }
  }
  for (const slot of ['Armor', 'Gloves', 'Accessory1', 'Accessory2'] as const) {
    const id = track[`equip${slot}Id`];
    const instanceKey = `equip${slot}InstanceId` as const;
    if (
      !id ||
      (armory.gears ?? []).some(row => row.id === track[instanceKey] && row.id !== undefined)
    )
      continue;
    const slug = resolveEquipment(id, mappings.gears);
    const level = gears.get(slug);
    if (level === undefined) continue;
    const tier = Math.max(0, Math.min(3, Math.round(Number(track[`equip${slot}RefineTier`]) || 0)));
    armory.gears ??= [];
    track[instanceKey] = add(
      armory.gears,
      {
        id: '',
        gearPieceId: slug,
        artificingLevels: level >= 60 ? Array(4).fill(tier || 3) : [],
      },
      `gear:${slot}`,
    );
  }
}
