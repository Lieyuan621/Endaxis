import { describe, expect, it } from 'vitest';

import { createEmptyScenario } from '../../../core/project/createProject';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import {
  contingencyContractMechanicId,
  contingencyContractTags,
} from '../../../data/contingencyContract/contingencyContractCatalog';
import {
  contingencyContractBuffDefinitions,
  contingencyContractInitializationPlans,
} from '../../../data/contingencyContract/definitions';
import { ScenarioSimulationService } from '../scenarioSimulationService';

const supportedTags = contingencyContractTags.filter(tag => tag.support === 'supported');
const initializationTagIds = new Set(
  contingencyContractInitializationPlans.map(plan => plan.tagId),
);
const contractBuffIds = new Set(Object.keys(contingencyContractBuffDefinitions));
const operator = gameDataRepository.getOperator('perlica');

const resources = {
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecoveryPauseDuration: 1.5,
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
} as const;

describe('危机合约生效词条的开局装配', () => {
  it.each([
    {
      slug: 'perlica',
      first: 'chr_0004_pelica_normal_skill',
      second: 'chr_0004_pelica_normal_skill',
      blocked: [150],
    },
    {
      slug: 'si',
      first: 'chr_0036_jsspsi_normal_skill',
      second: 'chr_0036_jsspsi_normal_skill_1',
      blocked: [],
    },
  ])('沉寂限制普通战技并放行原生后续段：$slug', async ({ slug, first, second, blocked }) => {
    const scenario = createEmptyScenario('preview-locks', 'preview');
    scenario.mechanics.selections = [200001, 200002].map(id => ({
      id: String(id),
      mechanicId: contingencyContractMechanicId(id),
      enabled: true,
      parameters: {},
    }));
    scenario.tracks[0] = {
      id: 'track:si',
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
      skillCasts: [],
    };
    // 真实模拟中首发挂锁不误报，第二次释放提示，但仍执行。
    scenario.mechanics.selections = [
      {
        id: 'lock',
        mechanicId: contingencyContractMechanicId(200002),
        enabled: true,
        parameters: {},
      },
    ];
    // 两名干员，避免单人施放后立即解除全队锁。
    scenario.tracks[1] = { ...structuredClone(scenario.tracks[0]), id: 'track:ally' };
    scenario.tracks[0].skillCasts = [0, 150].map((startFrame, i) => ({
      id: `battle:${i}`,
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: i === 0 ? first : second,
      },
      placement: { startFrame },
    }));
    const service = new ScenarioSimulationService({
      index: gameDataRepository,
      resources,
      spellInflictionSettings: skillSettings,
    });
    const run = await service.simulate(scenario, 180);
    expect(
      run.availabilityDiagnostics
        .filter(d => d.reasons.includes('skillTypeTagUnavailable'))
        .map(d => d.frame),
    ).toEqual(blocked);
    expect(
      run.receiptEntries.some(e => e.event === 'SkillStarted' && e.data?.castId === 'battle:1'),
    ).toBe(true);
  });
  it('第二期预览按全队计数挂锁、清空能量并执行敌人回血', async () => {
    const scenario = createEmptyScenario('preview-contracts', 'preview');
    scenario.enemy.editable.hp = 1000000;
    for (let index = 0; index < 2; index++) {
      scenario.tracks[index] = {
        id: `track:${index}`,
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
        initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
        skillCasts: [
          {
            id: `combo:${index}`,
            source: {
              kind: 'operatorSkill',
              skillGroupKey: 'comboSkill',
              skillKey: 'chr_0004_pelica_combo_skill',
            },
            placement: { startFrame: index * 150 },
          },
          {
            id: `battle:${index}`,
            source: {
              kind: 'operatorSkill',
              skillGroupKey: 'battleSkill',
              skillKey: 'chr_0004_pelica_normal_skill',
            },
            placement: { startFrame: 300 + index * 150 },
          },
          ...(index === 0
            ? [
                {
                  id: 'ultimate',
                  source: {
                    kind: 'operatorSkill' as const,
                    skillGroupKey: 'ultimate',
                    skillKey: 'chr_0004_pelica_ultimate_skill',
                  },
                  placement: { startFrame: 600 },
                },
              ]
            : []),
        ],
      };
    }
    scenario.mechanics.selections = [200001, 200002, 200003, 200004].map(id => ({
      id: `preview:${id}`,
      mechanicId: contingencyContractMechanicId(id),
      enabled: true,
      parameters: {},
    }));
    const service = new ScenarioSimulationService({
      index: gameDataRepository,
      resources,
      spellInflictionSettings: skillSettings,
    });
    const result = await service.simulate(scenario, 1200);
    const statusSegments = projectBuffTimelineViz(result.receiptEntries, 1200);
    expect(statusSegments).toContainEqual(
      expect.objectContaining({
        buffId: 'buff_cc_chr_disable_normal_skill',
        targetId: 'track:0',
        icon: 'endaxis:contingency_contract/2/silence',
        showInSquadIcon: true,
      }),
    );
    expect(statusSegments).not.toContainEqual(
      expect.objectContaining({
        buffId: 'buff_cc_eny_heal_no_inflict',
      }),
    );
    const locks = projectBuffTimelineViz(result.receiptEntries, 1200).filter(
      segment => segment.buffId === 'buff_cc_chr_combo_lock_instance',
    );
    expect(locks.map(segment => segment.targetId).sort()).toEqual(['track:0', 'track:1']);
    for (const lock of locks) {
      expect(lock.icon).toBe('endaxis:contingency_contract/2/lockdown');
      expect(lock.showInSquadIcon).toBe(true);
      expect(lock.endFrame).toBeGreaterThan(lock.startFrame);
    }
    const applied = (id: string) =>
      result.receiptEntries.filter(
        entry => entry.event === 'BuffApplied' && entry.data?.buffId === id,
      );
    expect(
      applied('buff_cc_chr_combo_lock_instance')
        .map(entry => entry.targetId)
        .sort(),
    ).toEqual(['track:0', 'track:1']);
    expect(applied('buff_cc_chr_disable_normal_skill').map(entry => entry.targetId)).toEqual([
      'track:0',
    ]);
    expect(
      result.receiptEntries.filter(
        entry =>
          entry.event === 'BuffFinished' &&
          entry.data?.buffId === 'buff_cc_chr_disable_normal_skill',
      ),
    ).toHaveLength(1);
    expect(
      result.receiptEntries
        .filter(
          entry => entry.event === 'UltimateEnergyChanged' && entry.data?.requestedValue === -1000,
        )
        .map(entry => ({ targetId: entry.targetId, value: entry.data?.currentValue })),
    ).toEqual([{ targetId: 'track:1', value: 0 }]);
    const without = structuredClone(scenario);
    without.mechanics.selections = without.mechanics.selections.filter(
      entry => entry.mechanicId !== contingencyContractMechanicId(200001),
    );
    const baseline = await service.simulate(without, 1200);
    // 实际伤害还受导电和干员天赋影响，确保增伤未只停留在 Buff 展示层。
    const damage = (run: typeof result) =>
      run.receiptEntries
        .filter(entry => entry.event === 'DamageApplied')
        .reduce((total, entry) => total + Number(entry.data?.value ?? 0), 0);
    expect(damage(result)).toBeGreaterThan(damage(baseline));
    const healingOnly = structuredClone(scenario);
    for (const track of healingOnly.tracks) if (track) track.skillCasts = [];
    healingOnly.mechanics.selections = healingOnly.mechanics.selections.filter(
      entry => entry.mechanicId === contingencyContractMechanicId(200004),
    );
    const healing = await service.simulate(healingOnly, 240);
    expect(projectBuffTimelineViz(healing.receiptEntries, 240)).toContainEqual(
      expect.objectContaining({
        buffId: 'buff_cc_eny_heal_no_inflict_do_heal',
        targetId: 'enemy',
        icon: 'endaxis:icons/icon_battle_continuous_healing',
        showInHeadBarCommon: true,
      }),
    );
    const heal = healing.receiptEntries.find(
      entry => entry.event === 'HealingApplied' && entry.targetId === 'enemy',
    );
    expect(heal?.data?.requestedHealing).toBeCloseTo(20000, 1);
    healingOnly.mechanics.selections[0]!.parameters = {
      healRatioPerSecond: 0.07,
      healDelaySeconds: 1,
    };
    const customized = await service.simulate(healingOnly, 240);
    const customHeal = customized.receiptEntries.find(
      entry => entry.event === 'HealingApplied' && entry.targetId === 'enemy',
    );
    expect(customHeal?.data?.requestedHealing).toBeCloseTo(70000, 1);
    expect(customHeal!.frame).toBeLessThan(heal!.frame);
  });
  it('逐项建立真实 Buff 和来源回执，并将可见状态投影到时间轴', async () => {
    if (!operator) throw new Error('repository has no operator');
    expect(supportedTags.length).toBeGreaterThan(0);
    const service = new ScenarioSimulationService({
      index: gameDataRepository,
      resources,
      spellInflictionSettings: skillSettings,
    });
    let visibleContractBuffCount = 0;

    for (const tag of supportedTags) {
      const scenario = createEmptyScenario(
        `audit:contingency-contract:${operator.slug}:${tag.tagId}`,
        '危机合约横向装配门禁',
      );
      scenario.enemy.editable.hp = 1_000_000_000;
      scenario.tracks[0] = {
        id: `track:${operator.slug}`,
        operator: {
          operatorSlug: operator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
        skillCasts: [],
      };
      scenario.mechanics.selections.push({
        id: `selection:${tag.tagId}`,
        mechanicId: contingencyContractMechanicId(tag.tagId),
        enabled: true,
        parameters: {},
      });

      try {
        const result = await service.simulate(scenario, 0);
        const expectedSourceActionId = `upgrade-initialization:mechanic:selection:${tag.tagId}:0`;
        const contractBuffReceipts = result.receiptEntries.filter(
          entry =>
            entry.event === 'BuffApplied' &&
            typeof entry.data?.buffId === 'string' &&
            contractBuffIds.has(entry.data.buffId),
        );
        if (initializationTagIds.has(tag.tagId))
          expect(contractBuffReceipts.length).toBeGreaterThan(0);
        for (const receipt of contractBuffReceipts) {
          expect(receipt.data?.sourceActionId).toBe(expectedSourceActionId);
        }
        const visibleReceipts = contractBuffReceipts.filter(
          receipt => receipt.data?.visible === true || typeof receipt.data?.icon === 'string',
        );
        const projected = projectBuffTimelineViz(result.receiptEntries, 0);
        for (const receipt of visibleReceipts) {
          visibleContractBuffCount += 1;
          expect(
            projected.some(
              segment =>
                segment.buffId === receipt.data?.buffId &&
                segment.sourceActionId === expectedSourceActionId,
            ),
          ).toBe(true);
        }
      } catch (error) {
        throw new Error(
          `Contingency Contract ${tag.tagId} failed with operator '${operator.slug}': ${
            error instanceof Error ? error.message : String(error)
          }`,
          { cause: error },
        );
      }
    }
    expect(visibleContractBuffCount).toBeGreaterThan(0);
  }, 120_000);
});
