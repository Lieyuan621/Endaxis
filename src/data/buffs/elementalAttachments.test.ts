import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../../core/combat/attributes/combatAttributes';
import { CombatBuffContainer } from '../../core/combat/buffs/combatBuffs';
import { compileCombatBuffDefinitions } from '../../core/combat/buffs/combatBuffDefinitions';
import { INFLICTION_ELEMENTS } from '../../core/game-data/operatorDefinition';
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
  it('固化四种附着与同元素爆发的身份和时序', () => {
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: () => undefined,
      onSpellBurstTriggered: () => undefined,
      onAttackScaledDamageTriggered: () => undefined,
      readAttribute: () => 0,
    });
    const expected = {
      heat: {
        attachmentId: 'buff_common_energy_shard_attached_fire',
        burstId: 'buff_common_fire_fire_triggered',
        burstType: 'Fire',
        burstDuration: 5,
      },
      electric: {
        attachmentId: 'buff_common_energy_shard_attached_pulse',
        burstId: 'buff_common_pulse_pulse_triggered',
        burstType: 'Pulse',
        burstDuration: 10,
      },
      cryo: {
        attachmentId: 'buff_common_energy_shard_attached_cryst',
        burstId: 'buff_common_cryst_cryst_triggered',
        burstType: 'Cryst',
        burstDuration: 5,
      },
      nature: {
        attachmentId: 'buff_common_energy_shard_attached_natural',
        burstId: 'buff_common_natural_natural_triggered',
        burstType: 'Natural',
        burstDuration: 5,
      },
    } as const;

    for (const element of INFLICTION_ELEMENTS) {
      const rule = expected[element];
      expect(index.getAttachment(element)).toMatchObject({
        id: rule.attachmentId,
        durationSeconds: { blackboardKey: 'duration' },
        maxStackCount: 4,
      });
      expect(index.getBurst(element)).toMatchObject({
        id: rule.burstId,
        durationSeconds: rule.burstDuration,
        triggerIntervalSeconds: 1,
        waitFirstTriggerInterval: true,
        maxTriggerCount: 1,
      });
      expect(index.getSpellBurst(rule.burstType)).toMatchObject({
        burstType: rule.burstType,
        damageType: element,
        skillSettingDataKey: '法术爆发伤害倍率',
        skillSettingColumn: 1,
        atkScaleBase: 50,
      });
    }
  });

  it('compiles all four attachment roles through the typed definition boundary', () => {
    const emitStarted = vi.fn();
    const onSpellBurstTriggered = vi.fn();
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: emitStarted,
      onSpellBurstTriggered,
      onAttackScaledDamageTriggered: vi.fn(),
      readAttribute: () => 0,
    });
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());

    for (const element of INFLICTION_ELEMENTS) {
      const definition = index.getAttachment(element);
      expect(index.getAttachmentElement(definition)).toBe(element);
      expect(definition.stackingType).toBe('enhanceAndRefresh');
      expect(definition.maxStackCount).toBe(4);
      const buff = container.add(definition, 'operator');
      expect(buff?.remainingDuration).toBe(20);
      container.add(definition, 'operator');
    }

    expect(emitStarted.mock.calls.map(([payload]) => payload)).toEqual(
      INFLICTION_ELEMENTS.map(element => ({ element, layers: 2 })),
    );

    expect(index.getCompoundStatus('nature', 'electric').id).toBe(
      'buff_common_pulse_natural_triggered',
    );
    for (const factory of compoundStatusFactories.factories) {
      expect(index.getCompoundStatus(factory.consumedElement, factory.incomingElement).id).toBe(
        factory.createdBuff.buffId,
      );
    }
  });

  it('preserves the native attached-head-bar presentation for every elemental attachment', () => {
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: () => undefined,
      onSpellBurstTriggered: () => undefined,
      onAttackScaledDamageTriggered: () => undefined,
      readAttribute: () => 0,
    });
    const expectedIcons = {
      heat: 'icon_energy_fusion_fire',
      electric: 'icon_energy_fusion_pulse',
      cryo: 'icon_energy_fusion_cryst',
      nature: 'icon_infliction_nature',
    } as const;

    for (const element of INFLICTION_ELEMENTS) {
      expect(index.getAttachment(element).presentation).toMatchObject({
        visible: true,
        iconId: expectedIcons[element],
        showInHeadBarCommon: false,
        showInHeadBarAttached: true,
        iconStyleInSquad: 'Default',
        orderPriority: {
          useDirectoryValue: false,
          value: 0,
          category: 'CommonCharBuff',
        },
      });
    }
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

  it('creates every ordered compound status and publishes its initial abnormal damage', () => {
    const emittedDamage = vi.fn();
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      emitElementalInflictionStarted: () => undefined,
      onSpellBurstTriggered: () => undefined,
      onAttackScaledDamageTriggered: emittedDamage,
      readAttribute: () => 0,
    });
    const settings = createSkillSettingSource(skillSettings);

    for (const factory of compoundStatusFactories.factories) {
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

    expect(emittedDamage).toHaveBeenCalledTimes(12);
    expect(new Set(emittedDamage.mock.calls.map(([payload]) => payload.damageType))).toEqual(
      new Set(['heat', 'electric', 'cryo', 'nature']),
    );
  });
});
