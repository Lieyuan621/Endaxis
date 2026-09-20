import { describe, expect, it } from 'vitest';
import { INFLICTION_ELEMENTS } from '../../core/game-data/operatorDefinition';
import { compoundStatusFactories } from './compoundStatusFactories';

describe('compoundStatusFactories', () => {
  it('creates every ordered pair from the fixed four-element rules', () => {
    expect(compoundStatusFactories.revision).toBe('elemental-rules-v1');
    expect(compoundStatusFactories.factories).toHaveLength(12);
    expect(
      new Set(
        compoundStatusFactories.factories.map(
          factory => `${factory.consumedElement}:${factory.incomingElement}`,
        ),
      ).size,
    ).toBe(12);
    expect(
      compoundStatusFactories.factories.flatMap(factory => factory.skillSettingLookups),
    ).toHaveLength(39);
    expect(
      compoundStatusFactories.factories.filter(factory =>
        factory.createdBuff.buffId.endsWith('_wrapper'),
      ),
    ).toHaveLength(3);

    for (const consumedElement of INFLICTION_ELEMENTS) {
      for (const incomingElement of INFLICTION_ELEMENTS) {
        if (consumedElement === incomingElement) continue;
        expect(
          compoundStatusFactories.factories.some(
            factory =>
              factory.consumedElement === consumedElement &&
              factory.incomingElement === incomingElement,
          ),
        ).toBe(true);
      }
    }
  });

  it('selects the reaction recipe by the incoming element', () => {
    const expected = {
      heat: {
        settingKeys: ['异常初始伤害倍率', '燃烧每跳伤害'],
        assignmentKeys: ['atk_scale', 'burning_atk_scale'],
      },
      electric: {
        settingKeys: ['异常初始伤害倍率', '导电法术伤害提高', '导电持续时间'],
        assignmentKeys: ['atk_scale', 'spell_resistance_decrease', 'duration'],
      },
      cryo: {
        settingKeys: ['异常初始伤害倍率', '碎冰倍率', '冰冻持续时间'],
        assignmentKeys: ['atk_scale', 'shatter_dmg', 'duration'],
      },
      nature: {
        settingKeys: [
          '异常初始伤害倍率',
          '腐蚀每跳减抗',
          '腐蚀减抗上限',
          '腐蚀初始减抗',
          '腐蚀持续时间',
        ],
        assignmentKeys: [
          'atk_scale',
          'def_decrease_tick',
          'max_def_decrease',
          'start_def_decrease',
          'duration',
        ],
      },
    } as const;

    for (const factory of compoundStatusFactories.factories) {
      const recipe = expected[factory.incomingElement];
      expect(factory.skillSettingLookups.map(lookup => lookup.dataKey)).toEqual(recipe.settingKeys);
      expect(
        factory.createdBuff.blackboardAssignments
          .slice(0, recipe.assignmentKeys.length)
          .map(assignment => assignment.targetKey),
      ).toEqual(recipe.assignmentKeys);
      expect(factory.createdBuff.blackboardAssignments.slice(-3)).toEqual([
        { targetKey: 'consumed_layer', inputKey: 'consumed_layer' },
        { targetKey: 'count', inputKey: 'count' },
        { targetKey: 'consumed_type', inputKey: 'consumed_type' },
      ]);
    }
  });
});
