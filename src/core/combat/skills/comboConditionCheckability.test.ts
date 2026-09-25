import { describe, expect, it } from 'vitest';
import { ember } from '../../../data/operators/ember.generated';
import { snowshine } from '../../../data/operators/snowshine.generated';
import { catcher } from '../../../data/operators/catcher.generated';
import { purrchena } from '../../../data/operators/purrchena.generated';
import { perlica } from '../../../data/operators/perlica.generated';
import { compileActionSequence } from '../../compiler/compileSkill';
import { hasUnmodeledIncomingAttackTrigger } from './comboConditionCheckability';

describe('连携触发条件的可检查范围', () => {
  it.each([ember, snowshine, catcher, purrchena, perlica])(
    '$slug 按生成条件识别，不按职业识别',
    operator => {
      const programs = (operator.comboSkillConditions ?? []).map(condition => ({
        ...condition,
        skillGroupKey: 'combo',
        sequence: compileActionSequence(condition.sequence, 1, 'test.combo'),
      }));
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
    },
  );
});
