import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import {
  compileWeaponRuntimeDefinitionBatchSource,
  type CompiledWeaponStaticDefinitionSource,
  type CompiledWeaponTraitRuntimeDependencySource,
} from '../src/index.ts';
const definition: CompiledWeaponStaticDefinitionSource = {
  slug: 'wpn_columns',
  rarity: 5,
  weaponType: 'sword',
  baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
  traits: [{ key: 'skill1', levelCount: 2, modifiers: [] }],
};

function dependency(
  overrides: Partial<CompiledWeaponTraitRuntimeDependencySource> = {},
): CompiledWeaponTraitRuntimeDependencySource {
  return {
    weaponId: definition.slug,
    traitKey: 'skill1',
    slotIndex: 0,
    skillId: 'sk_columns',
    actionGraph: {
      skillId: 'sk_columns',
      level: 1,
      durationFrame: 0,
      declaredBlackboard: [],
      actionGroup: { timelineActions: [], passiveEvents: [] },
    },
    request: {
      originKind: 'weapon',
      originId: definition.slug,
      skillId: 'sk_columns',
      sourcePath: 'WeaponBasicTable.wpn_columns',
      inputBlackboard: {},
      levelSource: {
        kind: 'weaponProgression',
        slotIndex: 0,
        breakthroughTemplateId: 'fixture',
        talentTemplateId: 'fixture',
      },
    },
    levels: [1, 2],
    blackboard: {},
    startupBuffs: [],
    toggleBuffs: [],
    referencedBuffIds: [],
    ...overrides,
  };
}

describe('武器安装结构与等级列', () => {
  it('缺失条件值按原生等级 ID 诊断，不能把非连续等级改为行号', () => {
    const result = compileWeaponRuntimeDefinitionBatchSource(
      [definition],
      [
        dependency({
          levels: [2, 4],
          toggleBuffs: [
            {
              conditions: [
                {
                  kind: 'currentHpRatio',
                  comparison: 'GE',
                  value: { kind: 'unresolvedSkillBlackboard', key: 'server_hp_ratio' },
                },
              ],
              buffs: [],
            },
          ],
        }),
      ],
      {},
      fixtureGameplayTagRegistry,
    );
    expect(result.definitions).toEqual([]);
    expect(result.diagnostics.map(item => item.sourcePath)).toEqual([
      'wpn_columns.skill1.level2',
      'wpn_columns.skill1.level4',
    ]);
  });
});
