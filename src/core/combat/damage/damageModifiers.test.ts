import { chainEntry } from '../../../test/compiledGraphEntry';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { createDamageModifierCondition } from './damageModifierSequenceRuntime';
import { describe, expect, it, vi } from 'vitest';
import { createActionBlackboardState } from '../state/foundationState';
import { DamageModifier } from './damageModifiers';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from './damageScaleAttributes';
import { PlayerDamageContext, type PlayerDamageAttributeSnapshots } from './playerDamageContext';

const scaleAttributes = Object.fromEntries(
  DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
) as unknown as DamageScaleAttributeSnapshot;

function createContext(
  damageType: 'physical' | 'lifeDrain' = 'physical',
  addInstantAttributeModifier: PlayerDamageContext['addInstantAttributeModifier'] = () => undefined,
  skillCastId?: number,
) {
  const snapshots: PlayerDamageAttributeSnapshots = {
    attacker: {
      ...scaleAttributes,
      attack: 100,
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
  return new PlayerDamageContext({
    sourceId: 'operator',
    targetId: 'enemy',
    damageType,
    targetHealthType: 'normal',
    ...(skillCastId === undefined ? {} : { skillCastId }),
    ports: {
      captureAttributeSnapshots: () => snapshots,
      applyModifiers: () => undefined,
      addInstantAttributeModifier,
      clearInstantAttributeModifiers: () => undefined,
    },
  });
}

describe('DamageModifier', () => {
  it('records only executed direct scales with the resolved value', () => {
    const modifier = new DamageModifier('operator', {
      enabledSide: 'attacker',
      processors: [{ kind: 'damageScale', side: 'attacker', zone: 'normal', addition: 0.2 }],
    });
    const record = vi.fn();
    const context = createContext();
    modifier.apply('beforeCalculation', 'attacker', context, record);
    modifier.apply('afterCalculation', 'defender', context, record);
    modifier.apply('afterCalculation', 'attacker', createContext('lifeDrain'), record);
    expect(record).not.toHaveBeenCalled();
    modifier.apply('afterCalculation', 'attacker', context, record);
    expect(record).toHaveBeenCalledExactlyOnceWith('attacker', {
      kind: 'damageScale',
      zone: 'normal',
      addition: 0.2,
    });
    expect(context.damageScales.getFinalValue()).toBe(1.2);
  });
  it('resolves a Buff value into a one-hit instant attribute modifier', () => {
    const addInstantAttributeModifier = vi.fn();
    const context = createContext('physical', addInstantAttributeModifier);
    const modifier = new DamageModifier(
      'operator',
      {
        enabledSide: 'attacker',
        processors: [
          {
            kind: 'instantAttribute',
            targetSide: 'attacker',
            attribute: 'criticalDamageIncrease',
            values: {
              slot: 'baseAddition',
              value: { blackboardKey: 'critical_damage_up_to_bleed' },
            },
            attributeTiming: 'runtime',
          },
        ],
      },
      {
        buffId: 'test',
        blackboard: createActionBlackboardState({ critical_damage_up_to_bleed: 0.2 }),
      },
    );

    modifier.apply('beforeCalculation', 'attacker', context);

    expect(addInstantAttributeModifier).toHaveBeenCalledWith('attacker', {
      attribute: 'criticalDamageIncrease',
      values: expect.objectContaining({ baseAddition: 0.2 }),
      timing: 'runtime',
    });
  });

  it('checks side, owner and condition before running processors in declaration order', () => {
    const condition = createDamageModifierCondition(
      chainEntry('modifier-order', []),
      new CombatActionSequenceRuntime(
        { execute: () => true, evaluate: () => true },
        { blackboard: new ActionBlackboard() },
      ),
    );
    const evaluateCondition = vi.spyOn(condition, 'execute');
    const context = createContext();
    const modifier = new DamageModifier(
      'operator',
      {
        enabledSide: 'attacker',
        processors: [
          {
            kind: 'multiplyValue',
            timing: 'beforeCalculation',
            targetHealthTypes: ['normal'],
            scale: 1.5,
          },
          { kind: 'damageScale', side: 'attacker', zone: 'product', addition: 0.2 },
        ],
      },
      undefined,
      condition,
    );

    modifier.apply('beforeCalculation', 'defender', context);
    modifier.apply('beforeCalculation', 'attacker', context);
    context.setCalculationResult(100);
    modifier.apply('afterCalculation', 'attacker', context);

    expect(evaluateCondition).toHaveBeenCalledTimes(2);
    expect(context.value).toBe(150);
    expect(context.damageScales.getFinalValue()).toBeCloseTo(1.2);
  });

  it('rejects a modifier owned by the wrong entity and all processors for life drain', () => {
    const normal = createContext();
    const wrongOwner = new DamageModifier('other', {
      enabledSide: 'attacker',
      processors: [
        {
          kind: 'multiplyValue',
          timing: 'beforeCalculation',
          targetHealthTypes: ['normal'],
          scale: 2,
        },
      ],
    });
    wrongOwner.apply('beforeCalculation', 'attacker', normal);
    normal.setCalculationResult(100);
    expect(normal.value).toBe(100);

    const lifeDrain = createContext('lifeDrain');
    const modifier = new DamageModifier('operator', {
      enabledSide: 'attacker',
      processors: [
        {
          kind: 'multiplyValue',
          timing: 'beforeCalculation',
          targetHealthTypes: ['normal'],
          scale: 2,
        },
      ],
    });
    modifier.apply('beforeCalculation', 'attacker', lifeDrain);
    lifeDrain.setCalculationResult(100);
    expect(lifeDrain.value).toBe(100);
  });
});
