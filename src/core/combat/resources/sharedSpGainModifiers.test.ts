import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import {
  createSharedSpGainModifier,
  SharedSpGainModifierSet,
  createSharedSpRecoveryModifier,
  SharedSpRecoveryModifierSet,
  resolveSharedSpGain,
  resolveSharedSpRecovery,
} from './sharedSpGainModifiers';

describe('SharedSpGainModifierSet', () => {
  it('恢复同一切面后，各分支按自己的注册项计算获取和恢复效率', () => {
    const runtime = new StateStepper(
      {
        gain: { modifiers: [createSharedSpGainModifier('gainEfficiency', 'addition', 0.5, false)] },
        recovery: { modifiers: [createSharedSpRecoveryModifier('multiplier', 0.5)] },
      },
      (step, remove: boolean) => {
        if (remove) {
          step.state.gain.modifiers.length = 0;
          step.state.recovery.modifiers.length = 0;
        }
        return {
          gain: resolveSharedSpGain(step.state.gain, { baseGainEfficiency: 1 }, 'skill', 'gain')
            .totalEfficiency,
          returned: resolveSharedSpGain(
            step.state.gain,
            { baseGainEfficiency: 1 },
            'skill',
            'return',
          ).totalEfficiency,
          recovery: resolveSharedSpRecovery(step.state.recovery, 8),
        };
      },
    );
    const checkpoint = runtime.save();
    expect(runtime.step(true)).toEqual({ gain: 1, returned: 1, recovery: 8 });
    runtime.restore(checkpoint);
    expect(runtime.step(false)).toEqual({ gain: 1.5, returned: 1, recovery: 12 });
    runtime.restore(checkpoint);
    expect(runtime.step(true)).toEqual({ gain: 1, returned: 1, recovery: 8 });
  });

  it('combines the base gain segment and power-attack segment in native order', () => {
    const modifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1.2 });
    modifiers.add(createSharedSpGainModifier('gainEfficiency', 'addition', 0.3, true));
    modifiers.add(createSharedSpGainModifier('gainEfficiency', 'multiplier', 0.5, true));
    modifiers.add(createSharedSpGainModifier('powerAttackEfficiency', 'addition', 0.2, false));
    modifiers.add(createSharedSpGainModifier('powerAttackEfficiency', 'multiplier', 0.25, false));

    expect(modifiers.resolve('powerAttack', 'gain')).toEqual({
      gainEfficiency: 2.25,
      sourceEfficiency: 1.5,
      totalEfficiency: 3.375,
    });
  });

  it('filters only the base gain segment for returned SP', () => {
    const modifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    modifiers.add(createSharedSpGainModifier('gainEfficiency', 'addition', 0.5, false));
    modifiers.add(createSharedSpGainModifier('gainEfficiency', 'addition', 0.25, true));
    modifiers.add(createSharedSpGainModifier('powerAttackEfficiency', 'addition', 0.5, false));

    expect(modifiers.resolve('powerAttack', 'return')).toEqual({
      gainEfficiency: 1.25,
      sourceEfficiency: 1.5,
      totalEfficiency: 1.875,
    });
  });

  it('clamps each multiplier segment to a non-negative factor', () => {
    const modifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    modifiers.add(createSharedSpGainModifier('gainEfficiency', 'multiplier', -2, true));
    modifiers.add(createSharedSpGainModifier('powerAttackEfficiency', 'multiplier', -3, true));

    expect(modifiers.resolve('powerAttack', 'gain')).toEqual({
      gainEfficiency: 0,
      sourceEfficiency: 0,
      totalEfficiency: 0,
    });
  });

  it('registers and removes modifiers by identity', () => {
    const modifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 1 });
    const first = createSharedSpGainModifier('gainEfficiency', 'addition', 0.5, true);
    const second = createSharedSpGainModifier('gainEfficiency', 'addition', 0.5, true);
    modifiers.add(first);
    modifiers.add(first);
    modifiers.add(second);

    expect(modifiers.modifierCount).toBe(2);
    expect(modifiers.remove(first)).toBe(true);
    expect(modifiers.resolve('skill', 'gain').totalEfficiency).toBe(1.5);
    expect(modifiers.remove(first)).toBe(false);
  });

  it('keeps personal ultimate energy outside the shared SP model', () => {
    const modifiers = new SharedSpGainModifierSet({ baseGainEfficiency: 0.8 });

    expect(Object.keys(modifiers.settings)).toEqual(['baseGainEfficiency']);
    expect(modifiers.resolve('default', 'gain').totalEfficiency).toBe(0.8);
  });
});

describe('SharedSpRecoveryModifierSet', () => {
  it('applies native additions before the clamped multiplier segment', () => {
    const modifiers = new SharedSpRecoveryModifierSet();
    modifiers.add(createSharedSpRecoveryModifier('addition', 2));
    modifiers.add(createSharedSpRecoveryModifier('multiplier', -0.25));

    expect(modifiers.resolve(10)).toBe(9);
    modifiers.add(createSharedSpRecoveryModifier('multiplier', -2));
    expect(modifiers.resolve(10)).toBe(0);
  });

  it('registers and removes recovery modifiers by identity', () => {
    const modifiers = new SharedSpRecoveryModifierSet();
    const modifier = createSharedSpRecoveryModifier('multiplier', -0.1);

    modifiers.add(modifier);
    modifiers.add(modifier);
    expect(modifiers.resolve(10)).toBe(9);
    expect(modifiers.remove(modifier)).toBe(true);
    expect(modifiers.remove(modifier)).toBe(false);
    expect(modifiers.resolve(10)).toBe(10);
  });
});
