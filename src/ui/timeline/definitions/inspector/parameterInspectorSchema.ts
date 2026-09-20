import {
  createInspectorField,
  initialInspectorValue,
  type InspectorField,
  type InspectorValueShape,
} from './inspectorFields';

const prefix = 'timeline.skillEditing.';
/** 注解只负责语义差异；类型、可选性和枚举来自自动提取的契约结构。 */
const fieldLabels: Record<string, string> = {
  operator: 'comparisonOperator',
  value: 'compareValue',
  left: 'operandLeft',
  right: 'operandRight',
  valueType: 'healthValueType',
  returnValueIfMissing: 'returnValueIfPoiseMissing',
  contextKey: 'conditionContextKey',
  objectTypes: 'objectTypeSelection',
  flag: 'contextFlag',
  skillTypes: 'cooldownSkillType',
  skillType: 'cooldownSkillType',
  skillId: 'cooldownSkillId',
  buffTags: 'buffTags',
  query: 'queryParameters',
  timeDomain: 'markerTimeDomain',
};
const optionPrefixes: Record<string, string> = {
  operator: 'comparisonOperators.',
  target: 'buffTargets.',
  valueType: 'healthValueTypes.',
  reaction: 'elementalReactions.',
  tagQueryType: 'tagQueryTypes.',
  match: 'tagQueryTypes.',
  skillTypes: 'skillTypes.',
  query: 'buffQueryKinds.',
};

/** 参数对象与顶层参数复用同一套注解；这里只描述显示差异，不重列查询的字段。 */
export function parameterInspectorField<T extends object>(
  key: string,
  shape: InspectorValueShape & { optional?: boolean },
  labelOverride?: string,
): InspectorField<T> {
  const label = labelOverride ?? fieldLabels[key] ?? key;
  return createInspectorField<T>(key, {
    editor: shape.type,
    optional: shape.optional,
    options: shape.options,
    variants: shape.variants,
    properties: shape.properties,
    element: shape.element,
    labelKey: prefix + label,
    optionLabelPrefix:
      key === 'skillTypes' || key === 'skillType'
        ? 'hitEditor.skillTypes.'
        : prefix + (optionPrefixes[key] ?? key + '.'),
    helpKey:
      shape.type === 'actionValue'
        ? prefix + 'fieldHelp.conditionOperand'
        : prefix + 'fieldHelp.' + label,
    create: () => initialInspectorValue(shape),
  });
}
