import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { perlica } from '../../../data/operators/perlica.generated';
import { tangtang } from '../../../data/operators/tangtang.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('汤汤法术脆弱与落草承伤按源时钟到期，不被队友终结技时间膨胀延寿', async () => {
  let scenario = createEmptyScenario('debuff-clock', '法术承伤时钟');
  scenario.battle.durationFrames = 1000;
  for (const [index, operator] of [tangtang, perlica].entries()) {
    scenario.tracks[index as 0 | 1] = {
      id: operator.slug,
      operator: {
        operatorSlug: operator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon:
        index === 0
          ? {
              weaponSlug: 'wpn_pistol_0011',
              level: 90,
              tuned: true,
              potential: 5,
              traitLevels: [9, 9, 9],
            }
          : null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: index === 0 ? 0 : 80 },
      skillCasts: [],
    };
  }
  let id = 0;
  for (const placement of [
    { trackIndex: 0 as const, operator: tangtang, skillGroupKey: 'comboSkill', startFrame: 1 },
    { trackIndex: 0 as const, operator: tangtang, skillGroupKey: 'battleSkill', startFrame: 120 },
    { trackIndex: 1 as const, operator: perlica, skillGroupKey: 'ultimate', startFrame: 250 },
  ]) {
    scenario = placeSkillGroup({
      scenario,
      ...placement,
      ids: { allocate: kind => `${kind}:${++id}` },
    }).scenario;
  }
  const run = await createEditorSimulationService().simulate(scenario, 1000);
  const entries = run.receiptEntries;
  expect(entries.some(e => e.event === 'TimeDilationStarted' && e.frame >= 250)).toBe(true);
  for (const [buffId, durationFrames] of [
    ['buff_common_affixes_vulnerable_spell_default_child', 450],
    ['buff_wpn_pistol_0011_valid2', 600],
  ] as const) {
    const applied = entries.filter(e => e.event === 'BuffApplied' && e.data?.buffId === buffId);
    expect(applied).toHaveLength(1);
    const finished = entries.find(
      e =>
        e.event === 'BuffFinished' &&
        e.data?.buffId === buffId &&
        e.data?.instanceId === applied[0]!.data?.instanceId,
    );
    expect(finished?.data?.reason).toBe('lifetime');
    // 当前帧创建后即参与该帧 tick，故 450/600 个 tick 的帧号差为 449/599。
    expect(finished!.frame - applied[0]!.frame).toBe(durationFrames - 1);
    expect(applied[0]!.frame).toBeLessThan(250);
    expect(finished!.frame).toBeGreaterThan(300);
  }
  expect(entries.some(e => e.event === 'DamageApplied' && e.data?.skillType === 'ultimate')).toBe(
    true,
  );
});
