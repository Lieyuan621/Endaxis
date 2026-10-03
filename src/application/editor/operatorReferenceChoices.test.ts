import { describe, expect, it } from 'vitest';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
import type { CommonDefinitionSource } from '../../core/game-data/gameDataRepository';
import { skillFixture } from '../../test/skillFixture';
import { operatorReferenceChoices } from './operatorReferenceChoices';
import { resolveReference } from './referenceResolver';

const skill = (key: string) =>
  skillFixture({
    key,
    timelineBlockFrames: 30,
    scheduledSequences: [],
    actionGraph: { main: { nodes: {} }, macros: {} },
  });
const owner = {
  slug: 'owner',
  skillGroups: [
    {
      key: 'group',
      operationType: 'basicAttack',
      skills: [skill('base'), skill('base')],
      variants: [{ key: 'mode', skills: skill('variant') }],
      replacementSkills: [skill('replacement')],
      routedReplacementSkills: [{ skill: skill('routed') }],
    },
  ],
  dodgeSkill: skill('dodge'),
  skillSlots: [{ key: 'slot' }],
  buffDefinitions: { localBuff: {} },
  abilityEntityDefinitions: {
    localEntity: { childSkills: { child: { skillId: 'entity-child' } } },
  },
} as unknown as OperatorDefinition;
const shared = (id: string, buffs: string[], entities: string[] = []): CommonDefinitionSource =>
  ({
    id,
    buffDefinitions: Object.fromEntries(buffs.map(key => [key, {}])),
    abilityEntityDefinitions: Object.fromEntries(entities.map(key => [key, {}])),
  }) as unknown as CommonDefinitionSource;

describe('operatorReferenceChoices', () => {
  it('keeps declaration identity and exact owner namespace, including variants and replacements', () => {
    const result = operatorReferenceChoices(owner, [], { assetId: 'actual-owner-asset' });
    expect(result.skill!.candidates.map(choice => choice.value)).toEqual([
      'base',
      'base',
      'variant',
      'replacement',
      'routed',
      'dodge',
    ]);
    expect(new Set(result.skill!.candidates.map(choice => choice.identity)).size).toBe(6);
    expect(resolveReference('skill', 'base', result.skill).state).toBe('ambiguous');
    expect(result.skill!.candidates[2]!.target?.resourcePath).toEqual([
      'skillGroups',
      0,
      'variants',
      0,
      'skills',
    ]);
    expect(result.skill!.candidates[4]!.target?.resourcePath).toEqual([
      'skillGroups',
      0,
      'routedReplacementSkills',
      0,
      'skill',
    ]);
    expect(result.skillGroup!.candidates[0]!.target).toEqual({
      assetId: 'actual-owner-asset',
      resourcePath: [],
      page: 'skills',
    });
    expect(result.skillSlot!.candidates[0]!.target).toEqual(
      result.skillGroup!.candidates[0]!.target,
    );
    expect(JSON.stringify(result)).not.toContain('entity-child');
  });

  it('preserves local/shared and shared/shared collisions instead of selecting a winner', () => {
    const result = operatorReferenceChoices(owner, [
      shared('first', ['localBuff', 'collision'], ['localEntity']),
      shared('second', ['collision']),
    ]);
    for (const [family, key] of [
      ['buff', 'localBuff'],
      ['buff', 'collision'],
      ['abilityEntity', 'localEntity'],
    ]) {
      const resolution = resolveReference(family!, key, result[family!]);
      expect(resolution.state).toBe('ambiguous');
      expect(resolution.matches).toHaveLength(2);
      expect(
        resolution.candidates
          .filter(candidate => candidate.value === key)
          .every(candidate => !candidate.selectable),
      ).toBe(true);
    }
    expect(
      result
        .buff!.candidates.filter(candidate => candidate.value === 'collision')
        .map(candidate => candidate.source.id),
    ).toEqual(['first', 'second']);
  });

  it('keeps source-qualified identity stable when the directory order changes', () => {
    const first = shared('first', ['one']);
    const second = shared('second', ['two']);
    const identities = (sources: readonly CommonDefinitionSource[]) =>
      operatorReferenceChoices(owner, sources)
        .buff!.candidates.filter(candidate => candidate.scope === 'shared')
        .map(candidate => candidate.identity)
        .sort();
    expect(identities([first, second])).toEqual(identities([second, first]));
  });

  it('does not fabricate navigation and accepts only explicit shared navigation', () => {
    expect(operatorReferenceChoices(owner).buff!.candidates[0]!.target).toBeUndefined();
    const result = operatorReferenceChoices(
      owner,
      [shared('common', ['sharedBuff'], ['sharedEntity'])],
      {
        sharedTarget: (_source, family, id) =>
          family === 'buff' ? { assetId: `verified-${id}`, resourcePath: [] } : undefined,
      },
    );
    expect(result.buff!.candidates[1]!.target?.assetId).toBe('verified-sharedBuff');
    expect(result.abilityEntity!.candidates[1]!.target).toBeUndefined();
  });

  it('keeps write permission independent of selection and source kind', () => {
    const readonly = operatorReferenceChoices(owner).skill;
    expect(
      resolveReference('skill', 'dodge', readonly).candidates.find(
        candidate => candidate.value === 'dodge',
      ),
    ).toMatchObject({ writable: false, selectable: true });
    const editable = operatorReferenceChoices(owner, [], {
      assetId: 'custom',
      assetName: 'Custom owner',
      sourceKind: 'project',
      writable: true,
    });
    expect(editable.skill!.owner).toBe('custom');
    expect(
      resolveReference('skill', 'dodge', { ...editable.skill!, owner: owner.slug }).state,
    ).toBe('invisible');
    expect(resolveReference('skill', 'dodge', editable.skill).selected).toMatchObject({
      writable: true,
      source: { id: 'custom', label: 'Custom owner', kind: 'project' },
    });
  });

  it('distinguishes empty, unset, unknown, cross-owner, and wrong-family catalogs', () => {
    const other = operatorReferenceChoices({
      slug: 'other',
      skillGroups: [],
    } as unknown as OperatorDefinition);
    expect(resolveReference('skill', 'dodge', other.skill)).toMatchObject({
      state: 'invalid',
      catalogState: 'empty',
    });
    expect(resolveReference('skill', '', other.skill).state).toBe('unset');
    expect(resolveReference('skill', 'dodge', undefined).state).toBe('contextUnknown');
    const own = operatorReferenceChoices(owner);
    expect(resolveReference('skill', 'dodge', { ...own.skill!, owner: 'other' }).state).toBe(
      'invisible',
    );
    expect(resolveReference('buff', 'dodge', own.skill).state).toBe('contextUnknown');
    expect(
      resolveReference('skill', 'localBuff', {
        ...own.skill!,
        candidates: [...own.skill!.candidates, ...own.buff!.candidates],
      }).state,
    ).toBe('invalid');
    expect(resolveReference('skill', 'dodge', { ...own.skill!, complete: false }).state).toBe(
      'contextUnknown',
    );
  });
});
