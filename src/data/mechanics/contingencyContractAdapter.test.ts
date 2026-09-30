import { describe, expect, it } from 'vitest';
import { MechanicAdapterRegistry, compileMechanics } from '../../core/mechanics/mechanicCompiler';
import {
  CONTINGENCY_CONTRACT_MECHANIC_PREFIX,
  contingencyContractMechanicAdapter,
  contingencyContractMechanicDefinitions,
} from './contingencyContractAdapter';

describe('contingencyContractAdapter', () => {
  it('compiles an enemy maximum-health tag into a pre-vitals contribution', () => {
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
    expect(compiled.contributions[0]?.contribution).toEqual({
      kind: 'enemyProgramStatMultiplier',
      stat: 'maxHealth',
      multiplier: 1.5,
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
