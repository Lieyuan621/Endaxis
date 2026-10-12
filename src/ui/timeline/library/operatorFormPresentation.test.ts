import { describe, expect, it } from 'vitest';
import { arcane } from '../../../data/operators/arcane.generated';
import { alesh } from '../../../data/operators/alesh.generated';
import { listOperatorSkillDefinitionBindings } from '../../../core/game-data/operatorSkillDefinitions';
import {
  resolveOperatorPresentationFormKey,
  resolveOperatorSkillIcon,
} from './operatorFormPresentation';

describe('干员展示形态', () => {
  it('普攻、下落攻击和处决不接受原生或条件图标覆盖', () => {
    const bindings = listOperatorSkillDefinitionBindings(alesh).filter(({ skill }) =>
      ['basicAttack', 'plungingAttack', 'finisher'].includes(skill.skillType),
    );
    expect(new Set(bindings.map(({ skill }) => skill.skillType)).size).toBe(3);
    for (const binding of bindings) {
      expect(binding.skill.icon).toBeUndefined();
      expect(
        resolveOperatorSkillIcon(
          {
            ...binding,
            skill: {
              ...binding.skill,
              icon: 'endaxis:operators/alesh/battle_02',
              useSkillGroupIcon: true,
            },
          },
          null,
          alesh,
        ),
      ).toBe('/icons/icon_attack_sword.webp');
    }
  });
  it('按照最终智识和意志面板判断诀的当前形态', () => {
    expect(
      resolveOperatorPresentationFormKey(arcane, {
        strength: 0,
        agility: 0,
        intellect: 500,
        will: 500,
      }),
    ).toBe('int');
    expect(
      resolveOperatorPresentationFormKey(arcane, {
        strength: 0,
        agility: 0,
        intellect: 499,
        will: 500,
      }),
    ).toBe('will');
  });
});
