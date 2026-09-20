import { describe, expect, it } from 'vitest';
import { evaluateTimeScaleCurve } from '../../core/combat/time/timeScaleCurve';
import { timeDilationRuntimeConfig } from './timeDilationConfig';
import { HIT_STOP_NAMED_CURVE_DEFINITIONS, HIT_STOP_NAMED_CURVE_KEYS } from './hitStopCurveCatalog';
import {
  TIME_DILATION_NAMED_CURVE_DEFINITIONS,
  TIME_DILATION_NAMED_CURVE_KEYS,
  TIME_DILATION_PRIORITY_DEFINITIONS,
  TIME_DILATION_PRIORITY_OPTIONS,
  TIME_DILATION_SLOT_DEFINITIONS,
  timeDilationSlotName,
} from './timeDilationCatalog';

describe('time-dilation version catalog', () => {
  it('maps recovered slot ids to exact GameplayTag paths', () => {
    expect(timeDilationSlotName('TimeDilation/Layer/Entity/HitStop')).toBe(
      'TimeDilation/Layer/Entity/HitStop',
    );
    expect(timeDilationSlotName('TimeDilation/Layer/Entity/Frozen')).toBe(
      'TimeDilation/Layer/Entity/Frozen',
    );
    expect(timeDilationSlotName('TimeDilation/Layer/Entity/Seal')).toBe(
      'TimeDilation/Layer/Entity/Seal',
    );
    expect(timeDilationSlotName('TimeDilation/Layer/Global/UltiSkill')).toBe(
      'TimeDilation/Layer/Global/UltiSkill',
    );
    expect(TIME_DILATION_SLOT_DEFINITIONS).toHaveLength(8);
    expect(timeDilationSlotName('unassigned')).toBeUndefined();
  });

  it('projects native priority tags into their runtime comparison values', () => {
    expect(TIME_DILATION_PRIORITY_DEFINITIONS).toHaveLength(10);
    expect(
      TIME_DILATION_PRIORITY_DEFINITIONS.find(
        definition => definition.tagPath === 'TimeDilation/Priority/UltiSkill',
      ),
    ).toMatchObject({ tagPath: 'TimeDilation/Priority/UltiSkill', value: 100 });
    expect(TIME_DILATION_PRIORITY_OPTIONS.map(option => option.value)).toEqual([
      10, 15, 20, 21, 30, 50, 100,
    ]);
  });

  it('exposes every curve recovered from the shared native config', () => {
    expect(TIME_DILATION_NAMED_CURVE_KEYS).toEqual([
      'forge_iron_hitstop',
      'indie_dg002_travel_guide',
      'interactive_behit_plant',
      'interactive_behit_mine',
      'RESETto1',
      'interrupt_weakness',
      'ComboSkill',
    ]);
    expect(TIME_DILATION_NAMED_CURVE_DEFINITIONS.interrupt_weakness).toHaveLength(3);
    expect(
      evaluateTimeScaleCurve(TIME_DILATION_NAMED_CURVE_DEFINITIONS.interrupt_weakness, 0.618),
    ).toBeCloseTo(0.01);
  });

  it('assembles the runtime from the same definitions used by the editor', () => {
    expect([...timeDilationRuntimeConfig.curves!.keys()]).toEqual([
      ...TIME_DILATION_NAMED_CURVE_KEYS,
      ...HIT_STOP_NAMED_CURVE_KEYS,
    ]);
    for (const name of TIME_DILATION_NAMED_CURVE_KEYS) {
      expect(timeDilationRuntimeConfig.curves!.get(name)?.(0)).toBeCloseTo(
        TIME_DILATION_NAMED_CURVE_DEFINITIONS[name][0]!.value,
      );
    }
    expect(HIT_STOP_NAMED_CURVE_KEYS).toHaveLength(24);
    expect(HIT_STOP_NAMED_CURVE_DEFINITIONS.char_hard_stop).toEqual([
      expect.objectContaining({ time: 0, value: 0.1 }),
      expect.objectContaining({ time: 0.05, value: 0.02 }),
      expect.objectContaining({ time: 0.618, value: 0.02 }),
      expect.objectContaining({ time: 1, value: 1 }),
    ]);
    expect(timeDilationRuntimeConfig.curves!.get('char_hard_stop')?.(0.618)).toBeCloseTo(0.02);
  });
});
