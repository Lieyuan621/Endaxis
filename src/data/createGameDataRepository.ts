import { ActionGraphDefinitionRepository } from '../core/compiler/actionGraphDefinitionRepository';
import { validateActionGraphOwner } from '../core/action-graph/actionGraphValidation';
import type {
  ActionGraphDefinition,
  ActionGraphResourceDefinition,
} from '../../packages/game-data-contract/src/actionGraph';
/**
 * 只负责把已经取得的定义集合装配成同步只读仓库。
 * 该文件不导入任何正式游戏定义，因此按需加载路径可以创建小仓库，而不会顺带加载整库。
 */
import type {
  CommonDefinitionSource,
  GameDataBrowser,
  GameDataRepository,
  MechanicDefinitionRef,
} from '../core/game-data/gameDataRepository';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../core/game-data/equipmentDefinition';
import type {
  OperatorBuffDefinitions,
  OperatorAbilityEntityDefinitions,
  OperatorDefinition,
} from '../core/game-data/operatorDefinition';
import type { EnemyDefinition } from '../core/game-data/enemyDefinition';
import type { ConsumableDefinition } from '../core/game-data/consumableDefinition';

export interface GameDataRepositoryInput {
  /** 按需加载扩充同一仓库时保留已发布程序与编译目录。 */
  readonly actionPrograms?: ActionGraphDefinitionRepository;
  readonly revision: string;
  readonly commonDefinitionSources?: readonly CommonDefinitionSource[];
  readonly operators?: readonly OperatorDefinition[];
  readonly weapons?: readonly WeaponDefinition[];
  /** 旧项目展示 slug 到当前原生武器身份的兼容映射。 */
  readonly weaponAliases?: Readonly<Record<string, string>>;
  readonly gears?: readonly GearDefinition[];
  /** 只用于解析旧项目身份；浏览器仍只枚举规范定义。 */
  readonly gearAliases?: Readonly<Record<string, string>>;
  readonly gearSets?: readonly GearSetDefinition[];
  /** 原生套装 ID 与旧项目 slug 并存期间的身份兼容映射。 */
  readonly gearSetAliases?: Readonly<Record<string, string>>;
  readonly enemies?: readonly EnemyDefinition[];
  readonly mechanics?: readonly MechanicDefinitionRef[];
  readonly consumables?: readonly ConsumableDefinition[];
}

function collectCommonDefinitions(sources: readonly CommonDefinitionSource[]) {
  const buffDefinitions: Record<string, OperatorBuffDefinitions[string]> = {};
  const abilityEntityDefinitions: Record<string, OperatorAbilityEntityDefinitions[string]> = {};
  const buffOwners = new Map<string, CommonDefinitionSource>();
  const entityOwners = new Map<string, CommonDefinitionSource>();
  const sourceIds = new Set<string>();
  const registered = sources.map(source => {
    if (!source.id) throw new Error('common definition source identity must not be empty');
    if (sourceIds.has(source.id))
      throw new Error(`duplicate common definition source '${source.id}'`);
    sourceIds.add(source.id);
    const buffs = Object.freeze({ ...source.buffDefinitions });
    const entities = Object.freeze({ ...source.abilityEntityDefinitions });
    const registeredSource = Object.freeze({
      ...source,
      buffDefinitions: buffs,
      abilityEntityDefinitions: entities,
    });
    // 实体模板本身没有图；入口与所有权校验遍历真正的子技能/被动资源。
    for (const [id, definition] of Object.entries(buffs))
      validateActionGraphOwner(definition, `common Buff '${id}'`);
    for (const [id, definition] of Object.entries(entities))
      validateActionGraphOwner(
        definition as typeof definition & { actionGraph?: ActionGraphResourceDefinition },
        `common AbilityEntity '${id}'`,
      );
    for (const [id, definition] of Object.entries(buffs)) {
      if (!id) throw new Error(`common definition source '${source.id}' has an empty Buff ID`);
      const previous = buffOwners.get(id);
      if (previous !== undefined)
        throw new Error(`common Buff '${id}' belongs to both '${previous.id}' and '${source.id}'`);
      buffOwners.set(id, registeredSource);
      Object.defineProperty(buffDefinitions, id, { value: definition, enumerable: true });
    }
    for (const [id, definition] of Object.entries(entities)) {
      if (!id)
        throw new Error(`common definition source '${source.id}' has an empty AbilityEntity ID`);
      const previous = entityOwners.get(id);
      if (previous !== undefined)
        throw new Error(
          `common AbilityEntity '${id}' belongs to both '${previous.id}' and '${source.id}'`,
        );
      entityOwners.set(id, registeredSource);
      Object.defineProperty(abilityEntityDefinitions, id, { value: definition, enumerable: true });
    }
    return registeredSource;
  });
  return {
    sources: Object.freeze(registered),
    buffOwners,
    entityOwners,
    buffDefinitions: Object.freeze(buffDefinitions),
    abilityEntityDefinitions: Object.freeze(abilityEntityDefinitions),
  };
}

function indexDefinitions<T>(
  definitions: readonly T[],
  identity: (definition: T) => string,
  kind: string,
): ReadonlyMap<string, T> {
  const indexed = new Map<string, T>();
  for (const definition of definitions) {
    const id = identity(definition);
    if (id.length === 0) throw new Error(`${kind} identity must not be empty`);
    if (indexed.has(id)) throw new Error(`duplicate ${kind} definition '${id}'`);
    indexed.set(id, definition);
  }
  return indexed;
}

function indexSlugAliases<T extends { readonly slug: string }>(
  aliases: Readonly<Record<string, string>> | undefined,
  definitions: ReadonlyMap<string, T>,
  kind: string,
): ReadonlyMap<string, T> {
  const indexed = new Map<string, T>();
  for (const [alias, target] of Object.entries(aliases ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    if (alias.length === 0 || target.length === 0) {
      throw new Error(`${kind} alias identity and target must not be empty`);
    }
    if (alias === target) throw new Error(`redundant ${kind} alias '${alias}'`);
    if (definitions.has(alias)) throw new Error(`${kind} alias '${alias}' shadows a definition`);
    const definition = definitions.get(target);
    if (definition === undefined) {
      throw new Error(`${kind} alias '${alias}' targets unknown definition '${target}'`);
    }
    indexed.set(alias, Object.freeze({ ...definition, slug: alias }));
  }
  return indexed;
}

/** 创建查询结果封闭的数据仓库；后续修改输入数组不会改变已经创建的查询结果。 */
export function createGameDataRepository(
  input: GameDataRepositoryInput,
): GameDataRepository & GameDataBrowser {
  if (input.revision.length === 0) throw new Error('game data revision must not be empty');
  const operatorList = Object.freeze([...(input.operators ?? [])]);
  const common = collectCommonDefinitions(input.commonDefinitionSources ?? []);
  const weaponList = Object.freeze([...(input.weapons ?? [])]);
  const gearList = Object.freeze([...(input.gears ?? [])]);
  const gearSetList = Object.freeze([...(input.gearSets ?? [])]);
  for (const [kind, definitions] of [
    ['operator', operatorList],
    ['weapon', weaponList],
    ['gear', gearList],
    ['gear set', gearSetList],
  ] as const) {
    for (const definition of definitions) {
      if (kind !== 'gear') {
        validateActionGraphOwner(
          definition as typeof definition & { actionGraph?: ActionGraphDefinition },
          `${kind} '${definition.slug}'`,
        );
      }
    }
  }
  const enemyList = Object.freeze([...(input.enemies ?? [])]);
  const operators = indexDefinitions(operatorList, value => value.slug, 'operator');
  const weapons = indexDefinitions(weaponList, value => value.slug, 'weapon');
  const weaponAliases = indexSlugAliases(input.weaponAliases, weapons, 'weapon');
  const gears = indexDefinitions(gearList, value => value.slug, 'gear');
  const gearSets = indexDefinitions(gearSetList, value => value.slug, 'gear set');
  const gearAliases = indexSlugAliases(input.gearAliases, gears, 'gear');
  const gearSetAliases = indexSlugAliases(input.gearSetAliases, gearSets, 'gear set');
  const enemies = indexDefinitions(enemyList, value => value.id, 'enemy');
  const mechanics = indexDefinitions(input.mechanics ?? [], value => value.id, 'mechanic');
  const consumableList = Object.freeze([...(input.consumables ?? [])]);
  const consumables = indexDefinitions(consumableList, value => value.id, 'consumable');

  return Object.freeze({
    revision: input.revision,
    actionPrograms: input.actionPrograms ?? new ActionGraphDefinitionRepository(),
    getCommonDefinitionSources: () => common.sources,
    getCommonBuffSource: (id: string) => common.buffOwners.get(id) ?? null,
    getCommonAbilityEntitySource: (id: string) => common.entityOwners.get(id) ?? null,
    getCommonBuffDefinitions: () => common.buffDefinitions,
    getCommonAbilityEntityDefinitions: () => common.abilityEntityDefinitions,
    getOperators: () => operatorList,
    getWeapons: () => weaponList,
    getGears: () => gearList,
    getGearSets: () => gearSetList,
    getEnemies: () => enemyList,
    getOperator: (slug: string) => operators.get(slug) ?? null,
    getWeapon: (slug: string) => weapons.get(slug) ?? weaponAliases.get(slug) ?? null,
    getGear: (slug: string) => gears.get(slug) ?? gearAliases.get(slug) ?? null,
    getGearSet: (slug: string) => gearSets.get(slug) ?? gearSetAliases.get(slug) ?? null,
    getEnemy: (id: string) => enemies.get(id) ?? null,
    getMechanic: (id: string) => mechanics.get(id) ?? null,
    getConsumable: (id: string) => consumables.get(id) ?? null,
    getConsumables: () => consumableList,
  });
}
