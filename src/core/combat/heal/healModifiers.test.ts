import { describe, expect, it } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { CombatVitals } from '../resources/combatVitals';
import { HealCalculationContext } from './healModifiers';

function vitals(health: number) {
  return new CombatVitals({
    health,
    maxHealth: 1000,
    maxPoise: 0,
    poise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 0,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
}

describe('heal modifiers', () => {
  it('按治疗 Tag 在计算前修改本次治疗的属性快照', () => {
    const buffs = new CombatBuffContainer('healer', new CombatAttributeSet());
    buffs.add(
      {
        id: 'buff.weapon.tagged-heal-up',
        stackingType: 'unique',
        blackboard: { heal_up: 0.2 },
        healModifiers: [
          {
            enabledSide: 'healer',
            condition: {
              kind: 'healTagsMatch',
              match: 'hasAny',
              tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            },
            processors: [
              {
                kind: 'modifyHealingIncrease',
                timing: 'beforeCalculation',
                side: 'healer',
                addition: { blackboardKey: 'heal_up' },
              },
            ],
          },
        ],
      },
      'healer',
    );
    const tagged = new HealCalculationContext(
      'healer',
      'ally',
      vitals(500),
      100,
      ['Skill/Character/Common/Heal/ComboSkillHeal'],
      0.1,
      0.05,
    );
    const untagged = new HealCalculationContext('healer', 'ally', vitals(500), 100, [], 0.1, 0.05);

    buffs.applyHealModifiers('beforeCalculation', 'healer', tagged);
    buffs.applyHealModifiers('beforeCalculation', 'healer', untagged);

    expect(tagged.healerOutputIncrease).toBeCloseTo(0.3);
    expect(tagged.receiverTakenIncrease).toBeCloseTo(0.05);
    expect(untagged.healerOutputIncrease).toBeCloseTo(0.1);
  });

  it('uses the Buff blackboard and target health condition after calculation', () => {
    const buffs = new CombatBuffContainer('snowshine', new CombatAttributeSet());
    const buff = buffs.add(
      {
        id: 'buff.snowshine.talent',
        stackingType: 'unique',
        blackboard: { heal_up: 0.1, rate: 0.5 },
        healModifiers: [
          {
            enabledSide: 'healer',
            condition: {
              kind: 'targetHealthCompare',
              valueType: 'ratio',
              operator: 'lessOrEqual',
              value: { blackboardKey: 'rate' },
            },
            processors: [
              {
                kind: 'modifyCalculationResult',
                timing: 'afterCalculation',
                baseMultiplier: { blackboardKey: 'heal_up' },
                multiplierCount: 1,
              },
            ],
          },
        ],
      },
      'snowshine',
    );
    if (buff === null) throw new Error('expected Buff');
    const lowHealth = new HealCalculationContext('snowshine', 'ally', vitals(500), 100);

    buffs.applyHealModifiers('afterCalculation', 'healer', lowHealth);
    expect(lowHealth.value).toBeCloseTo(110);

    const highHealth = new HealCalculationContext('snowshine', 'ally', vitals(501), 100);
    buffs.applyHealModifiers('afterCalculation', 'healer', highHealth);
    expect(highHealth.value).toBe(100);

    buff.finish();
    const afterFinish = new HealCalculationContext('snowshine', 'ally', vitals(500), 100);
    buffs.applyHealModifiers('afterCalculation', 'healer', afterFinish);
    expect(afterFinish.value).toBe(100);
  });
});
