import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions';
import { conditionStructure } from './conditionStructure.generated';
import type { InspectorField, InspectorValueShape } from './inspectorFields';
import { parameterInspectorField } from './parameterInspectorSchema';

const specificLabels: Partial<Record<CombatCondition['kind'], Record<string, string>>> = {
  enemySuperArmorCompare: { value: 'superArmor' },
  cameraToTargetAngleCompare: { value: 'cameraTargetAngle' },
  abilityEntityRemainingDurationCompare: { value: 'value' },
};
/** 整个对象的字段都可编辑时才自动接管；复杂分支完整保留专用编辑器。 */
export function conditionInspectorFields<K extends CombatCondition['kind']>(
  kind: K,
): readonly InspectorField<Extract<CombatCondition, { kind: K }>>[] | undefined {
  const structure = conditionStructure[kind];
  const entries: [
    string,
    (
      | (InspectorValueShape & { optional: boolean })
      | { type: 'conditionNode' | 'conditionNodes' | 'unsupported' }
    ),
  ][] = Object.entries(structure);
  if (entries.some(([, field]) => field.type === 'unsupported')) return undefined;
  const fields = entries.filter(
    (entry): entry is [string, InspectorValueShape & { optional: boolean }] =>
      entry[1].type !== 'conditionNode' &&
      entry[1].type !== 'conditionNodes' &&
      entry[1].type !== 'unsupported',
  );
  return fields.map(([key, field]) => {
    const result = parameterInspectorField<Extract<CombatCondition, { kind: K }>>(
      key,
      field,
      specificLabels[kind]?.[key],
    );
    if (kind === 'deckAttributeCompare' && (key === 'left' || key === 'right')) {
      return { ...result, optionLabelPrefix: 'timeline.skillEditing.attributes.' };
    }
    return (kind === 'entityTagMatch' && key === 'tags') ||
      (kind === 'eventBuffTagsMatch' && key === 'buffTags')
      ? { ...result, widget: 'gameplayTags' as const }
      : result;
  });
}
