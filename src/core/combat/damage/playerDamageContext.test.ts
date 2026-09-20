import { describe, expect, it, vi } from 'vitest';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from './damageScaleAttributes';
import { PlayerDamageContext, type PlayerDamageAttributeSnapshots } from './playerDamageContext';

function createSnapshots(attack: number): PlayerDamageAttributeSnapshots {
  const scaleAttributes = Object.fromEntries(
    DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
  ) as unknown as DamageScaleAttributeSnapshot;
  return {
    attacker: {
      ...scaleAttributes,
      attack,
      criticalRate: 0,
      criticalDamageIncrease: 0,
      weaknessDamageMultiplier: 1,
      igniteDamageMultiplier: 1,
      physicalInflictionDamageMultiplier: 1,
    },
    defender: {
      ...scaleAttributes,
      defense: 0,
      shelterDamageMultiplier: 0,
      breakingAttackDamageTakenMultiplier: 1,
      resistances: {
        physical: { percent: 0, damageTakenMultiplier: 1 },
        heat: { percent: 0, damageTakenMultiplier: 1 },
        electric: { percent: 0, damageTakenMultiplier: 1 },
        cryo: { percent: 0, damageTakenMultiplier: 1 },
        nature: { percent: 0, damageTakenMultiplier: 1 },
        ether: { percent: 0, damageTakenMultiplier: 1 },
      },
    },
  };
}

describe('PlayerDamageContext', () => {
  it('preserves modifier order, pending calculation scale, and refreshed snapshots', () => {
    let attack = 100;
    const order: string[] = [];
    const context = new PlayerDamageContext({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'electric',
      targetHealthType: 'normal',
      ports: {
        captureAttributeSnapshots: () => createSnapshots(attack),
        applyModifiers: (timing, side, damageContext) => {
          order.push(`${timing}:${side}`);
          if (timing === 'beforeCalculation' && side === 'attacker') {
            damageContext.multiplyCalculationValue(1.5);
            attack = 120;
          }
          if (timing === 'afterCalculation' && side === 'defender') {
            damageContext.multiplyCalculationValue(2);
          }
        },
        addInstantAttributeModifier: () => undefined,
        clearInstantAttributeModifiers: side => order.push(`clear:${side}`),
      },
    });

    context.applyModifiers('beforeCalculation');
    expect(context.attackerAttributes.attack).toBe(120);
    context.setCalculationResult(context.attackerAttributes.attack * 4);
    expect(context.baseValue).toBe(480);
    expect(context.value).toBe(720);
    expect(context.resolveFinalAttackValue()).toBe(1440);
    expect(context.attackerAttributes.attack).toBe(120);
    expect(order).toEqual([
      'beforeCalculation:attacker',
      'beforeCalculation:defender',
      'clear:attacker',
      'clear:defender',
      'afterCalculation:attacker',
      'afterCalculation:defender',
      'clear:attacker',
      'clear:defender',
    ]);
  });

  it('clears both sides when modifier processing throws', () => {
    const clear = vi.fn();
    const context = new PlayerDamageContext({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'physical',
      targetHealthType: 'normal',
      ports: {
        captureAttributeSnapshots: () => createSnapshots(1),
        applyModifiers: () => {
          throw new Error('modifier failed');
        },
        addInstantAttributeModifier: () => undefined,
        clearInstantAttributeModifiers: clear,
      },
    });

    expect(() => context.applyModifiers('beforeCalculation')).toThrow('modifier failed');
    expect(clear.mock.calls).toEqual([['attacker'], ['defender']]);
  });

  it('keeps before-calculation instant attributes through the final snapshot, then clears them', () => {
    let instantResistance = false;
    const clear = vi.fn(() => {
      instantResistance = false;
    });
    const context = new PlayerDamageContext({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'heat',
      targetHealthType: 'normal',
      ports: {
        captureAttributeSnapshots: () => {
          const snapshots = createSnapshots(100);
          return {
            ...snapshots,
            defender: {
              ...snapshots.defender,
              resistances: {
                ...snapshots.defender.resistances,
                heat: { percent: instantResistance ? 30 : 50, damageTakenMultiplier: 1 },
              },
            },
          };
        },
        applyModifiers: (timing, side, damageContext) => {
          if (timing === 'beforeCalculation' && side === 'attacker') {
            damageContext.addInstantAttributeModifier('defender', {
              attribute: 'FireResistance',
              values: {
                addition: 0,
                multiplier: 0,
                finalAddition: 0,
                finalMultiplier: 1,
                baseAddition: -20,
                baseMultiplier: 0,
                baseFinalAddition: 0,
                baseFinalMultiplier: 1,
              },
              timing: 'runtime',
            });
          }
        },
        addInstantAttributeModifier: () => {
          instantResistance = true;
        },
        clearInstantAttributeModifiers: clear,
      },
    });

    context.applyModifiers('beforeCalculation');
    context.setCalculationResult(100);
    context.resolveFinalAttackValue();

    expect(context.defenderAttributes.resistances.heat.percent).toBe(30);
    expect(instantResistance).toBe(false);
    expect(clear.mock.calls).toEqual([['attacker'], ['defender'], ['attacker'], ['defender']]);
  });
});
