/** 验证切面复制保留修正器的归属、身份和注册顺序，回退后可按原关系移除。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { ATTRIBUTE_MODIFIER_SOURCES, createCombatAttributeState } from '../state/foundationState';
import {
  addCombatAttributeModifier,
  defineCombatAttribute,
  readCombatAttribute,
  removeCombatAttributeModifier,
} from './combatAttributeExecution';
import { attributeModifierValues } from './combatAttributes';
import { createCombatAttributeModifier } from './combatAttributeExecution';

describe('attribute state graph', () => {
  it('restores distinct equal-valued modifiers and their owner references', () => {
    const attributes = createCombatAttributeState<'attack'>();
    defineCombatAttribute(attributes, 'attack', 100, { minimum: 0 });
    const first = createCombatAttributeModifier(
      'attack',
      attributeModifierValues('addition', 10),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    const second = createCombatAttributeModifier(
      'attack',
      attributeModifierValues('addition', 10),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    addCombatAttributeModifier(attributes, first);
    addCombatAttributeModifier(attributes, first);
    addCombatAttributeModifier(attributes, second);
    const session = new StateStepper(
      { attributes, owners: [first, second] },
      (step, owner: number) => {
        const removed = removeCombatAttributeModifier(
          step.state.attributes,
          step.state.owners[owner]!,
        );
        return {
          removed,
          attack: readCombatAttribute(
            step.state.attributes,
            'attack',
            'final',
            ATTRIBUTE_MODIFIER_SOURCES.all,
          ),
        };
      },
    );
    const root = session.save();
    const copied = session.read();
    expect(copied.attributes.modifiers).toHaveLength(2);
    expect(copied.attributes.modifiers[0]).toBe(copied.owners[0]);
    expect(copied.attributes.modifiers[1]).toBe(copied.owners[1]);
    expect(copied.owners[0]).not.toBe(copied.owners[1]);
    expect(session.step(0)).toEqual({ removed: true, attack: 110 });
    const left = session.save();
    expect(session.step(0)).toEqual({ removed: false, attack: 110 });
    session.restore(root);
    expect(session.step(1)).toEqual({ removed: true, attack: 110 });
    expect(session.step(0)).toEqual({ removed: true, attack: 100 });
    session.restore(left);
    expect(session.step(1)).toEqual({ removed: true, attack: 100 });
    expect(attributes.modifiers).toEqual([first, second]);
  });
});
