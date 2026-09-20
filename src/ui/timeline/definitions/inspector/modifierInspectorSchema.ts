import type { EquipmentModifierDefinition } from '../../../../core/game-data/equipmentDefinition';
import { modifierStructure } from './modifierStructure.generated';
import { matchesInspectorValue, type InspectorValueShape } from './inspectorFields';
import { parameterInspectorField } from './parameterInspectorSchema';
import { enumSelectionField } from './inspectorEnumSelection';

/** 类型及候选值来自契约；筛选字段显式选用集合视图，不改变普通列表语义。 */
export function modifierInspectorFields(value: EquipmentModifierDefinition) {
  const structure = modifierStructure as InspectorValueShape;
  const variant = structure.variants?.find(shape => matchesInspectorValue(shape, value));
  return Object.entries(variant?.properties ?? {})
    .filter(([key]) => key !== 'kind')
    .map(([key, shape]) => {
      const field = parameterInspectorField<EquipmentModifierDefinition>(key, shape);
      if (key === 'damageTypes' || key === 'skillTypes')
        return enumSelectionField({
          ...field,
          labelKey: `timeline.skillEditing.modifierFields.${key}`,
        });
      return {
        ...field,
        labelKey: `timeline.skillEditing.modifierFields.${key}`,
        optionLabelPrefix: `timeline.skillEditing.modifierFields.options.`,
        helpKey: key === 'slot' ? 'timeline.skillEditing.modifierFields.slotHelp' : undefined,
        // 从省略态启用公式槽时保持旧面板的 BaseAddition 选择，不依赖 TS 联合排序。
        ...(key === 'slot'
          ? {
              toggle: (current: EquipmentModifierDefinition, enabled: boolean) =>
                enabled ? field.write(current, 'baseAddition') : field.toggle(current, false),
            }
          : {}),
      };
    });
}
