/** 由当前版本 TimeDilationConfig TypeTree dump 与同批 GameplayTag 目录生成；不要手工编辑。
 * Source SHA-256: db931557146d6250c646817f38db53974be8887fe0bcd8796c7d858cf7d2a936
 */
import type { TimeScaleCurveKeyDefinition } from '../../core/game-data/operatorDefinition';
import type {
  TimeDilationPriorityDefinition,
  TimeDilationSlotDefinition,
  TimeDilationSlotSpecialConfigDefinition,
} from './timeDilationCatalog';

export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([
  {
    tagPath: 'TimeDilation/Priority/UltiSkill',
    value: 100,
  },
  {
    tagPath: 'TimeDilation/Priority/HitStop',
    value: 10,
  },
  {
    tagPath: 'TimeDilation/Priority/Frozen',
    value: 50,
  },
  {
    tagPath: 'TimeDilation/Priority/DashSucceed',
    value: 10,
  },
  {
    tagPath: 'TimeDilation/Priority/BreakPoise',
    value: 20,
  },
  {
    tagPath: 'TimeDilation/Priority/ComboSkill',
    value: 30,
  },
  {
    tagPath: 'TimeDilation/Priority/GlobalSlowMotion',
    value: 10,
  },
  {
    tagPath: 'TimeDilation/Priority/GlobalSlowMotionPro',
    value: 21,
  },
  {
    tagPath: 'TimeDilation/Priority/Interrupt',
    value: 15,
  },
  {
    tagPath: 'TimeDilation/Priority/VisualAdjust',
    value: 50,
  },
] as const satisfies readonly TimeDilationPriorityDefinition[]);
export const TIME_DILATION_SLOT_DEFINITIONS = Object.freeze([
  {
    id: 'TimeDilation/Layer/Entity/HitStop',
    name: 'TimeDilation/Layer/Entity/HitStop',
    scope: 'entity',
  },
  {
    id: 'TimeDilation/Layer/Global/GamePlay',
    name: 'TimeDilation/Layer/Global/GamePlay',
    scope: 'global',
  },
  {
    id: 'TimeDilation/Layer/Entity/Frozen',
    name: 'TimeDilation/Layer/Entity/Frozen',
    scope: 'entity',
  },
  {
    id: 'TimeDilation/Layer/Global/UltiSkill',
    name: 'TimeDilation/Layer/Global/UltiSkill',
    scope: 'global',
  },
  {
    id: 'TimeDilation/Layer/Entity/DashSucceed',
    name: 'TimeDilation/Layer/Entity/DashSucceed',
    scope: 'entity',
  },
  {
    id: 'TimeDilation/Layer/Entity/VisualAdjust',
    name: 'TimeDilation/Layer/Entity/VisualAdjust',
    scope: 'entity',
  },
  {
    id: 'TimeDilation/Layer/Entity/UltTangtang',
    name: 'TimeDilation/Layer/Entity/UltTangtang',
    scope: 'entity',
  },
  {
    id: 'TimeDilation/Layer/Entity/Seal',
    name: 'TimeDilation/Layer/Entity/Seal',
    scope: 'entity',
  },
] as const satisfies readonly TimeDilationSlotDefinition[]);
export const TIME_DILATION_NAMED_CURVE_DEFINITIONS = Object.freeze({
  forge_iron_hitstop: [
    {
      time: 0,
      value: 0.05,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0.33333334,
    },
    {
      time: 1,
      value: 1,
      inTangent: 0.95,
      outTangent: 0.95,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0,
    },
  ],
  indie_dg002_travel_guide: [
    {
      time: 0,
      value: 1,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0.33333334,
    },
    {
      time: 0.01,
      value: 0.4,
      inTangent: -32,
      outTangent: -32,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0.33333334,
    },
    {
      time: 0.025,
      value: 0.2,
      inTangent: -0.40816325,
      outTangent: -0.40816325,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0.33333334,
    },
    {
      time: 0.5,
      value: 0.15,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0.33333334,
    },
    {
      time: 0.98025024,
      value: 0.27664328,
      inTangent: 0.57838523,
      outTangent: 0.57838523,
      weightedMode: 0,
      inWeight: 0.24554868,
      outWeight: 0.33333334,
    },
  ],
  interactive_behit_plant: [
    {
      time: 0,
      value: 0,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0,
    },
    {
      time: 1,
      value: 1,
      inTangent: 2,
      outTangent: 2,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0,
    },
  ],
  interactive_behit_mine: [
    {
      time: 0,
      value: 0.05,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0.33333334,
    },
    {
      time: 0.38,
      value: 0.05,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0.0938591,
    },
    {
      time: 1,
      value: 1,
      inTangent: 1.532258,
      outTangent: 1.532258,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0,
    },
  ],
  RESETto1: [
    {
      time: 0,
      value: 1,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0,
    },
    {
      time: 1,
      value: 1,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0,
    },
  ],
  interrupt_weakness: [
    {
      time: 0,
      value: 0,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0,
      outWeight: 0.33333334,
    },
    {
      time: 0.618,
      value: 0.01,
      inTangent: 0,
      outTangent: 0,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0.33333334,
    },
    {
      time: 1,
      value: 1,
      inTangent: 2.5916228,
      outTangent: 2.5916228,
      weightedMode: 0,
      inWeight: 0.33333334,
      outWeight: 0,
    },
  ],
  ComboSkill: [
    {
      time: 0,
      value: 0.01,
      inTangent: 0.000489342,
      outTangent: 0.000489342,
      weightedMode: 2,
      inWeight: 0,
      outWeight: 1,
    },
    {
      time: 1,
      value: 1,
      inTangent: 8.798947,
      outTangent: 8.798947,
      weightedMode: 1,
      inWeight: 0.102117956,
      outWeight: 0,
    },
  ],
} satisfies Readonly<Record<string, readonly TimeScaleCurveKeyDefinition[]>>);
export const TIME_DILATION_SLOT_SPECIAL_CONFIGS = Object.freeze([
  {
    globalSlot: 'TimeDilation/Layer/Global/UltiSkill',
    entitySlot: 'TimeDilation/Layer/Entity/Frozen',
    influencesDuration: true,
  },
  {
    globalSlot: 'TimeDilation/Layer/Global/GamePlay',
    entitySlot: 'TimeDilation/Layer/Entity/Frozen',
    influencesDuration: true,
  },
  {
    globalSlot: 'TimeDilation/Layer/Global/UltiSkill',
    entitySlot: 'TimeDilation/Layer/Entity/Seal',
    influencesDuration: true,
  },
  {
    globalSlot: 'TimeDilation/Layer/Global/GamePlay',
    entitySlot: 'TimeDilation/Layer/Entity/Seal',
    influencesDuration: true,
  },
] as const satisfies readonly TimeDilationSlotSpecialConfigDefinition[]);
