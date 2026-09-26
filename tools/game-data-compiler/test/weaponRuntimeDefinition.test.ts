import { equipmentFixture } from './sourceFixtures.ts';
import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';

import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import type { WeaponDefinition } from '../../../packages/game-data-contract/src/equipment.ts';
import { ActionGraphDefinitionRepository } from '../../../src/core/compiler/actionGraphDefinitionRepository.ts';
import { compileWeaponContributions } from '../../../src/core/compiler/compileEquipment.ts';
import { rootActionSteps } from '../../../src/core/compiler/actionProgramInspection.ts';
import {
  attachWeaponProductIdentities,
  compileWeaponRuntimeDefinitionBatchSource,
  renderWeaponDefinitionFiles,
  type CompiledWeaponStaticDefinitionSource,
  type CompiledWeaponTraitRuntimeDependencySource,
} from '../src/index.ts';

const itemFixture = equipmentFixture() as { readonly itemTableEntry: Record<string, unknown> };

const definition: CompiledWeaponStaticDefinitionSource = {
  slug: 'wpn_test_0001',
  rarity: 5,
  weaponType: 'sword',
  baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
  traits: [{ key: 'skill1', levelCount: 2, modifiers: [] }],
};

const dependency: CompiledWeaponTraitRuntimeDependencySource = {
  weaponId: definition.slug,
  traitKey: 'skill1',
  slotIndex: 0,
  skillId: 'sk_wpn_test_0001',
  actionGraph: {
    skillId: 'sk_wpn_test_0001',
    level: 1,
    durationFrame: 0,
    declaredBlackboard: [],
    actionGroup: { timelineActions: [], passiveEvents: [] },
  },
  request: {
    originKind: 'weapon',
    originId: definition.slug,
    sourcePath: `WeaponBasicTable.${definition.slug}`,
    skillId: 'sk_wpn_test_0001',
    levelSource: {
      kind: 'weaponProgression',
      slotIndex: 0,
      breakthroughTemplateId: 'fixture',
      talentTemplateId: 'fixture',
    },
    inputBlackboard: {},
  },
  levels: [1, 2],
  blackboard: {},
  startupBuffs: [],
  toggleBuffs: [],
  referencedBuffIds: [],
};

describe('weapon runtime definitions', () => {
  it('事件引用的 Buff 缺失时必须阻断，即使没有启动或 Toggle 安装', () => {
    expect(() =>
      compileWeaponRuntimeDefinitionBatchSource(
        [definition],
        [
          {
            ...dependency,
            referencedBuffIds: ['buff_only_created_by_event'],
          },
        ],
        {},
        fixtureGameplayTagRegistry,
      ),
    ).toThrow('BuffData: missing Buff definition "buff_only_created_by_event"');
  });
  it('attaches language-neutral ItemTable identity without generating a display name', () => {
    const item = {
      ...itemFixture.itemTableEntry,
      id: definition.slug,
      iconId: 'wpn_sword_test',
      rarity: definition.rarity,
    };

    expect(attachWeaponProductIdentities([definition], { [definition.slug]: item })).toEqual([
      {
        ...definition,
        assetSlug: 'wpn_sword_test',
        iconPath: '/weapons/sword/wpn_sword_test.webp',
      },
    ]);
  });

  it('projects native weapon icon prefixes through the shared product asset convention', () => {
    const native = { ...definition, slug: 'wpn_claym_0003', weaponType: 'greatsword' as const };
    const item = {
      ...itemFixture.itemTableEntry,
      id: native.slug,
      iconId: native.slug,
      rarity: native.rarity,
    };

    expect(attachWeaponProductIdentities([native], { [native.slug]: item })[0]).toMatchObject({
      assetSlug: 'wpn_greatsword_0003',
      iconPath: '/weapons/greatsword/wpn_greatsword_0003.webp',
    });
  });

  it('preserves a complete trait batch without inventing runtime behavior', () => {
    const result = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [dependency],
      {},
      fixtureGameplayTagRegistry,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.definitions).toEqual([
      {
        ...definition,
        traits: [
          {
            ...definition.traits[0],
            skillId: dependency.skillId,
            actionGraph: { main: { nodes: {} }, macros: {} },
          },
        ],
      },
    ]);
  });

  it('fails closed when a trait runtime dependency is missing', () => {
    const result = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [],
      {},
      fixtureGameplayTagRegistry,
    );

    expect(result.definitions).toEqual([]);
    expect(result.diagnostics).toContainEqual({
      status: 'blocked',
      sourcePath: `WeaponBasicTable.${definition.slug}`,
      reason: 'missing compiled weapon trait runtime dependency',
    });
  });

  it.each([
    ['OnProjectileLaunched', 'unsupported ability event "OnProjectileLaunched"'],
    ['OnReceiveHeal', 'unsupported equipment ability event "receiveHeal"'],
  ])('fails closed for an unsupported weapon event %s', (nativeEvent, reason) => {
    const withPassiveEvent: CompiledWeaponTraitRuntimeDependencySource = {
      ...dependency,
      actionGraph: {
        ...dependency.actionGraph,
        actionGroup: {
          timelineActions: [],
          passiveEvents: [{ abilityEvent: nativeEvent, actions: [] }],
        },
      },
    };

    const result = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [withPassiveEvent],
      {},
      fixtureGameplayTagRegistry,
    );

    expect(result.definitions).toEqual([]);
    expect(result.diagnostics).toContainEqual({
      status: 'blocked',
      sourcePath: `${definition.slug}.skill1.actionGraph`,
      reason:
        `${definition.slug}.skill1.actionGraph.passiveEventActions[0].abilityEvent: ` + reason,
    });
  });

  it.each([
    ['OnAfterSkillApplyCost', 'afterSkillApplyCost'],
    ['OnObtainAtb', 'skillSpGained'],
    ['OnConsumeBuff', 'buffConsumed'],
    ['OnAfterOutputPhysicalInfliction', 'afterOutputPhysicalInfliction'],
    [302, 'beforeOutputDamage'],
  ] as const)(
    '把 %s 投影到公共 AbilityEvent，不生成另一份语义事件',
    (nativeEvent, abilityEvent) => {
      const amount = Object.freeze([10, 20]);
      const withPassiveEvent: CompiledWeaponTraitRuntimeDependencySource = {
        ...dependency,
        blackboard: { amount, constant: 7 },
        actionGraph: {
          ...dependency.actionGraph,
          actionGroup: {
            timelineActions: [],
            passiveEvents: [
              {
                abilityEvent: nativeEvent,
                actions: [
                  {
                    onlyExecuteWhenSourceIsMainCharacter: false,
                    onlyExecuteWhenSourceIsGuard: false,
                    actions: [
                      {
                        sourcePath: 'SkillData.sk_wpn_test_0001.mutation',
                        metadata: {
                          nativeType: 'Game.ModifyActionValue',
                          nativeName: 'ModifyActionValue',
                          enabled: true,
                          priorityLevel: 'Default',
                          priorityOffset: 0,
                          serverActionIndex: 0,
                        },
                        body: {
                          kind: 'leaf',
                          value: {
                            family: 'blackboardMutation',
                            action: {
                              kind: 'blackboardMutation',
                              key: 'counter',
                              operation: 'Assign',
                              value: { value: 1, blackboardKey: null, levelValues: null },
                              directValue: true,
                              calculationTarget: { targetSource: 'Owner' } as never,
                              calculationType: 'HpRatio',
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      };

      const result = compileWeaponRuntimeDefinitionBatchSource(
        [definition],
        [withPassiveEvent],
        {},
        fixtureGameplayTagRegistry,
      );

      expect(result.definitions[0]?.traits[0]?.blackboard?.amount).toBe(amount);
      expect(result.definitions[0]?.traits[0]?.blackboard?.constant).toBe(7);
      expect(result.definitions[0]?.traits[0]?.eventHandlers?.[0]).not.toHaveProperty('blackboard');
      expect(result.diagnostics).toEqual([]);
      const trait = result.definitions[0]?.traits[0];
      const handler = trait?.eventHandlers?.[0];
      expect(handler).toMatchObject({
        key: 'skill1:event:0:sequence:0',
        abilityEvent,
        priority: 0,
      });
      const reference = handler?.sequence.$sequence;
      expect(reference).toEqual(expect.any(String));
      const action =
        trait?.actionGraph && 'main' in trait.actionGraph
          ? trait.actionGraph.main.nodes[reference as string]?.action
          : undefined;
      expect(action).toMatchObject({ kind: 'modifyActionValue', parameters: { key: 'counter' } });
    },
  );

  it('把构筑期 Deck 属性变化响应折叠为单次配装初始化程序', () => {
    const withDeckEvent: CompiledWeaponTraitRuntimeDependencySource = {
      ...dependency,
      actionGraph: {
        ...dependency.actionGraph,
        actionGroup: {
          timelineActions: [],
          passiveEvents: [
            {
              abilityEvent: 'OnCharDeckAttrChanged',
              actions: [
                {
                  onlyExecuteWhenSourceIsMainCharacter: false,
                  onlyExecuteWhenSourceIsGuard: false,
                  actions: [
                    {
                      sourcePath: 'SkillData.sk_wpn_test_0001.deck-mutation',
                      metadata: {
                        nativeType: 'Game.ModifyActionValue',
                        nativeName: 'ModifyActionValue',
                        enabled: true,
                        priorityLevel: 'Default',
                        priorityOffset: 0,
                        serverActionIndex: 0,
                      },
                      body: {
                        kind: 'leaf',
                        value: {
                          family: 'blackboardMutation',
                          action: {
                            kind: 'blackboardMutation',
                            key: 'form',
                            operation: 'Assign',
                            value: { value: 1, blackboardKey: null, levelValues: null },
                            directValue: true,
                            calculationTarget: { targetSource: 'Owner' } as never,
                            calculationType: 'HpRatio',
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };

    const result = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [withDeckEvent],
      {},
      fixtureGameplayTagRegistry,
    );

    expect(result.diagnostics).toEqual([]);
    const deckTrait = result.definitions[0]?.traits[0];
    const initialization = deckTrait?.initializationSequence?.$sequence;
    expect(initialization).toEqual(expect.any(String));
    const initialAction =
      deckTrait?.actionGraph && 'main' in deckTrait.actionGraph
        ? deckTrait.actionGraph.main.nodes[initialization as string]?.action
        : undefined;
    expect(initialAction).toMatchObject({
      kind: 'modifyActionValue',
      parameters: { key: 'form' },
    });
    expect(result.definitions[0]?.traits[0]?.eventHandlers).toBeUndefined();
  });

  it('projects native weapon event guards without flattening their sequence boundary', () => {
    const guarded: CompiledWeaponTraitRuntimeDependencySource = {
      ...dependency,
      actionGraph: {
        ...dependency.actionGraph,
        actionGroup: {
          timelineActions: [],
          passiveEvents: [
            {
              abilityEvent: 'OnBeforeOutputDamage',
              actions: [
                {
                  onlyExecuteWhenSourceIsMainCharacter: false,
                  onlyExecuteWhenSourceIsGuard: false,
                  actions: [
                    {
                      sourcePath: 'SkillData.sk_wpn_test_0001.damageTag',
                      metadata: {
                        nativeType: 'Game.CheckDamageDecorateMask',
                        nativeName: 'CheckDamageDecorateMask',
                        enabled: true,
                        priorityLevel: 'Default',
                        priorityOffset: 0,
                        serverActionIndex: 0,
                      },
                      body: {
                        kind: 'leaf',
                        value: {
                          family: 'condition',
                          action: {
                            kind: 'damageDecorateMask',
                            sourceType: 'CheckDamageDecorateMask',
                            checkType: 'HasAll',
                            mask: 2097152,
                          },
                        },
                      },
                    },
                    {
                      sourcePath: 'SkillData.sk_wpn_test_0001.mutation',
                      metadata: {
                        nativeType: 'Game.ModifyActionValue',
                        nativeName: 'ModifyActionValue',
                        enabled: true,
                        priorityLevel: 'Default',
                        priorityOffset: 0,
                        serverActionIndex: 1,
                      },
                      body: {
                        kind: 'leaf',
                        value: {
                          family: 'blackboardMutation',
                          action: {
                            kind: 'blackboardMutation',
                            key: 'counter',
                            operation: 'Assign',
                            value: { value: 1, blackboardKey: null, levelValues: null },
                            directValue: true,
                            calculationTarget: { targetSource: 'Owner' },
                            calculationType: 'HpRatio',
                          },
                        },
                      },
                    },
                  ] as never,
                },
              ],
            },
          ],
        },
      },
    };

    const result = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [guarded],
      {},
      fixtureGameplayTagRegistry,
    );

    expect(result.diagnostics).toEqual([]);
    const guardedTrait = result.definitions[0]?.traits[0];
    const guardedHandler = guardedTrait?.eventHandlers?.[0];
    expect(guardedHandler).toMatchObject({ abilityEvent: 'beforeOutputDamage' });
    const guardedReference = guardedHandler?.sequence.$sequence;
    const guardedAction =
      guardedTrait?.actionGraph && 'main' in guardedTrait.actionGraph
        ? guardedTrait.actionGraph.main.nodes[guardedReference as string]?.action
        : undefined;
    // 条件守卫保留为独立节点，不被拍平进响应入口。
    expect(guardedAction).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalAttackLastCombo'],
        },
      },
    });
  });

  it('renders one file per weapon type and a stable index', () => {
    const batch = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [dependency],
      {},
      fixtureGameplayTagRegistry,
    );
    const files = renderWeaponDefinitionFiles(batch);

    expect(files.map(item => item.relativePath)).toEqual([
      'index.generated.ts',
      'sword/wpn_test_0001.generated.ts',
      'weapon-definitions.audit.json',
    ]);
    expect(files[1]!.content).toContain('satisfies WeaponDefinition');
  });

  it('武器内嵌词条自己的图，生成文件可直接编译事件程序', () => {
    const source: WeaponDefinition = {
      slug: 'wpn_graph_test',
      rarity: 5,
      weaponType: 'sword',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        {
          key: 'event',
          levelCount: 1,
          skillId: 'sk_wpn_graph_test',
          eventHandlers: [
            {
              key: 'on-buff',
              event: { kind: 'buffConsumed' },
              sequence: { $sequence: 'entry' },
            },
          ],
          actionGraph: {
            main: {
              nodes: {
                entry: {
                  action: { kind: 'dealStagger', parameters: { value: 7 } },
                  next: null,
                },
              },
            },
            macros: {},
          },
        },
      ],
    };
    const weaponContent = renderWeaponDefinitionFiles({
      definitions: [source],
      diagnostics: [],
    }).find(file => file.relativePath.endsWith('wpn_graph_test.generated.ts'))!.content;
    const loadDefinition = (content: string) => {
      const code = ts.transpileModule(content, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
      }).outputText;
      const exports: Record<string, unknown> = {};
      new Function('require', 'exports', code)((id: string) => {
        throw new Error(`Unexpected generated import ${id}`);
      }, exports);
      return exports.default;
    };
    const weapon = loadDefinition(
      weaponContent,
    ) as import('../../../packages/game-data-contract/src/equipment.ts').WeaponDefinition;
    expect(weapon.traits[0]!.eventHandlers![0]!.sequence).toHaveProperty('$sequence');
    expect(weapon.traits[0]).toHaveProperty('actionGraph');
    const compiled = compileWeaponContributions(
      weapon,
      [1],
      { main: 'strength', secondary: 'agility' },
      new ActionGraphDefinitionRepository(),
    );
    expect(rootActionSteps(compiled[0]!.eventHandlers[0]!.sequence)[0]).toMatchObject({
      kind: 'dealStagger',
      parameters: { value: 7 },
    });
  });
});
