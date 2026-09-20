import { describe, expect, it } from 'vitest';

import { createEmptyScenario } from '../../../core/project/createProject';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import {
  contingencyContractMechanicId,
  contingencyContractTags,
} from '../../../data/mechanics/contingencyContractCatalog';
import {
  contingencyContractBuffDefinitions,
  contingencyContractInitializationPlans,
} from '../../../data/mechanics/generated/contingencyContractDefinitions.generated';
import { ScenarioSimulationService } from '../scenarioSimulationService';

const supportedTags = contingencyContractTags.filter(tag => tag.support === 'supported');
const initializationTagIds = new Set(
  contingencyContractInitializationPlans.map(plan => plan.tagId),
);
const contractBuffIds = new Set(Object.keys(contingencyContractBuffDefinitions));
const operators = gameDataRepository.getOperators();

const resources = {
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecoveryPauseDuration: 1.5,
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
} as const;

describe('所有正式干员与危机合约生效词条的开局装配', () => {
  it('逐项建立真实 Buff、事件与生命账本，不留下角色组合特判', async () => {
    expect(operators).toHaveLength(31);
    expect(supportedTags).toHaveLength(24);
    const service = new ScenarioSimulationService({
      index: gameDataRepository,
      repositoryRevision: `${gameDataRepository.revision}:contingency-contract-matrix`,
      resources,
      spellInflictionSettings: skillSettings,
    });
    let visibleContractBuffCount = 0;

    for (const operator of operators) {
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
            receipt =>
              receipt.data?.visible === true ||
              typeof receipt.data?.iconId === 'string' ||
              typeof receipt.data?.iconPath === 'string',
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
    }
    expect(visibleContractBuffCount).toBeGreaterThan(0);
  }, 120_000);
});
