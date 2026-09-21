import { describe, expect, it, vi } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from './combatBuffs';
import { GameplayTagRegistry } from '../tags/gameplayTags';
import {
  COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
  compileCombatBuffDefinitions,
  type CombatBuffDefinitionsDocument,
} from './combatBuffDefinitions';

type Attribute = 'attack';

const defineDocument = (input: unknown): CombatBuffDefinitionsDocument =>
  input as CombatBuffDefinitionsDocument;

function requireAddedBuff<T>(buff: T | null): T {
  if (buff === null) throw new Error('test fixture buff was unexpectedly rejected');
  return buff;
}

function createDocument(): CombatBuffDefinitionsDocument {
  return {
    schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
    revision: 'test-1',
    buffs: [
      {
        id: 'attachment.heat',
        presentation: {
          iconId: 'icon_attachment_heat',
          iconPath: '/icons/icon_attachment_heat.webp',
          visible: true,
        },
        stackingType: 'enhanceAndRefresh',
        maxStackCount: 4,
        durationSeconds: { blackboardKey: 'duration' },
        blackboard: { duration: 20 },
        role: { kind: 'elementalAttachment', element: 'heat' },
        actions: { afterEnhance: [{ kind: 'emitElementalInflictionStarted' }] },
      },
      {
        id: 'burst.heat',
        stackingType: 'unlimited',
        role: { kind: 'elementalBurst', element: 'heat' },
      },
      {
        id: 'status.heat.cryo',
        stackingType: 'unlimited',
        role: {
          kind: 'compoundStatus',
          consumedElement: 'heat',
          incomingElement: 'cryo',
        },
      },
    ],
  };
}

describe('compileCombatBuffDefinitions', () => {
  it('compiles data-only attachment roles and lifecycle actions', () => {
    const emitStarted = vi.fn();
    const index = compileCombatBuffDefinitions<Attribute>(createDocument(), {
      emitElementalInflictionStarted: emitStarted,
    });
    const definition = index.getAttachment('heat');
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());

    const first = requireAddedBuff(
      container.add(definition, 'operator', {
        blackboardValues: { duration: 12 },
      }),
    );
    expect(first.remainingDuration).toBe(12);
    expect(first.definition.presentation).toEqual({
      iconId: 'icon_attachment_heat',
      iconPath: '/icons/icon_attachment_heat.webp',
      visible: true,
    });
    expect(index.getAttachmentElement(definition)).toBe('heat');
    expect(index.getBurst('heat').id).toBe('burst.heat');
    expect(index.getCompoundStatus('heat', 'cryo').id).toBe('status.heat.cryo');
    expect(emitStarted).toHaveBeenCalledExactlyOnceWith({ element: 'heat', layers: 1 }, first);

    container.add(definition, 'operator');
    expect(emitStarted).toHaveBeenCalledTimes(2);
    expect(emitStarted).toHaveBeenCalledWith(
      { element: 'heat', layers: 2 },
      expect.objectContaining({ definition }),
    );
  });

  it('rejects duplicate semantic roles instead of choosing by insertion order', () => {
    const document = createDocument();
    expect(() =>
      compileCombatBuffDefinitions<Attribute>(
        {
          ...document,
          buffs: [
            ...document.buffs,
            {
              id: 'attachment.heat.duplicate',
              stackingType: 'unlimited',
              role: { kind: 'elementalAttachment', element: 'heat' },
            },
          ],
        },
        { emitElementalInflictionStarted: vi.fn() },
      ),
    ).toThrow("role 'elementalAttachment'");
  });

  it('rejects executable semantics whose required role is missing', () => {
    expect(() =>
      compileCombatBuffDefinitions<Attribute>(
        {
          schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
          revision: 'test-1',
          buffs: [
            {
              id: 'invalid.event-source',
              stackingType: 'unlimited',
              actions: { afterEnhance: [{ kind: 'emitElementalInflictionStarted' }] },
            },
          ],
        },
        { emitElementalInflictionStarted: vi.fn() },
      ),
    ).toThrow('without an elemental-attachment role');
  });

  it('fails explicitly when a required runtime role is absent', () => {
    const index = compileCombatBuffDefinitions<Attribute>(createDocument(), {
      emitElementalInflictionStarted: vi.fn(),
    });
    expect(() => index.getBurst('nature')).toThrow("missing elemental burst 'nature'");
  });

  it('strictly parses and compiles Buff presentation instead of dropping it', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-presentation',
      buffs: [
        {
          id: 'buff.visible',
          stackingType: 'refresh',
          presentation: {
            iconId: 'icon_buff_visible',
            visible: true,
            showInSquadIcon: true,
            orderPriority: {
              useDirectoryValue: false,
              value: 3,
              category: 'CommonCharBuff',
            },
          },
        },
      ],
    });
    const definition = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    }).get('buff.visible');

    expect(definition?.presentation).toEqual({
      iconId: 'icon_buff_visible',
      visible: true,
      showInSquadIcon: true,
      orderPriority: {
        useDirectoryValue: false,
        value: 3,
        category: 'CommonCharBuff',
      },
    });
  });

  it.each(['stack', 'highPriority'] as const)(
    'preserves dynamic priority configuration but only loads it for priority types (%s)',
    stackingType => {
      const document = defineDocument({
        schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
        revision: 'test-priority',
        buffs: [
          {
            id: 'buff.dynamic-priority',
            stackingType,
            priority: { blackboardKey: 'priority', negate: true },
            blackboard: { priority: -3 },
          },
        ],
      });
      const index = compileCombatBuffDefinitions<Attribute>(document, {
        emitElementalInflictionStarted: vi.fn(),
      });
      const definition = index.get('buff.dynamic-priority');
      if (definition === undefined) throw new Error('compiled test buff is missing');

      expect(definition.priority).toEqual({ blackboardKey: 'priority', negate: true });
      const container = new CombatBuffContainer('operator', new CombatAttributeSet<Attribute>());
      expect(requireAddedBuff(container.add(definition, 'operator')).priority).toBe(
        stackingType === 'stack' ? 0 : 3,
      );
    },
  );

  it('parses shield and sustained-protection definitions strictly', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-protection',
      buffs: [
        {
          id: 'buff.protection',
          stackingType: 'unique',
          blackboard: { shield: 1000 },
          shields: [
            {
              infinityValue: false,
              value: { blackboardKey: 'shield' },
              absorbCount: -1,
              absorbAllDamageWhenConsumed: false,
              removeBuffWhenConsumed: true,
              priority: 'normal',
              replaceHitEffect: true,
              damageAbsorptions: [{ damageType: 'heat', ratio: 0.5, scale: 2 }],
            },
          ],
          sustainedProtection: {
            target: 'owner',
            superArmor: 35,
            impactResistance: 100,
          },
        },
      ],
    });
    const definition = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    }).get('buff.protection');

    expect(definition?.shields?.[0]?.damageAbsorptions[0]).toEqual({
      damageType: 'heat',
      ratio: 0.5,
      scale: 2,
    });
    expect(definition?.sustainedProtection).toEqual({
      target: 'owner',
      superArmor: 35,
      impactResistance: 100,
    });
  });

  it('preserves raw applyTags and compiles them into queryable identities', () => {
    const path = 'Combat/Buff/Pulse/Triggered';
    const tagId = path;
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-tags',
      buffs: [{ id: 'pulse-triggered', stackingType: 'unique', applyTags: [tagId] }],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    });
    const definition = index.get('pulse-triggered');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const container = new CombatBuffContainer(
      'enemy',
      new CombatAttributeSet<Attribute>(),
      new GameplayTagRegistry([path]),
    );
    requireAddedBuff(container.add(definition, 'operator'));

    expect(container.getCountByTags(['Combat/Buff/Pulse'])).toBe(1);
  });

  it('parses and registers fixed and blackboard-backed attribute modifiers', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-attributes',
      buffs: [
        {
          id: 'buff.attack',
          stackingType: 'unique',
          blackboard: { rate: 0.25 },
          attributeModifiers: [
            { attribute: 'attack', slot: 'baseAddition', value: 20 },
            {
              attribute: 'attack',
              slot: 'baseMultiplier',
              value: { blackboardKey: 'rate' },
            },
          ],
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    });
    const definition = index.get('buff.attack');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('operator', attributes);

    container.add(definition, 'operator');

    expect(attributes.get('attack')).toBe(150);
  });

  it('parses and compiles conditional blackboard-backed damage modifiers', () => {
    const slowTagId = 'Skill/Character/Common/Affixes/Slow';
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-damage-modifier',
      buffs: [
        {
          id: 'buff.fluorite.talent-1',
          stackingType: 'unique',
          blackboard: { dmg_up: 0.2 },
          damageModifiers: [
            {
              enabledSide: 'attacker',
              condition: {
                kind: 'entityTagMatch',
                target: 'enemy',
                tagQueryType: 'hasAny',
                tags: [slowTagId],
              },
              processors: [
                {
                  kind: 'damageScale',
                  side: 'attacker',
                  zone: 'normal',
                  addition: { blackboardKey: 'dmg_up' },
                },
              ],
            },
          ],
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    });
    const definition = index.get('buff.fluorite.talent-1');
    if (definition === undefined) throw new Error('compiled test buff is missing');

    expect(definition.damageModifiers).toEqual([
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: [slowTagId],
        },
        processors: [
          {
            kind: 'damageScale',
            side: 'attacker',
            zone: 'normal',
            addition: { blackboardKey: 'dmg_up' },
          },
        ],
      },
    ]);
  });

  it('parses composite damage-event and Buff-blackboard modifier conditions', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-composite-damage-modifier',
      buffs: [
        {
          id: 'buff.last-rite.skill',
          stackingType: 'unique',
          blackboard: { potential_1: 1, atk_up: 0.2 },
          damageModifiers: [
            {
              enabledSide: 'attacker',
              condition: {
                kind: 'all',
                conditions: [
                  { kind: 'casterControlled' },
                  {
                    kind: 'eventDamageTagsMatch',
                    match: 'hasAny',
                    tags: ['normalAttackLastCombo'],
                  },
                  {
                    kind: 'buffBlackboardCompare',
                    left: { blackboardKey: 'potential_1' },
                    operator: 'equal',
                    right: 1,
                  },
                ],
              },
              processors: [
                {
                  kind: 'damageScale',
                  side: 'attacker',
                  zone: 'normal',
                  addition: { blackboardKey: 'atk_up' },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(document.buffs[0]?.damageModifiers?.[0]?.condition).toMatchObject({
      kind: 'all',
      conditions: [
        { kind: 'casterControlled' },
        { kind: 'eventDamageTagsMatch', tags: ['normalAttackLastCombo'] },
        { kind: 'buffBlackboardCompare', operator: 'equal' },
      ],
    });
  });

  it('parses a dynamic instant attribute damage processor', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-instant-damage-attribute',
      buffs: [
        {
          id: 'buff.rossi.ultimate-critical-damage',
          stackingType: 'refresh',
          blackboard: { critical_damage_up_to_bleed: 0.2 },
          damageModifiers: [
            {
              enabledSide: 'attacker',
              condition: {
                kind: 'eventDamageTagsMatch',
                match: 'hasAll',
                tags: ['ultimateSkill'],
              },
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
          ],
        },
      ],
    });

    expect(document.buffs[0]?.damageModifiers?.[0]?.processors[0]).toEqual({
      kind: 'instantAttribute',
      targetSide: 'attacker',
      attribute: 'criticalDamageIncrease',
      values: {
        slot: 'baseAddition',
        value: { blackboardKey: 'critical_damage_up_to_bleed' },
      },
      attributeTiming: 'runtime',
    });
  });

  it('refreshes registered attribute modifiers from the current buff blackboard on trigger', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-refresh-attribute-modifiers',
      buffs: [
        {
          id: 'status.nature.heat',
          stackingType: 'unique',
          triggerIntervalSeconds: 1,
          waitFirstTriggerInterval: true,
          maxTriggerCount: -1,
          blackboard: { attackRate: 0.1 },
          attributeModifiers: [
            {
              attribute: 'attack',
              slot: 'baseMultiplier',
              value: { blackboardKey: 'attackRate' },
            },
          ],
          actions: {
            trigger: [{ kind: 'refreshAttributeModifierValues' }],
          },
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    });
    const definition = index.get('status.nature.heat');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('enemy', attributes);
    const buff = requireAddedBuff(container.add(definition, 'operator'));

    expect(attributes.get('attack')).toBeCloseTo(110);
    buff.blackboard.assignDynamic('attackRate', 0.5);
    expect(attributes.get('attack')).toBeCloseTo(110);

    container.tick(1);

    expect(attributes.get('attack')).toBeCloseTo(150);
  });

  it('executes direct blackboard assignment and addition before refreshing modifiers', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-modify-blackboard',
      buffs: [
        {
          id: 'status.nature.heat',
          stackingType: 'unique',
          blackboard: { startRate: 0.2, attackRate: 0 },
          attributeModifiers: [
            {
              attribute: 'attack',
              slot: 'baseMultiplier',
              value: { blackboardKey: 'attackRate' },
            },
          ],
          actions: {
            start: [
              {
                kind: 'modifyBlackboard',
                operation: 'assign',
                targetKey: 'attackRate',
                value: { blackboardKey: 'startRate' },
              },
              {
                kind: 'modifyBlackboard',
                operation: 'add',
                targetKey: 'attackRate',
                value: 0.3,
              },
              { kind: 'refreshAttributeModifierValues' },
            ],
          },
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    });
    const definition = index.get('status.nature.heat');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('enemy', attributes);
    const buff = requireAddedBuff(container.add(definition, 'operator'));

    expect(buff.blackboard.getNumber('attackRate')).toBeCloseTo(0.5);
    expect(attributes.get('attack')).toBeCloseTo(150);
  });

  it('treats a missing direct blackboard addition target as zero', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-add-missing-blackboard-target',
      buffs: [
        {
          id: 'status.direct-add',
          stackingType: 'unique',
          actions: {
            start: [
              {
                kind: 'modifyBlackboard',
                operation: 'add',
                targetKey: 'tick',
                value: 1,
              },
            ],
          },
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    });
    const definition = index.get('status.direct-add');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());

    const buff = requireAddedBuff(container.add(definition, 'operator'));

    expect(buff.blackboard.getNumber('tick')).toBe(1);
  });

  it('clamps a dynamic blackboard value against blackboard-backed bounds', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-clamp-blackboard',
      buffs: [
        {
          id: 'status.corrosion',
          stackingType: 'unique',
          blackboard: { def_decrease: -0.14, def_decrease_tick: -0.01, max_def_decrease: -0.15 },
          actions: {
            start: [
              {
                kind: 'modifyBlackboard',
                operation: 'add',
                targetKey: 'def_decrease',
                value: { blackboardKey: 'def_decrease_tick' },
              },
              {
                kind: 'clampBlackboard',
                targetKey: 'def_decrease',
                minimum: { blackboardKey: 'max_def_decrease' },
              },
            ],
          },
        },
      ],
    });
    const definition = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
    }).get('status.corrosion');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());

    const exact = requireAddedBuff(container.add(definition, 'operator'));
    expect(exact.blackboard.getNumber('def_decrease')).toBeCloseTo(-0.15);

    container.finishByIds(['status.corrosion'], 'other');
    const overshot = requireAddedBuff(
      container.add(definition, 'operator', {
        blackboardValues: { def_decrease_tick: -0.02 },
      }),
    );
    expect(overshot.blackboard.getNumber('def_decrease')).toBeCloseTo(-0.15);
  });

  it('stores a non-converted attribute value and immediately refreshes blackboard modifiers', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-store-attribute-value',
      buffs: [
        {
          id: 'status.store-attribute',
          stackingType: 'unique',
          blackboard: { coefficient: 0.5, result: 0 },
          attributeModifiers: [
            {
              attribute: 'attack',
              slot: 'finalAddition',
              value: { blackboardKey: 'result' },
            },
          ],
          actions: {
            start: [
              {
                kind: 'storeAttributeValue',
                target: 'source',
                attribute: { kind: 'specific', key: 'crystAbnormalDamageIncrease' },
                stage: 'finalNonConverted',
                useFloor: false,
                // 原生非取整分支不会读取 divisor，用缺失键固定这条边界。
                divisor: { blackboardKey: 'unusedDivisor' },
                multiplier: { blackboardKey: 'coefficient' },
                base: 2,
                targetKey: 'result',
              },
            ],
          },
        },
      ],
    });
    const readAttribute = vi.fn(() => 20);
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
      readAttribute,
    });
    const definition = index.get('status.store-attribute');
    if (definition === undefined) throw new Error('compiled test buff is missing');
    const attributes = new CombatAttributeSet<Attribute>();
    attributes.define('attack', 100, { minimum: 0, maximum: 1000 });
    const container = new CombatBuffContainer('enemy', attributes);

    const buff = requireAddedBuff(container.add(definition, 'operator'));

    expect(readAttribute).toHaveBeenCalledWith(
      {
        target: 'source',
        attribute: { kind: 'specific', key: 'crystAbnormalDamageIncrease' },
        stage: 'finalNonConverted',
      },
      buff,
    );
    expect(buff.blackboard.getNumber('result')).toBe(12);
    expect(attributes.get('attack')).toBe(112);
  });

  it('floors after division and before multiplying when StoreAttributeValue requests it', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-store-floored-attribute-value',
      buffs: [
        {
          id: 'status.store-floored-attribute',
          stackingType: 'unique',
          blackboard: { divisor: 4, multiplier: 3, base: 1 },
          actions: {
            start: [
              {
                kind: 'storeAttributeValue',
                target: 'source',
                attribute: { kind: 'all' },
                stage: 'armedNonConverted',
                useFloor: true,
                divisor: { blackboardKey: 'divisor' },
                multiplier: { blackboardKey: 'multiplier' },
                base: { blackboardKey: 'base' },
                targetKey: 'result',
              },
            ],
          },
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
      readAttribute: () => 11,
    });
    const definition = index.get('status.store-floored-attribute');
    if (definition === undefined) throw new Error('compiled test buff is missing');

    const buff = requireAddedBuff(
      new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>()).add(
        definition,
        'operator',
      ),
    );

    expect(buff.blackboard.getNumber('result')).toBe(7);
  });

  it('fails during index compilation when StoreAttributeValue lacks its runtime port', () => {
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-missing-store-attribute-port',
      buffs: [
        {
          id: 'status.missing-port',
          stackingType: 'unique',
          actions: {
            start: [
              {
                kind: 'storeAttributeValue',
                target: 'source',
                attribute: { kind: 'main' },
                stage: 'finalNonConverted',
                useFloor: false,
                divisor: 1,
                multiplier: 1,
                base: 0,
                targetKey: 'result',
              },
            ],
          },
        },
      ],
    });

    expect(() =>
      compileCombatBuffDefinitions<Attribute>(document, {
        emitElementalInflictionStarted: vi.fn(),
      }),
    ).toThrow("buff 'status.missing-port' stores an attribute value without a readAttribute port");
  });

  it('resolves attack-scaled Buff damage from the instance blackboard', () => {
    const onDamage = vi.fn();
    const document = defineDocument({
      schemaVersion: COMBAT_BUFF_DEFINITIONS_SCHEMA_VERSION,
      revision: 'test-buff-damage',
      buffs: [
        {
          id: 'status.damage',
          stackingType: 'unlimited',
          blackboard: { atk_scale: 0 },
          actions: {
            start: [
              {
                kind: 'dealAttackScaledDamage',
                damageType: 'nature',
                attackScale: { blackboardKey: 'atk_scale' },
                tags: ['natureAbnormal'],
                features: [],
                canCritical: true,
              },
            ],
          },
        },
      ],
    });
    const index = compileCombatBuffDefinitions<Attribute>(document, {
      emitElementalInflictionStarted: vi.fn(),
      onAttackScaledDamageTriggered: onDamage,
    });
    const definition = index.get('status.damage');
    if (definition === undefined) throw new Error('compiled test buff is missing');

    const container = new CombatBuffContainer('enemy', new CombatAttributeSet<Attribute>());
    const first = container.add(definition, 'operator', {
      blackboardValues: { atk_scale: 1.75 },
      sourceActionId: 'cast:first',
    });
    if (first === null) throw new Error('first test buff was not added');

    expect(onDamage).toHaveBeenCalledWith({
      damageType: 'nature',
      attackScale: 1.75,
      tags: ['natureAbnormal'],
      features: [],
      canCritical: true,
      sourceId: 'operator',
      buffId: 'status.damage',
      buffInstanceId: first.instanceId,
      buffOwnerId: 'enemy',
      sourceActionId: 'cast:first',
    });
    const second = container.add(definition, 'operator', {
      blackboardValues: { atk_scale: 2 },
      sourceActionId: 'cast:second',
    });
    if (second === null) throw new Error('second test buff was not added');
    expect(second.instanceId).not.toBe(first.instanceId);
    expect(onDamage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        buffInstanceId: second.instanceId,
        buffOwnerId: 'enemy',
        sourceActionId: 'cast:second',
        attackScale: 2,
      }),
    );
    const ally = new CombatBuffContainer('ally', new CombatAttributeSet<Attribute>()).add(
      definition,
      'operator',
      { blackboardValues: { atk_scale: 3 } },
    );
    if (ally === null) throw new Error('ally test buff was not added');
    expect(onDamage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        buffInstanceId: ally.instanceId,
        buffOwnerId: 'ally',
        buffId: 'status.damage',
        sourceActionId: 'status.damage',
        attackScale: 3,
      }),
    );
  });
});
