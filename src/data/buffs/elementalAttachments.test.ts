import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../../core/combat/attributes/combatAttributes';
import { CombatBuffContainer } from '../../core/combat/buffs/combatBuffs';
import { compileCombatBuffDefinitions } from '../../core/combat/buffs/combatBuffDefinitions';
import { ElementalInflictionBuffAdapter } from '../../core/combat/infliction/elementalInflictionBuffAdapter';
import { resolveElementalInfliction } from '../../core/combat/infliction/elementalInfliction';
import { executeCompoundStatusFactory } from '../../core/combat/infliction/compoundStatusFactory';
import { createSkillSettingSource } from '../../core/combat/infliction/skillSettings';
import { skillSettings } from '../combat/skillSettings';
import { compoundStatusFactories } from './compoundStatusFactories';
import { elementalAttachments } from './elementalAttachments';

type Attribute =
  | 'attack'
  | 'PhysicalResistance'
  | 'FireResistance'
  | 'PulseResistance'
  | 'CrystResistance'
  | 'NaturalResistance';

function createEnemyAttributes(): CombatAttributeSet<Attribute> {
  const attributes = new CombatAttributeSet<Attribute>();
  for (const key of [
    'PhysicalResistance',
    'FireResistance',
    'PulseResistance',
    'CrystResistance',
    'NaturalResistance',
  ] as const) {
    attributes.define(key, 0, {});
  }
  return attributes;
}

describe('elementalAttachments', () => {
  it('编译真实附着定义并发布叠层变化', () => {
    const emitStarted = vi.fn();
    const onSpellBurstTriggered = vi.fn();
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: emitStarted,
      onSpellBurstTriggered,
      onAttackScaledDamageTriggered: vi.fn(),
      readAttribute: () => 0,
    });
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());

    const definition = index.getAttachment('electric');
    expect(index.getAttachmentElement(definition)).toBe('electric');
    expect(definition.stackingType).toBe('enhanceAndRefresh');
    expect(definition.maxStackCount).toBe(4);
    const buff = container.add(definition, 'operator');
    expect(buff?.remainingDuration).toBe(20);
    container.add(definition, 'operator');
    expect(emitStarted.mock.calls.map(([payload]) => payload)).toEqual([
      { element: 'electric', layers: 1 },
      { element: 'electric', layers: 2 },
    ]);

    expect(index.getCompoundStatus('nature', 'electric').id).toBe(
      'buff_common_pulse_natural_triggered',
    );
  });

  it('resolves real nature layers through the factory into an active conduct status', () => {
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: () => undefined,
      onSpellBurstTriggered: () => undefined,
      onAttackScaledDamageTriggered: () => undefined,
      readAttribute: () => 0,
    });
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());
    const settings = createSkillSettingSource(skillSettings);
    const adapter = new ElementalInflictionBuffAdapter(
      container,
      'operator',
      index,
      undefined,
      undefined,
      (consumedElement, incomingElement, input) => {
        const factory = compoundStatusFactories.factories.find(
          entry =>
            entry.consumedElement === consumedElement && entry.incomingElement === incomingElement,
        )!;
        return executeCompoundStatusFactory(factory, input, 0, settings)
          .blackboardValues as Readonly<Record<string, number>>;
      },
    );

    for (const operation of resolveElementalInfliction('nature', null)) adapter.apply(operation);
    const existing = adapter.getExistingAttachment();
    for (const operation of resolveElementalInfliction('electric', existing)) {
      adapter.apply(operation);
    }

    const conduct = container.findFirst(
      buff => buff.definition.id === 'buff_common_pulse_natural_triggered',
    );
    expect(conduct?.blackboard.getNumber('spell_resistance_decrease')).toBeCloseTo(0.12);
    expect(conduct?.blackboard.getNumber('final_spell_resistance_decrease')).toBeCloseTo(0.12);
    expect(conduct?.remainingDuration).toBe(12);
  });

  it('四种反应配方均能生成状态并发布初始异常伤害', () => {
    const emittedDamage = vi.fn();
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: () => undefined,
      onSpellBurstTriggered: () => undefined,
      onAttackScaledDamageTriggered: emittedDamage,
      readAttribute: () => 0,
    });
    const settings = createSkillSettingSource(skillSettings);

    const incomingElements = ['cryo', 'heat', 'nature', 'electric'] as const;
    for (const incomingElement of incomingElements) {
      const factory = compoundStatusFactories.factories.find(
        entry => entry.incomingElement === incomingElement,
      )!;
      const container = new CombatBuffContainer(
        `enemy.${factory.consumedElement}.${factory.incomingElement}`,
        createEnemyAttributes(),
      );
      const adapter = new ElementalInflictionBuffAdapter(
        container,
        'operator',
        index,
        undefined,
        undefined,
        (consumedElement, incomingElement, input) => {
          const matched = compoundStatusFactories.factories.find(
            entry =>
              entry.consumedElement === consumedElement &&
              entry.incomingElement === incomingElement,
          )!;
          return executeCompoundStatusFactory(matched, input, 0, settings)
            .blackboardValues as Readonly<Record<string, number>>;
        },
      );

      for (const operation of resolveElementalInfliction(factory.consumedElement, null)) {
        adapter.apply(operation);
      }
      const existing = adapter.getExistingAttachment();
      for (const operation of resolveElementalInfliction(factory.incomingElement, existing)) {
        adapter.apply(operation);
      }

      expect(
        container.findFirst(buff => buff.definition.id === factory.createdBuff.buffId),
      ).toBeDefined();
    }

    expect(emittedDamage).toHaveBeenCalledTimes(incomingElements.length);
    expect(new Set(emittedDamage.mock.calls.map(([payload]) => payload.damageType))).toEqual(
      new Set(['heat', 'electric', 'cryo', 'nature']),
    );
  });
});
