import { chainEntry } from '../../../test/compiledGraphEntry';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { createModifierConditionRuntime } from '../actions/modifierConditionRuntime';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import { OperatorControlConditionExecutor } from '../skills/operatorControlConditionExecutor';
import type { PoiseModifierConditionInput } from './poiseModifiers';
import { describe, expect, it } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { PoiseCalculationContext } from './poiseModifiers';

describe('poise modifiers', () => {
  it('失衡条件同时检查主控、技能标签和伤害特征，结束后不再生效', () => {
    let controlled = true;
    const buffs = new CombatBuffContainer('operator', new CombatAttributeSet());
    const buff = buffs.add(
      {
        id: 'buff.weapon.normal-last-poise-up',
        stackingType: 'unique',
        blackboard: { poise_up: 0.3 },
        poiseModifiers: [
          {
            enabledSide: 'attacker',
            createCondition: (buff, state) =>
              createModifierConditionRuntime<PoiseModifierConditionInput>(
                chainEntry(
                  'poise-normal-last',
                  [
                    {
                      kind: 'conditional',
                      parameters: { condition: { kind: 'conditionNode', nodeId: 'controlled' } },
                      whenTrue: { $sequence: null },
                    },
                    {
                      kind: 'conditional',
                      parameters: { condition: { kind: 'conditionNode', nodeId: 'tag' } },
                      whenTrue: { $sequence: null },
                    },
                    {
                      kind: 'conditional',
                      parameters: { condition: { kind: 'conditionNode', nodeId: 'feature' } },
                      whenTrue: { $sequence: null },
                    },
                  ],
                  {
                    controlled: { type: 'boolean', expression: { kind: 'casterControlled' } },
                    feature: {
                      type: 'boolean',
                      expression: {
                        kind: 'eventDamageFeaturesMatch',
                        match: 'hasAny',
                        features: ['talentDamage'],
                      },
                    },
                    tag: {
                      type: 'boolean',
                      expression: {
                        kind: 'eventDamageTagsMatch',
                        match: 'hasAll',
                        tags: ['normalAttackLastCombo'],
                      },
                    },
                  },
                ),
                new CombatActionSequenceRuntime(
                  new OperatorControlConditionExecutor({
                    isCasterControlled: () => controlled,
                    delegate: new EventContextConditionExecutor({
                      execute: () => true,
                      evaluate: () => {
                        throw new Error('unexpected condition');
                      },
                    }),
                  }),
                  { blackboard: buff.blackboard },
                ),
                input => ({ context: { kind: 'poise', input }, target: { kind: 'enemy' } }),
                state,
              ),
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
      ['talentDamage'],
      1,
      1,
    );
    const uncontrolled = new PoiseCalculationContext(
      'operator',
      'enemy',
      ['normalAttackLastCombo'],
      ['talentDamage'],
      1,
      1,
    );

    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', matching);
    controlled = false;
    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', uncontrolled);

    expect(matching.outputMultiplier).toBeCloseTo(1.3);
    expect(uncontrolled.outputMultiplier).toBe(1);

    controlled = true;
    const noFeature = new PoiseCalculationContext(
      'operator',
      'enemy',
      ['normalAttackLastCombo'],
      [],
      1,
      1,
    );
    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', noFeature);
    expect(noFeature.outputMultiplier).toBe(1);
    buff.finish();
    const afterFinish = new PoiseCalculationContext(
      'operator',
      'enemy',
      ['normalAttackLastCombo'],
      ['talentDamage'],
      1,
      1,
    );
    buffs.applyPoiseModifiers('beforeCalculation', 'attacker', afterFinish);
    expect(afterFinish.outputMultiplier).toBe(1);
  });
});
