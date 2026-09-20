/**
 * `game-data-contract` 包的公共入口。
 *
 * 业务代码从这里引用干员、技能、Buff、装备和战斗动作等数据类型，避免依赖包内的
 * 文件布局。这个文件只汇总对外公开的数据定义，不创建模拟器实例，也不执行战斗逻辑。
 */
export * from './primitives.ts';
export * from './gameplayTags.ts';
export * from './abilityEvents.ts';
export * from './actions.ts';
export * from './conditions.ts';
export * from './skills.ts';
export * from './buffs.ts';
export * from './operators.ts';
export * from './equipment.ts';
export * from './enemies.ts';
export * from './consumables.ts';
export * from './buildModifiers.ts';
export * from './modifiers.ts';
export type { ContingencyContractTagDefinition } from './mechanics.ts';
