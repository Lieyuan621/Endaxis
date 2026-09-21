import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { projectSkillCastActualDurationFrames } from '../../../core/projection/timelineDisplayTime';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';
import { rossiChr_0028_wulfa_normal_skill } from '../../../data/operators/rossi.generated';

it('洛茜战技执行可中断标记后结束块体，块尾可接普攻', async () => {
  expect(rossiChr_0028_wulfa_normal_skill.timelineBlockFrames).toBe(49);
  const scenario = createEmptyScenario('rossi-interrupt', '洛茜接续');
  scenario.tracks[0] = {
    id: 'rossi',
    operator: {
      operatorSlug: 'rossi',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0028_wulfa_normal_skill',
        },
        placement: { startFrame: 1 },
      },
    ],
  };
  const service = createEditorSimulationService();
  const result = await service.simulate(scenario, 300);
  const duration = projectSkillCastActualDurationFrames(result.receiptEntries).get('battle');
  expect(duration).toBeDefined();
  expect(duration).toBeLessThan(100);
  scenario.tracks[0]!.skillCasts.push({
    id: 'attack',
    source: {
      kind: 'operatorSkill',
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0028_wulfa_attack1',
    },
    placement: { startFrame: 1 + duration! },
  });
  const continued = await service.simulate(scenario, 300);
  expect(
    continued.receiptEntries.filter(
      entry => entry.event === 'SkillInputCannotInterruptCurrentSkill',
    ),
  ).toEqual([]);
});
