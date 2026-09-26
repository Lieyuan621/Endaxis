import { describe, expect, it } from 'vitest';

import type { OperatorDefinition } from '../../../core/game-data/operatorDefinition';
import { createEmptyScenario } from '../../../core/project/createProject';
import { lifeng, perlica, operatorDefinitions } from '../../../data/operators';
import * as operators from '../../../data/operators';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import {
  groupPlacedSkillSequence,
  placeSkillGroup,
  placeLibrarySkillGroup,
} from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { resolveCompactSkillSelection } from '../../../ui/timeline/library/compactSkillSelection';
import { SkillPlacementTransaction } from '../../../ui/timeline/interaction/skillPlacementTransaction';
import { ScenarioEditorSession } from '../../editor/scenarioEditorSession';
import {
  projectSkillCastActualDurationFrames,
  projectSkillCastActualStartFrames,
} from '../../../core/projection/timelineDisplayTime';
import { projectTimelineHitOccurrences } from '../../../ui/timeline/results/timelineHitEffects';

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

function createChain(operator: OperatorDefinition) {
  const scenario = createEmptyScenario(`chain:${operator.slug}`, '正式模拟普攻接续边界');
  scenario.battle.durationFrames = 240;
  scenario.tracks[0] = {
    id: 'track:0',
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
  let id = 0;
  // 仅复用技能库的顺序及稳定身份；所有候选时刻均在下方重新指定。
  return placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator,
    skillGroupKey: 'basicAttack',
    startFrame: 1,
    ids: { allocate: () => `cast:${id++}` },
  }).scenario;
}

describe('generated basic attack chain input timing', () => {
  it('浮空连携通过原生切换退出，不等待静态预览的六秒结束点', async () => {
    const scenario = createChain(operators.typhoeus);
    scenario.tracks[0]!.skillCasts = [];
    const battle = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: operators.typhoeus,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: () => 'floating:battle' },
    });
    const combo = placeSkillGroup({
      scenario: battle.scenario,
      trackIndex: 0,
      operator: operators.typhoeus,
      skillGroupKey: 'comboSkill',
      skillKey: 'chr_0034_typhoea_combo_skillfloating',
      startFrame: 30,
      ids: { allocate: () => 'floating:combo' },
    });
    const run = await service.simulate(combo.scenario, 240);
    const interrupted = run.receiptEntries.find(
      entry => entry.data?.castId === 'floating:combo' && entry.event === 'SkillInterrupted',
    );
    expect(interrupted).toMatchObject({ frame: 97, data: { reason: 'castNextSkill' } });
    expect(
      run.receiptEntries.some(
        entry =>
          entry.frame === 97 &&
          entry.event === 'SkillStarted' &&
          entry.data?.skillId === 'chr_0034_typhoea_normal_skill_floating_loop',
      ),
    ).toBe(true);
  });
  it('陈千语连携块尾可接 A1，战技提前窗口不缩短块宽', async () => {
    const scenario = createChain(operators.chenQianyu);
    const track = scenario.tracks[0]!;
    track.skillCasts = [
      {
        id: 'chen:combo',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0005_chen_combo_skill',
        },
        placement: { startFrame: 1 },
      },
    ];
    const first = await service.simulate(scenario, 100);
    const width = projectSkillCastActualDurationFrames(first.receiptEntries).get('chen:combo')!;
    expect(width).toBeGreaterThanOrEqual(41);
    track.skillCasts.push({
      id: 'chen:a1',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0005_chen_attack1',
      },
      placement: { startFrame: 1 + width },
    });
    const next = await service.simulate(scenario, 100);
    expect(
      next.receiptEntries.filter(
        entry =>
          entry.event === 'SkillInputCannotInterruptCurrentSkill' &&
          entry.data?.castId === 'chen:a1',
      ),
    ).toEqual([]);
    expect(projectSkillCastActualStartFrames(next.receiptEntries).get('chen:a1')).toBe(1 + width);
  });

  it('提弗洛斯强化普攻按各段第一次原生输入窗口紧凑放置', async () => {
    const scenario = createChain(operators.typhoeus);
    scenario.battle.durationFrames = 240;
    scenario.tracks[0]!.skillCasts = [];
    const battleSkill = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: operators.typhoeus,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: () => 'typhoeus:battle' },
    });
    let nextId = 0;
    const enhanced = placeLibrarySkillGroup({
      scenario: battleSkill.scenario,
      trackIndex: 0,
      operator: operators.typhoeus,
      skillGroupKey: 'basicAttack',
      variantKey: 'enhancedBasicAttack',
      startFrame: 30,
      ids: { allocate: () => `typhoeus:floating:${nextId++}` },
    });

    expect(
      enhanced.scenario.tracks[0]!.skillCasts.filter(cast =>
        cast.id.startsWith('typhoeus:floating:'),
      ).map(cast => cast.placement.startFrame),
    ).toEqual([30, 49, 68, 87, 116]);

    const run = await service.simulate(enhanced.scenario, 240);
    expect(
      run.receiptEntries
        .filter(
          entry =>
            entry.event === 'SkillInputProcessed' &&
            String(entry.data?.castId).startsWith('typhoeus:floating:'),
        )
        .map(entry => [entry.data?.castId, entry.frame, entry.data?.accepted]),
    ).toEqual([
      ['typhoeus:floating:0', 30, true],
      ['typhoeus:floating:1', 49, true],
      ['typhoeus:floating:2', 68, true],
      ['typhoeus:floating:3', 87, true],
      ['typhoeus:floating:4', 116, true],
    ]);
    expect(
      run.receiptEntries.filter(
        entry =>
          entry.event === 'SkillInputResolutionUnknown' ||
          entry.event === 'SkillInputInterruptionUnknown',
      ),
    ).toEqual([]);
    const burstHits = run.receiptEntries.filter(
      entry => entry.event === 'DamageApplied' && typeof entry.data?.spellBurstType === 'string',
    );
    expect(burstHits.length).toBeGreaterThan(0);
    const skillMarkerDamageCount = [...projectTimelineHitOccurrences(run.receiptEntries).values()]
      .flat()
      .reduce((total, occurrence) => total + occurrence.label.damage.length, 0);
    expect(skillMarkerDamageCount).toBe(
      run.receiptEntries.filter(
        entry => entry.event === 'DamageApplied' && entry.data?.spellBurstType === undefined,
      ).length,
    );

    const groupedScenario = groupPlacedSkillSequence(enhanced.scenario, enhanced.skillCastIds);
    const groupedRun = await service.simulate(groupedScenario, 240);
    const select = (values: ReadonlyMap<string, number>) =>
      new Map([...values].filter(([id]) => enhanced.skillCastIds.includes(id)));
    expect(select(projectSkillCastActualStartFrames(groupedRun.receiptEntries))).toEqual(
      select(projectSkillCastActualStartFrames(run.receiptEntries)),
    );
    expect(select(projectSkillCastActualDurationFrames(groupedRun.receiptEntries))).toEqual(
      select(projectSkillCastActualDurationFrames(run.receiptEntries)),
    );
  });

  it('伊冯未开启强化时回退为12345重击六段，原场景不留下推测前缀', async () => {
    const scenario = createChain(operators.yvonne);
    scenario.battle.durationFrames = 650;
    scenario.tracks[0]!.skillCasts = [];
    let nextId = 0;
    const placed = placeLibrarySkillGroup({
      scenario,
      trackIndex: 0,
      operator: operators.yvonne,
      skillGroupKey: 'basicAttack',
      variantKey: 'enhancedBasicAttack',
      startFrame: 1,
      ids: { allocate: () => `fallback:${nextId++}` },
    });
    const transaction = new SkillPlacementTransaction(service, () => 0);
    const result = await transaction.resolve(placed);
    expect(result?.incomplete).toBe(true);
    expect(result?.skillCastIds).toHaveLength(6);
    expect(
      result?.scenario.tracks[0]!.skillCasts.map(cast =>
        cast.source.kind === 'operatorSkill' ? cast.source.skillKey : '',
      ),
    ).toEqual([
      'chr_0017_yvonne_ult_attack1_1',
      'chr_0017_yvonne_ult_attack2_1',
      'chr_0017_yvonne_ult_attack2_2',
      'chr_0017_yvonne_ult_attack3_1',
      'chr_0017_yvonne_ult_attack3_2',
      'chr_0017_yvonne_ult_attack_end',
    ]);
    expect(result?.scenario).toEqual(placed.fallback?.scenario);
    expect(scenario.tracks[0]!.skillCasts).toHaveLength(0);
  });
  it.each([66, 96])(
    '伊冯强化整组从A1按实际块尾递归续段，重复A5直到重击（起始%s帧）',
    async startFrame => {
      let scenario = createChain(operators.yvonne);
      scenario.battle.durationFrames = 650;
      scenario.tracks[0]!.skillCasts = [];
      scenario.tracks[0]!.initialState.ultimateEnergy = 200;
      scenario = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: operators.yvonne,
        skillGroupKey: 'ultimate',
        startFrame: 1,
        ids: { allocate: () => 'ultimate' },
      }).scenario;
      let nextId = 0;
      const placed = placeLibrarySkillGroup({
        scenario,
        trackIndex: 0,
        operator: operators.yvonne,
        skillGroupKey: 'basicAttack',
        variantKey: 'enhancedBasicAttack',
        startFrame,
        ids: { allocate: () => `enhanced:${nextId++}` },
      });
      expect(placed.skillCastIds).toHaveLength(1);
      const result = await service.planSkillChain(
        placed.scenario,
        placed.skillCastIds,
        650,
        undefined,
        'continuation',
        placed.extension,
      );
      expect(result.status).toBe('planned');
      if (result.status !== 'planned') return;
      const casts = result.scenario.tracks[0]!.skillCasts.filter(cast => cast.id !== 'ultimate');
      const keys = casts.map(cast =>
        cast.source.kind === 'operatorSkill' ? cast.source.skillKey : '',
      );
      expect(keys.slice(0, 5)).toEqual([
        'chr_0017_yvonne_ult_attack1_1',
        'chr_0017_yvonne_ult_attack2_1',
        'chr_0017_yvonne_ult_attack2_2',
        'chr_0017_yvonne_ult_attack3_1',
        'chr_0017_yvonne_ult_attack3_2',
      ]);
      expect(keys.filter(key => key === 'chr_0017_yvonne_ult_attack3_2').length).toBeGreaterThan(1);
      expect(keys.at(-1)).toBe('chr_0017_yvonne_ult_attack_end');
      expect(casts.length).toBeLessThanOrEqual(24);
      expect(casts[0]!.placement.startFrame).toBe(startFrame);
      for (let i = 1; i < casts.length; i++)
        expect(casts[i]!.placement.startFrame).toBeGreaterThan(casts[i - 1]!.placement.startFrame!);
      const groupedScenario = groupPlacedSkillSequence(result.scenario, result.skillCastIds!);
      const groupedRun = await service.simulate(groupedScenario, 650);
      const acceptedFrames = (entries: typeof result.run.receiptEntries) =>
        entries
          .filter(
            entry =>
              entry.event === 'SkillInputProcessed' &&
              entry.data?.accepted === true &&
              result.skillCastIds?.includes(String(entry.data.castId)),
          )
          .map(entry => [entry.data!.castId, entry.frame]);
      expect(acceptedFrames(groupedRun.receiptEntries)).toEqual(
        acceptedFrames(result.run.receiptEntries),
      );
      expect(placed.scenario.tracks[0]!.skillCasts).toHaveLength(2);
      expect(
        result.run.receiptEntries.filter(
          entry =>
            result.skillCastIds?.includes(String(entry.data?.castId)) &&
            entry.event.startsWith('SkillInput') &&
            entry.event !== 'SkillInputProcessed',
        ),
      ).toEqual([]);
    },
  );
  it.each(
    operatorDefinitions.flatMap(operator =>
      [-60, 0, 1].map(startFrame => ({ operator, startFrame })),
    ),
  )(
    '$operator.slug compact layout at $startFrame is stable when applied twice',
    async ({ operator, startFrame }) => {
      const scenario = createChain(operator);
      scenario.battle.durationFrames = 600;
      scenario.tracks[0]!.skillCasts.forEach((cast, i) => {
        cast.placement.startFrame = startFrame + i * 80;
      });
      const ids = scenario.tracks[0]!.skillCasts.map(cast => cast.id);
      const before = structuredClone(scenario);
      const first = await service.planSkillChain(scenario, ids, 600, undefined, 'compact');
      expect(first.status).toBe('planned');
      if (first.status !== 'planned') return;
      const second = await service.planSkillChain(first.scenario, ids, 600, undefined, 'compact');
      expect(second.status).toBe('planned');
      if (second.status !== 'planned') return;
      expect(second.scenario).toEqual(first.scenario);
      expect(scenario).toEqual(before);
      expect(first.scenario.tracks[0]!.skillCasts[0]!.placement.startFrame).toBe(startFrame);
    },
  );
  it.each([false, true])(
    'preserves same-frame document order when selected cast is first: %s',
    async selectedFirst => {
      const scenario = createChain(perlica);
      scenario.tracks[0]!.skillCasts = scenario.tracks[0]!.skillCasts.slice(-1);
      scenario.tracks[0]!.skillCasts[0]!.placement.startFrame = 1;
      const battle = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'battleSkill',
        startFrame: 10,
        ids: { allocate: () => 'unselected:battle' },
      });
      const placed = placeSkillGroup({
        scenario: battle.scenario,
        trackIndex: 0,
        operator: perlica,
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0004_pelica_attack1',
        startFrame: 100,
        ids: { allocate: () => 'selected:basic' },
      });
      if (selectedFirst) {
        const casts = placed.scenario.tracks[0]!.skillCasts;
        placed.scenario.tracks[0]!.skillCasts = [casts[0]!, casts[2]!, casts[1]!];
      }
      const before = structuredClone(placed.scenario);
      const result = await service.planSkillChain(
        placed.scenario,
        ['cast:3', 'selected:basic'],
        240,
        undefined,
        'compact',
      );
      expect(result.status).toBe('planned');
      if (result.status !== 'planned') return;
      const interruption = result.run.receiptEntries.find(
        entry => entry.event === 'SkillInterrupted' && entry.data?.castId === 'cast:3',
      );
      expect(interruption?.frame).toBe(10);
      expect(
        result.scenario.tracks[0]!.skillCasts.find(c => c.id === 'selected:basic')!.placement
          .startFrame,
      ).toBe(10);
      expect(result.scenario.tracks[0]!.skillCasts.find(c => c.id === 'unselected:battle')).toEqual(
        before.tracks[0]!.skillCasts.find(c => c.id === 'unselected:battle'),
      );
      expect(placed.scenario).toEqual(before);
      expect(
        result.run.receiptEntries
          .filter(entry => entry.event === 'SkillInputProcessed' && entry.frame === 10)
          .map(entry => entry.data?.castId),
      ).toEqual(
        selectedFirst
          ? ['selected:basic', 'unselected:battle']
          : ['unselected:battle', 'selected:basic'],
      );
      const repeated = await service.planSkillChain(
        result.scenario,
        ['cast:3', 'selected:basic'],
        240,
        undefined,
        'compact',
      );
      expect(repeated.status).toBe('planned');
      if (repeated.status === 'planned') expect(repeated.scenario).toEqual(result.scenario);
    },
  );
  it('keeps the complete authored chain undoable when the planning service throws', async () => {
    const authored = createChain(perlica);
    const original = structuredClone(authored);
    original.tracks[0]!.skillCasts = [];
    const session = new ScenarioEditorSession(original);
    const error = new Error('unsupported simulation data');
    const transaction = new SkillPlacementTransaction(
      {
        planSkillChain: () => {
          throw error;
        },
      },
      () => session.snapshot.revision,
    );
    const result = await transaction.resolve({
      scenario: authored,
      skillCastIds: authored.tracks[0]!.skillCasts.map(cast => cast.id),
    });
    expect(result).toEqual({ scenario: authored, incomplete: true, error });
    if (!result) return;
    session.commit('placeSkillGroup', () => result.scenario);
    expect(session.snapshot.scenario).toEqual(authored);
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario).toEqual(original);
    expect(session.canUndo).toBe(false);
    expect(session.redo()).toBe(true);
    expect(session.snapshot.scenario).toEqual(authored);
  });
  it('compacts Perlica heavy attack then battle skill despite the anchor input warning', async () => {
    const scenario = createChain(perlica);
    scenario.tracks[0]!.skillCasts = scenario.tracks[0]!.skillCasts.slice(-1);
    scenario.tracks[0]!.skillCasts[0]!.placement.startFrame = 1;
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 100,
      ids: { allocate: () => 'battle:probe' },
    });
    const result = await service.planSkillChain(
      placed.scenario,
      ['cast:3', 'battle:probe'],
      240,
      undefined,
      'compact',
    );
    expect(result.status).toBe('planned');
    if (result.status !== 'planned') return;
    expect(result.scenario.tracks[0]!.skillCasts.map(c => c.placement.startFrame)).toEqual([1, 46]);
    expect(
      result.run.availabilityDiagnostics.some(
        d => d.skillId === 'chr_0004_pelica_attack4' && d.reasons.includes('skillInputMismatch'),
      ),
    ).toBe(true);
    expect(
      result.run.receiptEntries.filter(e => e.event === 'DamageApplied').map(e => e.frame),
    ).toContain(29); // 第28帧发射，下一帧Default阶段处理投射物命中。
  });
  it('compacts selected existing casts in time order as one undoable operation', async () => {
    const scenario = createChain(lifeng);
    const casts = scenario.tracks[0]!.skillCasts;
    casts.forEach((cast, i) => {
      cast.placement.startFrame = 1 + i * 50;
    });
    const untouched = structuredClone(casts[0]!);
    untouched.id = 'unselected';
    untouched.placement.startFrame = 220;
    casts.push(untouched);
    // Document order need not equal time order.
    scenario.tracks[0]!.skillCasts = [casts[2]!, casts[0]!, casts[3]!, casts[1]!, untouched];
    const selection = resolveCompactSkillSelection(
      scenario,
      new Set(['cast:3', 'cast:1', 'cast:0', 'cast:2']),
    );
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;
    const session = new ScenarioEditorSession(scenario);
    const transaction = new SkillPlacementTransaction(service, () => session.snapshot.revision);
    const result = await transaction.resolve(
      { scenario, skillCastIds: selection.castIds },
      'compact',
    );
    expect(result?.incomplete).toBe(false);
    if (!result || result.incomplete) return;
    const byId = new Map(result.scenario.tracks[0]!.skillCasts.map(cast => [cast.id, cast]));
    expect(selection.castIds.map(id => byId.get(id)!.placement.startFrame)).toEqual([
      1, 28, 49, 69,
    ]);
    expect(byId.get('unselected')).toEqual(untouched);
    const run = await service.simulate(result.scenario, 240);
    for (let i = 1; i < selection.castIds.length; i++) {
      const boundary = run.receiptEntries.find(
        entry =>
          entry.event === 'SkillOperableBoundaryReached' &&
          entry.data?.castId === selection.castIds[i - 1],
      );
      expect(boundary).toBeDefined();
      expect(byId.get(selection.castIds[i]!)!.placement.startFrame).toBe(boundary!.frame + 1);
    }
    session.commit('compactSelectedSkills', () => result.scenario);
    expect(session.undo()).toBe(true);
    expect(session.snapshot.scenario).toEqual(scenario);
    expect(session.canUndo).toBe(false);
    expect(session.redo()).toBe(true);
    expect(session.snapshot.scenario).toEqual(result.scenario);
  });

  it.each([-60, 0, 1])(
    'plans a hit-stop-aware chain at %s without rewriting existing placements',
    async startFrame => {
      const scenario = createChain(lifeng);
      const casts = scenario.tracks[0]!.skillCasts;
      casts.forEach(cast => {
        cast.placement = { startFrame: cast.placement.startFrame! + startFrame - 1 };
      });
      const ids = casts.map(cast => cast.id);
      const before = structuredClone(scenario);
      const result = await service.planSkillChain(scenario, ids, 240);
      expect(scenario).toEqual(before);
      expect(result.status).toBe('planned');
      if (result.status !== 'planned') return;
      expect(result.scenario.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual(
        [1, 28, 48, 68].map(frame => frame + startFrame - 1),
      );
      expect(result.run.availabilityDiagnostics).toEqual([]);
      expect(result.scenario.tracks[0]!.skillCasts.map(cast => cast.id)).toEqual(ids);
    },
  );

  it('returns incomplete at the requested horizon without moving the source chain', async () => {
    const scenario = createChain(lifeng);
    const before = structuredClone(scenario);
    const ids = scenario.tracks[0]!.skillCasts.map(cast => cast.id);
    const result = await service.planSkillChain(scenario, ids, 20);
    expect(result).toEqual({ status: 'incomplete', unresolvedCastIds: ids.slice(1) });
    expect(scenario).toEqual(before);
  });

  it('retains the simulated compact prefix when the horizon ends before the last cast', async () => {
    const scenario = createChain(lifeng);
    const before = structuredClone(scenario);
    const ids = scenario.tracks[0]!.skillCasts.map(cast => cast.id);
    const result = await service.planSkillChain(scenario, ids, 55, undefined, 'compact');
    expect(result).toEqual({
      status: 'incomplete',
      unresolvedCastIds: [ids[3]],
      plannedStartFrames: new Map([
        [ids[0], 1],
        [ids[1], 28],
        [ids[2], 49],
      ]),
    });
    expect(scenario).toEqual(before);
  });

  it.each([-60, 0, 1])(
    'compacts at %s without clamping the author anchor to combat start',
    async startFrame => {
      const scenario = createChain(lifeng);
      scenario.tracks[0]!.skillCasts.forEach((cast, index) => {
        cast.placement.startFrame = startFrame + index * 50;
      });
      const before = structuredClone(scenario);
      const ids = scenario.tracks[0]!.skillCasts.map(cast => cast.id);
      const result = await service.planSkillChain(scenario, ids, 240, undefined, 'compact');
      expect(result.status).toBe('planned');
      if (result.status !== 'planned') return;
      expect(result.scenario.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual(
        [0, 27, 48, 68].map(offset => startFrame + offset),
      );
      expect(scenario).toEqual(before);
    },
  );

  it('does not start planning an aborted request', async () => {
    const scenario = createChain(lifeng);
    const controller = new AbortController();
    controller.abort();
    await expect(
      service.planSkillChain(
        scenario,
        scenario.tracks[0]!.skillCasts.map(cast => cast.id),
        240,
        controller.signal,
      ),
    ).rejects.toThrow();
  });

  it.each([
    { operator: perlica, expected: [1, 18, 37, 64] },
    { operator: lifeng, expected: [1, 28, 48, 68] },
  ])(
    '$operator.slug finds the earliest legal input from actual simulation',
    async ({ operator, expected }) => {
      const scenario = createChain(operator);
      const originalCasts = structuredClone(scenario.tracks[0]!.skillCasts);
      const starts = [1];
      for (let index = 1; index < originalCasts.length; index++) {
        let found = false;
        // 不读 timelineBlockFrames 或展示边界，也不借助无限推迟规避失败。
        // 每一帧重放完整前缀，确保前段实际命中产生的停帧仍参与判断。
        for (let frame = starts[index - 1]! + 1; frame < 200; frame++) {
          scenario.tracks[0]!.skillCasts = structuredClone(originalCasts.slice(0, index + 1));
          scenario.tracks[0]!.skillCasts.forEach((cast, castIndex) => {
            cast.placement.startFrame = castIndex === index ? frame : starts[castIndex]!;
          });
          const run = await service.simulate(scenario, 240);
          const candidateDiagnostics = run.availabilityDiagnostics.filter(d => d.frame === frame);
          if (candidateDiagnostics.some(d => d.reasons.includes('skillInterruptUnavailable')))
            continue;
          // 不能把身份不匹配或未知条件当成已找到合法接续。
          expect(run.availabilityDiagnostics).toEqual([]);
          starts.push(frame);
          found = true;
          break;
        }
        expect(found, `${operator.slug} stage ${index + 1} had no legal candidate`).toBe(true);
      }
      expect(starts).toEqual(expected);

      // 每个已确认边界提前一帧仍必须报错，不能通过取消校验达成连段。
      for (let index = 1; index < originalCasts.length; index++) {
        scenario.tracks[0]!.skillCasts = structuredClone(originalCasts.slice(0, index + 1));
        scenario.tracks[0]!.skillCasts.forEach((cast, castIndex) => {
          cast.placement.startFrame = starts[castIndex]! - (castIndex === index ? 1 : 0);
        });
        const run = await service.simulate(scenario, 240);
        const castSource = originalCasts[index]!.source;
        expect(run.availabilityDiagnostics).toContainEqual(
          expect.objectContaining({
            frame: starts[index]! - 1,
            skillId: castSource.kind === 'operatorSkill' ? castSource.skillKey : undefined,
            reasons: expect.arrayContaining(['skillInterruptUnavailable']),
          }),
        );
      }

      scenario.tracks[0]!.skillCasts = structuredClone(originalCasts);
      scenario.tracks[0]!.skillCasts.forEach((cast, index) => {
        cast.placement.startFrame = starts[index]!;
      });
      const run = await service.simulate(scenario, 240);
      expect(run.availabilityDiagnostics).toEqual([]);
      if (operator.slug === lifeng.slug) {
        const ownerStops = run.receiptEntries
          .filter(
            entry =>
              entry.event === 'TimeDilationStarted' &&
              entry.targetId === 'track:0' &&
              entry.data?.slot === 'TimeDilation/Layer/Entity/HitStop',
          )
          .map(entry => ({
            frame: entry.frame,
            skill: entry.data?.sourceActionId,
            duration: entry.data?.durationSeconds,
          }));
        expect(ownerStops).toEqual([
          { frame: 10, skill: 'chr_0015_lifeng_attack1', duration: 0.067 },
          { frame: 19, skill: 'chr_0015_lifeng_attack1', duration: 0.067 },
          { frame: 32, skill: 'chr_0015_lifeng_attack2', duration: 0.1 },
          { frame: 59, skill: 'chr_0015_lifeng_attack3', duration: 0.167 },
          { frame: 92, skill: 'chr_0015_lifeng_attack5', duration: 0.3 },
        ]);
      }
    },
  );
});
