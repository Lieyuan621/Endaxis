/** 同时恢复 Buff 归属与实体属性，验证增强、移除和失败回退不会留下游离修正。 */
import { describe, expect, it } from 'vitest';
import {
  addCombatAttributeModifier,
  defineCombatAttribute,
  readCombatAttribute,
  removeCombatAttributeModifier,
} from '../attributes/combatAttributeExecution';
import { attributeModifierValues } from '../attributes/combatAttributes';
import { createCombatAttributeModifier } from '../attributes/combatAttributeExecution';
import { StateStepper } from '../runtime/stateStepper';
import { ATTRIBUTE_MODIFIER_SOURCES, createCombatAttributeState } from '../state/foundationState';
import { createBuffAttributeState, createBuffInstanceState } from '../state/instanceState';
import {
  removeBuffAttributeModifiers,
  replaceBuffAttributeModifiers,
} from './buffAttributeExecution';

const modifier = (value: number) =>
  createCombatAttributeModifier(
    'attack',
    attributeModifierValues('addition', value),
    ATTRIBUTE_MODIFIER_SOURCES.buff,
    'runtime',
  );

describe('buff attribute ownership', () => {
  it('restores ownership after enhancement and removes only the selected buff', () => {
    const attributes = createCombatAttributeState<'attack'>();
    defineCombatAttribute(attributes, 'attack', 100, { minimum: 0 });
    const instance = createBuffInstanceState<'attack'>({
      ownerId: 'owner',
      instanceId: 1,
      definitionId: 'buff',
      sourceId: 'source',
    });
    const buff = instance.attributes;
    const other = modifier(7);
    addCombatAttributeModifier(attributes, other);
    const session = new StateStepper(
      { attributes, buff, instance, other },
      (step, input: number | 'remove') => {
        const host = {
          addModifier: (value: ReturnType<typeof modifier>) =>
            addCombatAttributeModifier(step.state.attributes, value),
          removeModifier: (value: ReturnType<typeof modifier>) =>
            removeCombatAttributeModifier(step.state.attributes, value),
        };
        if (input === 'remove') removeBuffAttributeModifiers(step.state.buff, host);
        else replaceBuffAttributeModifiers(step.state.buff, true, [modifier(input)], host);
        return readCombatAttribute(
          step.state.attributes,
          'attack',
          'final',
          ATTRIBUTE_MODIFIER_SOURCES.all,
        );
      },
    );
    expect(session.step(10)).toBe(117);
    const root = session.save();
    expect(session.step(20)).toBe(127);
    const enhanced = session.save();
    session.restore(root);
    const restored = session.read();
    expect(restored.instance.attributes).toBe(restored.buff);
    expect(restored.attributes.modifiers[0]).toBe(restored.other);
    expect(restored.attributes.modifiers[1]).toBe(restored.buff.modifiers[0]);
    expect(session.step('remove')).toBe(107);
    session.restore(enhanced);
    expect(session.step('remove')).toBe(107);
    expect(session.read().attributes.modifiers).toHaveLength(1);
  });

  it('rolls back a partially registered replacement and retains old ownership', () => {
    const attributes = createCombatAttributeState<'attack' | 'missing'>();
    defineCombatAttribute(attributes, 'attack', 100, { minimum: 0 });
    const buff = createBuffAttributeState<'attack' | 'missing'>();
    const old = modifier(10);
    buff.modifiers = [old];
    addCombatAttributeModifier(attributes, old);
    const valid = modifier(20);
    const invalid = createCombatAttributeModifier(
      'missing',
      attributeModifierValues('addition', 1),
      ATTRIBUTE_MODIFIER_SOURCES.buff,
      'runtime',
    );
    expect(() =>
      replaceBuffAttributeModifiers(buff, true, [valid, invalid], {
        addModifier: value => addCombatAttributeModifier(attributes, value),
        removeModifier: value => removeCombatAttributeModifier(attributes, value),
      }),
    ).toThrow('requires explicit native bounds');
    expect(buff.modifiers).toEqual([old]);
    expect(attributes.modifiers).toEqual([old]);
    expect(attributes.modifiers[0]).toBe(buff.modifiers[0]);
  });
});
