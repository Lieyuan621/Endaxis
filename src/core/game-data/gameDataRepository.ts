import type { ActionGraphDefinitionRepository } from '../compiler/actionGraphDefinitionRepository';

/**
 * 编译和解析阶段访问游戏数据的只读端口。
 * 具体数据源由应用层注入；核心不得借此读取项目状态、UI 状态或可变运行时对象。
 */
import type {
  OperatorAbilityEntityDefinitions,
  OperatorBuffDefinitions,
  OperatorDefinition,
} from './operatorDefinition';
import type { GearDefinition, GearSetDefinition, WeaponDefinition } from './equipmentDefinition';
import type { EnemyDefinition } from './enemyDefinition';
import type { ConsumableDefinition } from './consumableDefinition';

export const MECHANIC_FAMILIES = ['stage', 'contingencyContract', 'seasonTower', 'custom'] as const;
/** 决定一项场景机制由哪类 Adapter 解释。 */
export type MechanicFamily = (typeof MECHANIC_FAMILIES)[number];

/** 机制定义当前允许暴露给项目编辑器的参数类型。 */
export type MechanicParameterType = 'boolean' | 'number' | 'string';

/** 一项机制参数的定义契约；项目值必须先按此定义校验。 */
export interface MechanicParameterDefinition {
  key: string;
  type: MechanicParameterType;
  required: boolean;
  defaultValue?: boolean | number | string;
}

/** 这里只保存定义元数据；可执行行为由机制适配器编译。 */
export interface MechanicDefinitionRef {
  id: string;
  family: MechanicFamily;
  revision: string;
  parameters: readonly MechanicParameterDefinition[];
}

/** 公共定义的来源目录；可执行资源各自持有局部图。 */
export interface CommonDefinitionSource {
  readonly id: string;
  readonly buffDefinitions?: OperatorBuffDefinitions;
  readonly abilityEntityDefinitions?: OperatorAbilityEntityDefinitions;
}

/** 新核心使用的只读游戏数据边界。 */
export interface GameDataRepository {
  /** 图定义修订及等级编译缓存，由仓库统一拥有。 */
  readonly actionPrograms: ActionGraphDefinitionRepository;
  /** 保留公共 Buff、合约和消耗品的来源边界，供图入口按所属程序编译。 */
  getCommonDefinitionSources(): readonly CommonDefinitionSource[];
  getCommonBuffSource?(id: string): CommonDefinitionSource | null;
  getCommonAbilityEntitySource?(id: string): CommonDefinitionSource | null;
  /** 模拟服务缓存的来源标识；正式仓库取 SkillSetting 来源版本，不写入项目。 */
  readonly revision: string;
  /** 由版本化数据生成、编辑器只读的共享 Buff 蓝图。 */
  getCommonBuffDefinitions?(): OperatorBuffDefinitions;
  /** 由版本化数据生成、编辑器只读的共享能力实体蓝图。 */
  getCommonAbilityEntityDefinitions?(): OperatorAbilityEntityDefinitions;
  getOperator(slug: string): OperatorDefinition | null;
  getWeapon(slug: string): WeaponDefinition | null;
  getGear(slug: string): GearDefinition | null;
  getGearSet(slug: string): GearSetDefinition | null;
  getEnemy(id: string): EnemyDefinition | null;
  getMechanic(id: string): MechanicDefinitionRef | null;
  getConsumable(id: string): ConsumableDefinition | null;
  /** 消耗品互斥需要同版本完整目录，不能从当前场景引用反推。 */
  getConsumables(): readonly ConsumableDefinition[];
}

/** 编辑器选择器在只读查询端口之外需要的定义枚举能力。编译器仅依赖 `GameDataRepository`。 */
export interface GameDataBrowser {
  getOperators(): readonly OperatorDefinition[];
  getWeapons(): readonly WeaponDefinition[];
  getGears(): readonly GearDefinition[];
  getGearSets(): readonly GearSetDefinition[];
  getEnemies(): readonly EnemyDefinition[];
  getConsumables(): readonly ConsumableDefinition[];
}
