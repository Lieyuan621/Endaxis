import { describe, expect, it } from 'vitest';
import {
  validateGearDefinition,
  validateGearSetDefinition,
  validateWeaponDefinition,
} from './equipmentDefinitionValidation';

describe('equipmentDefinitionValidation', () => {
  it('校验武器词条图与同级 Buff 图，拒绝悬空引用和词条持有 Buff', () => {
    const weapon = {
      slug: 'graph-weapon',
      rarity: 6,
      weaponType: 'sword',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        {
          key: 'passive',
          levelCount: 1,
          initializationSequence: { $sequence: 'apply' },
          actionGraph: {
            main: {
              nodes: {
                apply: {
                  action: { kind: 'applyBuff', parameters: { buffId: 'owned', target: 'caster' } },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
      ],
      buffDefinitions: {
        owned: {
          stackingType: 'unique',
          lifecycleSequences: { start: { $sequence: 'start' } },
          actionGraph: {
            main: {
              nodes: { start: { action: { kind: 'finishTimeline', parameters: {} }, next: null } },
            },
            macros: {},
          },
        },
      },
    };
    const broken = structuredClone(weapon);
    broken.buffDefinitions.owned.lifecycleSequences.start.$sequence = 'missing';
    expect(
      validateWeaponDefinition(broken).some(issue =>
        issue.message.includes('missing action graph node'),
      ),
    ).toBe(true);
    expect(
      validateWeaponDefinition({
        ...weapon,
        traits: [{ ...weapon.traits[0], buffDefinitions: weapon.buffDefinitions }],
      }).some(issue => issue.path.endsWith('.traits[0].buffDefinitions')),
    ).toBe(true);
    const missingGraph = {
      ...weapon,
      traits: [{ key: 'passive', levelCount: 1, initializationSequence: { $sequence: 'apply' } }],
    };
    expect(validateWeaponDefinition(missingGraph)).not.toEqual([]);
  });

  // 生产缺陷最小重现（2026-09-26 记录，保留失败）：validateBuffDefinition 未剥离
  // actionGraph 再交给 parseCombatBuffDefinitionEntry，合同允许的可执行 Buff 被
  // "unknown property 'actionGraph'" 拒绝；71 件真实生成武器均命中。位置：
  // src/core/game-data/validation/buffApplication.ts（validateBuffDefinition 解构清单）。
  it('接受持有自己图的可执行 Buff（当前因校验层未识别 actionGraph 而失败）', () => {
    expect(
      validateWeaponDefinition({
        slug: 'graph-weapon',
        rarity: 6,
        weaponType: 'sword',
        baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
        traits: [],
        buffDefinitions: {
          owned: {
            stackingType: 'unique',
            lifecycleSequences: { start: { $sequence: 'start' } },
            actionGraph: {
              main: {
                nodes: {
                  start: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
                },
              },
              macros: {},
            },
          },
        },
      }),
    ).toEqual([]);
  });
  it.each(['enableSequence', 'initializationSequence'] as const)(
    '用公共动作校验 %s 而非忽略损坏的程序',
    field => {
      expect(
        validateGearSetDefinition({
          slug: 'fixture',
          [field]: { $sequence: null },
          actionGraph: { main: { nodes: {} }, macros: {} },
        }),
      ).toEqual([]);
      // 旧树形态 { steps } 在当前协议下是损坏的入口引用，必须被拒绝。
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
            sequence: { $sequence: null },
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
                sequence: { $sequence: 'entry' },
              },
            ],
            actionGraph: {
              main: {
                nodes: {
                  entry: {
                    action: {
                      kind: 'changeResource',
                      parameters: { resource: 'sp', amount: 1, recipient: 'team' },
                    },
                    next: null,
                  },
                },
              },
              macros: {},
            },
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
        initializationSequence: { $sequence: 'entry' },
        actionGraph: {
          main: {
            nodes: {
              entry: {
                action: {
                  kind: 'applyBuff',
                  parameters: { buffId: 'buff.fixture-set', target: 'caster' },
                },
                next: null,
              },
            },
          },
          macros: {},
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

  it('rejects executable programs on static gear and gear traits', () => {
    const issues = validateGearDefinition({
      slug: 'fixture-gear',
      slotType: 'armor',
      levelRequirement: 1,
      baseDefense: 1,
      actionGraph: { nodes: {} },
      traits: [
        {
          key: 'attribute-1',
          levelCount: 1,
          display: {
            kind: 'modifier',
            modifier: { kind: 'panelStat', stat: 'attackFlat', value: 1 },
          },
          initializationSequence: { $sequence: null },
        },
      ],
    });
    expect(issues).toContainEqual({
      path: '$.actionGraph',
      message: 'gear does not own an action graph',
    });
    expect(issues).toContainEqual({
      path: '$.traits[0].initializationSequence',
      message: 'gear traits only contain static modifiers',
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
          sequence: { $sequence: 'invalid-event-action' },
        },
      ],
      buffDefinitions: { 'buff.invalid': { stackingType: 'not-a-stacking-type' } },
      initializationSequence: { $sequence: 'invalid-init-action' },
      actionGraph: {
        main: {
          nodes: {
            'invalid-event-action': { action: { kind: 'unknown-step' }, next: null },
            'invalid-init-action': { action: { kind: 'unknown-step' }, next: null },
          },
        },
        macros: {},
      },
    });

    expect(issues.some(issue => issue.path === '$.eventHandlers[0].event.kind')).toBe(true);
    expect(issues.some(issue => issue.path === '$.eventHandlers[0].condition.kind')).toBe(true);
    expect(
      issues.some(
        issue => issue.path.includes('invalid-event-action') && issue.path.endsWith('.kind'),
      ),
    ).toBe(true);
    expect(issues.some(issue => issue.path.includes('$.buffDefinitions.buff.invalid'))).toBe(true);
    expect(
      issues.some(
        issue => issue.path.includes('invalid-init-action') && issue.path.endsWith('.kind'),
      ),
    ).toBe(true);
  });

  it('rejects duplicate event handler identities within one contribution', () => {
    const event = { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' };
    const sequence = { $sequence: null };
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
