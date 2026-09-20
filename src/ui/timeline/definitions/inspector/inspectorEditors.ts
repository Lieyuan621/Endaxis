import { defineAsyncComponent, type Component, type InjectionKey } from 'vue';
import type { InspectorField } from './inspectorFields';
import type { InspectorPropertyPath } from './inspectorProperty';
import type { DefinitionProperty } from '../definitionEditContext';

type EditorKind = InspectorField<object>['editor'] | NonNullable<InspectorField<object>['widget']>;
type Metadata = Pick<
  InspectorField<object>,
  | 'editor'
  | 'options'
  | 'variants'
  | 'properties'
  | 'element'
  | 'optional'
  | 'selection'
  | 'labelKey'
  | 'optionLabelPrefix'
>;
export interface InspectorEditorContext {
  binding?: DefinitionProperty;
  field: Metadata;
  value: unknown;
  label: string;
  disabled: boolean;
  currentLevel: number;
  propertyPath?: InspectorPropertyPath;
  translate: (key: string) => string;
}
export interface InspectorEditorRegistration {
  component: Component;
  props: (context: InspectorEditorContext) => Record<string, unknown>;
}
export type InspectorEditorRegistry = Readonly<Record<EditorKind, InspectorEditorRegistration>>;
/** 注入只作用于当前工作区及其子控件，不修改全局注册表。 */
export const inspectorEditorRegistryKey: InjectionKey<InspectorEditorRegistry> =
  Symbol('inspector-editors');
const primitive = defineAsyncComponent(() => import('./InspectorPrimitiveValue.vue'));
const scalar: InspectorEditorRegistration = {
  component: primitive,
  props: ({ field, value, label, disabled, translate }) => ({
    value,
    label,
    disabled,
    kind: field.editor,
    optional: field.optional,
    options:
      field.editor === 'boolean'
        ? [
            { value: 'true', label: translate('timeline.skillEditing.booleanValues.true') },
            { value: 'false', label: translate('timeline.skillEditing.booleanValues.false') },
          ]
        : field.options?.map(value => ({
            value,
            label: translate(`${field.optionLabelPrefix}${value}`),
          })),
    defaultLabel: translate('common.default'),
  }),
};
const collectionProps = ({
  field,
  value,
  currentLevel,
  propertyPath,
  binding,
}: InspectorEditorContext) => ({
  binding,
  propertyPath,
  value,
  currentLevel,
  element: field.element,
  labelKey: field.labelKey,
  optionLabelPrefix: field.optionLabelPrefix,
});
const list: InspectorEditorRegistration = {
  component: defineAsyncComponent(() => import('./InspectorStringList.vue')),
  props: ({ field, value, label, disabled }) => ({
    value,
    label,
    disabled,
    options: field.options,
    optionLabelPrefix: field.optionLabelPrefix,
  }),
};
/** 按可复用编辑类型注册；组件不知道步骤种类、整份草稿或历史实现。 */
export const defaultInspectorEditors: InspectorEditorRegistry = Object.freeze({
  enumSelection: {
    component: defineAsyncComponent(() => import('./InspectorEnumSelection.vue')),
    props: ({ field, value, disabled }) => ({
      value,
      disabled,
      options: field.options ?? [],
      optionLabelPrefix: field.optionLabelPrefix,
      allowEmpty: field.selection?.allowEmpty ?? false,
      emptyLabelKey: field.selection?.emptyLabelKey,
    }),
  },
  gameplayTags: {
    component: defineAsyncComponent(() => import('./GameplayTagsEditor.vue')),
    props: ({ value }) => ({ tags: value, minimum: 0 }),
  },
  text: scalar,
  number: scalar,
  boolean: scalar,
  enum: scalar,
  textList: list,
  enumList: list,
  actionValue: {
    component: defineAsyncComponent(() => import('../actions/ActionValueOperandEditor.vue')),
    props: ({ value, translate }) => ({
      value,
      labels: {
        constant: translate('timeline.skillEditing.operandConstant'),
        blackboard: translate('timeline.skillEditing.operandBlackboard'),
        blackboardKey: translate('timeline.skillEditing.operandBlackboardKey'),
        constantValue: translate('timeline.skillEditing.operandConstantValue'),
      },
    }),
  },
  stringReference: {
    component: defineAsyncComponent(() => import('./StringReferenceEditor.vue')),
    props: ({ value, label }) => ({ value, label }),
  },
  union: {
    component: defineAsyncComponent(() => import('./InspectorUnionValue.vue')),
    props: context => ({
      ...collectionProps(context),
      variants: context.field.variants ?? [],
      optionLabelPrefix: context.field.optionLabelPrefix,
    }),
  },
  array: {
    component: defineAsyncComponent(() => import('./InspectorArrayValue.vue')),
    props: collectionProps,
  },
  dictionary: {
    component: defineAsyncComponent(() => import('./InspectorDictionaryValue.vue')),
    props: collectionProps,
  },
  object: {
    component: defineAsyncComponent(() => import('./InspectorObjectValue.vue')),
    props: ({ value, field, currentLevel, propertyPath, binding }) => ({
      optionLabelPrefix: field.optionLabelPrefix,
      binding,
      propertyPath,
      value,
      properties: field.properties ?? {},
      currentLevel,
    }),
  },
  levelValues: {
    component: defineAsyncComponent(() => import('../LevelValuesEditor.vue')),
    props: ({ value, currentLevel }) => ({ value, currentLevel }),
  },
  buffAssignments: {
    component: defineAsyncComponent(() => import('../buffs/BuffAssignmentsEditor.vue')),
    props: ({ value, currentLevel, binding }) => ({ value, currentLevel, binding }),
  },
});
export function extendInspectorEditors(
  overrides: Partial<InspectorEditorRegistry>,
  base = defaultInspectorEditors,
): InspectorEditorRegistry {
  return Object.freeze({ ...base, ...overrides });
}
