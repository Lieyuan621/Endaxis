import type { MechanicDefinitionRef } from '../../core/game-data/gameDataRepository';
import type { MechanicAdapter, MechanicAdapterInput } from '../../core/mechanics/mechanicCompiler';
import type { MechanicContribution } from '../../core/mechanics/mechanicContribution';
import { ActionGraphDefinitionRepository } from '../../core/compiler/actionGraphDefinitionRepository';
import {
  contingencyContractDefinitionRevision,
  contingencyContractBlockedTagReasons,
  contingencyContractEnemyMaxHealthPlans,
  contingencyContractInitializationPlans,
  contingencyContractOmittedTagReasons,
} from './generated/contingencyContractDefinitions.generated';

export const CONTINGENCY_CONTRACT_MECHANIC_PREFIX = 'contingency-contract:tag:';

const programs = new ActionGraphDefinitionRepository();

const planByMechanicId = new Map(
  contingencyContractInitializationPlans.map(plan => [
    `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}${plan.tagId}`,
    plan,
  ]),
);
const enemyMaxHealthPlanByMechanicId = new Map(
  contingencyContractEnemyMaxHealthPlans.map(plan => [
    `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}${plan.tagId}`,
    plan,
  ]),
);

const allTagIds = [
  ...new Set([
    ...contingencyContractInitializationPlans.map(plan => plan.tagId),
    ...contingencyContractEnemyMaxHealthPlans.map(plan => plan.tagId),
    ...Object.keys(contingencyContractBlockedTagReasons).map(Number),
    ...Object.keys(contingencyContractOmittedTagReasons).map(Number),
  ]),
].sort((left, right) => left - right);

export const contingencyContractMechanicDefinitions: readonly MechanicDefinitionRef[] =
  Object.freeze(
    allTagIds.map(tagId =>
      Object.freeze({
        id: `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}${tagId}`,
        family: 'contingencyContract' as const,
        revision: contingencyContractDefinitionRevision,
        parameters: Object.freeze([]),
      }),
    ),
  );

export const contingencyContractMechanicAdapter: MechanicAdapter = Object.freeze({
  family: 'contingencyContract',
  revision: contingencyContractDefinitionRevision,
  compile(input: MechanicAdapterInput): readonly MechanicContribution[] {
    const plan = planByMechanicId.get(input.definition.id);
    const enemyMaxHealthPlan = enemyMaxHealthPlanByMechanicId.get(input.definition.id);
    if (enemyMaxHealthPlan !== undefined) {
      if (Object.keys(input.parameters).length > 0) {
        throw new Error(
          `Contingency Contract tag '${enemyMaxHealthPlan.tagId}' does not accept parameters`,
        );
      }
      return [
        {
          kind: 'enemyProgramStatMultiplier',
          stat: 'maxHealth',
          multiplier: enemyMaxHealthPlan.multiplier,
        },
      ];
    }
    if (plan === undefined) {
      const tagId = Number(input.definition.id.slice(CONTINGENCY_CONTRACT_MECHANIC_PREFIX.length));
      if (
        Object.hasOwn(contingencyContractBlockedTagReasons, tagId) ||
        Object.hasOwn(contingencyContractOmittedTagReasons, tagId)
      ) {
        return [];
      }
      throw new Error(`unknown Contingency Contract mechanic '${input.definition.id}'`);
    }
    if (Object.keys(input.parameters).length > 0) {
      throw new Error(`Contingency Contract tag '${plan.tagId}' does not accept parameters`);
    }
    return [
      {
        kind: 'battleInitializationSequence',
        sequence: programs
          .compile(plan.actionGraph, 0)
          .compileEntry(plan.sequence, `ContingencyContract.${plan.tagId}.initialization`),
      },
    ];
  },
});
