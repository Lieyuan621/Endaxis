import { describe, expect, it } from 'vitest';
import { createEditorSimulationService } from '../../application/simulation/editorSimulationService';
import { createEmptyProject } from '../../core/project/createProject';
import { CombatReceiptHistory } from '../../core/combat/receipt/combatReceiptHistory';
import { gameDataRepository } from '../../data/gameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import { placeSkillGroup } from '../timeline/interaction/placeSkillGroup';
import { applySimulationResult, buildOverlayPlanFromProject } from './projectPlan';

function projectFixture() {
  const project = createEmptyProject({ createdWith: 'overlay-test', projectId: 'overlay' });
  const scenario = project.scenarios[0]!;
  scenario.battle.durationFrames = 300;
  scenario.tracks[0] = {
    id: 'perlica-instance',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 20 },
    skillCasts: [],
  };
  let nextId = 0;
  const place = (skillGroupKey: string, startFrame: number) => {
    const placed = placeSkillGroup({
      scenario: project.scenarios[0]!,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey,
      startFrame,
      ids: { allocate: kind => `${kind}:${nextId++}` },
    }).scenario;
    project.scenarios[0] = placed;
    return placed;
  };
  return { project, place };
}

describe('project overlay export', () => {
  it('连续普攻遇到极限闪避后使用实际起止帧，结束时间不再停在预计链尾', async () => {
    const { project, place } = projectFixture();
    const scenario = place('basicAttack', 120);
    const casts = scenario.tracks[0]!.skillCasts;
    casts.forEach((cast, index) => {
      if (index > 0) cast.placement = { afterCastId: casts[index - 1]!.id };
    });
    scenario.battle.dodgeMarkers = [
      {
        id: 'dodge',
        frame: 148,
        trackIndex: 0,
        direction: 'forward',
        mode: { kind: 'perfectDodge', successDelayFrames: 5 },
      },
    ];
    const preview = buildOverlayPlanFromProject(project, gameDataRepository).plan;
    expect(preview.casts.map(cast => Math.round(cast.start * 30))).toEqual([120, 136, 154, 180]);

    const service = createEditorSimulationService(gameDataRepository);
    try {
      const run = await service.simulate(scenario, scenario.battle.durationFrames);
      const plan = buildOverlayPlanFromProject(project, gameDataRepository, run, 'zh-CN').plan;
      expect(plan.casts.map(cast => Math.round(cast.start * 30))).toEqual([120, 137, 170, 197]);
      const starts = run.receiptEntries.filter(entry => entry.event === 'SkillStarted');
      for (const cast of plan.casts) {
        const start = starts.find(entry => entry.data?.castId === cast.id)!;
        const boundary = run.receiptEntries.find(
          entry => entry.event === 'SkillOperableBoundaryReached' && entry.data?.castId === cast.id,
        );
        const interruption = run.receiptEntries.find(
          entry =>
            ['SkillInterrupted', 'SkillInputInterrupted'].includes(entry.event) &&
            entry.data?.castId === cast.id &&
            entry.data?.nextCastId !== cast.id,
        );
        const endFrame = Math.min(
          boundary ? boundary.frame + 1 : Infinity,
          interruption?.frame ?? Infinity,
        );
        expect(cast.start).toBe(start.frame / 30);
        expect(cast.end).toBe(endFrame / 30);
      }
      expect(plan.duration).toBe(Math.max(...plan.casts.map(cast => cast.end)));
      expect(plan.duration).toBeGreaterThan(preview.duration);
    } finally {
      service.clearCache();
    }
  });

  it('保留准备期负时间、真实能量上限与支付费用，空槽不生成轨道或资源', async () => {
    const { project, place } = projectFixture();
    place('battleSkill', -60);
    const scenario = place('battleSkill', 120);
    scenario.battle.resourceRules.maxSp = 200;
    scenario.battle.resourceRules.initialSp = 80;
    const preview = buildOverlayPlanFromProject(project, gameDataRepository).plan;
    expect(preview.casts.every(cast => cast.spCost === null)).toBe(true);

    const service = createEditorSimulationService(gameDataRepository);
    try {
      const run = await service.simulate(scenario, scenario.battle.durationFrames);
      const plan = buildOverlayPlanFromProject(project, gameDataRepository, run, 'zh-CN').plan;
      expect(plan.startTime).toBe(-2);
      expect(plan.casts.map(cast => cast.spCost)).toEqual([0, 100]);
      expect(plan.tracks).toHaveLength(1);
      expect(plan.tracks[0]).toMatchObject({
        trackId: 'perlica-instance',
        operatorName: '佩丽卡',
        element: 'electric',
        avatar: '/operators/perlica/avatar.webp',
      });
      expect(plan.casts[0]).toMatchObject({
        name: '协议ω·雷击',
        skillIcon: '/operators/perlica/battle 01.webp',
        element: 'electric',
      });
      expect(plan.maxSp).toBe(200);
      expect(plan.initialSp).toBe(80);
      expect(Object.keys(plan.gaugePoints)).toEqual(['perlica-instance']);
      expect(plan.gaugeMaxValues).toEqual({ 'perlica-instance': 80 });
      expect(
        Math.max(...plan.gaugePoints['perlica-instance']!.map(point => point.value)),
      ).toBeLessThan(80);
      expect(plan.gaugePoints['perlica-instance']![0]).toEqual({ time: -2, value: 20 });
    } finally {
      service.clearCache();
    }
  });

  it('技力不足时保留门禁回执费用，完整支付回执不会重复计费', async () => {
    const { project, place } = projectFixture();
    const scenario = place('battleSkill', 30);
    scenario.battle.resourceRules.initialSp = 0;
    scenario.battle.resourceRules.spRecoveryPerSecond = 0;
    const service = createEditorSimulationService(gameDataRepository);
    try {
      const run = await service.simulate(scenario, scenario.battle.durationFrames);
      expect(
        run.receiptEntries.find(entry => entry.event === 'SkillCostUnavailableAtStart')?.data
          ?.spNeed,
      ).toBe(100);
      const plan = buildOverlayPlanFromProject(project, gameDataRepository, run, 'zh-CN').plan;
      expect(plan.casts[0]!.spCost).toBe(100);
      expect(plan.initialSp).toBe(0);

      // 从同一真实运行保留首次支付前的回执前缀，验证缺少支付记录时仍可提示 SP 不足。
      const payment = run.receiptEntries.find(entry => entry.event === 'SpChanged')!;
      const prefix = new CombatReceiptHistory();
      for (const entry of run.receiptHistory.entries(0, payment.sequence)) prefix.append(entry);
      const preview = buildOverlayPlanFromProject(project, gameDataRepository).plan;
      expect(
        applySimulationResult(preview, { ...run, receiptHistory: prefix.snapshot() }, project.fps)
          .casts[0]!.spCost,
      ).toBe(100);
    } finally {
      service.clearCache();
    }
  });
});
