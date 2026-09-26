import { describe, expect, it } from 'vitest';
import { ember } from '../../../data/operators/ember.generated';
import { snowshine } from '../../../data/operators/snowshine.generated';
import { catcher } from '../../../data/operators/catcher.generated';
import { perlica } from '../../../data/operators/perlica.generated';
import { createDefaultOperatorInstance } from '../../../application/editor/loadoutBuildFactory';
import { ActionGraphDefinitionRepository } from '../../compiler/actionGraphDefinitionRepository';
import { compileOperatorComboSkillConditions } from '../../compiler/compileOperatorComboSkillConditions';
import { hasUnmodeledIncomingAttackTrigger } from './comboConditionCheckability';

describe('连携触发条件的可检查范围', () => {
  it.each([ember, snowshine, catcher, perlica])('$slug 按生成条件识别，不按职业识别', operator => {
    const programs = compileOperatorComboSkillConditions(
      operator,
      createDefaultOperatorInstance(operator),
      { programs: new ActionGraphDefinitionRepository() },
    );
    expect(programs.length).toBeGreaterThan(0);
    expect(hasUnmodeledIncomingAttackTrigger(programs, programs[0]!.skillKey)).toBe(
      operator !== perlica,
    );
    expect(hasUnmodeledIncomingAttackTrigger(programs, 'another-skill')).toBe(false);
    expect(
      hasUnmodeledIncomingAttackTrigger(
        programs.map(program => ({ ...program, event: 'outputDamage' as const })),
        programs[0]!.skillKey,
      ),
    ).toBe(false);
  });
});
