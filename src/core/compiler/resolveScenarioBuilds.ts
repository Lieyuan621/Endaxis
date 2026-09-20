/**
 * 将轨道内嵌的干员、武器与装备实例和只读定义解析为编译阶段共享的构筑视图。
 *
 * 本模块只确认身份、兼容性、装备槽位和三件套，不计算面板，也不补齐缺失配置。
 * 时间轴、资源、面板和战斗装配应复用这里的结果，避免各自解释同一份项目数据。
 */
import type { GameDataRepository } from '../game-data/gameDataRepository';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import type {
  GearInstanceDocument,
  OperatorInstanceDocument,
  ScenarioDocument,
  TrackDocument,
  TrackIndex,
  WeaponInstanceDocument,
} from '../project/schema';

export type ScenarioBuildIndex = Pick<
  GameDataRepository,
  'getOperator' | 'getWeapon' | 'getGear' | 'getGearSet'
>;

export type ResolvedGearSlot = keyof TrackDocument['gears'];

/** 一件已经确认槽位兼容的装备实例及其定义。 */
export interface ResolvedGearBuild {
  readonly slot: ResolvedGearSlot;
  readonly instance: GearInstanceDocument;
  readonly definition: GearDefinition;
}

/** 一条有干员轨道的完整构筑输入；后续阶段不得再次按 slug 查询这些定义对象。 */
export interface ResolvedScenarioBuild {
  readonly trackIndex: TrackIndex;
  readonly track: TrackDocument;
  readonly operatorInstance: OperatorInstanceDocument;
  readonly operator: OperatorDefinition;
  readonly weapon: {
    readonly instance: WeaponInstanceDocument;
    readonly definition: WeaponDefinition;
  } | null;
  readonly gears: readonly ResolvedGearBuild[];
  readonly activeGearSets: readonly GearSetDefinition[];
}

const GEAR_SLOTS = [
  ['armor', 'armor'],
  ['gloves', 'gloves'],
  ['accessory1', 'accessory'],
  ['accessory2', 'accessory'],
] as const satisfies readonly (readonly [ResolvedGearSlot, GearDefinition['slotType']])[];

function requireDefinitionEntry<T>(value: T | null, kind: string, slug: string): T {
  if (value === null) throw new Error(`${kind} definition '${slug}' does not exist`);
  return value;
}

function requireDefinitionIdentity(actual: string, expected: string, path: string): void {
  if (actual !== expected) {
    throw new Error(`${path} resolved definition identity '${actual}', expected '${expected}'`);
  }
}

function resolveWeapon(
  track: TrackDocument,
  operator: OperatorDefinition,
  trackPath: string,
  index: ScenarioBuildIndex,
): ResolvedScenarioBuild['weapon'] {
  const instance = track.weapon;
  if (instance === null) return null;
  const definition = requireDefinitionEntry(
    index.getWeapon(instance.weaponSlug),
    'weapon',
    instance.weaponSlug,
  );
  requireDefinitionIdentity(definition.slug, instance.weaponSlug, `${trackPath}.weapon`);
  if (definition.weaponType !== operator.weaponType) {
    throw new Error(
      `${trackPath}.weapon weapon type '${definition.weaponType}' is incompatible with operator weapon type '${operator.weaponType}'`,
    );
  }
  return { instance, definition };
}

function resolveGears(
  track: TrackDocument,
  trackPath: string,
  index: ScenarioBuildIndex,
): readonly ResolvedGearBuild[] {
  const resolved: ResolvedGearBuild[] = [];
  for (const [slot, expectedSlotType] of GEAR_SLOTS) {
    const instance = track.gears[slot];
    if (instance === null) continue;
    const definition = requireDefinitionEntry(
      index.getGear(instance.gearSlug),
      'gear',
      instance.gearSlug,
    );
    requireDefinitionIdentity(definition.slug, instance.gearSlug, `${trackPath}.gears.${slot}`);
    if (definition.slotType !== expectedSlotType) {
      throw new Error(
        `${trackPath}.gears.${slot} gear slot '${definition.slotType}' is incompatible with track slot '${slot}'`,
      );
    }
    resolved.push({ slot, instance, definition });
  }
  return resolved;
}

function resolveActiveGearSets(
  gears: readonly ResolvedGearBuild[],
  trackPath: string,
  index: ScenarioBuildIndex,
): readonly GearSetDefinition[] {
  const counts = new Map<string, number>();
  for (const { definition } of gears) {
    if (definition.gearSetSlug !== undefined) {
      counts.set(definition.gearSetSlug, (counts.get(definition.gearSetSlug) ?? 0) + 1);
    }
  }
  return [...counts]
    .filter(([, count]) => count >= 3)
    .map(([slug]) => {
      const definition = requireDefinitionEntry(index.getGearSet(slug), 'gear set', slug);
      requireDefinitionIdentity(definition.slug, slug, `${trackPath}.gears`);
      return definition;
    });
}

/** 按轨道顺序严格解析全部上场干员构筑。 */
export function resolveScenarioBuilds(
  scenario: ScenarioDocument,
  index: ScenarioBuildIndex,
): readonly ResolvedScenarioBuild[] {
  const resolved: ResolvedScenarioBuild[] = [];
  const seenTrackIds = new Set<string>();

  scenario.tracks.forEach((track, rawTrackIndex) => {
    if (track === null) return;
    const trackIndex = rawTrackIndex as TrackIndex;
    const trackPath = `scenario.tracks[${trackIndex}]`;
    const operatorInstance = track.operator;
    if (operatorInstance === null) {
      const hasEquipment =
        track.weapon !== null || Object.values(track.gears).some(instance => instance !== null);
      if (hasEquipment) {
        throw new Error(`${trackPath} configures equipment without an operator instance`);
      }
      if (track.skillCasts.length > 0) {
        throw new Error(`track ${trackIndex} has skill casts but no operator instance`);
      }
      return;
    }
    if (seenTrackIds.has(track.id)) {
      throw new Error(`duplicate track identity '${track.id}'`);
    }
    seenTrackIds.add(track.id);

    const baseOperator = requireDefinitionEntry(
      index.getOperator(operatorInstance.operatorSlug),
      'operator',
      operatorInstance.operatorSlug,
    );
    requireDefinitionIdentity(
      baseOperator.slug,
      operatorInstance.operatorSlug,
      `${trackPath}.operator`,
    );
    const operator: OperatorDefinition = baseOperator;
    const weapon = resolveWeapon(track, operator, trackPath, index);
    const gears = resolveGears(track, trackPath, index);
    resolved.push({
      trackIndex,
      track,
      operatorInstance,
      operator,
      weapon,
      gears,
      activeGearSets: resolveActiveGearSets(gears, trackPath, index),
    });
  });

  return resolved;
}
