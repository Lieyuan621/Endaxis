import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { projectSkillCastActualDurationFrames } from '../../../core/projection/timelineDisplayTime';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it.each(['battleSkill', 'ultimate'] as const)(
  '梨诺 %s 在结束操作开放时结束块体，不结束持续技能',
  async skillGroupKey => {
    const scenario = createEmptyScenario('manual-end', '手动结束技能块');
    scenario.tracks[0] = {
      id: 'liino',
      operator: {
        operatorSlug: 'liino',
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
          id: 'cast',
          source: {
            kind: 'operatorSkill',
            skillGroupKey,
            skillKey:
              skillGroupKey === 'battleSkill'
                ? 'chr_0035_liino_normal_skill'
                : 'chr_0035_liino_ultimate_skill',
          },
          placement: { startFrame: 1 },
        },
      ],
    };
    const result = await createEditorSimulationService().simulate(scenario, 250);
    const width = projectSkillCastActualDurationFrames(result.receiptEntries).get('cast');
    expect(width).toBeDefined();
    expect(width).toBeLessThan(200);
    expect(
      result.receiptEntries.filter(
        entry => entry.event === 'SkillFinished' && entry.data?.castId === 'cast',
      ),
    ).toEqual([]);
  },
);
