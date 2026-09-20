import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { mifu } from '../../../data/operators/mifu.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it.each([
  { battleSkill: 'chr_0031_mifu_normalskill_1', frame: 200, mismatch: true },
  { battleSkill: 'chr_0031_mifu_normalskill_2', frame: 200, mismatch: false },
  { battleSkill: 'chr_0031_mifu_normalskill_1', frame: 900, mismatch: false },
])(
  '弭弗连携后放 $battleSkill @ $frame，替换告警=$mismatch',
  async ({ battleSkill, frame, mismatch }) => {
    let scenario = createEmptyScenario('mifu-route', '连携后战技路由');
    scenario.tracks[0] = {
      id: 'mifu',
      operator: {
        operatorSlug: mifu.slug,
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
    let id = 0;
    scenario = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: mifu,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:${++id}` },
    }).scenario;
    const castId = 'requested-battle';
    scenario.tracks[0]!.skillCasts.push({
      id: castId,
      source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: battleSkill },
      placement: { startFrame: frame },
    });
    const before = structuredClone(scenario);
    const run = await createEditorSimulationService().simulate(scenario, frame + 200);
    const applied = run.receiptEntries.find(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0031_mifu_normalskill_2',
    );
    expect(applied).toBeDefined();
    expect(applied!.frame).toBeLessThan(frame);
    const routeWarnings = run.availabilityDiagnostics.filter(
      d => d.frame === frame && d.reasons.includes('skillInputMismatch'),
    );
    expect(routeWarnings).toHaveLength(mismatch ? 1 : 0);
    if (mismatch)
      expect(routeWarnings[0]).toMatchObject({
        skillId: battleSkill,
        actualSkillId: 'chr_0031_mifu_normalskill_2',
      });
    // 告警不阻止操作，也不把用户明确放置的第一段隐式替换掉。
    expect(
      run.receiptEntries.find(e => e.event === 'SkillInputProcessed' && e.data?.castId === castId)
        ?.data,
    ).toMatchObject({ skillId: battleSkill, accepted: true });
    expect(
      run.receiptEntries.some(e => e.event === 'DamageApplied' && e.data?.castId === castId),
    ).toBe(true);
    if (frame === 900) {
      const expired = run.receiptEntries.find(
        e =>
          e.event === 'BuffFinished' &&
          e.data?.buffId === 'buff_chr_0031_mifu_normalskill_2' &&
          e.data?.instanceId === applied!.data?.instanceId,
      );
      expect(expired?.data?.reason).toBe('lifetime');
      expect(expired!.frame).toBeLessThan(frame);
    }
    expect(scenario).toEqual(before);
  },
);
