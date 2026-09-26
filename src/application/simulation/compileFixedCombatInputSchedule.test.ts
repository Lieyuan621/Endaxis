import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import { perlica } from '../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../ui/timeline/interaction/placeSkillGroup';
import {
  compileCombatInputSchedule,
  compileFixedCombatInputSchedule,
} from './compileFixedCombatInputSchedule';

it('图干员从技能身份编排人工输入', () => {
  const scenario = createEmptyScenario('input-graph', 'Input graph');
  scenario.tracks[0] = {
    id: 'operator:perlica',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 5,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  const placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlica,
    skillGroupKey: 'battleSkill',
    startFrame: 30,
    ids: { allocate: () => 'cast:perlica' },
  }).scenario;
  const schedule = compileCombatInputSchedule(placed, { getOperator: () => perlica });
  expect(schedule.groups).toEqual([]);
  expect(schedule.inputs).toEqual(
    compileFixedCombatInputSchedule(placed, { getOperator: () => perlica }),
  );
  expect(schedule.inputs.length).toBeGreaterThan(0);
});
