/**
 * 将指定轨道的养成实例与版本化游戏数据解析为配装 UI 可直接读取的稳定模型。
 * 本模块只负责身份解析和用户输入快照，不翻译、不计算面板，也不修复损坏引用；调用方应在渲染前处理抛出的数据错误。
 */
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import type { GearDefinition, WeaponDefinition } from '../../../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import type {
  GearInstanceDocument,
  OperatorInstanceDocument,
  ScenarioDocument,
  TrackDocument,
  TrackIndex,
  WeaponInstanceDocument,
} from '../../../core/project/schema';

/** 时间轴固定装备槽的稳定身份；两个配件槽必须分别保留。 */
export type LoadoutGearSlot = keyof TrackDocument['gears'];

/** 干员实例的用户输入及其定义，不包含名称等本地化文本。 */
export interface OperatorInstanceViewModel {
  readonly operatorSlug: string;
  readonly level: number;
  readonly promoted: boolean;
  readonly potential: number;
  readonly trustLevel: number;
  readonly skillLevels: Readonly<Record<string, number>>;
  readonly talentStates: Readonly<Record<string, number>>;
  readonly baseStatOverrides?: Readonly<Record<string, number>>;
  readonly definition: Readonly<OperatorDefinition>;
}

/** 武器实例的用户输入及其定义；词条等级顺序与定义中的词条顺序一致。 */
export interface WeaponInstanceViewModel {
  readonly weaponSlug: string;
  readonly level: number;
  readonly tuned: boolean;
  readonly potential: number;
  readonly traitLevels: readonly number[];
  readonly definition: Readonly<WeaponDefinition>;
}

/** 单个装备槽中的实例；精锻等级顺序与定义中的词条顺序一致。 */
export interface GearInstanceViewModel {
  readonly slot: LoadoutGearSlot;
  readonly gearSlug: string;
  readonly artificingLevels: readonly number[];
  readonly definition: Readonly<GearDefinition>;
}

/** 四个装备槽的固定形状；未装备的槽位明确表示为 `null`。 */
export interface GearSlotsViewModel {
  readonly armor: GearInstanceViewModel | null;
  readonly gloves: GearInstanceViewModel | null;
  readonly accessory1: GearInstanceViewModel | null;
  readonly accessory2: GearInstanceViewModel | null;
}

/** 一条轨道的完整只读配装投影；空轨道同样返回固定形状。 */
export interface TrackLoadoutInstanceViewModel {
  readonly trackIndex: TrackIndex;
  readonly operator: OperatorInstanceViewModel | null;
  readonly weapon: WeaponInstanceViewModel | null;
  readonly gears: GearSlotsViewModel;
}

function requireDefinition<T>(
  definition: T | null,
  expectedSlug: string,
  kind: string,
  identity: (value: T) => string,
): T {
  if (definition === null) throw new Error(`${kind} definition '${expectedSlug}' does not exist`);
  const actualSlug = identity(definition);
  if (actualSlug !== expectedSlug) {
    throw new Error(
      `${kind} definition '${expectedSlug}' resolved definition identity '${actualSlug}'`,
    );
  }
  return definition;
}

function projectOperator(
  instance: OperatorInstanceDocument,
  repository: GameDataRepository,
): OperatorInstanceViewModel {
  const definition = requireDefinition(
    repository.getOperator(instance.operatorSlug),
    instance.operatorSlug,
    'operator',
    value => value.slug,
  );
  return {
    operatorSlug: instance.operatorSlug,
    level: instance.level,
    promoted: instance.promoted,
    potential: instance.potential,
    trustLevel: instance.trustLevel,
    skillLevels: { ...instance.skillLevels },
    talentStates: { ...instance.talentStates },
    ...(instance.baseStatOverrides === undefined
      ? {}
      : { baseStatOverrides: { ...instance.baseStatOverrides } }),
    definition,
  };
}

function projectWeapon(
  instance: WeaponInstanceDocument,
  repository: GameDataRepository,
): WeaponInstanceViewModel {
  return {
    weaponSlug: instance.weaponSlug,
    level: instance.level,
    tuned: instance.tuned,
    potential: instance.potential,
    traitLevels: [...instance.traitLevels],
    definition: requireDefinition(
      repository.getWeapon(instance.weaponSlug),
      instance.weaponSlug,
      'weapon',
      value => value.slug,
    ),
  };
}

function projectGear(
  slot: LoadoutGearSlot,
  instance: GearInstanceDocument,
  repository: GameDataRepository,
): GearInstanceViewModel {
  return {
    slot,
    gearSlug: instance.gearSlug,
    artificingLevels: [...instance.artificingLevels],
    definition: requireDefinition(
      repository.getGear(instance.gearSlug),
      instance.gearSlug,
      'gear',
      value => value.slug,
    ),
  };
}

/**
 * 解析指定轨道的全部实例。任何非空实例都必须同时存在定义；
 * 本函数不会用定义默认值掩盖损坏项目，也不会校验装备兼容性或计算面板。
 */
export function projectTrackLoadoutBuilds(
  scenario: ScenarioDocument,
  trackIndex: TrackIndex,
  repository: GameDataRepository,
): TrackLoadoutInstanceViewModel {
  const track = scenario.tracks[trackIndex];
  if (track === null) {
    return {
      trackIndex,
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    };
  }

  const operator = track.operator === null ? null : projectOperator(track.operator, repository);
  const weapon = track.weapon === null ? null : projectWeapon(track.weapon, repository);

  const projectSlot = (slot: LoadoutGearSlot): GearInstanceViewModel | null => {
    const instance = track.gears[slot];
    if (instance === null) return null;
    return projectGear(slot, instance, repository);
  };

  return {
    trackIndex,
    operator,
    weapon,
    gears: {
      armor: projectSlot('armor'),
      gloves: projectSlot('gloves'),
      accessory1: projectSlot('accessory1'),
      accessory2: projectSlot('accessory2'),
    },
  };
}
