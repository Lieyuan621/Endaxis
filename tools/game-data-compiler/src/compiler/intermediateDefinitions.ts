/**
 * 原生资源投影和优化使用的中间定义。此阶段允许尚未提取的数据表达式。
 * 发布前必须由 extractDefinitionDataNodes 转为正式契约，应用与存档不得依赖本模块。
 */
import type * as Contract from '../../../../packages/game-data-contract/src/index.ts';
export * from '../../../../packages/game-data-contract/src/index.ts';

/** 只扩展数据输入；动作种类、参数字段和资源归属仍来自正式契约。 */
export type IntermediateDefinition<T> = T extends { readonly kind: 'valueNode' }
  ? ActionValueOperand
  : T extends { readonly kind: 'conditionNode' }
    ? CombatCondition
    : T extends { readonly kind: 'stringNode' }
      ? ActionStringOperand
      : T extends readonly unknown[]
        ? { [K in keyof T]: IntermediateDefinition<T[K]> }
        : T extends object
          ? { [K in keyof T]: IntermediateDefinition<T[K]> }
          : T;

export type ActionValueOperand = Contract.ActionValueOperand | Contract.ActionValueExpression;
export type ActionStringOperand = Contract.ActionStringOperand | Contract.ActionStringExpression;
export type CombatCondition =
  | Contract.CombatCondition
  | IntermediateDefinition<Exclude<Contract.CombatConditionExpression, Contract.CombatCondition>>;
export type AbilityEntityChildSkillDefinition =
  IntermediateDefinition<Contract.AbilityEntityChildSkillDefinition>;
export type AbilityEntityDefinition = IntermediateDefinition<Contract.AbilityEntityDefinition>;
export type AbilityEntityPassiveSkillDefinition =
  IntermediateDefinition<Contract.AbilityEntityPassiveSkillDefinition>;
export type ActionGraphDataNode = IntermediateDefinition<Contract.ActionGraphDataNode>;
export type ActionGraphDefinition = IntermediateDefinition<Contract.ActionGraphDefinition>;
export type ActionGraphMacroDefinition =
  IntermediateDefinition<Contract.ActionGraphMacroDefinition>;
export type ActionGraphNode = IntermediateDefinition<Contract.ActionGraphNode>;
export type ActionGraphResourceDefinition =
  IntermediateDefinition<Contract.ActionGraphResourceDefinition>;
export type ActionGraphStep = IntermediateDefinition<Contract.ActionGraphStep>;
export type ActionSwitchOptionDefinition =
  IntermediateDefinition<Contract.ActionSwitchOptionDefinition>;
export type CombatEventResponseDefinition =
  IntermediateDefinition<Contract.CombatEventResponseDefinition>;
export type CombatStepDefinition = IntermediateDefinition<Contract.CombatStepDefinition>;
export type CombatStepForKind<K extends Contract.CombatStepKind> = IntermediateDefinition<
  Contract.CombatStepForKind<K>
>;
export type CombatStepParameters = IntermediateDefinition<Contract.CombatStepParameters>;
export type EquipmentContributionDefinition =
  IntermediateDefinition<Contract.EquipmentContributionDefinition>;
export type GearSetDefinition = IntermediateDefinition<Contract.GearSetDefinition>;
export type OperatorAbilityEntityDefinitions =
  IntermediateDefinition<Contract.OperatorAbilityEntityDefinitions>;
export type OperatorBuffDefinitions = IntermediateDefinition<Contract.OperatorBuffDefinitions>;
export type OperatorDefinition = IntermediateDefinition<Contract.OperatorDefinition>;
export type OperatorPassiveSkillDefinition =
  IntermediateDefinition<Contract.OperatorPassiveSkillDefinition>;
export type OperatorUpgradeDefinition = IntermediateDefinition<Contract.OperatorUpgradeDefinition>;
export type SkillBuffDefinition = IntermediateDefinition<Contract.SkillBuffDefinition>;
export type SkillDefinition = IntermediateDefinition<Contract.SkillDefinition>;
export type SkillGlobalBuffDefinition = IntermediateDefinition<Contract.SkillGlobalBuffDefinition>;
export type StaticBuffDefinition = IntermediateDefinition<Contract.StaticBuffDefinition>;
export type WeaponDefinition = IntermediateDefinition<Contract.WeaponDefinition>;
export type ActionGraphResourceCall = IntermediateDefinition<Contract.ActionGraphResourceCall>;
export type ComboSkillConditionDefinition =
  IntermediateDefinition<Contract.ComboSkillConditionDefinition>;
export type WeaponTraitDefinition = IntermediateDefinition<Contract.WeaponTraitDefinition>;
export type SkillGroupDefinition = IntermediateDefinition<Contract.SkillGroupDefinition>;
export type SkillPresentationVariantDefinition =
  IntermediateDefinition<Contract.SkillPresentationVariantDefinition>;
export type OperatorEntityBlackboardInitializerDefinition =
  IntermediateDefinition<Contract.OperatorEntityBlackboardInitializerDefinition>;
export type UpgradeModifierDefinition = IntermediateDefinition<Contract.UpgradeModifierDefinition>;
export type SkillGroupVariantDefinition =
  IntermediateDefinition<Contract.SkillGroupVariantDefinition>;
export type EquipmentEventHandlerDefinition =
  IntermediateDefinition<Contract.EquipmentEventHandlerDefinition>;
