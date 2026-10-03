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
  /** 类型的显示文本；语义身份按 aliases，完整声明按 source 定位。 */
  readonly type: string;
  readonly aliases?: readonly FieldSemanticAlias[];
  readonly optional?: boolean;
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
    /** 含 rest 槽时没有固定最大长度。 */
    readonly maxLength?: number;
  };
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

export interface FieldSemanticMetadata {
  readonly inlineCondition?: InlineConditionScope;
  readonly semantics?: FieldSemantics;
  /** 仓库相对路径及声明行列；容器槽继承最近声明，聚合字段保留全部来源。 */
  readonly source?: readonly string[];
  readonly fallback?: {
    readonly reason: FieldFallbackReason;
  };
}
