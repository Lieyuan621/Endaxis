import {
  TIME_DILATION_NAMED_CURVE_DEFINITIONS as GENERATED_TIME_DILATION_NAMED_CURVE_DEFINITIONS,
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
export const TIME_DILATION_SLOT_SPECIAL_CONFIGS: readonly TimeDilationSlotSpecialConfigDefinition[] =
  GENERATED_TIME_DILATION_SLOT_SPECIAL_CONFIGS;
