import type { GearDefinition } from '../../../core/game-data/equipmentDefinition';
import {
  getEquipmentModifierIconPath,
  getEquipmentModifierLabel,
} from '../../../utils/equipmentEffectDisplay';
import {
  formatProjectedEquipmentModifierValue,
  projectEquipmentTraitDisplay,
} from './equipmentModifierPresentation';

export interface GearAffixPresentationRow {
  readonly key: string;
  readonly traitIndex: number;
  readonly modifierId: string;
  readonly label: string;
  readonly valueText: string;
  readonly src: string;
  readonly marker: 'hollow-dot' | 'image';
  readonly title: string;
}

function formatRows(
  definition: GearDefinition,
  t: (key: string, named?: Record<string, unknown>) => string,
  selectedLevels?: readonly number[],
): readonly GearAffixPresentationRow[] {
  return definition.traits.map((trait, traitIndex) => {
    const projection = projectEquipmentTraitDisplay(trait.display);
    const values =
      selectedLevels === undefined
        ? projection.values
        : [
            projection.values[
              Math.max(
                0,
                Math.min(projection.values.length - 1, Math.trunc(selectedLevels[traitIndex] ?? 0)),
              )
            ] ?? 0,
          ];
    const label = getEquipmentModifierLabel(projection.modifierId, t);
    const valueText = values
      .map((_, index) => formatProjectedEquipmentModifierValue({ ...projection, values }, index))
      .join(' / ');
    const src = getEquipmentModifierIconPath(projection.modifierId) ?? '';
    return {
      key: `${definition.slug}-${traitIndex}-${projection.modifierId}`,
      traitIndex,
      modifierId: projection.modifierId,
      label,
      valueText,
      src,
      marker: src === '' ? ('hollow-dot' as const) : ('image' as const),
      title: `${label} ${valueText}`,
    };
  });
}

/** Selection previews show the complete value progression for each current-definition affix. */
export function getGearDefinitionSelectionAffixRows(
  definition: GearDefinition,
  t: (key: string, named?: Record<string, unknown>) => string,
): readonly GearAffixPresentationRow[] {
  return formatRows(definition, t);
}

/** Instance editors show the value selected by each persisted artificing level. */
export function getGearDefinitionInstanceAffixRows(
  definition: GearDefinition,
  artificingLevels: readonly number[],
  t: (key: string, named?: Record<string, unknown>) => string,
): readonly GearAffixPresentationRow[] {
  return formatRows(definition, t, artificingLevels);
}
