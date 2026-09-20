/**
 * 后台模拟当前场景所需的最小游戏数据包。
 *
 * 主线程已经为了编辑器选择器加载了完整游戏数据。本文件从中选出当前场景实际引用的定义，
 * Worker 收到后恢复为只读查询仓库，避免在第二个 JavaScript 运行环境中再次加载全部生成数据。
 */
import type {
  GameDataRepository,
  MechanicDefinitionRef,
} from '../../core/game-data/gameDataRepository';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../core/game-data/equipmentDefinition';
import type { EnemyDefinition } from '../../core/game-data/enemyDefinition';
import type {
  OperatorAbilityEntityDefinitions,
  OperatorBuffDefinitions,
  OperatorDefinition,
} from '../../core/game-data/operatorDefinition';
import type { ScenarioDocument } from '../../core/project/schema';
import type { ConsumableDefinition } from '../../core/game-data/consumableDefinition';

/** 可通过 Worker 消息传输、足以编译一个场景的纯数据。 */
export interface ScenarioSimulationGameData {
  readonly revision: string;
  readonly selectionKey: string;
  readonly commonBuffDefinitions: OperatorBuffDefinitions;
  readonly commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions;
  readonly operators: readonly OperatorDefinition[];
  readonly weapons: readonly WeaponDefinition[];
  readonly gears: readonly GearDefinition[];
  readonly gearSets: readonly GearSetDefinition[];
  readonly enemies: readonly EnemyDefinition[];
  readonly mechanics: readonly MechanicDefinitionRef[];
  readonly consumables: readonly ConsumableDefinition[];
}

function requireDefinition<T>(value: T | null, kind: string, id: string): T {
  if (value === null) throw new Error(`${kind} definition '${id}' does not exist`);
  return value;
}

function addDefinition<T>(target: Map<string, T>, id: string, definition: T): void {
  if (!target.has(id)) target.set(id, definition);
}

/**
 * 只读取场景身份得到数据选择键，不查询或组装定义。
 * 拖动技能块不会改变此键，因此高频模拟请求无需反复创建定义数组。
 */
export function scenarioSimulationGameDataSelectionKey(scenario: ScenarioDocument): string {
  const identities = new Set<string>();
  for (const track of scenario.tracks) {
    if (track?.operator !== null && track?.operator !== undefined)
      identities.add(`operator:${track.operator.operatorSlug}`);
    if (track?.weapon !== null && track?.weapon !== undefined)
      identities.add(`weapon:${track.weapon.weaponSlug}`);
    for (const instance of Object.values(track?.gears ?? {})) {
      if (instance !== null) identities.add(`gear:${instance.gearSlug}`);
    }
  }
  if (scenario.enemy.source.kind === 'prefab')
    identities.add(`enemy:${scenario.enemy.source.enemyId}`);
  for (const selection of scenario.mechanics.selections)
    identities.add(`mechanic:${selection.mechanicId}`);
  return [...identities].sort().join('\u001f');
}

/** 从完整编辑器仓库捕获当前场景引用的定义，不复制定义对象。 */
export function captureScenarioSimulationGameData(
  scenario: ScenarioDocument,
  repository: GameDataRepository,
): ScenarioSimulationGameData {
  const operators = new Map<string, OperatorDefinition>();
  const weapons = new Map<string, WeaponDefinition>();
  const gears = new Map<string, GearDefinition>();
  const gearSets = new Map<string, GearSetDefinition>();
  const enemies = new Map<string, EnemyDefinition>();
  const mechanics = new Map<string, MechanicDefinitionRef>();

  for (const track of scenario.tracks) {
    if (track?.operator !== null && track?.operator !== undefined) {
      const id = track.operator.operatorSlug;
      addDefinition(operators, id, requireDefinition(repository.getOperator(id), 'operator', id));
    }
    if (track?.weapon !== null && track?.weapon !== undefined) {
      const id = track.weapon.weaponSlug;
      addDefinition(weapons, id, requireDefinition(repository.getWeapon(id), 'weapon', id));
    }
    for (const instance of Object.values(track?.gears ?? {})) {
      if (instance === null) continue;
      const id = instance.gearSlug;
      const definition = requireDefinition(repository.getGear(id), 'gear', id);
      addDefinition(gears, id, definition);
      if (definition.gearSetSlug !== undefined) {
        const setId = definition.gearSetSlug;
        addDefinition(
          gearSets,
          setId,
          requireDefinition(repository.getGearSet(setId), 'gear set', setId),
        );
      }
    }
  }

  if (scenario.enemy.source.kind === 'prefab') {
    const id = scenario.enemy.source.enemyId;
    addDefinition(enemies, id, requireDefinition(repository.getEnemy(id), 'enemy', id));
  }
  for (const selection of scenario.mechanics.selections) {
    const id = selection.mechanicId;
    addDefinition(mechanics, id, requireDefinition(repository.getMechanic(id), 'mechanic', id));
  }

  return {
    revision: repository.revision,
    selectionKey: scenarioSimulationGameDataSelectionKey(scenario),
    commonBuffDefinitions: repository.getCommonBuffDefinitions?.() ?? {},
    commonAbilityEntityDefinitions: repository.getCommonAbilityEntityDefinitions?.() ?? {},
    operators: [...operators.values()],
    weapons: [...weapons.values()],
    gears: [...gears.values()],
    gearSets: [...gearSets.values()],
    enemies: [...enemies.values()],
    mechanics: [...mechanics.values()],
    consumables: repository.getConsumables(),
  };
}

function indexBy<T>(values: readonly T[], identity: (value: T) => string): ReadonlyMap<string, T> {
  return new Map(values.map(value => [identity(value), value]));
}

/** 在 Worker 内把纯数据包恢复成编译器使用的查询端口。 */
export function restoreScenarioSimulationGameData(
  data: ScenarioSimulationGameData,
): GameDataRepository {
  const operators = indexBy(data.operators, value => value.slug);
  const weapons = indexBy(data.weapons, value => value.slug);
  const gears = indexBy(data.gears, value => value.slug);
  const gearSets = indexBy(data.gearSets, value => value.slug);
  const enemies = indexBy(data.enemies, value => value.id);
  const mechanics = indexBy(data.mechanics, value => value.id);
  const consumables = indexBy(data.consumables, value => value.id);
  return Object.freeze({
    revision: data.revision,
    getCommonBuffDefinitions: () => data.commonBuffDefinitions,
    getCommonAbilityEntityDefinitions: () => data.commonAbilityEntityDefinitions,
    getOperator: (id: string) => operators.get(id) ?? null,
    getWeapon: (id: string) => weapons.get(id) ?? null,
    getGear: (id: string) => gears.get(id) ?? null,
    getGearSet: (id: string) => gearSets.get(id) ?? null,
    getEnemy: (id: string) => enemies.get(id) ?? null,
    getMechanic: (id: string) => mechanics.get(id) ?? null,
    getConsumable: (id: string) => consumables.get(id) ?? null,
    getConsumables: () => data.consumables,
  });
}
