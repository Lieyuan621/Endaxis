import { describe, expect, it } from 'vitest';
import {
  validateGearDefinition,
  validateGearSetDefinition,
  validateWeaponDefinition,
} from './equipmentDefinitionValidation';

describe('equipmentDefinitionValidation', () => {
  it.each(['enableSequence', 'initializationSequence'] as const)(
    '用公共动作校验 %s 而非忽略损坏的程序',
    field => {
      expect(validateGearSetDefinition({ slug: 'fixture', [field]: { steps: [] } })).toEqual([]);
      expect(
        validateGearSetDefinition({
          slug: 'fixture',
          [field]: { steps: [{ kind: 'not-an-action' }] },
        }),
      ).not.toEqual([]);
    },
  );
  it('rejects obsolete initialization and handler blackboards instead of silently losing values', () => {
    expect(validateGearSetDefinition({ slug: 'fixture', blackboard: { value: 1 } })).toEqual([]);
    expect(
      validateGearSetDefinition({ slug: 'fixture', initializationBlackboard: { value: 1 } }),
    ).not.toEqual([]);
    expect(
      validateGearSetDefinition({
        slug: 'fixture',
        eventHandlers: [
          {
            key: 'a',
            abilityEvent: 'enterFight',
            blackboard: { value: 1 },
            sequence: { steps: [] },
          },
        ],
      }),
    ).not.toEqual([]);
  });

  it('accepts valid static and event-driven equipment definitions', () => {
    expect(
      validateWeaponDefinition({
        slug: 'fixture-weapon',
        rarity: 6,
        weaponType: 'arts-unit',
        baseAttackAtLevelNodes: [10, 20, 30, 40, 50, 60],
        traits: [
          {
            key: 'attribute',
            levelCount: 3,
            modifiers: [
              { kind: 'attribute', attribute: 'main', operation: 'flat', value: [10, 20, 30] },
            ],
          },
          {
            key: 'event',
            levelCount: 1,
            eventHandlers: [
              {
                key: 'on-hit',
                event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
                condition: { kind: 'combatActive' },
                sequence: {
                  steps: [
                    {
                      kind: 'changeResource',
                      parameters: { resource: 'sp', amount: 1, recipient: 'team' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toEqual([]);

    expect(
      validateGearDefinition({
        slug: 'fixture-gear',
        slotType: 'armor',
        levelRequirement: 70,
        baseDefense: 100,
        gearSetSlug: 'fixture-set',
        traits: [
          {
            key: 'damage',
            levelCount: 4,
            display: {
              kind: 'composite',
              composite: 'heatAndNatureDamageIncrease',
              value: [0.1, 0.2, 0.3, 0.4],
            },
            modifiers: [
              {
                kind: 'damageBonus',
                damageTypes: ['heat', 'nature'],
                skillTypes: 'battleSkill',
                value: [0.1, 0.2, 0.3, 0.4],
              },
              {
                kind: 'damageScale',
                target: 'staggeredEnemy',
                value: [0.1, 0.2, 0.3, 0.4],
              },
            ],
          },
        ],
      }),
    ).toEqual([]);

    expect(
      validateGearSetDefinition({
        slug: 'fixture-set',
        modifiers: [{ kind: 'panelStat', stat: 'attackPercent', value: 0.1 }],
        buffDefinitions: { 'buff.fixture-set': { stackingType: 'unique' } },
        initializationSequence: {
          steps: [
            { kind: 'applyBuff', parameters: { buffId: 'buff.fixture-set', target: 'caster' } },
          ],
        },
      }),
    ).toEqual([]);
  });

  it('rejects duplicate trait identities and incomplete level values', () => {
    const issues = validateWeaponDefinition({
      slug: 'fixture-weapon',
      rarity: 6,
      weaponType: 'arts-unit',
      baseAttackAtLevelNodes: [10, 20, 30, 40, 50, 60],
      traits: [
        {
          key: 'duplicate',
          levelCount: 3,
          modifiers: [{ kind: 'attribute', attribute: 'main', operation: 'flat', value: [10, 20] }],
        },
        { key: 'duplicate', levelCount: 1 },
      ],
    });

    expect(issues).toContainEqual({
      path: '$.traits[0].modifiers[0].value',
      message: 'expected 3 level values',
    });
    expect(issues).toContainEqual({
      path: '$.traits[1].key',
      message: "duplicate trait key 'duplicate'",
    });
  });

  it('requires every gear trait to carry its native display definition', () => {
    const issues = validateGearDefinition({
      slug: 'fixture-gear',
      slotType: 'armor',
      levelRequirement: 1,
      baseDefense: 1,
      traits: [{ key: 'attribute-1', levelCount: 4, modifiers: [] }],
    });
    expect(issues).toContainEqual({
      path: '$.traits[0].display',
      message: 'expected an object',
    });
  });

  it('reports invalid nested event, condition and action sequence fields', () => {
    const issues = validateGearSetDefinition({
      slug: 'fixture-set',
      eventHandlers: [
        {
          key: 'invalid-handler',
          event: { kind: 'unknown-event' },
          condition: { kind: 'unknown-condition' },
          sequence: { steps: [{ kind: 'unknown-step' }] },
        },
      ],
      buffDefinitions: { 'buff.invalid': { stackingType: 'not-a-stacking-type' } },
      initializationSequence: { steps: [{ kind: 'unknown-step' }] },
    });

    expect(issues.some(issue => issue.path === '$.eventHandlers[0].event.kind')).toBe(true);
    expect(issues.some(issue => issue.path === '$.eventHandlers[0].condition.kind')).toBe(true);
    expect(issues.some(issue => issue.path === '$.eventHandlers[0].sequence.steps[0].kind')).toBe(
      true,
    );
    expect(issues.some(issue => issue.path.includes('$.buffDefinitions.buff.invalid'))).toBe(true);
    expect(issues.some(issue => issue.path === '$.initializationSequence.steps[0].kind')).toBe(
      true,
    );
  });

  it('rejects duplicate event handler identities within one contribution', () => {
    const event = { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' };
    const sequence = { steps: [] };
    const issues = validateGearSetDefinition({
      slug: 'fixture-set',
      eventHandlers: [
        { key: 'duplicate', event, sequence },
        { key: 'duplicate', event, sequence },
      ],
    });

    expect(issues).toContainEqual({
      path: '$.eventHandlers[1].key',
      message: "duplicate event handler key 'duplicate'",
    });
  });
});
