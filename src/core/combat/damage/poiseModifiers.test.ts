import { describe, expect, it } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { PoiseCalculationContext } from './poiseModifiers';

describe('poise modifiers', () => {
  it('仅在主控普攻末段的当前失衡包中增加来源方倍率', () => {
    const buffs = new CombatBuffContainer('operator', new CombatAttributeSet());
    const buff = buffs.add(
      {
        id: 'buff.weapon.normal-last-poise-up',
        stackingType: 'unique',
        blackboard: { poise_up: 0.3 },
        poiseModifiers: [
          {
            enabledSide: 'attacker',
            condition: {
              kind: 'all',
              conditions: [
                { kind: 'casterControlled' },
                {
                  kind: 'eventDamageTagsMatch',
                  match: 'hasAll',
                  tags: ['normalAttackLastCombo'],
                },
              ],
            },
            processors: [
              {
                kind: 'modifyPoiseScalar',
                timing: 'beforeCalculation',
                side: 'attacker',
                addition: { blackboardKey: 'poise_up' },
              },
            ],
          },
        ],
      },
      'operator',
    );
    if (buff === null) throw new Error('expected Buff');
    const matching = new PoiseCalculationContext(
      'operator',
      'enemy',
      ['normalAttack', 'normalAttackLastCombo'],
      true,
      1,
      1,
    );
    const uncontrolled = new PoiseCalculationContext(
      'operator',
      'enemy',
      ['normalAttackLastCombo'],
      false,
      1,
      1,
    );

    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', matching);
    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', uncontrolled);

    expect(matching.outputMultiplier).toBeCloseTo(1.3);
    expect(uncontrolled.outputMultiplier).toBe(1);

    buff.finish();
    const afterFinish = new PoiseCalculationContext(
      'operator',
      'enemy',
      ['normalAttackLastCombo'],
      true,
      1,
      1,
    );
    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', afterFinish);
    expect(afterFinish.outputMultiplier).toBe(1);
  });
});
