import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it('洛茜连携三提前消费火附着后，公共事件打开卡蜜拉连携窗口', async () => {
  const scenario = createEmptyScenario('rossi-camille', '火附着消费');
  scenario.tracks[0] = track('camille', 'chr_0033_camille_normal_skill', 'battleSkill', 1);
  scenario.tracks[1] = track('rossi', 'chr_0028_wulfa_combo_3_skill', 'comboSkill', 100);
  const service = createEditorSimulationService();
  const baseline = await service.simulate(scenario, 600);
  const finished = baseline.receiptEntries.find(
    e =>
      e.event === 'BuffFinished' &&
      e.data?.buffId === 'buff_common_energy_shard_attached_fire' &&
      e.data.reason === 'early',
  );
  expect(finished).toBeDefined();
  const opened = baseline.receiptEntries.find(
    e => e.event === 'ComboWindowOpened' && e.sourceId === 'camille',
  );
  expect(opened).toBeDefined();
  expect(opened!.frame).toBe(finished!.frame);
  expect(opened!.sequence).toBeGreaterThan(finished!.sequence);
  const castFrame = opened!.frame + 1;
  const cast = track('camille', 'chr_0033_camille_combo_skill', 'comboSkill', castFrame)
    .skillCasts[0]!;
  scenario.tracks[0]!.skillCasts.push({ ...cast, id: 'camille:combo' });
  const before = structuredClone(scenario);
  const run = await service.simulate(scenario, castFrame + 200);
  expect(run.comboWindowDiagnostics.filter(d => d.sourceId === 'camille')).toEqual([]);
  expect(
    run.receiptEntries.find(e => e.event === 'ComboWindowConsumed' && e.sourceId === 'camille')
      ?.frame,
  ).toBe(castFrame);
  expect(scenario).toEqual(before);
});

function track(
  slug: string,
  skillKey: string,
  skillGroupKey: string,
  frame: number,
): TrackDocument {
  return {
    id: slug,
    operator: {
      operatorSlug: slug,
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
        id: `${slug}:cast`,
        source: { kind: 'operatorSkill', skillGroupKey, skillKey },
        placement: { startFrame: frame },
      },
    ],
  };
}

it.each([
  { slug: 'mifu', skillKey: 'chr_0031_mifu_normalskill_3', cost: 50, available: 21.13333333333471 },
  { slug: 'mifu', skillKey: 'chr_0031_mifu_normalskill_3', cost: 50, available: 50 },
  {
    slug: 'xaihi',
    skillKey: 'chr_0011_seraph_normal_skill',
    cost: 100,
    available: 91.133333333334,
  },
  {
    slug: 'xaihi',
    skillKey: 'chr_0011_seraph_normal_skill',
    cost: 100,
    available: 85.2000000000001,
  },
  { slug: 'xaihi', skillKey: 'chr_0011_seraph_normal_skill', cost: 100, available: 100 },
])(
  '$slug $skillKey 技力 $available/$cost：告警不阻止支付',
  async ({ slug, skillKey, cost, available }) => {
    const scenario = createEmptyScenario('resource-boundary', '真实轴资源边界');
    scenario.battle.resourceRules.initialSp = available;
    scenario.battle.resourceRules.spRecoveryPerSecond = 0;
    scenario.tracks[0] = track(slug, skillKey, 'battleSkill', 1);
    const before = structuredClone(scenario);
    const run = await createEditorSimulationService().simulate(scenario, 180);
    const warnings = run.availabilityDiagnostics.filter(d =>
      d.reasons.includes('resourceUnavailable'),
    );
    expect(warnings).toHaveLength(available < cost ? 1 : 0);
    expect(run.receiptEntries.find(e => e.event === 'SkillInputProcessed')?.data).toMatchObject({
      skillId: skillKey,
      accepted: true,
    });
    const payment = run.receiptEntries.find(e => e.event === 'SkillCostApplied');
    expect(payment?.data?.remainingSp).toBeCloseTo(available - cost, 8);
    expect(scenario).toEqual(before);
  },
);

it.each([150, 151])('原生寒冷附着打开汤汤窗口：经过 %i 帧后的消费边界', async offset => {
  const scenario = createEmptyScenario('window-boundary', '真实附着与窗口时钟');
  scenario.tracks[0] = track('xaihi', 'chr_0011_seraph_combo_skill', 'comboSkill', 1);
  scenario.tracks[1] = track('tangtang', 'chr_0027_tangtang_combo_skill', 'comboSkill', 1);
  scenario.tracks[1].skillCasts = [];
  const service = createEditorSimulationService();
  const initial = await service.simulate(scenario, 100);
  const opened = initial.receiptEntries.find(
    e => e.event === 'ComboWindowOpened' && e.sourceId === 'tangtang',
  );
  expect(opened).toBeDefined();
  const frame = opened!.frame + offset;
  scenario.tracks[1] = track('tangtang', 'chr_0027_tangtang_combo_skill', 'comboSkill', frame);
  const before = structuredClone(scenario);
  const run = await service.simulate(scenario, frame + 100);
  const relevant = run.receiptEntries.filter(e => e.sourceId === 'tangtang');
  expect(run.comboWindowDiagnostics.filter(d => d.sourceId === 'tangtang')).toHaveLength(
    offset === 150 ? 0 : 1,
  );
  if (offset === 150) {
    expect(relevant.find(e => e.event === 'ComboWindowConsumed')?.frame).toBe(frame);
  } else {
    expect(relevant.find(e => e.event === 'ComboWindowExpired')?.frame).toBe(frame);
    expect(relevant.find(e => e.event === 'ComboWindowUnavailableAtStart')?.data?.reason).toBe(
      'windowMissing',
    );
  }
  expect(relevant.find(e => e.event === 'SkillInputProcessed')?.data?.accepted).toBe(true);
  expect(
    relevant.some(e => e.event === 'DamageApplied' && e.data?.castId === 'tangtang:cast'),
  ).toBe(true);
  expect(scenario).toEqual(before);
});

it.each([-3, 1])('汤汤连携冷却就绪前后 %i 帧发生寒冷附着，不补发过去的触发', async offset => {
  const scenario = createEmptyScenario('cooldown-trigger', '冷却与事件先后');
  scenario.tracks[0] = track('tangtang', 'chr_0027_tangtang_combo_skill', 'comboSkill', 1);
  const service = createEditorSimulationService();
  const baseline = await service.simulate(scenario, 900);
  const ready = baseline.receiptEntries.find(
    e => e.event === 'SkillCooldownReady' && e.sourceId === 'tangtang',
  );
  expect(ready).toBeDefined();

  // 从真实技能取得附着相对时刻，不手写连携初始黑板或窗口。
  const probe = createEmptyScenario('cryo-probe', '附着时序');
  probe.tracks[0] = track('xaihi', 'chr_0011_seraph_combo_skill', 'comboSkill', 1);
  const probeRun = await service.simulate(probe, 100);
  const infliction = probeRun.receiptEntries.find(e => e.event === 'ElementalInflictionApplied');
  expect(infliction?.data?.requestedElement).toBe('cryo');
  let triggerFrame = ready!.frame + offset;
  scenario.tracks[1] = track(
    'xaihi',
    'chr_0011_seraph_combo_skill',
    'comboSkill',
    triggerFrame - (infliction!.frame - 1),
  );
  // 队友施法也参与真实时钟，先在双人场景确定冷却结束，不能沿用单人时刻。
  let readyFrame = ready!.frame;
  for (let attempt = 0; attempt < 3; attempt++) {
    const trial = await service.simulate(scenario, 900);
    readyFrame = trial.receiptEntries.find(
      e => e.event === 'SkillCooldownReady' && e.sourceId === 'tangtang',
    )!.frame;
    const actualTrigger = trial.receiptEntries.find(
      e => e.event === 'ElementalInflictionApplied' && e.sourceId === 'xaihi',
    )!.frame;
    if (actualTrigger - readyFrame === offset) break;
    const adjustment = offset - (actualTrigger - readyFrame);
    const cast = scenario.tracks[1]!.skillCasts[0]!;
    cast.placement = { startFrame: cast.placement.startFrame! + adjustment };
  }
  triggerFrame = readyFrame + offset;
  const castFrame = readyFrame + 10;
  const nextCast = track('tangtang', 'chr_0027_tangtang_combo_skill', 'comboSkill', castFrame)
    .skillCasts[0]!;
  scenario.tracks[0]!.skillCasts.push({ ...nextCast, id: 'tangtang:second' });
  const run = await service.simulate(scenario, castFrame + 100);
  expect(
    run.receiptEntries.find(e => e.event === 'ElementalInflictionApplied' && e.sourceId === 'xaihi')
      ?.frame,
  ).toBe(triggerFrame);
  expect(
    run.receiptEntries.find(e => e.event === 'SkillCooldownReady' && e.sourceId === 'tangtang')
      ?.frame,
  ).toBe(readyFrame);
  const warnings = run.comboWindowDiagnostics.filter(
    d => d.sourceId === 'tangtang' && d.frame === castFrame,
  );
  expect(warnings).toHaveLength(offset < 0 ? 1 : 0);
  if (offset < 0) expect(warnings[0]?.reasons).toEqual(['windowMissing']);
  expect(
    run.receiptEntries.find(
      e => e.event === 'SkillInputProcessed' && e.data?.castId === 'tangtang:second',
    )?.data?.accepted,
  ).toBe(true);
});
