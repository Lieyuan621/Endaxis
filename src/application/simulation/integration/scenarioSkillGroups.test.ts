/** 用真实技能定义检查跨轨终结技变速能否带动连续组，且不把模拟时间写回存档。 */
import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { perlica, arclight } from '../../../data/operators';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import {
  createSkillCastGroup,
  dissolveSkillCastGroups,
} from '../../../ui/timeline/interaction/timelineDocumentCommands';
import {
  projectSkillCastActualDurationFrames,
  projectSkillCastActualStartFrames,
} from '../../../core/projection/timelineDisplayTime';
import { ScenarioSimulationService } from '../scenarioSimulationService';

function fixture() {
  let scenario = createEmptyScenario('continuous-groups', '连续组回归样本');
  scenario.battle.durationFrames = 450;
  for (const [index, operator] of [perlica, arclight].entries()) {
    scenario.tracks[index as 0 | 1] = {
      id: `track:${index}`,
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
      initialState: { ultimateEnergy: index === 0 ? 80 : 90 },
      skillCasts: [],
    };
  }
  let id = 0;
  const ids = { allocate: (kind: string) => `${kind}:group-test:${id++}` };
  const placed = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator: perlica,
    skillGroupKey: 'basicAttack',
    startFrame: 0,
    ids,
  });
  const castIds = placed.skillCastIds;
  const startFrames = new Map(
    placed.scenario.tracks[0]!.skillCasts.map(cast => [cast.id, cast.placement.startFrame!]),
  );
  scenario = createSkillCastGroup(placed.scenario, new Set(castIds), startFrames);
  const service = new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  });
  return { scenario, service, castIds, ids };
}

describe('持久连续组的完整模拟', () => {
  it('另一轨终结技延长组内技能时，后段跟随真实边界且拆组保留所见位置', async () => {
    const { scenario, service, castIds, ids } = fixture();
    const normal = await service.simulate(scenario, 450);
    const normalStarts = projectSkillCastActualStartFrames(normal.receiptEntries);
    const slowedScenario = placeSkillGroup({
      scenario,
      trackIndex: 1,
      operator: arclight,
      skillGroupKey: 'ultimate',
      startFrame: 5,
      ids,
    }).scenario;
    const before = structuredClone(slowedScenario);
    const slowed = await service.simulate(slowedScenario, 450);
    const starts = projectSkillCastActualStartFrames(slowed.receiptEntries);
    const widths = projectSkillCastActualDurationFrames(slowed.receiptEntries);
    expect(starts.get(castIds[1]!)).toBeGreaterThan(normalStarts.get(castIds[1]!)!);
    for (let index = 1; index < castIds.length; index++) {
      const previous = castIds[index - 1]!;
      expect(starts.get(castIds[index]!)).toBe(starts.get(previous)! + widths.get(previous)!);
    }
    expect(slowedScenario).toEqual(before);
    expect(
      slowedScenario.tracks[0]!.skillCasts.slice(1).every(
        cast => cast.placement.startFrame === undefined && cast.placement.afterCastId !== undefined,
      ),
    ).toBe(true);
    const ungrouped = dissolveSkillCastGroups(slowedScenario, new Set([castIds[1]!]), starts);
    expect(ungrouped.tracks[0]!.skillCasts.map(cast => cast.placement)).toEqual(
      castIds.map(id => ({ startFrame: starts.get(id) })),
    );
    const replay = await service.simulate(ungrouped, 450);
    expect(projectSkillCastActualStartFrames(replay.receiptEntries)).toEqual(starts);
    expect(replay.finalEnemyHealth).toBe(slowed.finalEnemyHealth);
  });

  it('模拟截断只返回已发生前缀，不修改后段存档或把未执行当成成功', async () => {
    const { scenario, service, castIds } = fixture();
    const before = structuredClone(scenario);
    const run = await service.simulate(scenario, 0);
    const starts = projectSkillCastActualStartFrames(run.receiptEntries);
    expect(starts.has(castIds[0]!)).toBe(true);
    expect(castIds.slice(1).every(id => !starts.has(id))).toBe(true);
    expect(scenario).toEqual(before);
    await expect(
      service.planSkillChain(scenario, castIds, 450, undefined, 'compact'),
    ).rejects.toThrow('dissolve continuous skill groups');
  });
});
