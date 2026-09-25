import { describe, expect, it } from 'vitest';
import { ExplicitCriticalSampleSource } from '../../../core/combat/random/criticalSampleSource';
import { ExplicitProbabilitySampleSource } from '../../../core/combat/random/probabilitySampleSource';
import type { SkillDefinition } from '../../../core/game-data/operatorDefinition';
import { compileOperatorEntityBlackboardInitialValues } from '../../../core/compiler/compileScenarioRuntimeAssembly';
import { compileOperatorDefinitionSkills } from '../../../core/compiler/compileScenarioTimeline';
import { resolveOperatorPanel } from '../../../core/compiler/resolveOperatorPanel';
import { resolveScenarioBuilds } from '../../../core/compiler/resolveScenarioBuilds';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { SkillCastDocument } from '../../../core/project/schema';
import { projectSkillEnhancementTimelineViz } from '../../../core/projection/skillEnhancementTimelineViz';
import { projectOperatorPassiveUiTimelineViz } from '../../../core/projection/operatorPassiveUiTimelineViz';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { compoundStatusFactories } from '../../../data/buffs/compoundStatusFactories';
import { skillSettings } from '../../../data/combat/skillSettings';
import { scheduled, sequence, step } from '../../../data/operators/definitionHelpers';
import {
  alesh,
  antal,
  arcane,
  arclight,
  ardelia,
  avywenna,
  catcher,
  camille,
  daPan,
  ember,
  endministrator,
  estella,
  fluorite,
  gilberta,
  laevatain,
  lastRite,
  lifeng,
  liino,
  perlica,
  pogranichnik,
  rossi,
  snowshine,
  tangtang,
  wulfgard,
  xaihi,
  yvonne,
  zhuangFangyi,
} from '../../../data/operators';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { getSkill } from '../../../data/operators/testUtils';
const laevatainBasicAttack1 = getSkill(laevatain, 'chr_0016_laevat_attack1');
import { projectTimelineEditor } from '../../../ui/timeline/timelineEditorViewModel';
import {
  projectHitEffectsByCast,
  projectTimelineHitActualFrames,
} from '../../../ui/timeline/results/timelineHitEffects';
import { runStandardPlayerDamageScenarioSimulation } from '../runStandardPlayerDamageScenarioSimulation';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';
import { createDefaultOperatorInstance } from '../../editor/loadoutBuildFactory';

/** 每次放置独立计数；对照场景可复用相同前缀，但同一次多段放置不能共享释放身份。 */
function numberedPlacementIds(prefix: string) {
  let nextId = 0;
  return { allocate: (kind: string) => `${kind}:${prefix}:${++nextId}` };
}

describe('registered generated operators', () => {
  it.each(['basicAttack', 'battleSkill', 'comboSkill', 'ultimate'])(
    '新注册的 purrchena %s 可经页面模拟入口完整执行',
    async skillGroupKey => {
      const operator = gameDataRepository.getOperator('purrchena');
      if (!operator) throw new Error('purrchena is not registered');
      const scenario = createEmptyScenario('scenario:purrchena', '新干员正式入口');
      scenario.battle.durationFrames = 600;
      scenario.tracks[0] = {
        id: 'track:purrchena',
        operator: createDefaultOperatorInstance(operator),
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator,
        skillGroupKey,
        startFrame: 1,
        ids: numberedPlacementIds('purrchena'),
      }).scenario;
      expect(placed.tracks[0]!.skillCasts.length).toBeGreaterThan(0);
      const result = await createEditorSimulationService().simulate(placed, 600);
      expect(
        result.receiptEntries.some(
          entry => entry.event === 'SkillStarted' && entry.sourceId === 'track:purrchena',
        ),
      ).toBe(true);
      if (skillGroupKey === 'battleSkill') {
        const firstCast = placed.tracks[0]!.skillCasts[0]!;
        expect(
          result.receiptEntries.filter(
            entry =>
              entry.event === 'SkillOperableBoundaryReached' && entry.data?.castId === firstCast.id,
          ),
        ).toHaveLength(1);
        // 战技先进入格挡姿态；没有敌方攻击时不凭空触发反击伤害。
        expect(
          result.receiptEntries.some(
            entry =>
              entry.event === 'BuffApplied' &&
              entry.data?.buffId === 'buff_chr_0038_purrche_aura_block',
          ),
        ).toBe(true);
      } else {
        expect(
          result.receiptEntries.some(
            entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:purrchena',
          ),
        ).toBe(true);
      }
    },
  );

  it('使命必达通过连携绑定编号识别击飞，并在十五秒后结束增伤', async () => {
    const scenario = createEmptyScenario('scenario:delivery-affix', '使命必达连携监听回归');
    scenario.battle.durationFrames = 700;
    scenario.tracks[0] = {
      id: 'track:gilberta',
      operator: {
        operatorSlug: 'gilberta',
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: {
        weaponSlug: 'wpn_funnel_0011',
        level: 90,
        tuned: true,
        potential: 5,
        traitLevels: [9, 9, 9],
      },
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [0, 120].map((startFrame, i) => ({
        id: `cast:delivery:${i}`,
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0013_aglina_combo_skill',
        },
        placement: { startFrame },
      })),
    };
    const { receiptEntries } = await createEditorSimulationService().simulate(scenario, 700);
    const applied = receiptEntries.filter(
      e => e.event === 'BuffApplied' && e.data?.buffId === 'buff_wpn_funnel_0011_valid',
    );
    expect(applied.length).toBeGreaterThan(0);
    const last = applied.at(-1)!;
    expect(receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'BuffFinished',
        frame: last.frame + 450,
        data: expect.objectContaining({ buffId: 'buff_wpn_funnel_0011_valid' }),
      }),
    );
  });
  it('applies Estella potential-3 DamageScaleProcessor only to the first battle-skill hit', () => {
    const run = (potential: 2 | 3) => {
      const scenario = createEmptyScenario(`scenario:estella:${potential}`, '艾斯黛拉战技倍率回归');
      scenario.battle.durationFrames = 60;
      scenario.tracks[0] = {
        id: 'track:estella',
        operator: {
          operatorSlug: estella.slug,
          level: 90,
          promoted: true,
          potential,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: estella,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:estella:${potential}` },
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 60,
        criticalSamples: new ExplicitCriticalSampleSource([1]),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: false,
          },
        },
      });
    };
    const damage = (potential: 2 | 3) => {
      const result = run(potential);
      return Number(
        result.receiptEntries.find(entry => entry.event === 'DamageApplied')?.data?.value,
      );
    };
    const baseDamage = damage(2);
    const enhancedDamage = damage(3);
    expect(baseDamage).toBeGreaterThan(0);
    expect(enhancedDamage / baseDamage).toBeCloseTo(1.4, 5);
  });

  it.each([2, 120])(
    'resolves Liino player input through the active battle-skill replacement slot at %if',
    endAt => {
      const scenario = createEmptyScenario('scenario:liino:battle-skill-slot', '梨诺战技换槽回归');
      scenario.battle.durationFrames = 240;
      scenario.tracks[0] = {
        id: 'track:liino',
        operator: {
          operatorSlug: liino.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const started = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: liino,
        skillGroupKey: 'battleSkill',
        skillKey: 'chr_0035_liino_normal_skill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:liino:battle-start` },
      }).scenario;
      const ended = placeSkillGroup({
        scenario: started,
        trackIndex: 0,
        operator: liino,
        skillGroupKey: 'battleSkill',
        skillKey: 'chr_0035_liino_normal_skill_end',
        startFrame: endAt,
        ids: { allocate: kind => `${kind}:liino:battle-end` },
      }).scenario;

      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: ended,
        endFrame: 240,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: true,
          },
        },
      });

      expect(
        result.receiptEntries.filter(
          entry =>
            entry.data?.castId === 'skillCast:liino:battle-end' &&
            ['SkillStarted', 'SkillEnded', 'SkillCostApplied'].includes(entry.event),
        ),
      ).toEqual([]);
      expect(result.receiptEntries).toContainEqual(
        expect.objectContaining({
          event: 'BuffApplied',
          frame: endAt,
          data: expect.objectContaining({ buffId: 'buff_chr_0035_liino_normalskill_end_active' }),
        }),
      );
      if (endAt === 120) {
        const boundary = result.receiptEntries.find(
          entry =>
            entry.event === 'SkillOperableBoundaryReached' &&
            entry.data?.castId === 'skillCast:liino:battle-start',
        );
        expect(boundary?.frame).toBeGreaterThan(1);
        expect(boundary?.frame).toBeLessThan(120);
        expect(boundary?.data?.durationFrames).toBe(50);
        // The native listener begins at skill-local frame 90; test termination inside that window.
        for (const buffId of [
          'buff_chr_0035_liino_normalskill_music_tag',
          'buff_chr_0035_liino_normalskill_music_damage',
          'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
        ]) {
          expect(result.receiptEntries).toContainEqual(
            expect.objectContaining({
              event: 'BuffApplied',
              data: expect.objectContaining({ buffId }),
            }),
          );
          expect(result.receiptEntries).toContainEqual(
            expect.objectContaining({
              event: 'BuffFinished',
              frame: endAt,
              data: expect.objectContaining({ buffId }),
            }),
          );
        }
      }
      expect(result.receiptEntries).toContainEqual(
        expect.objectContaining({
          event: 'SkillSwitchedToBuff',
          sourceId: 'track:liino',
          data: expect.objectContaining({
            castId: 'skillCast:liino:battle-end',
            skillId: 'chr_0035_liino_normal_skill_end',
          }),
        }),
      );
    },
  );

  it('runs Liino combo end custom event through the native deferred-cast slot', () => {
    const scenario = createEmptyScenario('scenario:liino:deferred-combo', '梨诺连携延迟施法回归');
    scenario.battle.durationFrames = 120;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:liino',
      operator: {
        operatorSlug: liino.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const battle = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: liino,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0035_liino_normal_skill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:liino:deferred-battle` },
    }).scenario;
    const combo = placeSkillGroup({
      scenario: battle,
      trackIndex: 0,
      operator: liino,
      skillGroupKey: 'comboSkill',
      skillKey: 'chr_0035_liino_combo_skill',
      startFrame: 20,
      ids: { allocate: kind => `${kind}:liino:deferred-combo` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: combo,
      endFrame: 120,
      criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:liino',
        data: expect.objectContaining({ skillId: 'chr_0035_liino_normal_skill_combo' }),
      }),
    );
  });

  [false, true].forEach(terminate => {
    it(`runs Liino ultimate damage/healing with explicit termination=${terminate}`, () => {
      // The explicit-end case also guards synchronous listener reentry:
      // CreateBuff must not recursively restart the completed native guard.
      const scenario = createEmptyScenario('scenario:liino:ultimate', '梨诺终结技生产回归');
      scenario.battle.durationFrames = 650;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:liino',
        operator: {
          operatorSlug: liino.slug,
          level: 90,
          promoted: true,
          potential: 5,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 2, 1: 2 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 160, maxUltimateEnergyOverride: 160 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: liino,
        skillGroupKey: 'ultimate',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:liino:ultimate` },
      }).scenario;

      const simulatedScenario = terminate
        ? placeSkillGroup({
            scenario: placed,
            trackIndex: 0,
            operator: liino,
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0035_liino_normal_skill_end',
            startFrame: 180,
            ids: { allocate: kind => `${kind}:liino:ultimate-end` },
          }).scenario
        : placed;
      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: simulatedScenario,
        endFrame: 650,
        criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: true,
          },
        },
      });

      if (terminate) {
        expect(result.receiptEntries).toContainEqual(
          expect.objectContaining({
            event: 'SkillTimelineJumped',
            frame: 180,
            data: expect.objectContaining({ destinationFrame: 540 }),
          }),
        );
        expect(result.receiptEntries).toContainEqual(
          expect.objectContaining({
            event: 'BuffFinished',
            frame: 180,
            data: expect.objectContaining({ buffId: 'buff_chr_0035_liino_ultskill_music_damage' }),
          }),
        );
        expect(result.receiptEntries).toContainEqual(
          expect.objectContaining({
            event: 'BuffApplied',
            frame: 180,
            data: expect.objectContaining({ buffId: 'buff_chr_0035_liino_ultskill_end' }),
          }),
        );
        expect(
          result.receiptEntries.filter(
            entry =>
              entry.frame === 180 && ['SkillStarted', 'SkillCostApplied'].includes(entry.event),
          ),
        ).toEqual([]);
      }
      expect(result.receiptEntries).toContainEqual(
        expect.objectContaining({
          event: 'DamageApplied',
          sourceId: 'track:liino',
          targetId: 'enemy',
        }),
      );
      expect(result.receiptEntries).toContainEqual(
        expect.objectContaining({
          event: 'HealingApplied',
          sourceId: 'track:liino',
          targetId: 'track:liino',
        }),
      );
    });
  });

  it('runs Ardelia battle-skill damage and wires potential 1 into its conditional vulnerability', () => {
    const run = (potential: number) => {
      const scenario = createEmptyScenario(
        `scenario:ardelia:potential-${potential}`,
        'Ardelia 潜能一生产回归',
      );
      scenario.battle.durationFrames = 80;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:ardelia',
        operator: {
          operatorSlug: ardelia.slug,
          level: 90,
          promoted: true,
          potential,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 2, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const program = compileOperatorDefinitionSkills(
        'track:ardelia',
        scenario.tracks[0]!.operator!,
        ardelia,
      ).find(candidate => candidate.skillGroupKey === 'battleSkill')!;
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: ardelia,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids: { allocate: (kind: string) => `${kind}:ardelia:${potential}` },
      }).scenario;
      return {
        rateVulnerability: Number(program.initialBlackboard.rate_vul_base),
        result: runStandardPlayerDamageScenarioSimulation({
          scenario: placed,
          endFrame: 80,
          criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
          elementalInflictionDocument: elementalAttachments,
          resolveNonRandomRuntimeSnapshot: () => ({
            runtimeExtensionMultiplier: 1,
            appliesIgniteDamageMultiplier: false,
            appliesPhysicalInflictionDamageMultiplier: false,
          }),
          options: {
            index: gameDataRepository,
            resources: {
              sharedSpGain: { baseGainEfficiency: 1 },
              spRecoveryPauseDuration: 1.5,
              normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
              ultimateEnergySystemUnlocked: true,
            },
          },
        }),
      };
    };
    const base = run(0);
    const enhanced = run(1);
    const damage = (runResult: typeof base) =>
      runResult.result.receiptEntries.filter(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:ardelia',
      );

    expect(damage(base)).toHaveLength(1);
    expect(damage(enhanced)).toHaveLength(1);
    // 没有侵蚀状态时不会创建易伤；潜能只提高该条件分支写入的易伤率。
    expect(damage(enhanced)[0]?.data?.value).toBe(damage(base)[0]?.data?.value);
    expect(enhanced.rateVulnerability - base.rateVulnerability).toBeCloseTo(0.08);
  });

  it('applies Catcher potential 1 defense-scaled damage after each ultimate hit', () => {
    const run = (potential: number) => {
      const scenario = createEmptyScenario(
        `scenario:catcher:potential-${potential}`,
        'Catcher 潜能一生产回归',
      );
      scenario.battle.durationFrames = 150;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:catcher',
        operator: {
          operatorSlug: catcher.slug,
          level: 90,
          promoted: true,
          potential,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 80 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: catcher,
        skillGroupKey: 'ultimate',
        startFrame: 1,
        ids: { allocate: (kind: string) => `${kind}:catcher:${potential}` },
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 150,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: true,
          },
        },
      });
    };
    const hits = (potential: number) =>
      run(potential).receiptEntries.filter(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:catcher',
      );
    const base = hits(0);
    const enhanced = hits(1);
    const potentialHits = (entries: typeof enhanced) =>
      entries.filter(entry =>
        String(entry.data?.stepKey).includes('buff_chr_0020_meurs_potential_1'),
      );

    expect(potentialHits(base)).toHaveLength(0);
    // 原始终结技只有 46/64/85 三个 DamageAction；潜能追加伤害各触发一次。
    expect(potentialHits(enhanced)).toHaveLength(3);
    expect(enhanced).toHaveLength(base.length + 3);
    expect(enhanced.reduce((total, entry) => total + Number(entry.data?.value), 0)).toBeGreaterThan(
      base.reduce((total, entry) => total + Number(entry.data?.value), 0),
    );
  });

  it('runs Avywenna standalone battle skill through the registered production pipeline', () => {
    const scenario = createEmptyScenario('scenario:avywenna:battle', 'Avywenna 战技生产回归');
    scenario.battle.durationFrames = 80;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:avywenna',
      operator: {
        operatorSlug: avywenna.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    let nextId = 0;
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: avywenna,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: (kind: string) => `${kind}:avywenna:${++nextId}` },
    }).scenario;
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 80,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'DamageApplied', sourceId: 'track:avywenna' }),
    );
  });

  it('runs Avywenna ultimate block callback, lance spawn, and direct hit through production', () => {
    const scenario = createEmptyScenario('scenario:avywenna:ultimate', 'Avywenna 终结技生产回归');
    scenario.battle.durationFrames = 90;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:avywenna:ultimate',
      operator: {
        operatorSlug: avywenna.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: avywenna,
      skillGroupKey: 'ultimate',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:avywenna:ultimate` },
    }).scenario;
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 90,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntitySpawned',
        // 第46帧发射后，由下一次投射物 Tick 落地生成枪。
        frame: 47,
        sourceId: 'track:avywenna:ultimate',
        data: expect.objectContaining({
          abilityEntityId: 'abilityentity_chr_0012_avywen_ultimate_skill_lance',
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'DamageApplied',
        frame: 52,
        sourceId: 'track:avywenna:ultimate',
        targetId: 'enemy',
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'TimeDilationEnded',
        frame: 46,
        sourceId: 'track:avywenna:ultimate',
        data: expect.objectContaining({ slot: 'ultimate' }),
      }),
    );
  });

  it('runs Avywenna combo-lance return callbacks through the compiled production skill', () => {
    let scenario = createEmptyScenario('scenario:avywenna:return', 'Avywenna 回枪生产回归');
    scenario.battle.durationFrames = 120;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:avywenna:return',
      operator: {
        operatorSlug: avywenna.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0, maxUltimateEnergyOverride: 1000 },
      skillCasts: [],
    };
    let serial = 0;
    for (const [skillGroupKey, startFrame] of [
      ['comboSkill', 1],
      ['battleSkill', 40],
    ] as const) {
      scenario = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: avywenna,
        skillGroupKey,
        startFrame,
        ids: { allocate: kind => `${kind}:avywenna:return:${++serial}` },
      }).scenario;
    }
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario,
      endFrame: 120,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    expect(
      result.receiptEntries.filter(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:avywenna:return',
      ).length,
    ).toBeGreaterThanOrEqual(3);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'DamageApplied',
        // 回收弹体在第47帧发射，下一次投射物 Tick 命中。
        frame: 48,
        sourceId: 'track:avywenna:return',
        targetId: 'enemy',
      }),
    );
  });

  it('applies Xaihi ultimate Crystal enhancement to a later basic attack', () => {
    const enhancementSteps =
      xaihi.buffDefinitions?.['buff_chr_0011_seraph_atk_buff']?.lifecycleSequences?.start?.steps;
    expect(enhancementSteps?.slice(-2)).toMatchObject([
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff_common_affixes_enhance_crystal',
          stringBlackboardAssignments: {
            child_buff_id: 'buff_chr_0011_seraph_ultimate_effect',
          },
        },
      },
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff_common_affixes_enhance_natural',
          stringBlackboardAssignments: {
            child_buff_id: 'buff_chr_0011_seraph_ultimate_effect_2',
          },
        },
      },
    ]);
    expect(
      xaihi.buffDefinitions?.['buff_chr_0011_seraph_ultimate_effect']?.presentation?.visible,
    ).toBe(true);
    const run = (withUltimate: boolean) => {
      const scenario = createEmptyScenario(`scenario:xaihi:${withUltimate}`, '熙海终结技增幅回归');
      scenario.battle.durationFrames = 180;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:xaihi',
        operator: {
          operatorSlug: xaihi.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 80 },
        skillCasts: [],
      };
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:xaihi:${++nextId}` };
      let placed = scenario;
      if (withUltimate) {
        placed = placeSkillGroup({
          scenario: placed,
          trackIndex: 0,
          operator: xaihi,
          skillGroupKey: 'ultimate',
          startFrame: 1,
          ids,
        }).scenario;
      }
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: xaihi,
        skillGroupKey: 'basicAttack',
        startFrame: 100,
        ids,
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 180,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: true,
          },
        },
      });
    };

    const damage = (result: ReturnType<typeof run>) =>
      Number(
        result.receiptEntries.find(
          entry =>
            entry.event === 'DamageApplied' &&
            entry.sourceId === 'track:xaihi' &&
            entry.frame >= 100,
        )?.data?.value,
      );
    const base = damage(run(false));
    const enhanced = damage(run(true));

    expect(base).toBeGreaterThan(0);
    expect(enhanced).toBeGreaterThan(base);
  });

  it('opens Xaihi combo window when the support crystal consumes both heals', () => {
    const scenario = createEmptyScenario(
      'scenario:xaihi:crystal-combo-window',
      '赛希支援晶体连携窗口回归',
    );
    scenario.battle.durationFrames = 180;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:xaihi:crystal-combo-window',
      operator: {
        operatorSlug: xaihi.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    let nextId = 0;
    const ids = { allocate: (kind: string) => `${kind}:xaihi:crystal:${++nextId}` };
    let placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: xaihi,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids,
    }).scenario;
    for (const startFrame of [50, 100]) {
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: xaihi,
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0011_seraph_attack5',
        startFrame,
        ids,
      }).scenario;
    }

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 180,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    const windows = result.receiptEntries.filter(
      entry =>
        entry.event === 'ComboWindowOpened' &&
        entry.sourceId === 'track:xaihi:crystal-combo-window',
    );
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      frame: 119,
      data: { nextSkillKey: 'chr_0011_seraph_combo_skill' },
    });
    const crystalSegments = projectOperatorPassiveUiTimelineViz(result.receiptEntries, 180, [
      {
        operatorId: 'track:xaihi:crystal-combo-window',
        definition: xaihi.passiveUi!,
      },
    ]);
    expect(crystalSegments).toHaveLength(1);
    expect(crystalSegments[0]).toMatchObject({
      kind: 'abilityEntityCount',
      endFrame: 180,
      entities: [expect.objectContaining({ kind: 'abilityEntity' })],
    });
    // 治疗次数耗尽只打开连携窗口；晶体仍在场，不应隐藏或伪装成剩余治疗次数。
    expect(crystalSegments[0]!.startFrame).toBeLessThan(119);
  });

  it('lets Da Pan Crush consume no-guard before the same-frame hit and activate talent 1', () => {
    const run = (talentLevel: number) => {
      const scenario = createEmptyScenario(`scenario:dapan:${talentLevel}`, '大潘压制天赋回归');
      scenario.battle.durationFrames = 660;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:dapan',
        operator: {
          operatorSlug: daPan.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: talentLevel, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:dapan:${++nextId}` };
      const first = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: daPan,
        skillGroupKey: 'comboSkill',
        startFrame: 1,
        ids,
      }).scenario;
      const placed = placeSkillGroup({
        scenario: first,
        trackIndex: 0,
        operator: daPan,
        skillGroupKey: 'comboSkill',
        startFrame: 550,
        ids,
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 660,
        criticalSamples: new ExplicitCriticalSampleSource(Array(80).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: true,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
        },
      });
    };

    const withoutTalent = run(0);
    const withTalent = run(2);
    const secondComboDamage = (result: ReturnType<typeof run>) => {
      const value = result.receiptEntries.find(
        entry =>
          entry.event === 'DamageApplied' &&
          entry.sourceId === 'track:dapan' &&
          entry.frame >= 572 &&
          (String(entry.data?.stepKey).includes('comboSkill') ||
            String(entry.data?.stepKey).includes('chr_0018_dapan_combo_skill')),
      )?.data?.value;
      return typeof value === 'number' ? value : undefined;
    };

    const baseline = secondComboDamage(withoutTalent);
    expect(baseline).toBeTypeOf('number');
    expect(secondComboDamage(withTalent)).toBeCloseTo((baseline ?? 0) * 1.06);
  });

  it('runs Arcane intellect-form battle entities and compiles the conditional combo cooldown', () => {
    const scenario = createEmptyScenario('scenario:arcane:registered', 'Arcane 默认仓库回归');
    scenario.battle.durationFrames = 180;
    scenario.tracks[0] = {
      id: 'track:arcane',
      operator: {
        operatorSlug: arcane.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const comboPlaced = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: arcane,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:arcane:combo` },
    }).scenario;
    const placed = placeSkillGroup({
      scenario: comboPlaced,
      trackIndex: 0,
      operator: arcane,
      skillGroupKey: 'battleSkill',
      startFrame: 30,
      ids: { allocate: kind => `${kind}:arcane` },
    }).scenario;

    const [build] = resolveScenarioBuilds(placed, gameDataRepository);
    if (build === undefined) throw new Error('missing Arcane resolved build');
    const panel = resolveOperatorPanel(build);
    const allSkills = compileOperatorDefinitionSkills(
      build.track.id,
      build.operatorInstance,
      build.operator,
      gameDataRepository.getCommonAbilityEntityDefinitions?.() ?? {},
      panel.attributes,
    );
    expect(
      allSkills.find(skill => skill.skillId === 'chr_0032_lizhiyan_combo_skill')?.cooldownFrames,
    ).toBe(360);
    expect(compileOperatorEntityBlackboardInitialValues(build.operator, panel)).toMatchObject({
      EntityBB_wisd_greater_will: 1,
    });

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 180,
      criticalSamples: new ExplicitCriticalSampleSource(Array(80).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(
      result.receiptEntries.filter(
        entry =>
          entry.event === 'SkillStarted' &&
          entry.sourceId === 'track:arcane' &&
          entry.data?.skillId === 'chr_0032_lizhiyan_normal_skill',
      ),
    ).toHaveLength(1);
    expect(
      result.receiptEntries.filter(
        entry =>
          entry.event === 'AbilityEntitySpawned' &&
          entry.sourceId === 'track:arcane' &&
          entry.data?.abilityEntityId === 'abilityentity_chr_0032_lizhiyan_normal_skill',
      ),
    ).toHaveLength(1);
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:arcane',
      ),
    ).toBe(true);
    expect(
      result.receiptEntries.some(
        entry =>
          entry.event === 'DamageApplied' &&
          entry.sourceId === 'track:arcane' &&
          String(entry.data?.stepKey).includes('combo_skill_seal'),
      ),
    ).toBe(true);
  });

  it('runs Laevatain basic attack through the default repository', () => {
    const scenario = createEmptyScenario('scenario:laevatain:registered', '莱万汀默认仓库回归');
    scenario.battle.durationFrames = 120;
    scenario.tracks[0] = {
      id: 'track:laevatain',
      operator: {
        operatorSlug: laevatain.slug,
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
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: laevatain,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: numberedPlacementIds('laevatain'),
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 120,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:laevatain',
        data: expect.objectContaining({ skillId: 'chr_0016_laevat_attack1' }),
      }),
    );
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:laevatain',
      ),
    ).toBe(true);
  });

  it('activates Laevatain fire-resistance ignore after absorbing four heat attachments', () => {
    const run = (talentLevel: 1 | 3) => {
      const scenario = createEmptyScenario(
        `scenario:laevatain:talent1:${talentLevel}`,
        '莱万汀天赋一默认仓库回归',
      );
      scenario.battle.durationFrames = 180;
      scenario.enemy.editable.resistances.heat = 50;
      scenario.tracks[0] = {
        id: 'track:laevatain',
        operator: {
          operatorSlug: laevatain.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: talentLevel },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: laevatain,
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0016_laevat_attack1',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:laevatain:talent1:${talentLevel}` },
      }).scenario;
      const cast = placed.tracks[0]?.skillCasts[0];
      if (cast === undefined) throw new Error('missing Laevatain test cast');
      const attachmentAndHit = (key: string): SkillDefinition => ({
        key: laevatainBasicAttack1.key,
        skillType: 'basicAttack',
        levelSource: 'basicAttack',
        nativeSkillType: laevatainBasicAttack1.nativeSkillType,
        timelineBlockFrames: 1,
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('applyElementalInfliction', { element: 'heat', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: 1,
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                },
                key,
              ),
            ),
          ),
        ],
      });
      const probe: SkillDefinition = {
        key: laevatainBasicAttack1.key,
        skillType: 'basicAttack',
        levelSource: 'basicAttack',
        nativeSkillType: laevatainBasicAttack1.nativeSkillType,
        timelineBlockFrames: 1,
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step(
                'dealDamage',
                { damageType: 'heat', attackScale: 1, tags: ['normalAttack'] },
                'probe',
              ),
            ),
          ),
        ],
      };
      const track = placed.tracks[0];
      if (track === null) throw new Error('missing Laevatain test track');
      track.skillCasts = [1, 32, 63, 94].map((startFrame, index) => ({
        ...cast,
        id: `skillCast:laevatain:talent1:${talentLevel}:absorb:${index + 1}`,
        placement: { startFrame },
        customDefinition: attachmentAndHit(`absorb:${index + 1}`),
      }));
      track.skillCasts.push({
        ...cast,
        id: `skillCast:laevatain:talent1:${talentLevel}:probe`,
        placement: { startFrame: 125 },
        customDefinition: probe,
      });

      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 180,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
        },
      });
      const damage = result.receiptEntries.filter(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:laevatain',
      );
      return damage.at(-1)?.data?.value as number | undefined;
    };

    const level1 = run(1);
    const level3 = run(3);
    expect(level1).toBeTypeOf('number');
    expect(level3).toBeTypeOf('number');
    expect(level3!).toBeGreaterThan(level1!);
  });

  it('runs Yvonne basic attack through the default repository', () => {
    const scenario = createEmptyScenario('scenario:yvonne:registered', '伊冯默认仓库回归');
    scenario.battle.durationFrames = 120;
    scenario.tracks[0] = {
      id: 'track:yvonne',
      operator: {
        operatorSlug: yvonne.slug,
        level: 90,
        promoted: true,
        potential: 3,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: yvonne,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: numberedPlacementIds('yvonne'),
    }).scenario;
    expect(placed.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual([
      1, 18, 33, 54, 79,
    ]);

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 120,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:yvonne',
        data: expect.objectContaining({ skillId: 'chr_0017_yvonne_attack1' }),
      }),
    );
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:yvonne',
      ),
    ).toBe(true);
  });

  it('runs Ember basic attack through the default repository', () => {
    const scenario = createEmptyScenario('scenario:ember:registered', 'Ember 默认仓库回归');
    scenario.battle.durationFrames = 120;
    scenario.tracks[0] = {
      id: 'track:ember',
      operator: {
        operatorSlug: ember.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: ember,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: numberedPlacementIds('ember'),
    }).scenario;
    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 120,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:ember',
        data: expect.objectContaining({ skillId: 'chr_0009_azrila_attack1' }),
      }),
    );
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:ember',
      ),
    ).toBe(true);
  });

  it('reduces Fluorite combo cooldown once when her nature infliction reaches the enemy', () => {
    const run = (potential: 4 | 5) => {
      const scenario = createEmptyScenario(
        `scenario:fluorite:potential5:${potential}`,
        '萤石潜能五默认仓库回归',
      );
      scenario.battle.durationFrames = 1310;
      scenario.tracks[0] = {
        id: 'track:fluorite',
        operator: {
          operatorSlug: fluorite.slug,
          level: 90,
          promoted: true,
          potential,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: {},
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      let placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: fluorite,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:fluorite:${potential}:battle:first` },
      }).scenario;
      // 原生连携条件运行在附着写入前，要求 trigger 已经持有对应附着 Tag；
      // 第二次自然附着才会通过条件并创建 Pending。
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: fluorite,
        skillGroupKey: 'battleSkill',
        startFrame: 70,
        ids: { allocate: kind => `${kind}:fluorite:${potential}:battle:second` },
      }).scenario;
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: fluorite,
        skillGroupKey: 'comboSkill',
        startFrame: 135,
        ids: { allocate: kind => `${kind}:fluorite:${potential}:first` },
      }).scenario;
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 0,
        operator: fluorite,
        skillGroupKey: 'comboSkill',
        startFrame: 1262,
        ids: { allocate: kind => `${kind}:fluorite:${potential}:second` },
      }).scenario;

      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 1310,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        spellInflictionSettings: skillSettings,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
        },
      }).receiptEntries;
    };

    const unavailable = (potential: 4 | 5) =>
      run(potential).some(
        entry =>
          entry.event === 'SkillCooldownUnavailableAtStart' &&
          entry.sourceId === 'track:fluorite' &&
          entry.data?.castId === 'skillCast:fluorite:' + potential + ':second',
      );

    expect(unavailable(4)).toBe(true);
    expect(unavailable(5)).toBe(false);
  });

  it('runs all four Fluorite ultimate projectile hits with the native per-target marker', () => {
    const scenario = createEmptyScenario('scenario:fluorite:ultimate', '萤石终结技完整回归');
    scenario.battle.durationFrames = 120;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:fluorite',
      operator: {
        operatorSlug: fluorite.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 100, maxUltimateEnergyOverride: 100 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: fluorite,
      skillGroupKey: 'ultimate',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:fluorite:ultimate` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 120,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });
    const hits = result.receiptEntries.filter(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.sourceId === 'track:fluorite' &&
        entry.data?.castId === 'skillCast:fluorite:ultimate',
    );

    expect(hits).toHaveLength(4);
    const launches = result.receiptEntries.filter(
      entry =>
        entry.event === 'ProjectileLaunched' &&
        entry.data?.castId === 'skillCast:fluorite:ultimate',
    );
    expect(launches.map(entry => entry.frame)).toEqual([60, 64, 68, 73]);
    // Battle 阶段发射后，下帧 Default 阶段才执行投射物首次碰撞。
    expect(hits.map(entry => entry.frame)).toEqual(launches.map(entry => entry.frame + 1));
    expect(hits.every(entry => Number(entry.data?.value) > 0)).toBe(true);
    expect(fluorite.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
  });

  it('runs Pogranichnik physical infliction, SP talent, and ultimate soldiers', () => {
    const run = (talentLevel: 0 | 2) => {
      const scenario = createEmptyScenario(
        `scenario:pogranichnik:${talentLevel}`,
        '波格兰尼奇默认仓库回归',
      );
      scenario.battle.durationFrames = 500;
      scenario.battle.resourceRules = {
        ...scenario.battle.resourceRules,
        initialSp: 300,
        spRecoveryPerSecond: 0,
      };
      scenario.tracks[0] = {
        id: 'track:pogranichnik',
        operator: {
          operatorSlug: pogranichnik.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: talentLevel === 0 ? {} : { 0: talentLevel },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 90 },
        skillCasts: [],
      };
      let nextId = 0;
      const ids = { allocate: (kind: string) => `${kind}:pogranichnik:${++nextId}` };
      const ultimate = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: pogranichnik,
        skillGroupKey: 'ultimate',
        startFrame: 1,
        ids,
      }).scenario;
      const battle = placeSkillGroup({
        scenario: ultimate,
        trackIndex: 0,
        operator: pogranichnik,
        skillGroupKey: 'battleSkill',
        startFrame: 120,
        ids,
      }).scenario;
      const secondBattle = placeSkillGroup({
        scenario: battle,
        trackIndex: 0,
        operator: pogranichnik,
        skillGroupKey: 'battleSkill',
        startFrame: 180,
        ids,
      }).scenario;
      const combo = placeSkillGroup({
        scenario: secondBattle,
        trackIndex: 0,
        operator: pogranichnik,
        skillGroupKey: 'comboSkill',
        startFrame: 250,
        ids,
      }).scenario;
      const placed = placeSkillGroup({
        scenario: combo,
        trackIndex: 0,
        operator: pogranichnik,
        skillGroupKey: 'basicAttack',
        startFrame: 330,
        ids,
      }).scenario;

      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 500,
        criticalSamples: new ExplicitCriticalSampleSource(Array(80).fill(1)),
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 20 },
            spRecoveryPauseDuration: 1.5,
            ultimateEnergySystemUnlocked: true,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          },
        },
      });
    };

    const withoutTalent = run(0);
    const withTalent = run(2);
    const basicDamage = (result: typeof withTalent) =>
      result.receiptEntries.find(
        entry =>
          entry.event === 'DamageApplied' &&
          String(entry.data?.stepKey).includes('chr_0029_pograni_attack1:'),
      )?.data?.value;

    expect(basicDamage(withoutTalent)).toBeTypeOf('number');
    expect(basicDamage(withTalent)).toBeTypeOf('number');
    expect(Number(basicDamage(withTalent))).toBeGreaterThan(Number(basicDamage(withoutTalent)));
    // 首次战技只叠无防备；第二次战技进入骨折链，并按原生 BeforeTake 事件打开连携窗口。
    expect(withTalent.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'ComboWindowOpened', sourceId: 'track:pogranichnik' }),
    );
    const soldiers = withTalent.receiptEntries.filter(
      entry =>
        entry.event === 'AbilityEntitySpawned' &&
        entry.data?.abilityEntityId === 'abilityentity_chr_0029_pograni_ultimate_skill',
    );
    // 原生终结技先生成四名常驻士兵；第二次战技在已有无防备时施加物理异常，
    // 承受方 Before 事件召出一名 attack2，随后连携命中再召出一名。
    expect(soldiers).toHaveLength(6);
    expect(
      soldiers.filter(entry => String(entry.data?.childSkillId).endsWith('_finish4')),
    ).toHaveLength(0);
    expect(
      soldiers.filter(
        entry => entry.data?.childSkillId === 'chr_0029_pograni_ultimate_skill_abilityentity',
      ),
    ).toHaveLength(4);
    expect(
      soldiers.filter(entry => String(entry.data?.childSkillId).endsWith('_attack2')),
    ).toHaveLength(2);
    expect(
      withTalent.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:pogranichnik',
      ),
    ).toBe(true);
  });

  it('routes Camille battle skill through her ultimate transformation and restores the slot', () => {
    const scenario = createEmptyScenario('scenario:camille:registered', '卡米拉默认仓库回归');
    scenario.battle.durationFrames = 360;
    scenario.battle.resourceRules = {
      ...scenario.battle.resourceRules,
      initialSp: 300,
      spRecoveryPerSecond: 0,
    };
    scenario.tracks[0] = {
      id: 'track:camille',
      operator: {
        operatorSlug: camille.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 130 },
      skillCasts: [],
    };
    let nextId = 0;
    const ids = { allocate: (kind: string) => `${kind}:camille:${++nextId}` };
    const ultimate = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: camille,
      skillGroupKey: 'ultimate',
      startFrame: 1,
      ids,
    }).scenario;
    const placed = placeSkillGroup({
      scenario: ultimate,
      trackIndex: 0,
      operator: camille,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0033_camille_normal_skill_2',
      startFrame: 180,
      ids,
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 360,
      criticalSamples: new ExplicitCriticalSampleSource(Array(80).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted')
        .map(entry => entry.data?.skillId),
    ).toEqual(['chr_0033_camille_ultimate_skill', 'chr_0033_camille_normal_skill_2']);
    expect(
      result.receiptEntries.filter(entry => entry.event === 'ComboWindowUnavailableAtStart'),
    ).toEqual([]);
    const slotChanges = result.receiptEntries
      .filter(entry => entry.event === 'SkillSlotChanged' && entry.sourceId === 'track:camille')
      .map(entry => entry.data?.targetSkillKey);
    expect(slotChanges).toEqual([
      'chr_0033_camille_normal_skill_2',
      'chr_0033_camille_normal_skill',
    ]);
    expect(
      result.receiptEntries.some(
        entry =>
          entry.event === 'SpChanged' &&
          entry.sourceId === 'track:camille' &&
          entry.data?.skillId === 'chr_0033_camille_normal_skill_2' &&
          entry.data?.requestedValue === -40,
      ),
    ).toBe(true);
    expect(
      result.receiptEntries.some(
        entry =>
          entry.event === 'DamageApplied' &&
          entry.sourceId === 'track:camille' &&
          String(entry.data?.stepKey).includes('chr_0033_camille_combo_skill_2'),
      ),
    ).toBe(true);
  });

  it('applies Bedazzling Night Debut attack stacks to an ally healed by Camille', () => {
    const run = (equipWeapon: boolean) => {
      const scenario = createEmptyScenario(
        `scenario:camille:bedazzling:${equipWeapon ? 'equipped' : 'bare'}`,
        '卡米拉曜夜治疗增伤生产回归',
      );
      scenario.battle.durationFrames = 300;
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:camille',
        operator: {
          operatorSlug: camille.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 2 },
        },
        weapon: equipWeapon
          ? {
              weaponSlug: 'wpn_lance_0014',
              level: 90,
              tuned: true,
              potential: 0,
              traitLevels: [9, 9, 9],
            }
          : null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      scenario.tracks[1] = {
        id: 'track:perlica',
        operator: {
          operatorSlug: perlica.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      // 用最小治疗动作隔离验证武器的“治疗他人”监听；不让卡米拉技能自身的蝙蝠条件和命停干扰武器门禁。
      scenario.battle.controlSwitches.push({ id: 'switch:perlica', frame: 0, trackIndex: 1 });
      let placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: camille,
        skillGroupKey: 'comboSkill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:camille:bedazzling` },
      }).scenario;
      const camilleCast = placed.tracks[0]?.skillCasts[0];
      if (camilleCast === undefined) throw new Error('missing Camille weapon probe cast');
      const camilleComboDefinition = camille.skillGroups
        .flatMap(group => (Array.isArray(group.skills) ? group.skills : [group.skills]))
        .find(skill => skill.key === 'chr_0033_camille_combo_skill');
      if (camilleComboDefinition === undefined)
        throw new Error('missing Camille combo skill definition');
      placed.tracks[0]!.skillCasts = [
        {
          ...camilleCast,
          customDefinition: {
            ...camilleComboDefinition,
            timelineBlockFrames: 1,
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  step('heal', {
                    target: 'controlledOperator',
                    tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                    attribute: 'intellect',
                    multiplier: { kind: 'constant', value: 0.3 },
                    addition: { kind: 'constant', value: 60 },
                  }),
                ),
              ),
            ],
          },
        },
      ];
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 1,
        operator: perlica,
        skillGroupKey: 'basicAttack',
        startFrame: 20,
        ids: numberedPlacementIds('perlica:bedazzling'),
      }).scenario;

      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 300,
        criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: false,
          },
        },
      });
    };

    const bare = run(false);
    const equipped = run(true);
    expect(equipped.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'HealingApplied',
        sourceId: 'track:camille',
        targetId: 'track:perlica',
      }),
    );
    const perlicaDamage = (result: typeof equipped) =>
      Number(
        result.receiptEntries.find(
          entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:perlica',
        )?.data?.value,
      );
    expect(perlicaDamage(bare)).toBeGreaterThan(0);
    expect(perlicaDamage(equipped)).toBeGreaterThan(perlicaDamage(bare));
  });

  it('resolves Zhuang Fangyi ultimate slot replacement and enhanced battle entity damage', () => {
    const scenario = createEmptyScenario('scenario:zhuang-fangyi:registered', '庄方宜默认仓库回归');
    scenario.battle.durationFrames = 300;
    scenario.battle.resourceRules = {
      ...scenario.battle.resourceRules,
      initialSp: 300,
      spRecoveryPerSecond: 0,
    };
    scenario.tracks[0] = {
      id: 'track:zhuang-fangyi',
      operator: {
        operatorSlug: zhuangFangyi.slug,
        level: 90,
        promoted: true,
        potential: 1,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 240 },
      skillCasts: [],
    };
    let nextId = 0;
    const ids = { allocate: (kind: string) => `${kind}:zhuang-fangyi:${++nextId}` };
    const ultimate = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: zhuangFangyi,
      skillGroupKey: 'ultimate',
      startFrame: 1,
      ids,
    }).scenario;
    const ultimateCastId = ultimate.tracks[0]!.skillCasts[0]!.id;
    const placed = placeSkillGroup({
      scenario: ultimate,
      trackIndex: 0,
      operator: zhuangFangyi,
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
      startFrame: 100,
      ids,
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 300,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      probabilitySamples: new ExplicitProbabilitySampleSource(Array(40).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'SkillStarted' && entry.sourceId === 'track:zhuang-fangyi')
        .map(entry => entry.data?.skillId),
    ).toEqual(['chr_0030_zhuangfy_ultimate_skill', 'chr_0030_zhuangfy_normal_skill_ult']);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillSlotChanged',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0030_zhuangfy_normal_skill_ult',
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntitySpawned',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_ult',
        }),
      }),
    );
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'SpChanged' && entry.data?.skillId === 'enhancedBattleSkill',
      ),
    ).toBe(false);
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:zhuang-fangyi',
      ),
    ).toBe(true);
    const enhancedBattleCastId = placed.tracks[0]!.skillCasts.find(
      cast =>
        cast.source.kind === 'operatorSkill' &&
        cast.source.skillKey === 'chr_0030_zhuangfy_normal_skill_ult',
    )!.id;
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'DamageApplied',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          castId: enhancedBattleCastId,
          stepKey:
            'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/scheduledSequences/3/sequence/steps/0/whenTrue/steps/2',
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ElementalInflictionApplied',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          castId: enhancedBattleCastId,
          requestedElement: 'electric',
        }),
      }),
    );
    expect(
      projectSkillEnhancementTimelineViz(result.receiptEntries, result.frame, [
        {
          castId: ultimateCastId,
          targetId: 'track:zhuang-fangyi',
          buffId: 'buff_chr_0030_zhuangfy_ult_base',
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        castId: ultimateCastId,
        startFrame: 79,
        endFrame: 300,
        completed: false,
      }),
    ]);
  });

  it('binds the standard battle before Zhuang Fangyi frame-zero Buff initialization without casts', () => {
    const scenario = createEmptyScenario(
      'scenario:zhuang-fangyi:initialization-only',
      '庄方宜开局 Buff 回归',
    );
    scenario.tracks[0] = {
      id: 'track:zhuang-fangyi',
      operator: {
        operatorSlug: zhuangFangyi.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario,
      endFrame: 0,
      criticalSamples: new ExplicitCriticalSampleSource([]),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'BuffApplied' && entry.frame === 0)
        .map(entry => entry.data?.buffId),
    ).toEqual(
      expect.arrayContaining([
        'buff_chr_0030_zhuangfy_passive_check_sword',
        'buff_chr_0030_zhuangfy_potential1',
        'buff_chr_0030_zhuangfy_potential5',
      ]),
    );
  });

  it('keeps Zhuang Fangyi basic attack 1 active until the independently placed attack 2 input', () => {
    const scenario = createEmptyScenario(
      'scenario:zhuang-fangyi:basic-chain-input',
      '庄方宜普攻独立输入回归',
    );
    scenario.battle.durationFrames = 60;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:zhuang-fangyi',
      operator: {
        operatorSlug: zhuangFangyi.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    let nextId = 0;
    const ids = { allocate: (kind: string) => `${kind}:zhuang-fangyi:basic-chain:${++nextId}` };
    const withAttack1 = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: zhuangFangyi,
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0030_zhuangfy_attack1',
      startFrame: 1,
      ids,
    }).scenario;
    const placed = placeSkillGroup({
      scenario: withAttack1,
      trackIndex: 0,
      operator: zhuangFangyi,
      skillGroupKey: 'basicAttack',
      skillKey: 'chr_0030_zhuangfy_attack2',
      // 第一段施放当帧不推进；接续窗口要在下一次输入阶段才能观察到。
      startFrame: 17,
      ids,
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 60,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      probabilitySamples: new ExplicitProbabilitySampleSource(Array(20).fill(0)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    const attack2CastId = placed.tracks[0]!.skillCasts.find(
      cast =>
        cast.source.kind === 'operatorSkill' &&
        cast.source.skillKey === 'chr_0030_zhuangfy_attack2',
    )!.id;
    expect(
      result.receiptEntries.filter(
        entry =>
          (entry.event === 'SkillInputResolvedToDifferentSkill' ||
            entry.event === 'SkillInputCannotInterruptCurrentSkill') &&
          entry.data?.castId === attack2CastId,
      ),
    ).toEqual([]);
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'SkillStarted',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          skillId: 'chr_0030_zhuangfy_attack2',
          castId: attack2CastId,
        }),
      }),
    );
  });

  it('lets a standalone Zhuang Fangyi battle skill find its spawned sword and produce its final hit', () => {
    const scenario = createEmptyScenario(
      'scenario:zhuang-fangyi:battle-only',
      '庄方宜单放战技回归',
    );
    scenario.battle.durationFrames = 90;
    scenario.battle.resourceRules = {
      ...scenario.battle.resourceRules,
      initialSp: 100,
      spRecoveryPerSecond: 0,
    };
    scenario.tracks[0] = {
      id: 'track:zhuang-fangyi',
      operator: {
        operatorSlug: zhuangFangyi.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: zhuangFangyi,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:zhuang-fangyi:battle-only` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 90,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      probabilitySamples: new ExplicitProbabilitySampleSource(Array(20).fill(0)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntitySpawned',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
        }),
      }),
    );
    expect(
      result.receiptEntries.some(
        entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:zhuang-fangyi',
      ),
    ).toBe(true);
    const castModel = projectTimelineEditor(placed, gameDataRepository).tracks[0]!.skillCasts[0]!;
    const actualHitFrames = projectTimelineHitActualFrames(result.receiptEntries);
    const visibleMarkers = castModel.hitMarkers.filter(marker => actualHitFrames.has(marker.hitId));
    // 原生 sword_triggerd 先把总数减一；只有一把剑时普通段的 index < count 不成立，
    // 仅 index == count 的最后一剑生效。旧 Python 产物曾错误裁掉这两层条件而重复结算。
    expect(visibleMarkers.map(marker => actualHitFrames.get(marker.hitId))).toEqual([29]);
    expect(
      projectHitEffectsByCast(
        placed,
        result.receiptEntries,
        placed.tracks[0]!.skillCasts[0]!.id,
        castModel.hitMarkers,
      ).size,
    ).toBe(1);
  });

  it('projects Zhuang Fangyi enhanced heavy-attack ability-entity damage back to its skill block', () => {
    const scenario = createEmptyScenario(
      'scenario:zhuang-fangyi:enhanced-basic-attack',
      '庄方宜强化普攻命中回归',
    );
    scenario.battle.durationFrames = 90;
    scenario.enemy.editable.hp = 10_000_000;
    scenario.tracks[0] = {
      id: 'track:zhuang-fangyi',
      operator: {
        operatorSlug: zhuangFangyi.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: zhuangFangyi,
      skillGroupKey: 'enhancedBasicAttack',
      skillKey: 'chr_0030_zhuangfy_attack3_ult',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:zhuang-fangyi:enhanced-basic-attack` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 90,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      probabilitySamples: new ExplicitProbabilitySampleSource(Array(20).fill(0)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    const cast = placed.tracks[0]!.skillCasts[0]!;
    const castModel = projectTimelineEditor(placed, gameDataRepository).tracks[0]!.skillCasts[0]!;
    const actualHitFrames = projectTimelineHitActualFrames(result.receiptEntries);
    const visibleMarkers = castModel.hitMarkers.filter(marker => actualHitFrames.has(marker.hitId));
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntitySpawned',
        sourceId: 'track:zhuang-fangyi',
        data: expect.objectContaining({
          abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack3_ult',
        }),
      }),
    );
    expect(
      result.receiptEntries.filter(
        entry =>
          entry.event === 'DamageApplied' &&
          entry.sourceId === 'track:zhuang-fangyi' &&
          entry.data?.castId === cast.id,
      ),
    ).toHaveLength(1);
    expect(visibleMarkers).toHaveLength(1);
    expect(
      projectHitEffectsByCast(placed, result.receiptEntries, cast.id, castModel.hitMarkers).size,
    ).toBe(1);
  });

  it('applies Zhuang Fangyi talent 1 electromagnetic enhancement to battle-skill hits', () => {
    const run = (talentLevel: 0 | 1 | 2) => {
      const scenario = createEmptyScenario(
        `scenario:zhuang-fangyi:talent1:${talentLevel}`,
        '庄方宜天地造化生产回归',
      );
      scenario.battle.durationFrames = 90;
      scenario.battle.resourceRules = {
        ...scenario.battle.resourceRules,
        initialSp: 100,
        spRecoveryPerSecond: 0,
      };
      scenario.enemy.editable.hp = 10_000_000;
      scenario.tracks[0] = {
        id: 'track:zhuang-fangyi',
        operator: {
          operatorSlug: zhuangFangyi.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: talentLevel, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: zhuangFangyi,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:zhuang-fangyi:talent1:${talentLevel}` },
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 90,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        probabilitySamples: new ExplicitProbabilitySampleSource(Array(20).fill(0)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: true,
          },
        },
      });
    };
    const damage = (talentLevel: 0 | 1 | 2) =>
      run(talentLevel)
        .receiptEntries.filter(
          entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:zhuang-fangyi',
        )
        .reduce((total, entry) => total + Number(entry.data?.value), 0);

    expect(damage(1)).toBeGreaterThan(damage(0));
    expect(damage(2)).toBeGreaterThan(damage(1));
  });

  it('runs Snowshine combo ability entity and records full-health healing', () => {
    const scenario = createEmptyScenario('scenario:snowshine:registered', '雪绒默认仓库回归');
    scenario.battle.durationFrames = 150;
    scenario.tracks[0] = {
      id: 'track:snowshine',
      operator: {
        operatorSlug: snowshine.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    scenario.tracks[1] = {
      id: 'track:perlica',
      operator: {
        operatorSlug: perlica.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 1, 1: 1 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: snowshine,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:snowshine` },
    }).scenario;
    const panels = new Map(
      resolveScenarioBuilds(placed, gameDataRepository).map(build => [
        build.track.id,
        resolveOperatorPanel(build),
      ]),
    );
    const snowshinePanel = panels.get('track:snowshine');
    const perlicaPanel = panels.get('track:perlica');
    if (snowshinePanel === undefined || perlicaPanel === undefined) {
      throw new Error('missing Snowshine production panels');
    }
    const expectedInitialHealing =
      (snowshinePanel.attributes.will * 0.5 + 216) *
      (1 + perlicaPanel.attributes.will * Math.fround(0.001));

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 150,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: false,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'AbilityEntitySpawned',
        sourceId: 'track:snowshine',
        data: expect.objectContaining({
          abilityEntityId: 'abilityentity_chr_0014_aurora_combo_skill',
        }),
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'HealingApplied',
        sourceId: 'track:snowshine',
        targetId: 'track:perlica',
        data: expect.objectContaining({ actualHealing: 0 }),
      }),
    );
    const initialHealing = result.receiptEntries.find(
      entry => entry.event === 'HealingApplied' && entry.targetId === 'track:perlica',
    );
    expect(initialHealing?.data?.requestedHealing).toBeCloseTo(expectedInitialHealing);
  });

  it('runs Wulfgard battle skill through the registered production repository', () => {
    const scenario = createEmptyScenario('scenario:wulfgard:registered', '狼卫默认仓库回归');
    scenario.battle.durationFrames = 150;
    scenario.tracks[0] = {
      id: 'track:wulfgard',
      operator: {
        operatorSlug: wulfgard.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: wulfgard,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:wulfgard` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 150,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: false,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'DamageApplied',
        sourceId: 'track:wulfgard',
        targetId: 'enemy',
      }),
    );
  });

  it.each(['basicAttack', 'finisher', 'comboSkill'] as const)(
    'runs Alesh %s through the registered production repository',
    skillGroupKey => {
      const scenario = createEmptyScenario(
        `scenario:alesh:${skillGroupKey}:registered`,
        '阿列什默认仓库回归',
      );
      scenario.battle.durationFrames = 160;
      scenario.tracks[0] = {
        id: 'track:alesh',
        operator: {
          operatorSlug: alesh.slug,
          level: 90,
          promoted: true,
          potential: 5,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 2, 1: 2 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: alesh,
        skillGroupKey,
        startFrame: 1,
        ids: numberedPlacementIds(`alesh:${skillGroupKey}`),
      }).scenario;

      const result = runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 160,
        criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
        probabilitySamples: new ExplicitProbabilitySampleSource(Array(20).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: false,
          },
        },
      });

      expect(result.receiptEntries).toContainEqual(
        expect.objectContaining({
          event: 'DamageApplied',
          sourceId: 'track:alesh',
          targetId: 'enemy',
        }),
      );
    },
  );

  it('applies Antal battle-skill vulnerability and its potential-5 keyword enhancement', () => {
    const run = (potential: number) => {
      const scenario = createEmptyScenario(`scenario:antal:${potential}`, '安塔尔关键词增强回归');
      scenario.battle.durationFrames = 1_340;
      scenario.tracks[0] = {
        id: 'track:antal',
        operator: {
          operatorSlug: antal.slug,
          level: 90,
          promoted: true,
          potential,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 2, 1: 2 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      scenario.tracks[1] = {
        id: 'track:perlica',
        operator: {
          operatorSlug: perlica.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: { 0: 0, 1: 0 },
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      let placed = placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator: antal,
        skillGroupKey: 'battleSkill',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:antal:${potential}` },
      }).scenario;
      placed = placeSkillGroup({
        scenario: placed,
        trackIndex: 1,
        operator: perlica,
        skillGroupKey: 'basicAttack',
        startFrame: 1_280,
        ids: numberedPlacementIds(`perlica:${potential}`),
      }).scenario;
      return runStandardPlayerDamageScenarioSimulation({
        scenario: placed,
        endFrame: 1_340,
        criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
        elementalInflictionDocument: elementalAttachments,
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        options: {
          index: gameDataRepository,
          resources: {
            sharedSpGain: { baseGainEfficiency: 1 },
            spRecoveryPauseDuration: 1.5,
            normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
            ultimateEnergySystemUnlocked: false,
          },
        },
      });
    };

    const base = run(4);
    const enhanced = run(5);
    const perlicaDamage = (result: typeof enhanced) =>
      Number(
        result.receiptEntries.find(
          entry => entry.event === 'DamageApplied' && entry.sourceId === 'track:perlica',
        )?.data?.value,
      );
    expect(perlicaDamage(base)).toBeGreaterThan(0);
    expect(perlicaDamage(enhanced)).toBeGreaterThan(perlicaDamage(base));
  });

  it('injects the triggering infliction type into Antal combo skill blackboard', () => {
    const scenario = createEmptyScenario('scenario:antal:combo-input', '安塔尔连携输入回归');
    scenario.battle.durationFrames = 180;
    const createTrack = (id: string, operatorSlug: string) => ({
      id,
      operator: {
        operatorSlug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    });
    scenario.tracks[0] = createTrack('track:antal', antal.slug);
    scenario.tracks[1] = createTrack('track:wulfgard', wulfgard.slug);

    let placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: antal,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:antal:focus` },
    }).scenario;
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 1,
      operator: wulfgard,
      skillGroupKey: 'battleSkill',
      startFrame: 40,
      ids: { allocate: kind => `${kind}:wulfgard:infliction` },
    }).scenario;
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 0,
      operator: antal,
      skillGroupKey: 'comboSkill',
      startFrame: 80,
      ids: { allocate: kind => `${kind}:antal:combo` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 180,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      spellInflictionSettings: {
        schemaVersion: 1,
        revision: 'antal-combo-regression',
        data: [
          {
            key: '法术爆发伤害倍率',
            values: [1.5, 2, 2.5, 3],
            enhanceFormulaKey: '',
          },
        ],
        enhanceFormulas: [],
      },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: false,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'ComboWindowConsumed', sourceId: 'track:antal' }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'ComboWindowOpened', sourceId: 'track:wulfgard' }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'DamageApplied',
        sourceId: 'track:antal',
        targetId: 'enemy',
      }),
    );
  });

  it('keeps Perlica, Wulfgard, Last Rite and Tangtang native combo conditions in generated operator definitions', () => {
    expect('comboSkillRegistrations' in perlica).toBe(false);
    expect(perlica.comboSkillConditions).toEqual([
      expect.objectContaining({
        key: 'native-combo:0',
        skillKey: 'chr_0004_pelica_combo_skill',
        event: 'beforeTakeDamage',
        immediately: false,
        initialValues: null,
        sequence: expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              parameters: expect.objectContaining({
                condition: expect.objectContaining({
                  kind: 'eventDamageTagsMatch',
                  tags: ['normalAttackLastCombo'],
                }),
              }),
            }),
          ]),
        }),
      }),
    ]);
    expect(JSON.stringify(perlica.comboSkillConditions)).toContain('eventSourceControlled');
    expect(JSON.stringify(perlica.comboSkillConditions)).toContain('contextTargetObjectTypeMatch');
    expect('comboSkillRegistrations' in wulfgard).toBe(false);
    expect(wulfgard.comboSkillConditions).toEqual([
      expect.objectContaining({
        key: 'native-combo:0',
        skillKey: 'chr_0006_wolfgd_combo_skill',
        event: 'beforeTakeInfliction',
        immediately: false,
        initialValues: null,
      }),
    ]);
    expect('comboSkillRegistrations' in lastRite).toBe(false);
    expect(lastRite.comboSkillConditions).toEqual([
      expect.objectContaining({
        key: 'native-combo:0',
        skillKey: 'chr_0026_lastrite_combo_skill',
        event: 'beforeTakeInfliction',
        immediately: false,
        initialValues: null,
      }),
    ]);
    expect('comboSkillRegistrations' in tangtang).toBe(false);
    expect(tangtang.comboSkillConditions).toEqual([
      expect.objectContaining({
        key: 'native-combo:0',
        skillKey: 'chr_0027_tangtang_combo_skill',
        event: 'takeDamage',
        immediately: false,
        initialValues: null,
        sequence: expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({
              parameters: expect.objectContaining({
                condition: {
                  kind: 'eventDamageTagsMatch',
                  match: 'hasAny',
                  tags: ['fireBurst', 'cryoBurst', 'electricBurst', 'natureBurst'],
                },
              }),
            }),
          ]),
        }),
      }),
      expect.objectContaining({
        key: 'native-combo:1',
        skillKey: 'chr_0027_tangtang_combo_skill',
        event: 'beforeTakeInfliction',
      }),
    ]);
  });

  it('keeps newly decoded Arclight, Gilberta, Estella and Laevatain native combo conditions', () => {
    expect(arclight.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'outputBuff',
      'buffEndsEarly',
    ]);
    expect(JSON.stringify(arclight.comboSkillConditions)).toContain(
      'Skill/Character/Common/SpellStatus/Conduct',
    );

    expect(gilberta.comboSkillConditions?.map(condition => condition.event)).toEqual(['addedBuff']);
    expect(JSON.stringify(gilberta.comboSkillConditions)).toContain('contextTargetObjectTypeMatch');
    expect(JSON.stringify(gilberta.comboSkillConditions)).toContain(
      'Skill/Character/Common/SpellStatus',
    );

    expect(estella.comboSkillConditions?.map(condition => condition.event)).toEqual(['addedBuff']);
    expect(JSON.stringify(estella.comboSkillConditions)).toContain(
      'Skill/Character/Common/SpellStatus/Frozen',
    );

    expect(laevatain.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'addedBuff',
    ]);
    expect(JSON.stringify(laevatain.comboSkillConditions)).toContain(
      'Skill/Character/Common/SpellStatus/Burning',
    );
    expect(JSON.stringify(laevatain.comboSkillConditions)).toContain(
      'Skill/Character/Common/SpellStatus/Corrupt',
    );
  });

  it('keeps shared target-context combo conditions for the next eight generated operators', () => {
    expect(alesh.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'buffEndsEarly',
      'buffEndsEarly',
    ]);
    expect(ember.comboSkillConditions?.map(condition => condition.event)).toEqual(['takeDamage']);
    expect(avywenna.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'beforeOutputDamage',
    ]);
    expect(ardelia.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'beforeOutputDamage',
    ]);
    expect(zhuangFangyi.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'beforeOutputDamage',
      'beforeOutputDamage',
    ]);
    expect(lifeng.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'beforeTakeDamage',
    ]);
    expect(endministrator.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'outputDamage',
    ]);
    expect(yvonne.comboSkillConditions?.map(condition => condition.event)).toEqual([
      'beforeTakeDamage',
    ]);

    const serialized = JSON.stringify([
      ember.comboSkillConditions,
      avywenna.comboSkillConditions,
      ardelia.comboSkillConditions,
      zhuangFangyi.comboSkillConditions,
      lifeng.comboSkillConditions,
      endministrator.comboSkillConditions,
      yvonne.comboSkillConditions,
      alesh.comboSkillConditions,
    ]);
    expect(serialized).toContain('actionInputTargetObjectTypeMatch');
    expect(serialized).toContain('actionInputTargetIdentityMatch');
    expect(serialized).toContain('contextTargetIdentityMatch');
    expect(serialized).toContain('contextTargetEntityTagMatch');
  });

  it('opens Zhuang Fangyi combo window after controlled finisher hits Perlica infliction', () => {
    const scenario = createEmptyScenario(
      'scenario:zhuang-fangyi:perlica-infliction-combo',
      '佩丽卡电磁附着接庄方宜重击连携回归',
    );
    scenario.battle.durationFrames = 150;
    const createTrack = (id: string, operatorSlug: string) => ({
      id,
      operator: {
        operatorSlug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    });
    scenario.tracks[0] = createTrack('track:perlica:zhuang-combo', perlica.slug);
    scenario.tracks[1] = createTrack('track:zhuang-fangyi:combo', zhuangFangyi.slug);
    scenario.battle.controlSwitches = [{ id: 'switch:zhuang-fangyi', frame: 30, trackIndex: 1 }];
    let nextId = 0;
    const ids = { allocate: (kind: string) => `${kind}:zhuang-combo:${++nextId}` };
    let placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids,
    }).scenario;
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 1,
      operator: zhuangFangyi,
      skillGroupKey: 'finisher',
      startFrame: 40,
      ids,
    }).scenario;
    placed = placeSkillGroup({
      scenario: placed,
      trackIndex: 1,
      operator: zhuangFangyi,
      skillGroupKey: 'comboSkill',
      startFrame: 81,
      ids,
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 150,
      criticalSamples: new ExplicitCriticalSampleSource(Array(40).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowOpened',
        sourceId: 'track:zhuang-fangyi:combo',
      }),
    );
    expect(result.receiptEntries).not.toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowUnavailableAtStart',
        sourceId: 'track:zhuang-fangyi:combo',
      }),
    );
  });

  it('opens Zhuang Fangyi combo window after the controlled fifth basic attack hits Perlica infliction', () => {
    const scenario = createEmptyScenario(
      'scenario:zhuang-fangyi:perlica-infliction-basic-attack-combo',
      '附件排轴：佩丽卡电磁附着接庄方宜第五段普攻连携回归',
    );
    scenario.battle.prepFrames = 67;
    scenario.battle.durationFrames = 900;
    scenario.tracks[0] = {
      id: 'track:sample:2',
      operator: {
        operatorSlug: zhuangFangyi.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: (
        [
          ['skillCast:sample:6', 'chr_0030_zhuangfy_attack1', 11],
          ['skillCast:sample:7', 'chr_0030_zhuangfy_attack2', 26],
          ['skillCast:sample:8', 'chr_0030_zhuangfy_attack3', 41],
          ['skillCast:sample:9', 'chr_0030_zhuangfy_attack4', 67],
          ['skillCast:sample:10', 'chr_0030_zhuangfy_attack5', 84],
        ] as const
      )
        .map(([id, skillKey, startFrame]): SkillCastDocument => ({
          id,
          source: {
            kind: 'operatorSkill',
            skillGroupKey: 'basicAttack',
            skillKey,
            action: 'basicAttack',
          },
          placement: { startFrame },
        }))
        .concat({
          id: 'skillCast:sample:12',
          source: {
            kind: 'operatorSkill' as const,
            skillGroupKey: 'comboSkill',
            skillKey: 'chr_0030_zhuangfy_combo_skill',
            action: 'comboSkill' as const,
          },
          placement: { startFrame: 147 },
        }),
    };
    scenario.tracks[1] = {
      id: 'track:sample:3',
      operator: {
        operatorSlug: perlica.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 1 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        {
          id: 'skillCast:sample:11',
          source: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: 'chr_0004_pelica_normal_skill',
            action: 'battleSkill',
          },
          placement: { startFrame: 41 },
        },
      ],
    };

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario,
      endFrame: 240,
      criticalSamples: new ExplicitCriticalSampleSource(Array(100).fill(1)),
      probabilitySamples: new ExplicitProbabilitySampleSource(Array(100).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      spellInflictionSettings: skillSettings,
      compoundStatusFactories,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: true,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowOpened',
        sourceId: 'track:sample:2',
      }),
    );
    expect(result.receiptEntries).not.toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowUnavailableAtStart',
        sourceId: 'track:sample:2',
      }),
    );
    const opened = result.receiptEntries.find(
      entry => entry.event === 'ComboWindowOpened' && entry.sourceId === 'track:sample:2',
    );
    expect(opened?.frame).toBe(104);
    const consumed = result.receiptEntries.find(
      entry => entry.event === 'ComboWindowConsumed' && entry.sourceId === 'track:sample:2',
    );
    expect(consumed?.frame).toBe(147);
  });

  it('binds Rossi native combo conditions to combo 2 without borrowing combo 3 cooldown', () => {
    expect(rossi.comboSkillConditions).toHaveLength(2);
    expect(rossi.comboSkillConditions?.map(condition => condition.skillKey)).toEqual([
      'chr_0028_wulfa_combo_2_skill',
      'chr_0028_wulfa_combo_2_skill',
    ]);
  });

  it('opens Arclight combo window from the real output-Buff event', () => {
    const scenario = createEmptyScenario(
      'scenario:arclight:output-buff-combo',
      '弧光输出 Buff 连携回归',
    );
    scenario.battle.durationFrames = 90;
    const createTrack = (id: string, operatorSlug: string) => ({
      id,
      operator: {
        operatorSlug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    });
    scenario.tracks[0] = createTrack('track:arclight', arclight.slug);
    scenario.tracks[1] = createTrack('track:perlica', perlica.slug);
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 1,
      operator: perlica,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:perlica:conduct` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 90,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: false,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'ComboWindowOpened', sourceId: 'track:arclight' }),
    );
  });

  it('keeps Antal forced combo casts simulatable while diagnosing the missing trigger', () => {
    const scenario = createEmptyScenario('scenario:antal:forced-combo', '安塔尔强制连携回归');
    scenario.battle.durationFrames = 80;
    scenario.tracks[0] = {
      id: 'track:antal',
      operator: {
        operatorSlug: antal.slug,
        level: 90,
        promoted: true,
        potential: 5,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: antal,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:antal:forced-combo` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 80,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: false,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'ComboWindowUnavailableAtStart',
        sourceId: 'track:antal',
      }),
    );
    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({ event: 'DamageApplied', sourceId: 'track:antal' }),
    );
  });

  it('updates Tangtang passive HUD when a tagged combo water entity spawns', () => {
    const scenario = createEmptyScenario('scenario:tangtang:passive-ui', '汤汤被动界面回归');
    scenario.battle.durationFrames = 150;
    scenario.tracks[0] = {
      id: 'track:tangtang',
      operator: {
        operatorSlug: tangtang.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 2, 1: 2 },
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: tangtang,
      skillGroupKey: 'comboSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:tangtang:combo` },
    }).scenario;

    const result = runStandardPlayerDamageScenarioSimulation({
      scenario: placed,
      endFrame: 150,
      criticalSamples: new ExplicitCriticalSampleSource(Array(20).fill(1)),
      elementalInflictionDocument: elementalAttachments,
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      options: {
        index: gameDataRepository,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
          ultimateEnergySystemUnlocked: false,
        },
      },
    });

    expect(result.receiptEntries).toContainEqual(
      expect.objectContaining({
        event: 'CharacterPassiveUiValueChanged',
        sourceId: 'track:tangtang',
        targetId: 'track:tangtang',
        data: expect.objectContaining({ value: 1 }),
      }),
    );
    expect(
      projectOperatorPassiveUiTimelineViz(result.receiptEntries, 150, [
        {
          operatorId: 'track:tangtang',
          definition: tangtang.passiveUi!,
        },
      ]),
    ).toContainEqual({
      kind: 'numeric',
      appearance: 'tangtangDroplets',
      operatorId: 'track:tangtang',
      startFrame: expect.any(Number),
      endFrame: 150,
      value: 1,
      maximum: 2,
      active: false,
    });
  });
});
