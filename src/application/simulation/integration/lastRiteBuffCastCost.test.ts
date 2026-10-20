import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('技力不足时连续组内的别礼战技仍先扣费，再返还技力', async () => {
  const scenario = createEmptyScenario('last-rite-cost', '别礼旁路扣费');
  scenario.battle.resourceRules.initialSp = 0;
  scenario.tracks[0] = {
    id: 'last-rite',
    operator: {
      operatorSlug: 'last-rite',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: { '0': 2, '1': 2 },
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'a1',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0026_lastrite_attack1',
          action: 'basicAttack',
        },
        placement: { startFrame: 3 },
      },
      {
        id: 'a2',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0026_lastrite_attack2',
          action: 'basicAttack',
        },
        placement: { afterCastId: 'a1' },
      },
      {
        id: 'battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0026_lastrite_normal_skill',
          action: 'battleSkill',
        },
        placement: { afterCastId: 'a2' },
      },
      {
        id: 'a3',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0026_lastrite_attack3',
          action: 'basicAttack',
        },
        placement: { afterCastId: 'battle' },
      },
      {
        id: 'a4',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0026_lastrite_attack4',
          action: 'basicAttack',
        },
        placement: { afterCastId: 'a3' },
      },
    ],
  };
  const result = await createEditorSimulationService().simulate(scenario, 300);
  const entries = result.receiptEntries;
  expect(entries.some(e => e.event === 'SkillSwitchedToBuff')).toBe(true);
  expect(entries.filter(e => e.event === 'SkillCostRejected')).toEqual([]);
  const changes = entries.filter(e => e.event === 'SpChanged');
  const paymentIndex = changes.findIndex(e => e.data?.actualValue === -100);
  expect(paymentIndex).toBeGreaterThanOrEqual(0);
  expect(changes.slice(paymentIndex + 1)).toContainEqual(
    expect.objectContaining({
      data: expect.objectContaining({ actualValue: 30, gainKind: 'refund' }),
    }),
  );
});
