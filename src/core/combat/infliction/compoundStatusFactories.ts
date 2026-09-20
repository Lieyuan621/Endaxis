/** 复合状态配方的静态生成契约。 */
import type { InflictionElement } from '../../game-data/operatorDefinition';
import type { ActionBlackboardValue } from '../actions/actionBlackboard';

export const COMPOUND_STATUS_FACTORIES_SCHEMA_VERSION = 1;

/** 复合状态定义能够直接保存或从黑板读取的标量。 */
export type CompoundStatusFactoryScalar = number | { readonly blackboardKey: string };

/** 从 SkillSetting 定义读取一个已确认数值的引用。 */
export interface CompoundStatusSkillSettingLookup {
  readonly dataKey: string;
  readonly column: CompoundStatusFactoryScalar;
  readonly enhanceAttributeSource: 'source';
  readonly storeKey: string;
}

/** 创建复合状态时写入动作黑板的一项赋值。 */
export interface CompoundStatusBlackboardAssignment {
  readonly targetKey: string;
  readonly inputKey: string;
}

/** 一种复合反应及其方向对应的 Buff 构造配方。 */
export interface CompoundStatusFactoryEntry {
  readonly id: string;
  readonly consumedElement: InflictionElement;
  readonly incomingElement: InflictionElement;
  readonly durationSeconds: CompoundStatusFactoryScalar;
  readonly blackboard: Readonly<Record<string, ActionBlackboardValue>>;
  readonly skillSettingLookups: readonly CompoundStatusSkillSettingLookup[];
  readonly createdBuff: {
    readonly buffId: string;
    readonly blackboardAssignments: readonly CompoundStatusBlackboardAssignment[];
  };
}

/** 生成的复合状态工厂定义顶层版本化文档。 */
export interface CompoundStatusFactoriesDocument {
  readonly schemaVersion: typeof COMPOUND_STATUS_FACTORIES_SCHEMA_VERSION;
  readonly revision: string;
  readonly factories: readonly CompoundStatusFactoryEntry[];
}

/** 生成复合状态配方进入核心前的严格边界。 */
