import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { skillSettings } from '../../../data/combat/skillSettings';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import {
  projectAttachmentContinuations,
  projectAttachmentConversionLinks,
} from '../../../core/projection/attachmentContinuations';
import { projectEnemyEffectViz } from '../../../core/projection/enemyEffectViz';

it.each(['repeat', 'convert', 'consume'])(
  'connects actual infliction instances: %s',
  async mode => {
    const scenario = createEmptyScenario('attachment', 'attachment');
    scenario.battle.durationFrames = 240;
    scenario.tracks[0] = {
      id: 'track:0',
      operator: {
        operatorSlug: 'perlica',
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
      skillCasts: [1, 100].map((startFrame, index) => ({
        id: `cast:${index}`,
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0004_pelica_normal_skill',
        },
        placement: { startFrame },
      })),
    };
    if (mode !== 'repeat') {
      const second = structuredClone(scenario.tracks[0]!);
      second.id = 'track:1';
      second.operator!.operatorSlug = mode === 'consume' ? 'perlica' : 'wulfgard';
      second.skillCasts = second.skillCasts.slice(1);
      if (mode === 'convert' && second.skillCasts[0]?.source.kind === 'operatorSkill') {
        second.skillCasts[0].source.skillKey = 'chr_0006_wolfgd_normal_skill';
      }
      scenario.tracks[1] = second;
      scenario.tracks[0]!.skillCasts = scenario.tracks[0]!.skillCasts.slice(0, 1);
      if (mode === 'consume') {
        scenario.tracks[0]!.operator!.operatorSlug = 'wulfgard';
        const firstSource = scenario.tracks[0]!.skillCasts[0]?.source;
        if (firstSource?.kind === 'operatorSkill') {
          firstSource.skillKey = 'chr_0006_wolfgd_normal_skill';
        }
        const third = structuredClone(second);
        third.id = 'track:2';
        third.operator!.operatorSlug = 'arclight';
        const thirdSource = third.skillCasts[0]?.source;
        if (thirdSource?.kind === 'operatorSkill') {
          thirdSource.skillKey = 'chr_0007_ikut_normal_skill';
        }
        third.skillCasts[0]!.id = 'cast:consume';
        third.skillCasts[0]!.placement.startFrame = 180;
        scenario.tracks[2] = third;
      }
    }
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
    const run = await service.simulate(scenario, 240);
    if (mode !== 'repeat') {
      const viz = projectEnemyEffectViz(run.receiptEntries, 240);
      const conversions = viz.attachmentConversions ?? [];
      expect(conversions).toHaveLength(1);
      const allSegments = projectBuffTimelineViz(run.receiptEntries, 240);
      const links = projectAttachmentConversionLinks(allSegments, conversions);
      expect(links.size).toBe(1);
      const [head, tail] = [...links][0]!;
      expect(head.buffId).not.toBe(tail.buffId);
      expect(head.endFrame).toBe(tail.startFrame);
      expect(viz.markers.filter(marker => marker.kind === 'attachmentTrigger')).toEqual([
        {
          frame: head.endFrame,
          kind: 'attachmentTrigger',
          element: mode === 'consume' ? 'electric' : 'heat',
        },
      ]);
      if (mode === 'consume') {
        const finished = run.receiptEntries.filter(
          entry =>
            entry.event === 'BuffFinished' &&
            entry.data?.buffId === tail.buffId &&
            entry.data?.instanceId === tail.instanceId,
        );
        expect(finished).toHaveLength(1);
        expect(finished[0]!.data?.reason).toBe('early');
        expect(tail.endFrame).toBe(finished[0]!.frame);
        expect(tail.endFrame).toBeGreaterThan(180);
        expect(tail.endFrame).toBeLessThan(240);
        // 旧版 ENEMY_EFFECT_EXPIRE 只截短持续段；不为原生消费制造额外图标。
        expect(viz.markers.filter(marker => marker.kind === 'reactionConsumed')).toEqual([]);
      }
      return;
    }
    const ids = new Set(
      elementalAttachments.buffs
        .filter(buff => buff.role?.kind === 'elementalAttachment')
        .map(buff => buff.id),
    );
    const segments = projectBuffTimelineViz(run.receiptEntries, 240).filter(segment =>
      ids.has(segment.buffId),
    );
    expect(segments.map(segment => segment.layers)).toEqual([1, 2]);
    expect(segments[0]!.endFrame).toBe(segments[1]!.startFrame);
    expect([...projectAttachmentContinuations(segments, ids)]).toEqual([segments[0]]);
    expect(segments.every(segment => Boolean(segment.iconId || segment.iconPath))).toBe(true);
  },
);
