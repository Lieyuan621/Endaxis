import type { TimeScaleCurveKeyDefinition } from '../../core/game-data/operatorDefinition';
import {
  TIME_DILATION_NAMED_CURVE_DEFINITIONS as GENERATED_TIME_DILATION_NAMED_CURVE_DEFINITIONS,
  TIME_DILATION_PRIORITY_DEFINITIONS as GENERATED_TIME_DILATION_PRIORITY_DEFINITIONS,
  TIME_DILATION_SLOT_DEFINITIONS as GENERATED_TIME_DILATION_SLOT_DEFINITIONS,
  TIME_DILATION_SLOT_SPECIAL_CONFIGS as GENERATED_TIME_DILATION_SLOT_SPECIAL_CONFIGS,
} from './timeDilationCatalog.generated';

export interface TimeDilationSlotDefinition {
  readonly id: string;
  readonly name: string;
  readonly scope: 'global' | 'entity';
}

export interface TimeDilationPriorityDefinition {
  readonly tagPath: string;
  readonly value: number;
}

export interface TimeDilationSlotSpecialConfigDefinition {
  readonly globalSlot: string;
  readonly entitySlot: string;
  readonly influencesDuration: boolean;
}

export const TIME_DILATION_NAMED_CURVE_DEFINITIONS =
  GENERATED_TIME_DILATION_NAMED_CURVE_DEFINITIONS;
export const TIME_DILATION_PRIORITY_DEFINITIONS: readonly TimeDilationPriorityDefinition[] =
  GENERATED_TIME_DILATION_PRIORITY_DEFINITIONS;
export const TIME_DILATION_SLOT_DEFINITIONS: readonly TimeDilationSlotDefinition[] =
  GENERATED_TIME_DILATION_SLOT_DEFINITIONS;
export const TIME_DILATION_SLOT_SPECIAL_CONFIGS: readonly TimeDilationSlotSpecialConfigDefinition[] =
  GENERATED_TIME_DILATION_SLOT_SPECIAL_CONFIGS;

export const TIME_DILATION_PRIORITY_OPTIONS = Object.freeze(
  [...new Set(TIME_DILATION_PRIORITY_DEFINITIONS.map(definition => definition.value))]
    .sort((left, right) => left - right)
    .map(value =>
      Object.freeze({
        value,
        tagPaths: TIME_DILATION_PRIORITY_DEFINITIONS.filter(
          definition => definition.value === value,
        ).map(definition => definition.tagPath),
      }),
    ),
);

export type TimeDilationNamedCurveKey = keyof typeof TIME_DILATION_NAMED_CURVE_DEFINITIONS;

export const TIME_DILATION_NAMED_CURVE_KEYS = Object.freeze(
  Object.keys(TIME_DILATION_NAMED_CURVE_DEFINITIONS) as TimeDilationNamedCurveKey[],
);

export function timeDilationNamedCurveKeys(
  keyName: string,
): readonly TimeScaleCurveKeyDefinition[] | undefined {
  return (
    TIME_DILATION_NAMED_CURVE_DEFINITIONS as Readonly<
      Record<string, readonly TimeScaleCurveKeyDefinition[]>
    >
  )[keyName];
}

export function timeDilationSlotName(slotId: string): string | undefined {
  return TIME_DILATION_SLOT_DEFINITIONS.find(slot => slot.id === slotId)?.name;
}
