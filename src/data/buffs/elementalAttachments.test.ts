import { ActionBlackboard } from '../../core/combat/actions/actionBlackboard';
import { EventContextConditionExecutor } from '../../core/combat/events/eventContextConditionExecutor';
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
      resolveConditionOperations: () =>
        new EventContextConditionExecutor({
          execute: () => {
            throw new Error('unexpected action');
          },
          evaluate: () => {
            throw new Error('unexpected condition');
          },
        }),
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
      resolveConditionOperations: () =>
        new EventContextConditionExecutor({
          execute: () => {
            throw new Error('unexpected action');
          },
          evaluate: () => {
            throw new Error('unexpected condition');
          },
        }),
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
    if (!conduct) throw new Error('missing conduct Buff');
    const input = {
      side: 'defender' as const,
      sourceId: 'operator',
      targetId: 'enemy',
      skillCastId: null,
      damageType: 'electric' as const,
      tags: [],
      features: [],
    };
    const results = (buff: typeof conduct) =>
      buff.damageModifiers.map(modifier => modifier.condition!.execute(input));
    expect(results(conduct)).toEqual([false, true, false, false]);
    const saved = structuredClone(container.runtimeState);
    const restored = new CombatBuffContainer<Attribute>(
      'enemy',
      new CombatAttributeSet(saved.attributes),
      undefined,
      null,
      ActionBlackboard.bindRuntimeState(saved.entityBlackboard),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      saved,
    );
    restored.bindRestoredInstances(state => index.get(state.identity.definitionId));
    const restoredConduct = restored.getInstance(conduct.instanceId)!;
    expect(results(restoredConduct)).toEqual(results(conduct));
    expect(restoredConduct.blackboard.getNumber('final_spell_resistance_decrease')).toBeCloseTo(
      0.12,
    );
    expect(
      restoredConduct.damageModifiers.every(
        modifier => !modifier.condition!.execute({ ...input, damageType: 'physical' }),
      ),
    ).toBe(true);
  });

  it('四种反应配方均能生成状态并发布初始异常伤害', () => {
    const emittedDamage = vi.fn();
    const index = compileCombatBuffDefinitions<Attribute>(elementalAttachments, {
      resolveConditionOperations: () =>
        new EventContextConditionExecutor({
          execute: () => {
            throw new Error('unexpected action');
          },
          evaluate: () => {
            throw new Error('unexpected condition');
          },
        }),
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
