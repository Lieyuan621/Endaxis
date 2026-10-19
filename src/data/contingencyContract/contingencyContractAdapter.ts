import type { MechanicDefinitionRef } from '../../core/game-data/gameDataRepository';
import type {
  MechanicAdapter,
  MechanicAdapterInput,
} from '../../core/scenarioMechanics/mechanicCompiler';
import type { MechanicContribution } from '../../core/scenarioMechanics/mechanicContribution';
import { ActionGraphDefinitionRepository } from '../../core/compiler/actionGraphDefinitionRepository';
import {
  contingencyContractDefinitionRevision,
  contingencyContractBlockedTagReasons,
  contingencyContractOmittedTagReasons,
} from './generated/contingencyContractDefinitions.generated';
import { contingencyContractInitializationPlans } from './definitions';
import { contractInitialVariables, resolveContractInitialVariables } from './definitions';
import { withContractInitialVariables } from './initialVariables';

export const CONTINGENCY_CONTRACT_MECHANIC_PREFIX = 'contingency-contract:tag:';

const programs = new ActionGraphDefinitionRepository();

const planByMechanicId = new Map(
  contingencyContractInitializationPlans.map(plan => [
    `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}${plan.tagId}`,
    plan,
  ]),
);

const allTagIds = [
  ...new Set([
    ...contingencyContractInitializationPlans.map(plan => plan.tagId),
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
        parameters: Object.freeze(
          contractInitialVariables(tagId).map(field => ({
            ...field,
            type: 'number' as const,
            required: false,
          })),
        ),
      }),
    ),
  );

export const contingencyContractMechanicAdapter: MechanicAdapter = Object.freeze({
  family: 'contingencyContract',
  revision: contingencyContractDefinitionRevision,
  compile(input: MechanicAdapterInput): readonly MechanicContribution[] {
    const plan = planByMechanicId.get(input.definition.id);
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
    const values = resolveContractInitialVariables(plan.tagId, input.parameters);
    const changed = contractInitialVariables(plan.tagId).some(
      field => values[field.key] !== field.defaultValue,
    );
    return [
      {
        kind: 'battleInitializationSequence',
        sequence: programs
          .compile(
            changed ? withContractInitialVariables(plan.actionGraph, values) : plan.actionGraph,
            0,
          )
          .compileEntry(plan.sequence, `ContingencyContract.${plan.tagId}.initialization`),
      },
    ];
  },
});
