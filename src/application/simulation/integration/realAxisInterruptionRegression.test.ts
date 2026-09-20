import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument } from '../../../core/project/schema';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';
import { spDisplayPoints } from '../../../ui/timeline/results/resourceCurveDisplay';

const resources = {
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecoveryPauseDuration: 1.5,
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
};

it('正式编辑器装配从导出SkillSetting读取技力恢复暂停', async () => {
  const scenario = createEmptyScenario('native-resource-settings', '导出恢复暂停');
  scenario.tracks[0] = track('xaihi', [['battleSkill', 'battleSkill', 3]]);
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 80);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const firstRecovery = result.receiptEntries.find(
    e => e.event === 'SpChanged' && e.frame > 3 && e.data?.source === 'autoRecovery',
  );
  // Fifteen full paused ticks after the cast; the following frame resumes recovery.
  expect(firstRecovery?.frame).toBe(19);
  const facts = result.resourceCurves.sp.points;
  const originalFacts = JSON.stringify(facts);
  const drawing = spDisplayPoints(facts, -scenario.battle.prepFrames, 80);
  const deducted = facts.find(p => p.frame === 3 && p.source !== 'autoRecovery');
  expect(deducted).toBeDefined();
  expect(drawing).toContainEqual({ frame: 18, value: deducted!.value });
  expect(drawing.filter(p => p.frame > 3 && p.frame < 19)).toEqual([
    { frame: 18, value: deducted!.value },
  ]);
  expect(facts.find(p => p.frame === 19)).toMatchObject({ source: 'autoRecovery' });
  expect(JSON.stringify(facts)).toBe(originalFacts);
});

it('别礼非主控战技跳转到支援分支并在同帧通过Buff启动返还技力', async () => {
  const scenario = createEmptyScenario('last-rite-support-refund', '非主控支援分支返还');
  scenario.tracks[0] = track('arcane', []);
  scenario.tracks[1] = track('last-rite', [['battleSkill', 'battleSkill', 16]]);
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 100);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const refunds = result.receiptEntries.filter(
    e => e.event === 'SpChanged' && e.data?.gainKind === 'refund',
  );
  expect(refunds).toEqual([
    expect.objectContaining({
      frame: 16,
      sourceId: 'last-rite',
      data: expect.objectContaining({ baseValue: 30, actualValue: 30 }),
    }),
  ]);
  expect(result.receiptEntries).toContainEqual(
    expect.objectContaining({
      event: 'BuffApplied',
      frame: 16,
      data: expect.objectContaining({ buffId: 'buff_chr_0026_lastrite_normal_skill_self' }),
    }),
  );
});

it.each([
  ['basicAttack2', 2, 30],
  ['basicAttack3', 2, 37],
  ['basicAttack3', 12, 77],
] as const)(
  '别礼%s等级%i按实际单击黑板倍率而非显示总倍率均分',
  async (skillId, level, multiplier) => {
    const scenario = createEmptyScenario('last-rite-hit-scale', '实际倍率与显示倍率');
    const owner = track('last-rite', [['basicAttack', skillId, 10]]);
    owner.operator!.skillLevels.basicAttack = level;
    scenario.tracks[0] = owner;
    const before = JSON.stringify(scenario);
    const result = await createEditorSimulationService().simulate(scenario, 120);
    expect(JSON.stringify(scenario)).toBe(before);
    expect(result.executionDiagnostics).toEqual([]);
    const hits = result.receiptEntries.filter(
      e => e.event === 'DamageApplied' && e.data?.castId === `last-rite:${skillId}`,
    );
    expect(hits).toHaveLength(2);
    for (const hit of hits) expect(hit.data?.skillMultiplierPercent).toBeCloseTo(multiplier);
  },
);

it.each([true, false])('守墓人之赠重击增伤要求受益者为主控（主控=%s）', async controlled => {
  const scales: number[] = [];
  for (const potential of [0, 1]) {
    const scenario = createEmptyScenario('last-rite-potential-heavy', '潜能重击增伤主控条件');
    scenario.tracks[0] = track('arcane', []);
    const owner = track('last-rite', [
      ['battleSkill', 'battleSkill', 1],
      ['basicAttack', 'basicAttack4', 100],
    ]);
    owner.operator!.potential = potential;
    scenario.tracks[1] = owner;
    scenario.battle.controlSwitches = [
      { id: 'diagnostic-control', frame: 0, trackIndex: controlled ? 1 : 0 },
    ];
    const before = JSON.stringify(scenario);
    const result = await createEditorSimulationService().simulate(scenario, 200);
    expect(JSON.stringify(scenario)).toBe(before);
    expect(result.executionDiagnostics).toEqual([]);
    expect(
      result.receiptEntries.some(
        e =>
          e.event === 'BuffApplied' &&
          e.targetId === 'last-rite' &&
          e.data?.buffId === 'buff_chr_0026_lastrite_normal_skill',
      ),
    ).toBe(true);
    const hits = result.receiptEntries.filter(
      e =>
        e.event === 'DamageApplied' &&
        e.data?.castId === 'last-rite:basicAttack4' &&
        e.data?.stepKey === 'chr_0026_lastrite_attack4:/scheduledSequences/2/sequence/steps/0',
    );
    expect(hits).toHaveLength(1);
    scales.push(Number(hits[0]!.data?.damageScaleMultiplier));
  }
  expect(scales[1]! - scales[0]!).toBeCloseTo(controlled ? 0.2 : 0);
});

it('艾尔黛拉非主控连携的投射物命中仍回复终结技能量', async () => {
  const scenario = createEmptyScenario('ardelia-combo-energy', '非主控连携回能');
  scenario.tracks[0] = track('arcane', []);
  scenario.tracks[1] = track('ardelia', [['comboSkill', 'comboSkill', 10]]);
  const before = JSON.stringify(scenario);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 150);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const gains = result.receiptEntries.filter(
    e => e.event === 'UltimateEnergyChanged' && e.targetId === 'ardelia',
  );
  expect(gains).toEqual([
    expect.objectContaining({
      sourceId: 'ardelia',
      data: expect.objectContaining({ baseValue: 10, actualValue: 10, applied: true }),
    }),
  ]);
});

it('卡缪基础被动在蝠翼实体结束时清理持续时间图标', async () => {
  const scenario = createEmptyScenario('camille-passive-finish', '蝠翼实体清理');
  scenario.tracks[0] = track('arcane', []);
  scenario.tracks[1] = track('camille', [['battleSkill', 'battleSkill', 16]]);
  const before = JSON.stringify(scenario);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 2000);
  expect(result.executionDiagnostics).toEqual([]);
  expect(JSON.stringify(scenario)).toBe(before);
  const entries = result.receiptEntries;
  const ended = entries.find(
    e =>
      e.event === 'AbilityEntityFinished' &&
      e.data?.abilityEntityId === 'abilityentity_chr_0033_camille_normal_skill',
  );
  expect(ended).toBeDefined();
  const icon = entries.filter(
    e => e.data?.buffId === 'buff_chr_0033_camille_normal_skill_bat_duration_icon',
  );
  expect(icon.find(e => e.event === 'BuffApplied')).toBeDefined();
  expect(icon.filter(e => e.event === 'BuffFinished')).toEqual([
    expect.objectContaining({
      frame: ended!.frame,
      targetId: 'camille',
      data: expect.objectContaining({ reason: 'other' }),
    }),
  ]);
});

it('别礼原生基础被动拒绝通用回能，保留专属回能与不足能量时的强制扣费', async () => {
  const scenario = createEmptyScenario('last-rite-recovery', '公开轴回能来源最小回归');
  scenario.tracks[0] = track('xaihi', [['battleSkill', 'battleSkill', 3]]);
  scenario.tracks[1] = track('last-rite', [
    ['battleSkill', 'battleSkill', 16],
    ['ultimate', 'ultimate', 100],
  ]);
  const before = JSON.stringify(scenario);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 110);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  expect(result.receiptEntries).toContainEqual(
    expect.objectContaining({
      event: 'BuffApplied',
      targetId: 'last-rite',
      data: expect.objectContaining({ buffId: 'buff_chr_0026_lastrite_passive' }),
    }),
  );
  const energy = result.receiptEntries.filter(
    e => e.event === 'UltimateEnergyChanged' && e.targetId === 'last-rite',
  );
  for (const sourceId of ['xaihi', 'last-rite']) {
    expect(energy).toContainEqual(
      expect.objectContaining({
        sourceId,
        data: expect.objectContaining({ baseValue: 6.5, applied: false, actualValue: 0 }),
      }),
    );
  }
  expect(energy).toContainEqual(
    expect.objectContaining({
      frame: 16,
      sourceId: 'last-rite',
      data: expect.objectContaining({ baseValue: 16, applied: true, actualValue: 16 }),
    }),
  );
  expect(energy).toContainEqual(
    expect.objectContaining({
      frame: 100,
      sourceId: 'last-rite',
      data: expect.objectContaining({ actualValue: -16, currentValue: 0 }),
    }),
  );
});

it.each([true, false])('赛希晶体仅被主控重击消费且正确保留来源（主控=%s）', async controlled => {
  const scenario = createEmptyScenario('xaihi-enhance-source', '晶体增幅来源');
  const healer = track('xaihi', [['battleSkill', 'battleSkill', 1]]);
  healer.operator!.potential = 1;
  healer.gears = {
    armor: null,
    gloves: { gearSlug: 'item_equip_t4_suit_usp02_hand_02', artificingLevels: [3, 3, 3] },
    accessory1: { gearSlug: 'item_equip_t4_suit_usp02_edc_04', artificingLevels: [3, 3] },
    accessory2: { gearSlug: 'item_equip_t4_suit_usp02_edc_04', artificingLevels: [3, 3] },
  };
  scenario.tracks[0] = track('arcane', [['basicAttack', 'basicAttack5', 120]]);
  scenario.tracks[1] = healer;
  scenario.battle.controlSwitches = [
    { id: 'control:actor', frame: 0, trackIndex: controlled ? 0 : 1 },
  ];
  const before = JSON.stringify(scenario);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 300);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const entries = result.receiptEntries;
  expect(entries.some(e => e.event === 'DamageApplied' && e.sourceId === 'arcane')).toBe(true);
  expect(entries).toContainEqual(
    expect.objectContaining({
      event: 'BuffApplied',
      targetId: 'arcane',
      data: expect.objectContaining({ buffId: 'buff_chr_0011_seraph_normal_skill_heal' }),
    }),
  );
  const carrier = entries.find(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_common_affixes_enhance_spell',
  );
  const parent = entries.find(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_potential_1_atkup',
  );
  if (!controlled) {
    expect(parent).toBeUndefined();
    expect(carrier).toBeUndefined();
    expect(
      entries.some(
        e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_mainchr_heal',
      ),
    ).toBe(false);
    expect(
      entries.some(
        e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_combo_count',
      ),
    ).toBe(false);
    return;
  }
  expect(parent).toBeDefined();
  expect(carrier).toBeDefined();
  expect(carrier!.sourceId).toBe('xaihi');
  expect(carrier!.sourceId).toBe(parent!.sourceId);
  expect(carrier!.targetId).toBe('arcane');
  expect(
    entries.find(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_normal_skill_heal',
    )?.sourceId,
  ).toMatch(/^ability-entity:/);
  expect(
    entries.find(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_mainchr_heal',
    )?.sourceId,
  ).toBe('xaihi');
  expect(
    entries.find(
      e =>
        e.event === 'BuffApplied' &&
        e.data?.buffId === 'buff_equipsuit_usp_02_AddAttack' &&
        e.targetId === 'arcane',
    ),
  ).toMatchObject({ sourceId: 'xaihi', frame: carrier!.frame });
});

it('诀直接创建腐蚀时，天赋与潜能只延长一次寿命', async () => {
  for (const upgraded of [false, true]) {
    const scenario = createEmptyScenario('arcane-corrosion', '直接创建腐蚀');
    const operator = track('arcane', [['ultimate', 'ultimate', 1]]);
    operator.operator!.potential = upgraded ? 5 : 0;
    operator.operator!.talentStates = upgraded ? { '0': 2, '1': 2 } : {};
    scenario.tracks[0] = operator;
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 1500);
    const entries = result.receiptEntries.filter(
      e => e.data?.buffId === 'buff_common_natural_natural_corrupt_do',
    );
    const start = entries.find(e => e.event === 'BuffApplied');
    const end = entries.find(e => e.event === 'BuffFinished');
    expect(start).toBeDefined();
    expect(end).toBeDefined();
    expect(end!.frame - start!.frame).toBe((upgraded ? 30 : 15) * 30);
  }
});

it('动火用原生十秒增伤不被另一干员的终结技膨胀延长', async () => {
  const scenario = createEmptyScenario('hot-work-clock', '套装默认时钟');
  const operator = track('arcane', [['ultimate', 'ultimate', 1]]);
  operator.gears = {
    accessory2: null,
    armor: { gearSlug: 'item_equip_t4_suit_fire_natr01_body_02', artificingLevels: [3, 3, 3] },
    gloves: { gearSlug: 'item_equip_t4_suit_fire_natr01_hand_04', artificingLevels: [3, 3, 3] },
    accessory1: { gearSlug: 'item_equip_t4_suit_fire_natr01_edc_04', artificingLevels: [3, 3, 3] },
  };
  scenario.tracks[0] = operator;
  scenario.tracks[1] = track('tangtang', [['ultimate', 'ultimate', 120]]);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 600);
  const buffs = result.receiptEntries.filter(
    e => e.data?.buffId === 'buff_equipsuit_fninflict_01_poisedamageadd',
  );
  const start = buffs.find(e => e.event === 'BuffApplied');
  const end = buffs.find(e => e.event === 'BuffFinished');
  expect(start).toBeDefined();
  expect(end).toBeDefined();
  expect(
    result.receiptEntries.some(
      e =>
        e.event === 'TimeDilationStarted' &&
        e.sourceId === 'tangtang' &&
        e.frame > start!.frame &&
        e.frame < end!.frame,
    ),
  ).toBe(true);
  // 创建帧是否已经 tick 影响一帧，不能把此差异当作冻结时长。
  expect(end!.frame - start!.frame).toBeGreaterThanOrEqual(299);
  expect(end!.frame - start!.frame).toBeLessThanOrEqual(300);
});

it('艾尔黛拉终结后续命中读取中途施加的赛希增幅，不冻结施法时增益', async () => {
  const scenario = createEmptyScenario('ardelia-live-enhance', '持续技能中途增幅');
  scenario.tracks[0] = track('ardelia', [['ultimate', 'ultimate', 1]]);
  scenario.tracks[1] = track('xaihi', [['ultimate', 'ultimate', 100]]);
  scenario.tracks[0]!.initialState.ultimateEnergy = 90;
  scenario.tracks[1]!.initialState.ultimateEnergy = 80;
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 450);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const applied = result.receiptEntries.find(
    e =>
      e.event === 'BuffApplied' &&
      e.targetId === 'ardelia' &&
      e.data?.buffId === 'buff_chr_0011_seraph_ultimate_effect_2',
  );
  expect(applied).toBeDefined();
  const hits = result.receiptEntries.filter(
    e => e.event === 'DamageApplied' && e.data?.castId === 'ardelia:ultimate',
  );
  const early = hits.filter(e => e.sequence < applied!.sequence);
  const late = hits.filter(e => e.sequence > applied!.sequence);
  expect(early.length).toBeGreaterThan(0);
  expect(late.length).toBeGreaterThan(0);
  for (const hit of early) expect(hit.data?.damageScaleMultiplier).toBeCloseTo(1);
  for (const hit of late) {
    expect(Number(hit.data?.damageScaleMultiplier)).toBeGreaterThan(1);
    expect(hit.data?.attack).toBe(early[0]!.data?.attack);
    expect(hit.data?.skillMultiplierPercent).toBe(165);
    expect(Number(hit.data?.expectedDamage)).toBeGreaterThan(
      Number(early[0]!.data?.expectedDamage),
    );
  }
});

it.each([true, false])('赛希连携天赋要求命中前已有寒冷（预附着=%s）', async prepared => {
  const scenario = createEmptyScenario('xaihi-existing-infliction', '天赋既有附着条件');
  scenario.tracks[0] = track(
    'xaihi',
    prepared
      ? [
          ['comboSkill', 'comboSkill', 1],
          ['comboSkill', 'comboSkill', 100],
        ]
      : [['comboSkill', 'comboSkill', 100]],
  );
  if (prepared) scenario.tracks[0]!.skillCasts[0]!.id = 'prepare-cryo';
  scenario.tracks[0]!.operator!.talentStates = { '0': 2 };
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 180);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const hits = result.receiptEntries.filter(
    e =>
      e.event === 'DamageApplied' &&
      e.data?.castId === 'xaihi:comboSkill' &&
      e.data?.skillType === 'comboSkill' &&
      String(e.data?.stepKey).startsWith('chr_0011_seraph_combo_skill:'),
  );
  expect(hits).toHaveLength(1);
  const buffs = result.receiptEntries.filter(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0011_seraph_talent_1_crystup',
  );
  expect(buffs).toHaveLength(prepared ? 1 : 0);
  if (prepared) {
    expect(buffs[0]!.frame).toBe(hits[0]!.frame);
    expect(buffs[0]!.sequence).toBeLessThan(hits[0]!.sequence);
  }
  expect(hits[0]!.data?.damageScaleMultiplier).toBeCloseTo(prepared ? 1.1 : 1);
});

it.each([
  ['ardelia', 'buff_common_natural_natural_corrupt_do', 7],
  ['xaihi', 'buff_chr_0011_seraph_talent_1_crystup', 5],
] as const)('%s敌方增益使用原生默认时钟，不随另一干员终结技顺延', async (slug, buffId, seconds) => {
  async function simulate(ultimateFrame?: number) {
    const scenario = createEmptyScenario('enemy-buff-clock', '敌方Buff时钟');
    scenario.tracks[0] = track(slug, [['comboSkill', 'comboSkill', 1]]);
    if (slug === 'xaihi') {
      // 原生天赋检查既有寒冷附着/冻结，不能用空木桩假装条件成立。
      scenario.tracks[0] = track(slug, [
        ['comboSkill', 'comboSkill', 1],
        ['comboSkill', 'comboSkill', 100],
      ]);
      scenario.tracks[0]!.skillCasts[0]!.id = 'prepare-cryo';
    }
    scenario.tracks[0]!.operator!.talentStates = { '0': 2 };
    scenario.tracks[1] = track(
      'tangtang',
      ultimateFrame === undefined ? [] : [['ultimate', 'ultimate', ultimateFrame]],
    );
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 700);
    expect(result.executionDiagnostics).toEqual([]);
    const entries = result.receiptEntries;
    const start = entries.find(e => e.event === 'BuffApplied' && e.data?.buffId === buffId);
    const end = entries.find(e => e.event === 'BuffFinished' && e.data?.buffId === buffId);
    expect(start).toBeDefined();
    expect(end).toBeDefined();
    return { entries, start: start!.frame, end: end!.frame };
  }
  const normal = await simulate();
  const slowed = await simulate(normal.start + 2);
  expect(
    slowed.entries.some(
      e =>
        e.event === 'TimeDilationStarted' &&
        e.sourceId === 'tangtang' &&
        e.data?.kind === 'global' &&
        e.frame > slowed.start &&
        e.frame < slowed.end,
    ),
  ).toBe(true);
  expect(slowed.start).toBe(normal.start);
  expect(slowed.end).toBe(normal.end);
  // 创建发生在本帧Buff tick之前/之后会有一帧边界，不允许把全屏膨胀时长加到寿命上。
  expect(normal.end - normal.start).toBeGreaterThanOrEqual(seconds * 30 - 1);
  expect(normal.end - normal.start).toBeLessThanOrEqual(seconds * 30);
});

it.each([true, false])('赫拉芬格连携增益要求目标已有寒冷附着（附着=%s）', async withCryo => {
  const scenario = createEmptyScenario('khravengger-cryo-gate', '连携目标附着条件');
  scenario.tracks[0] = track('xaihi', withCryo ? [['comboSkill', 'comboSkill', 10]] : []);
  const owner = track('last-rite', [['comboSkill', 'comboSkill', 100]]);
  owner.weapon = {
    weaponSlug: 'wpn_claym_0013',
    level: 90,
    tuned: true,
    potential: 0,
    traitLevels: [9, 9, 4],
  };
  scenario.tracks[1] = owner;
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 250);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  expect(
    result.receiptEntries.some(e => e.event === 'DamageApplied' && e.sourceId === 'last-rite'),
  ).toBe(true);
  const applied = result.receiptEntries.filter(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_wpn_claym_0013_combo_skill',
  );
  if (withCryo) {
    // The 0.1-second marker is a hit debounce, not a once-per-cast guard.
    expect(applied).toHaveLength(2);
    expect(applied[1]!.frame - applied[0]!.frame).toBeGreaterThanOrEqual(3);
    for (const entry of applied) expect(entry.targetId).toBe('last-rite');
  } else expect(applied).toEqual([]);
});

it.each([true, false])('爆破单元区分同元素爆发与异色反应（同元素=%s）', async sameElement => {
  const scenario = createEmptyScenario('detonation-burst-gate', '爆发与异色反应');
  scenario.tracks[0] = sameElement
    ? track('xaihi', [['comboSkill', 'comboSkill', 1]])
    : track('perlica', [['battleSkill', 'battleSkill', 1]]);
  scenario.tracks[0]!.id = 'primer';
  scenario.tracks[0]!.skillCasts[0]!.id = 'primer-combo';
  const owner = track('xaihi', [['comboSkill', 'comboSkill', 100]]);
  owner.weapon = {
    weaponSlug: 'wpn_funnel_0008',
    level: 90,
    tuned: true,
    potential: 0,
    traitLevels: [9, 9, 6],
  };
  scenario.tracks[1] = owner;
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 250);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const infliction = result.receiptEntries.find(
    e => e.event === 'ElementalInflictionApplied' && e.sourceId === 'xaihi',
  );
  expect(infliction?.data?.outcomeKind).toBe(sameElement ? 'burst' : 'compoundStatus');
  const buffs = result.receiptEntries.filter(
    e =>
      e.event === 'BuffApplied' && e.data?.buffId === 'buff_wpn_funnel_0008_magic_damage_taken_up',
  );
  if (sameElement) expect(buffs).toHaveLength(1);
  else expect(buffs).toEqual([]);
});

it.each([0, 1, 4])('别礼连携按实际消费的%i层寒冷拆分附加伤害与基础伤害', async layers => {
  const scenario = createEmptyScenario('last-rite-consumed-scales', '连携消费倍率');
  const primer = track(
    'xaihi',
    [1, 150, 300, 450].slice(4 - layers).map(frame => ['comboSkill', 'comboSkill', frame] as const),
  );
  primer.skillCasts.forEach((cast, index) => {
    cast.id = `primer:${index}`;
  });
  scenario.tracks[0] = primer;
  scenario.tracks[1] = track('last-rite', [['comboSkill', 'comboSkill', 600]]);
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 750);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const hits = result.receiptEntries.filter(
    e => e.event === 'DamageApplied' && e.data?.castId === 'last-rite:comboSkill',
  );
  expect(hits).toHaveLength(3);
  for (const [index, expected] of [160, 240 * layers, 160].entries()) {
    expect(hits[index]!.data?.skillMultiplierPercent).toBeCloseTo(expected, 3);
  }
  expect(hits[1]!.frame).toBe(hits[2]!.frame);
  expect(hits[0]!.frame).toBeLessThan(hits[1]!.frame);
});

it.each([true, false])('潮涌只由持有者输出的二层附着触发（本人=%s）', async ownInfliction => {
  const scenario = createEmptyScenario('tide-surge-owner', '套装附着来源');
  const caster = track('perlica', [
    ['battleSkill', 'battleSkill', 1],
    ['battleSkill', 'battleSkill', 100],
  ]);
  caster.skillCasts[0]!.id = 'first-electric';
  scenario.tracks[0] = caster;
  scenario.tracks[1] = track('last-rite', []);
  scenario.tracks[ownInfliction ? 0 : 1]!.gears = {
    armor: null,
    gloves: { gearSlug: 'item_equip_t4_suit_burst01_hand_01', artificingLevels: [3, 3, 3] },
    accessory1: { gearSlug: 'item_equip_t4_suit_burst01_edc_01', artificingLevels: [3, 3, 3] },
    accessory2: { gearSlug: 'item_equip_t4_suit_burst01_edc_01', artificingLevels: [3, 3, 3] },
  };
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 220);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  expect(
    result.receiptEntries.some(
      e => e.event === 'ElementalInflictionApplied' && e.data?.currentLayers === 2,
    ),
  ).toBe(true);
  const buffs = result.receiptEntries.filter(
    e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_equipsuit_burst_01_spelldmgup',
  );
  if (ownInfliction) {
    expect(buffs).toHaveLength(1);
    expect(buffs[0]?.targetId).toBe('perlica');
  } else expect(buffs).toEqual([]);
});

it('赫拉芬格战技附着增益使用15秒默认时钟，不被全屏终结技顺延', async () => {
  async function simulate(withUltimate: boolean) {
    const scenario = createEmptyScenario('khravengger-clock', '武器增益默认时钟');
    const owner = track('last-rite', [
      ['basicAttack', 'basicAttack1', 3],
      ['battleSkill', 'battleSkill', 16],
      ['basicAttack', 'basicAttack4', 100],
    ]);
    owner.weapon = {
      weaponSlug: 'wpn_claym_0013',
      level: 90,
      tuned: true,
      potential: 0,
      traitLevels: [9, 9, 4],
    };
    owner.operator!.talentStates = { '0': 2, '1': 2 };
    scenario.tracks[0] = owner;
    scenario.tracks[1] = track('tangtang', withUltimate ? [['ultimate', 'ultimate', 200]] : []);
    const before = JSON.stringify(scenario);
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 700);
    expect(result.executionDiagnostics).toEqual([]);
    expect(JSON.stringify(scenario)).toBe(before);
    const buffs = result.receiptEntries.filter(
      e => e.data?.buffId === 'buff_wpn_claym_0013_normal_skill',
    );
    const starts = buffs.filter(e => e.event === 'BuffApplied');
    expect(starts).toHaveLength(1);
    const end = buffs.find(e => e.event === 'BuffFinished');
    expect(end?.data?.reason).toBe('lifetime');
    return { start: starts[0]!.frame, end: end!.frame, entries: result.receiptEntries };
  }
  const normal = await simulate(false);
  const slowed = await simulate(true);
  expect(
    slowed.entries.some(
      e =>
        e.event === 'TimeDilationStarted' &&
        e.sourceId === 'tangtang' &&
        e.data?.kind === 'global' &&
        e.frame > normal.start &&
        e.frame < normal.end,
    ),
  ).toBe(true);
  expect([slowed.start, slowed.end]).toEqual([normal.start, normal.end]);
  expect(normal.end - normal.start).toBeGreaterThanOrEqual(449);
  expect(normal.end - normal.start).toBeLessThanOrEqual(450);
});

it('别礼连携后的残留停帧可使连续A2第二击晚于后续A3输入', async () => {
  // 公开轴主控诊断的454/521/542/572帧整体减453，仅保留影响边界的技能。
  // 延后A3只用于证明第二击可达，绝不能据此移动原始轴输入或补发已中断的命中。
  async function simulate(withCombo: boolean, a3Frame: number) {
    const scenario = createEmptyScenario('last-rite-a2-boundary', '连携后普攻边界');
    scenario.tracks[0] = track('last-rite', [
      ...(withCombo ? [['comboSkill', 'comboSkill', 1] as const] : []),
      ['basicAttack', 'basicAttack1', 68],
      ['basicAttack', 'basicAttack2', 89],
      ['basicAttack', 'basicAttack3', a3Frame],
    ]);
    const before = JSON.stringify(scenario);
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 180);
    expect(result.executionDiagnostics).toEqual([]);
    expect(JSON.stringify(scenario)).toBe(before);
    return result.receiptEntries;
  }
  const ordinary = await simulate(false, 119);
  const interrupted = await simulate(true, 119);
  const delayed = await simulate(true, 130);
  const a2Hits = (entries: typeof ordinary) =>
    entries.filter(e => e.event === 'DamageApplied' && e.data?.castId === 'last-rite:basicAttack2');
  expect(a2Hits(ordinary)).toHaveLength(2);
  expect(a2Hits(interrupted)).toHaveLength(1);
  expect(a2Hits(delayed)).toHaveLength(2);
  expect(a2Hits(delayed)[1]!.frame).toBeGreaterThanOrEqual(119);
  expect(
    interrupted.find(
      e => e.event === 'SkillInterrupted' && e.data?.castId === 'last-rite:basicAttack2',
    )?.frame,
  ).toBe(119);
  expect(
    interrupted.find(e => e.event === 'SkillStarted' && e.data?.castId === 'last-rite:basicAttack3')
      ?.frame,
  ).toBe(119);
});

it('艾尔黛拉连携半额溅射排除主目标，不重复命中唯一木桩', async () => {
  const scenario = createEmptyScenario('ardelia-splash-exclusion', '连携主目标与溅射');
  scenario.tracks[0] = track('ardelia', [['comboSkill', 'comboSkill', 1]]);
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 200);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const hits = result.receiptEntries.filter(e => e.event === 'DamageApplied');
  expect(hits.map(e => e.data?.skillMultiplierPercent)).toEqual([100, 250]);
  expect(
    result.receiptEntries.some(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_common_natural_natural_corrupt_do',
    ),
  ).toBe(true);
});

it.each([true, false])('诀集束攻击仅由主控重击触发（主控=%s）', async controlled => {
  const scenario = createEmptyScenario('arcane-cluster-controller', '集束攻击来源');
  scenario.tracks[0] = track('arcane', [['ultimate', 'ultimate', 1]]);
  scenario.tracks[1] = track('last-rite', [['basicAttack', 'basicAttack4', 100]]);
  scenario.battle.controlSwitches = [
    { id: 'diagnostic-control', frame: 0, trackIndex: controlled ? 1 : 0 },
  ];
  const before = JSON.stringify(scenario);
  const result = await createEditorSimulationService().simulate(scenario, 300);
  expect(JSON.stringify(scenario)).toBe(before);
  expect(result.executionDiagnostics).toEqual([]);
  const entries = result.receiptEntries;
  expect(
    entries.some(e => e.event === 'DamageApplied' && e.data?.castId === 'last-rite:basicAttack4'),
  ).toBe(true);
  expect(
    entries.some(
      e =>
        e.event === 'BuffApplied' &&
        e.data?.buffId === 'buff_chr_0032_lizhiyan_ultimate_skill_inaura',
    ),
  ).toBe(true);
  const layers = entries.filter(
    e =>
      e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0032_lizhiyan_ultimate_skill_layer',
  );
  const lasers = entries.filter(
    e => e.event === 'DamageApplied' && String(e.data?.stepKey).includes('laser'),
  );
  if (controlled) {
    expect(layers).toHaveLength(1);
    expect(lasers).toHaveLength(4);
    for (const laser of lasers) expect(laser.sourceId).toBe('arcane');
  } else {
    expect(layers).toEqual([]);
    expect(lasers).toEqual([]);
  }
});

it('秘仪在本地58帧命中，队友即时连携的全局膨胀仍可延后命中但不阻止输入', async () => {
  const frames: number[] = [];
  for (const withCombo of [false, true]) {
    const scenario = createEmptyScenario('arcana-global-clock', '秘仪与队友连携');
    scenario.tracks[0] = track('arcane', [['ultimate', 'arcana', 1]]);
    scenario.tracks[0]!.operator!.talentStates = { '0': 2, '1': 2 };
    // The public axis uses the will branch; an unequipped Arcane takes the intellect branch.
    scenario.tracks[0]!.gears = {
      armor: { gearSlug: 'item_equip_t4_suit_usp02_body_03', artificingLevels: [3, 3] },
      gloves: { gearSlug: 'item_equip_t4_suit_usp02_hand_03', artificingLevels: [3, 3, 3] },
      accessory1: { gearSlug: 'item_equip_t4_suit_usp02_edc_04', artificingLevels: [3, 3] },
      accessory2: { gearSlug: 'item_equip_t4_suit_usp02_edc_04', artificingLevels: [3, 3] },
    };
    if (withCombo) scenario.tracks[1] = track('last-rite', [['comboSkill', 'comboSkill', 50]]);
    const before = JSON.stringify(scenario);
    const run = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 160);
    expect(run.executionDiagnostics).toEqual([]);
    expect(JSON.stringify(scenario)).toBe(before);
    const hits = run.receiptEntries.filter(
      e => e.event === 'DamageApplied' && e.data?.castId === 'arcane:arcana',
    );
    expect(hits).toHaveLength(1);
    frames.push(hits[0]!.frame);
    const scheming = run.receiptEntries.filter(
      e =>
        e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0032_lizhiyan_talent1_vulnerable',
    );
    expect(scheming).toHaveLength(1);
    // The on-hit effect follows the actual actor clock, not the placement time or legacy offset.
    expect(scheming[0]!.frame).toBe(hits[0]!.frame);
    expect(run.receiptEntries.indexOf(scheming[0]!)).toBeLessThan(
      run.receiptEntries.indexOf(hits[0]!),
    );
    if (withCombo) {
      expect(run.comboWindowDiagnostics.some(e => e.frame === 50)).toBe(true);
      expect(
        run.receiptEntries.find(
          e => e.event === 'SkillStarted' && e.data?.castId === 'last-rite:comboSkill',
        )?.frame,
      ).toBe(50);
    }
  }
  expect(frames[0]).toBe(59);
  expect(frames[1]).toBeGreaterThan(frames[0]!);
});

it('低温症的15秒寿命不被队友终结技全屏膨胀延长', async () => {
  const spans: number[][] = [];
  for (const withUltimate of [false, true]) {
    const scenario = createEmptyScenario('last-rite-talent-clock', '低温症默认时钟');
    scenario.tracks[0] = track('last-rite', [['comboSkill', 'comboSkill', 600]]);
    scenario.tracks[0]!.operator!.talentStates = { '0': 2 };
    scenario.tracks[1] = track(
      'xaihi',
      [1, 150, 300, 450].map(frame => ['comboSkill', 'comboSkill', frame] as const),
    );
    scenario.tracks[1]!.skillCasts.forEach((cast, index) => {
      cast.id = `attachment:${index}`;
    });
    if (withUltimate) scenario.tracks[2] = track('tangtang', [['ultimate', 'ultimate', 850]]);
    const before = JSON.stringify(scenario);
    const run = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 1500);
    expect(JSON.stringify(scenario)).toBe(before);
    expect(run.executionDiagnostics).toEqual([]);
    const start = run.receiptEntries.find(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_chr_0026_lastrite_talent_1_vul',
    );
    expect(start).toBeDefined();
    const end = run.receiptEntries.find(
      e => e.event === 'BuffFinished' && e.data?.instanceId === start!.data?.instanceId,
    );
    expect(end?.data?.reason).toBe('lifetime');
    expect(end!.frame - start!.frame).toBe(450);
    expect(start!.frame).toBeLessThan(850);
    expect(end!.frame).toBeGreaterThan(850);
    spans.push([start!.frame, end!.frame]);
  }
  expect(spans[1]).toEqual(spans[0]);
});

it('诀秘仪命中时，负时长的筹谋增幅仍然生效', async () => {
  const damage: number[] = [];
  for (const talentLevel of [1, 2]) {
    const scenario = createEmptyScenario('arcana-enhance', '筹谋');
    scenario.tracks[0] = track('arcane', [['ultimate', 'arcana', 1]]);
    scenario.tracks[0]!.operator!.talentStates = { '0': talentLevel };
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 150);
    const hit = result.receiptEntries.find(
      e => e.event === 'DamageApplied' && e.data?.skillType === 'ultimate',
    );
    expect(hit).toBeDefined();
    damage.push(hit!.data!.expectedDamage as number);
  }
  expect(damage[1]! / damage[0]!).toBeCloseTo(1.24);
});

it('洛茜在敌人破防但未失衡时仍执行战技后续并施加流血', async () => {
  async function simulate(withNoGuard: boolean) {
    const scenario = createEmptyScenario('rossi-no-guard', '破防不是失衡');
    // 失衡槽设得足够大，先用一次战技建立原生破防 Buff，再测第二次战技。
    scenario.enemy.editable.stagger.maximum = 100000;
    scenario.enemy.editable.hp = 10000000;
    scenario.tracks[0] = track(
      'rossi',
      withNoGuard
        ? [
            ['battleSkill', 'battleSkill', 1],
            ['battleSkill', 'battleSkill', 100],
          ]
        : [['battleSkill', 'battleSkill', 100]],
    );
    scenario.tracks[0]!.operator!.talentStates = { '0': 2, '1': 2 };
    if (withNoGuard) scenario.tracks[0]!.skillCasts[0]!.id = 'prepare-no-guard';
    return (
      await new ScenarioSimulationService({
        index: gameDataRepository,
        spellInflictionSettings: skillSettings,
        resources,
      }).simulate(scenario, 600)
    ).receiptEntries;
  }
  const ready = await simulate(true);
  const unprepared = await simulate(false);
  const applied = (entries: typeof ready, buffId: string) =>
    entries.some(entry => entry.event === 'BuffApplied' && entry.data?.buffId === buffId);
  expect(applied(ready, 'buff_physical_no_guard')).toBe(true);
  expect(applied(ready, 'buff_chr_0028_wulfa_normal_bleed')).toBe(true);
  expect(
    ready.some(
      entry =>
        entry.event === 'BuffApplied' &&
        entry.data?.buffId === 'buff_chr_0028_wulfa_tut_normalskill_failure' &&
        entry.data?.sourceActionId === 'rossi:battleSkill',
    ),
  ).toBe(false);
  expect(applied(unprepared, 'buff_chr_0028_wulfa_normal_bleed')).toBe(false);
  expect(applied(unprepared, 'buff_chr_0028_wulfa_tut_normalskill_failure')).toBe(true);
});

it('opens Xaihi window, not the controlled teammate window, when both crystal uses are consumed', async () => {
  const scenario = createEmptyScenario('crystal-teammate', '队友消耗支援晶体');
  scenario.battle.durationFrames = 240;
  scenario.tracks[0] = track('arcane', []);
  scenario.tracks[0].skillCasts = [50, 140].map((startFrame, index) => ({
    id: `heavy:${index}`,
    source: {
      kind: 'operatorSkill',
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0032_lizhiyan_attack5',
    },
    placement: { startFrame },
  }));
  scenario.tracks[1] = track('xaihi', [['battleSkill', 'battleSkill', 1]]);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 240);
  const depleted = result.receiptEntries.find(
    entry =>
      entry.event === 'BuffFinished' &&
      entry.data?.buffId === 'buff_chr_0011_seraph_combo_count' &&
      entry.data?.layers === 2,
  );
  expect(depleted).toBeDefined();
  const windows = result.receiptEntries.filter(entry => entry.event === 'ComboWindowOpened');
  expect(windows.filter(entry => entry.sourceId === 'xaihi')).toHaveLength(1);
  expect(windows.some(entry => entry.sourceId === 'xaihi' && entry.frame === depleted?.frame)).toBe(
    true,
  );
  expect(windows.filter(entry => entry.sourceId === 'arcane')).toHaveLength(0);
});

it('keeps Tangtang Qingbo cooldown at 10.2 seconds through ordinary combo dilation', async () => {
  const scenario = createEmptyScenario('tangtang-cooldown', '清波冷却回归');
  scenario.battle.durationFrames = 400;
  const tangtang = track('tangtang', [['comboSkill', 'comboSkill', 10]]);
  tangtang.gears = {
    armor: { gearSlug: 'item_equip_t4_suit_combo_cd01_body_01', artificingLevels: [0, 0, 0] },
    gloves: { gearSlug: 'item_equip_t4_suit_combo_cd01_hand_01', artificingLevels: [0, 0, 0] },
    accessory1: { gearSlug: 'item_equip_t4_suit_combo_cd01_edc_01', artificingLevels: [0, 0, 0] },
    accessory2: null,
  };
  scenario.tracks[0] = tangtang;
  // 另一干员的连携与汤汤冷却重叠，不能把普通全局膨胀计入冷却时长。
  scenario.tracks[1] = track('perlica', [['comboSkill', 'comboSkill', 60]]);
  const result = await new ScenarioSimulationService({
    index: gameDataRepository,
    spellInflictionSettings: skillSettings,
    resources,
  }).simulate(scenario, 400);
  const entries = result.receiptEntries.filter(
    entry =>
      entry.sourceId === 'tangtang' && entry.data?.skillId === 'chr_0027_tangtang_combo_skill',
  );
  const reserved = entries.find(entry => entry.event === 'SkillCooldownReserved');
  const ready = entries.find(entry => entry.event === 'SkillCooldownReady');
  expect(reserved?.data?.remainingFrames).toBe(306);
  expect(ready?.frame).toBe((reserved?.frame ?? -1) + 306);
});

/** 真实轴首轮 A4 缺伤害的最小对照；不携带私人存档或旧版伤害快照。 */
function track(slug: string, casts: readonly (readonly [string, string, number])[]): TrackDocument {
  const operator = gameDataRepository.getOperator(slug);
  if (!operator) throw new Error(`missing fixture operator '${slug}'`);
  const resolveSkillId = (groupKey: string, selection: string): string => {
    const group = operator.skillGroups.find(item => item.key === groupKey);
    if (!group) throw new Error(`missing fixture skill group '${slug}/${groupKey}'`);
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    if (selection === 'arcana') {
      const replacement = group.replacementSkills?.[0];
      if (!replacement) throw new Error(`missing fixture replacement '${slug}/${selection}'`);
      return replacement.key;
    }
    const ordinal = selection.match(/^basicAttack([1-9][0-9]*)$/);
    const skill = ordinal ? skills[Number(ordinal[1]) - 1] : skills[0];
    if (!skill) throw new Error(`missing fixture skill '${slug}/${selection}'`);
    return skill.key;
  };
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
    skillCasts: casts.map(([skillGroupKey, skillKey, startFrame]) => ({
      id: `${slug}:${skillKey}`,
      source: {
        kind: 'operatorSkill',
        skillGroupKey,
        skillKey: resolveSkillId(skillGroupKey, skillKey),
      },
      placement: { startFrame },
    })),
  };
}

it.each([
  ['basicAttack1', 'basicAttack2', 20],
  ['basicAttack2', 'basicAttack3', 29],
  ['basicAttack3', 'basicAttack4', 36],
] as const)('别礼%s接%s的原生窗口%i帧只告警、不拒绝输入', async (current, next, boundary) => {
  for (const offset of [boundary, boundary + 1]) {
    const scenario = createEmptyScenario('last-rite-input-window', '非主控普攻接续边界');
    scenario.tracks[0] = track('arcane', []);
    scenario.tracks[1] = track('last-rite', [
      ['basicAttack', current, 10],
      ['basicAttack', next, 10 + offset],
    ]);
    const before = JSON.stringify(scenario);
    const result = await createEditorSimulationService().simulate(scenario, 120);
    expect(JSON.stringify(scenario)).toBe(before);
    expect(result.executionDiagnostics).toEqual([]);
    const warnings = result.receiptEntries.filter(
      e =>
        e.event === 'SkillInputCannotInterruptCurrentSkill' &&
        e.data?.castId === `last-rite:${next}`,
    );
    expect(warnings).toHaveLength(offset === boundary ? 1 : 0);
    if (offset === boundary)
      expect(warnings[0]!.data?.currentSkillTimelineFrame).toBe(boundary - 1);
    expect(
      result.receiptEntries.some(
        e =>
          e.event === 'SkillStarted' &&
          e.frame === 10 + offset &&
          e.data?.castId === `last-rite:${next}`,
      ),
    ).toBe(true);
  }
});

it('records the input-phase local frame at an exact allowed-next boundary', async () => {
  // 记录当前固定步长调度约定，不把它宣称为已闭环的原生渲染帧顺序。
  for (const offset of [22, 23]) {
    const scenario = createEmptyScenario('a3-boundary', '接续边界');
    scenario.tracks[0] = track('arcane', [
      ['basicAttack', 'basicAttack3', 10],
      ['basicAttack', 'basicAttack4', 10 + offset],
    ]);
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 40);
    const blocked = result.receiptEntries.filter(
      entry =>
        entry.event === 'SkillInputCannotInterruptCurrentSkill' &&
        entry.data?.castId === 'arcane:basicAttack4',
    );
    if (offset === 22) {
      expect(blocked).toHaveLength(1);
      expect(blocked[0]?.data?.currentSkillTimelineFrame).toBe(21);
    } else expect(blocked).toHaveLength(0);
    expect(
      result.receiptEntries.some(
        entry =>
          entry.event === 'SkillStarted' &&
          entry.data?.castId === 'arcane:basicAttack4' &&
          entry.frame === 10 + offset,
      ),
    ).toBe(true);
  }
});

it('retains inputs but interrupts A4 before its first hit during another operator combo dilation', async () => {
  async function simulate(withCombo: boolean) {
    const scenario = createEmptyScenario('a4-dilation', '跨干员膨胀最小对照');
    scenario.battle.durationFrames = 100;
    scenario.tracks[0] = track('arcane', [
      ['basicAttack', 'basicAttack4', 10],
      ['basicAttack', 'basicAttack5', 31],
    ]);
    scenario.tracks[1] = track('tangtang', withCombo ? [['comboSkill', 'comboSkill', 12]] : []);
    const before = JSON.stringify(scenario);
    const result = await new ScenarioSimulationService({
      index: gameDataRepository,
      spellInflictionSettings: skillSettings,
      resources,
    }).simulate(scenario, 100);
    expect(JSON.stringify(scenario)).toBe(before);
    return result.receiptEntries;
  }
  const normal = await simulate(false);
  const slowed = await simulate(true);
  const a4Hits = (entries: typeof normal) =>
    entries.filter(
      entry => entry.event === 'DamageApplied' && entry.data?.castId === 'arcane:basicAttack4',
    );
  expect(a4Hits(normal).length).toBeGreaterThan(0);
  expect(a4Hits(slowed)).toHaveLength(0);
  expect(
    slowed.some(
      entry =>
        entry.event === 'TimeDilationStarted' &&
        entry.sourceId === 'tangtang' &&
        entry.data?.kind === 'global',
    ),
  ).toBe(true);
  expect(
    slowed.some(
      entry =>
        entry.event === 'SkillInterrupted' &&
        entry.data?.castId === 'arcane:basicAttack4' &&
        entry.frame === 31,
    ),
  ).toBe(true);
  expect(
    slowed.some(
      entry =>
        entry.event === 'SkillStarted' &&
        entry.data?.castId === 'arcane:basicAttack5' &&
        entry.frame === 31,
    ),
  ).toBe(true);
});
