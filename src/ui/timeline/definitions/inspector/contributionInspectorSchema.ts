import type {
  EquipmentContributionDefinition,
  EquipmentEventHandlerDefinition,
} from '../../../../core/game-data/equipmentDefinition';
import { contributionStructure, handlerStructure } from './contributionStructure.generated';
import { createInspectorField, type InspectorValueShape } from './inspectorFields';
import { parameterInspectorField } from './parameterInspectorSchema';

/** 空黑板以空字典显示；写回最后一项删除时省略字段，不保留空对象。 */
function blackboardField<T extends object>(
  key: Extract<keyof T, string>,
  shape: InspectorValueShape,
) {
  const field = createInspectorField<T>(key, {
    ...parameterInspectorField<T>(key, shape),
    labelKey: `timeline.skillEditing.contributionFields.${key}`,
    helpKey: `timeline.skillEditing.contributionFields.${key}Help`,
    optional: false,
    replace: (value, input) => {
      if (Object.keys(input as object).length) return { ...value, [key]: input };
      const next = { ...value };
      delete next[key];
      return next;
    },
  });
  return { ...field, read: (value: T) => field.read(value) ?? {} };
}

export const contributionBlackboardFields = [
  blackboardField<EquipmentContributionDefinition>('blackboard', contributionStructure.blackboard),
];

/** 条件/序列由图拥有；事件触发器仍用专用控件，不把两个互斥事件族铺成可选字段。 */
export function handlerInspectorFields(value: EquipmentEventHandlerDefinition) {
  return [
    ...(
      ['key', 'priority', ...(value.abilityEvent === undefined ? [] : ['abilityEvent'])] as const
    ).map(key => {
      const shape = handlerStructure[key as 'key' | 'priority' | 'abilityEvent'];
      return {
        ...parameterInspectorField<EquipmentEventHandlerDefinition>(key, {
          ...shape,
          optional: key === 'priority',
        }),
        labelKey: `timeline.skillEditing.contributionFields.${key}`,
        helpKey: `timeline.skillEditing.contributionFields.${key}Help`,
      };
    }),
  ];
}
