import { describe, expect, it } from 'vitest';
import {
  MechanicAdapterRegistry,
  compileMechanics,
} from '../../core/scenarioMechanics/mechanicCompiler';
import {
  CONTINGENCY_CONTRACT_MECHANIC_PREFIX,
  contingencyContractMechanicAdapter,
  contingencyContractMechanicDefinitions,
} from './contingencyContractAdapter';
import { contractInitialVariables } from './definitions';

describe('contingencyContractAdapter', () => {
  it('overrides first-season entry constants without changing shared defaults', () => {
    const id = `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}101101`;
    const definition = contingencyContractMechanicDefinitions.find(entry => entry.id === id)!;
    expect(contractInitialVariables(101101)).toContainEqual({
      key: 'hp_ratio',
      defaultValue: 0.05,
    });
    const compile = (parameters: Record<string, number>) =>
      compileMechanics(
        { selections: [{ id: 'custom', mechanicId: id, enabled: true, parameters }] },
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
      ).contributions[0]!.contribution;
    for (const value of [0.12, 0.05]) {
      const result = compile(value === 0.05 ? {} : { hp_ratio: value });
      if (result.kind !== 'battleInitializationSequence' || result.sequence.entry === null)
        throw new Error('missing initialization');
      expect(result.sequence.graph.nodes.get(result.sequence.entry)?.action).toMatchObject({
        kind: 'applyBuff',
        parameters: {
          buffs: [{ blackboardAssignments: { hp_ratio: { kind: 'constant', value } } }],
        },
      });
    }
  });
  it('compiles an enemy maximum-health tag into ordinary Buff initialization', () => {
    const mechanicId = `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}900101`;
    const definition = contingencyContractMechanicDefinitions.find(
      entry => entry.id === mechanicId,
    )!;
    const compiled = compileMechanics(
      { selections: [{ id: 'selection:900101', mechanicId, enabled: true, parameters: {} }] },
      { getMechanic: id => (id === mechanicId ? definition : null) },
      new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
    );
    expect(compiled.sources).toHaveLength(1);
    expect(compiled.contributions).toHaveLength(1);
    const contribution = compiled.contributions[0]!.contribution;
    if (
      contribution.kind !== 'battleInitializationSequence' ||
      contribution.sequence.entry === null
    )
      throw new Error('missing initialization');
    expect(
      contribution.sequence.graph.nodes.get(contribution.sequence.entry)?.action,
    ).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        buffs: [
          {
            buffId: 'buff_cc_enemy_common_hp_up',
            blackboardAssignments: { hp_up: { kind: 'constant', value: 1.5 } },
          },
        ],
      },
    });
  });

  it('compiles a real supported tag into battle initialization', () => {
    const mechanicId = `${CONTINGENCY_CONTRACT_MECHANIC_PREFIX}100003`;
    const definition = contingencyContractMechanicDefinitions.find(
      entry => entry.id === mechanicId,
    );
    if (definition === undefined) throw new Error('missing tag 100003 fixture');
    const compiled = compileMechanics(
      {
        selections: [{ id: 'selection:100003', mechanicId, enabled: true, parameters: {} }],
      },
      { getMechanic: id => (id === mechanicId ? definition : null) },
      new MechanicAdapterRegistry([contingencyContractMechanicAdapter]),
    );

    expect(compiled.contributions).toHaveLength(1);
    const contribution = compiled.contributions[0]?.contribution;
    expect(contribution).toMatchObject({ kind: 'battleInitializationSequence' });
    if (contribution?.kind !== 'battleInitializationSequence') throw new Error('unexpected kind');
    if (contribution.sequence.entry === null) throw new Error('missing graph entry');
    const entryNode = contribution.sequence.graph.nodes.get(contribution.sequence.entry);
    expect(entryNode?.action).toMatchObject({ kind: 'createGlobalBuff' });
  });
});
