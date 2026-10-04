/** Stable editor capabilities for a small set of formal contract declarations.
 * Source paths and line positions belong to build diagnostics, never runtime identity. */
export type FieldDeclarationId =
  | 'DealDamageParameters.instantAttributeModifiers'
  | 'DealDamageParameters.instantDamageScaleModifiers'
  | 'CombatStepParameters.spawnAbilityEntity.definition'
  | 'CombatStepParameters.applyBuff.keywordEnhancements'
  | 'CombatStepParameters.applyBuff.onActionEndBuffs'
  | 'CombatStepParameters.readSkillSettingData.items'
  | 'CombatStepParameters.createGlobalBuff.definition'
  | 'CombatStepParameters.listenForCombatEvents.responses'
  | 'CombatStepNode.options'
  | 'AbilityEntityDefinition.childSkill'
  | 'AbilityEntityDefinition.childSkills'
  | 'AbilityEntityDefinition.passiveSkills'
  | 'CombatStepParameters.readSkillSettingData.items.values'
  | 'CombatStepParameters.withActionBlackboardScope.initialValues'
  | 'CombatStepParameters.withActionBlackboardScope.entityInitialValues'
  | 'CombatStepParameters.withActionBlackboardScope.entityAssignments'
  | 'CombatStepParameters.applyBuff.blackboardAssignments'
  | 'CombatStepParameters.applyBuff.stringBlackboardAssignments'
  | 'CombatStepParameters.applyBuff.copiedBlackboardAssignments'
  | 'CombatStepParameters.applyBuff.onActionEndBuffs.blackboardAssignments'
  | 'CombatStepParameters.applyBuff.onActionEndBuffs.stringBlackboardAssignments'
  | 'CombatStepParameters.spawnAbilityEntity.blackboardAssignments'
  | 'CombatStepParameters.spawnAbilityEntity.stringBlackboardAssignments'
  | 'CombatStepParameters.createGlobalBuff.blackboardAssignments'
  | 'ActionGraphMacroCall.arguments'
  | 'SkillGlobalBuffChildDefinition.blackboardAssignments';

export type FieldReferenceKind =
  'gearSet' | 'buff' | 'skillGroup' | 'skillSlot' | 'skill' | 'abilityEntity';

export interface FieldDeclarationMetadata {
  readonly declaration?: FieldDeclarationId;
  readonly referenceKind?: FieldReferenceKind;
  readonly readonlyDeclaration?: true;
  readonly deferredCondition?: 'availability' | 'legacyHandler';
  readonly nativeId?: true;
  /** Host paths still determine which runtime blackboard is available. */
  readonly blackboardOrigin?: 'contract' | 'abilityEntity' | 'globalBuff';
}

export function sameFieldDeclaration(
  first: FieldDeclarationMetadata | undefined,
  second: FieldDeclarationMetadata | undefined,
): boolean {
  return first?.declaration !== undefined && first.declaration === second?.declaration;
}

/** 只标记正式契约中已存在的类型，不以字段名或当前值推断领域含义。 */
export type FieldSemanticAlias =
  | 'TimeScaleCurveDefinition'
  | 'GameplayTag'
  | 'ActionStringOperand'
  | 'ActionValueOperand'
  | 'ActionGraphReference'
  | 'LevelValues'
  | 'CombatCondition'
  | 'BuildCondition';

/** 生成描述保留容器子槽；对象字段仍由各自现有 schema 表达。 */
export interface FieldSemantics {
  readonly aliases?: readonly FieldSemanticAlias[];
  readonly arrayElement?: FieldSemantics;
  readonly recordValue?: FieldSemantics;
  readonly unionVariants?: readonly FieldSemantics[];
  readonly tuple?: {
    readonly elements: readonly {
      readonly label?: string;
      readonly optional?: boolean;
      readonly rest?: boolean;
      readonly semantics: FieldSemantics;
    }[];
    readonly minLength: number;
  };
}

/** 仅查询当前值及其联合分支；容器子槽描述的是其他值。 */
export function hasSemanticAlias(
  semantics: FieldSemantics | undefined,
  alias: FieldSemanticAlias,
): boolean {
  return Boolean(
    semantics?.aliases?.includes(alias) ||
    semantics?.unionVariants?.some(variant => hasSemanticAlias(variant, alias)),
  );
}

export type FieldFallbackReason =
  | 'no-present-type'
  | 'graph-reference-boundary'
  | 'owned-resource-boundary'
  | 'depth-limit'
  | 'recursive-type'
  | 'unsupported-type'
  | 'structured-editor-pending'
  | 'tuple-editor-pending'
  | 'condition-editor-pending';

/** Definition-only authoring scopes, never graph/macro binding environments. */
export type InlineConditionScope = 'equipment' | 'skillSwitch' | 'enemyStaggered';

export interface FieldSemanticMetadata extends FieldDeclarationMetadata {
  readonly inlineCondition?: InlineConditionScope;
  readonly semantics?: FieldSemantics;
  readonly fallback?: {
    readonly reason: FieldFallbackReason;
  };
}
