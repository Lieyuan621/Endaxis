import { ActionGraphDefinitionRepository } from '../core/compiler/actionGraphDefinitionRepository';
/**
 * 为时间轴页面按项目加载正式游戏定义。
 * 首次进入只读取项目实际引用的干员和装备；打开选择器或导入项目时再扩充为完整目录。
 * 对核心暴露的查询仍是同步接口，异步加载不会进入编译、模拟和投影层。
 */
import type { GameDataBrowser, GameDataRepository } from '../core/game-data/gameDataRepository';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../core/game-data/equipmentDefinition';
import type { OperatorDefinition } from '../core/game-data/operatorDefinition';
import { createGameDataRepository } from './createGameDataRepository';

type DefinitionModule<T> = Readonly<Record<string, unknown>> & { readonly default?: T };
type TimelineGameDataRepository = GameDataRepository & GameDataBrowser;

const operatorLoaders = import.meta.glob<DefinitionModule<OperatorDefinition>>(
  './operators/*.generated.ts',
);
const weaponLoaders = import.meta.glob<DefinitionModule<WeaponDefinition>>(
  './equipment/generated-weapons/**/*.generated.ts',
);
const gearLoaders = import.meta.glob<DefinitionModule<GearDefinition>>(
  './equipment/generated/**/*.generated.ts',
);
const gearSetLoaders = import.meta.glob<DefinitionModule<GearSetDefinition>>(
  './equipment/generated-gear-sets/*.generated.ts',
);

export interface ProjectGameDataRepository extends TimelineGameDataRepository {
  /** 加载选择器需要的完整干员和装备目录；重复调用复用同一个任务。 */
  ensureAllDefinitions(): Promise<void>;
  /** 当前是否已经扩充成完整目录。 */
  hasAllDefinitions(): boolean;
}

interface ProjectDefinitionReferences {
  readonly operators: Set<string>;
  readonly weapons: Set<string>;
  readonly gears: Set<string>;
  readonly gearSets: Set<string>;
}

function collectProjectDefinitionReferences(value: unknown): ProjectDefinitionReferences {
  const references: ProjectDefinitionReferences = {
    operators: new Set(),
    weapons: new Set(),
    gears: new Set(),
    gearSets: new Set(),
  };
  const seen = new Set<object>();
  const projectGears = new Set<string>();

  const visit = (current: unknown): void => {
    if (current === null || typeof current !== 'object' || seen.has(current)) return;
    seen.add(current);
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }
    const record = current as Record<string, unknown>;
    if (typeof record.operatorSlug === 'string' && !record.operatorSlug.startsWith('project:'))
      references.operators.add(record.operatorSlug);
    if (typeof record.weaponSlug === 'string' && !record.weaponSlug.startsWith('project:'))
      references.weapons.add(record.weaponSlug);
    if (typeof record.gearSlug === 'string') {
      if (record.gearSlug.startsWith('project:')) projectGears.add(record.gearSlug);
      else references.gears.add(record.gearSlug);
    }
    if (typeof record.gearSetSlug === 'string' && !record.gearSetSlug.startsWith('project:'))
      references.gearSets.add(record.gearSetSlug);
    // Project definitions are materialized in the save; their origins are audit-only.
    for (const [key, nested] of Object.entries(record)) {
      if (key !== 'definitionLibrary') visit(nested);
    }
  };

  visit(value);
  // A materialized project gear can still use a built-in set. Its origin is
  // audit-only, but its gearSetSlug is a live simulation dependency.
  const library = (
    value as {
      definitionLibrary?: { gears?: Record<string, { definition?: { gearSetSlug?: string } }> };
    } | null
  )?.definitionLibrary;
  for (const slug of projectGears) {
    const setSlug = library?.gears?.[slug]?.definition?.gearSetSlug;
    if (setSlug !== undefined && !setSlug.startsWith('project:')) references.gearSets.add(setSlug);
  }
  return references;
}

function loaderByBasename<T>(
  loaders: Readonly<Record<string, () => Promise<DefinitionModule<T>>>>,
  slug: string,
): (() => Promise<DefinitionModule<T>>) | undefined {
  return Object.entries(loaders).find(([path]) => path.endsWith(`/${slug}.generated.ts`))?.[1];
}

function definitionFromModule<T extends { readonly slug: string }>(
  module: DefinitionModule<T>,
  slug: string,
  kind: string,
): T {
  for (const value of Object.values(module)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      (value as { slug?: unknown }).slug === slug
    ) {
      return value as T;
    }
  }
  throw new Error(`${kind} definition module does not export '${slug}'`);
}

async function loadDefinition<T extends { readonly slug: string }>(
  loaders: Readonly<Record<string, () => Promise<DefinitionModule<T>>>>,
  slug: string,
  kind: string,
): Promise<T> {
  const load = loaderByBasename(loaders, slug);
  if (load === undefined) throw new Error(`missing ${kind} definition loader '${slug}'`);
  return definitionFromModule(await load(), slug, kind);
}

async function loadReferencedDefinitions(project: unknown) {
  const references = collectProjectDefinitionReferences(project);
  const operators: OperatorDefinition[] = [];
  const weapons: WeaponDefinition[] = [];
  const gears: GearDefinition[] = [];
  const gearSets: GearSetDefinition[] = [];

  for (const slug of references.operators) {
    operators.push(await loadDefinition(operatorLoaders, slug, 'operator'));
  }
  for (const slug of references.weapons) {
    weapons.push(await loadDefinition(weaponLoaders, slug, 'weapon'));
  }
  for (const slug of references.gears) {
    const gear = await loadDefinition(gearLoaders, slug, 'gear');
    gears.push(gear);
    if (gear.gearSetSlug !== undefined) references.gearSets.add(gear.gearSetSlug);
  }
  for (const slug of references.gearSets) {
    gearSets.push(await loadDefinition(gearSetLoaders, slug, 'gear set'));
  }
  return { operators, weapons, gears, gearSets };
}

/** 建立可原地扩充的页面仓库，已有项目会话始终持有同一个查询对象。 */
export async function createProjectGameDataRepository(
  project: unknown,
): Promise<ProjectGameDataRepository> {
  const [
    { generatedSkillSettings },
    common,
    contingency,
    mechanics,
    enemies,
    consumables,
    selected,
  ] = await Promise.all([
    import('./combat/skillSettings.generated'),
    import('./buffs/commonDefinitions'),
    import('./mechanics/generated/contingencyContractDefinitions.generated'),
    import('./mechanics/contingencyContractAdapter'),
    import('./enemies/generated/index.generated'),
    import('./consumables'),
    loadReferencedDefinitions(project),
  ]);

  const fixed = {
    actionPrograms: new ActionGraphDefinitionRepository(),
    revision: generatedSkillSettings.revision,
    commonDefinitionSources: [
      { id: 'common-buffs', buffDefinitions: common.commonBuffDefinitions },
      {
        id: 'contingency-contracts',
        buffDefinitions: contingency.contingencyContractBuffDefinitions,
      },
      { id: 'consumables', buffDefinitions: consumables.consumableBuffDefinitions },
    ],
    enemies: enemies.generatedEnemyDefinitions,
    mechanics: mechanics.contingencyContractMechanicDefinitions,
    consumables: consumables.consumableDefinitions,
  } as const;
  let current = createGameDataRepository({ ...fixed, ...selected });
  let allDefinitionsTask: Promise<void> | undefined;
  let allDefinitionsLoaded = false;

  const ensureAllDefinitions = (): Promise<void> => {
    if (allDefinitionsTask !== undefined) return allDefinitionsTask;
    allDefinitionsTask = (async () => {
      const { operatorDefinitions } = await import('./operators');
      const equipment = await import('./equipment');
      current = createGameDataRepository({
        ...fixed,
        operators: operatorDefinitions,
        weapons: equipment.weaponDefinitions,
        gears: equipment.gearDefinitions,
        gearSets: equipment.gearSetDefinitions,
      });
      allDefinitionsLoaded = true;
    })().catch(error => {
      allDefinitionsTask = undefined;
      throw error;
    });
    return allDefinitionsTask;
  };

  return Object.freeze({
    actionPrograms: fixed.actionPrograms,
    revision: generatedSkillSettings.revision,
    getCommonDefinitionSources: () => current.getCommonDefinitionSources?.() ?? [],
    getCommonBuffSource: (id: string) => current.getCommonBuffSource?.(id) ?? null,
    getCommonAbilityEntitySource: (id: string) =>
      current.getCommonAbilityEntitySource?.(id) ?? null,
    getCommonBuffDefinitions: () => current.getCommonBuffDefinitions?.() ?? {},
    getCommonAbilityEntityDefinitions: () => current.getCommonAbilityEntityDefinitions?.() ?? {},
    getOperators: () => current.getOperators(),
    getWeapons: () => current.getWeapons(),
    getGears: () => current.getGears(),
    getGearSets: () => current.getGearSets(),
    getEnemies: () => current.getEnemies(),
    getOperator: (slug: string) => current.getOperator(slug),
    getWeapon: (slug: string) => current.getWeapon(slug),
    getGear: (slug: string) => current.getGear(slug),
    getGearSet: (slug: string) => current.getGearSet(slug),
    getEnemy: (id: string) => current.getEnemy(id),
    getMechanic: (id: string) => current.getMechanic(id),
    getConsumable: (id: string) => current.getConsumable(id),
    getConsumables: () => current.getConsumables(),
    ensureAllDefinitions,
    hasAllDefinitions: () => allDefinitionsLoaded,
  });
}
