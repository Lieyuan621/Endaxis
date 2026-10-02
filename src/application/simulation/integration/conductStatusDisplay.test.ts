import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { perlica, zhuangFangyi } from '../../../data/operators';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { projectCombatStatusIndicators } from '../../../core/projection/combatStatusIndicators';

it('导电图标跟随真实等级升级、封顶和重新施加', async () => {
  let scenario = createEmptyScenario('conduct-display', '导电等级显示回归');
  for (const [index, operator] of [perlica, zhuangFangyi].entries()) {
    scenario.tracks[index] = {
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
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
  }
  let nextId = 0;
  const ids = { allocate: (kind: string) => `${kind}:conduct:${++nextId}` };
  // 显式排程分别提供 1/2/3/4 层电附着，再用 1 层重施，覆盖上限和实际等级回落。
  for (const [trackIndex, operator, skillGroupKey, startFrame] of [
    [0, perlica, 'comboSkill', 0],
    [0, perlica, 'battleSkill', 60],
    [1, zhuangFangyi, 'comboSkill', 120],
    [0, perlica, 'battleSkill', 240],
    [0, perlica, 'battleSkill', 270],
    [1, zhuangFangyi, 'comboSkill', 300],
    [0, perlica, 'battleSkill', 420],
    [0, perlica, 'battleSkill', 450],
    [0, perlica, 'battleSkill', 480],
    [1, zhuangFangyi, 'comboSkill', 540],
    [0, perlica, 'battleSkill', 600],
    [0, perlica, 'battleSkill', 630],
    [0, perlica, 'battleSkill', 660],
    [0, perlica, 'battleSkill', 690],
    [1, zhuangFangyi, 'comboSkill', 750],
    [0, perlica, 'battleSkill', 1000],
    [1, zhuangFangyi, 'comboSkill', 1060],
  ] as const) {
    scenario = placeSkillGroup({
      scenario,
      trackIndex,
      operator,
      skillGroupKey,
      startFrame,
      ids,
    }).scenario;
  }
  const service = createEditorSimulationService();
  const run = await service.simulate(scenario, 1800);
  const conductId = 'buff_common_pulse_pulse_conduct_triggered_do';
  const segments = projectBuffTimelineViz(run.receiptEntries, 1800).filter(
    s => s.buffId === conductId,
  );
  expect(segments.map(segment => segment.layers)).toEqual([1, 2, 3, 4, 4, 2]);
  // 图标和 HUD 都在替换边沿采用新等级，结束后不保留旧状态。
  expect(
    segments.map(segment => projectCombatStatusIndicators(segments, segment.startFrame)[0]?.layers),
  ).toEqual([1, 2, 3, 4, 4, 2]);
  expect(
    segments.slice(1).map((segment, index) => segment.startFrame === segments[index]!.endFrame),
  ).toEqual([true, true, true, true, true]);
  expect(segments.at(-1)).toMatchObject({ endFrame: 1624, endReason: 'lifetime' });
  expect(projectCombatStatusIndicators(segments, 1624)).toEqual([]);
  const applied = run.receiptEntries.filter(
    entry => entry.event === 'BuffApplied' && entry.data?.buffId === conductId,
  );
  expect(applied.map(entry => entry.data?.layers)).toEqual([1, 1, 1, 1, 1, 1]);
  // 图标数值不反写 Buff 叠层或伤害：各等级仍使用实际生成定义的易伤倍率。
  const hits = run.receiptEntries.filter(
    entry =>
      entry.event === 'DamageApplied' && [73, 144, 324, 564, 774, 1084].includes(entry.frame),
  );
  expect(hits.map(entry => entry.data?.['damageScale:normal:defender'])).toEqual([
    1.12, 1.16, 1.2, 1.24, 1.24, 1.16,
  ]);
});
