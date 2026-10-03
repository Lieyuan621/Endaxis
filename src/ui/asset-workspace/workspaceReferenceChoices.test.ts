import { describe, expect, it } from 'vitest';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
import type { CommonDefinitionSource } from '../../core/game-data/gameDataRepository';
import { gearSetDefinitions } from '../../data/equipment/equipmentDefinitions';
import { createEmptyProject } from '../../core/project/createProject';
import { saveProjectTemplateDefinition } from '../../application/editor/projectTemplateCommands';
import { perlica } from '../../data/operators/perlica.generated';
import { skillFixture } from '../../test/skillFixture';
import { resolveReference } from '../../application/editor/referenceResolver';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import { WorkspaceAssetSession, type WorkspaceAssetSource } from './workspaceSession';
import { WorkspaceNavigation } from './workspaceNavigation';
import { describeWorkspaceResources } from './workspaceResources';
import { sharedBuffAssetId, workspaceReferenceChoices } from './workspaceReferenceChoices';

const skill = (key: string) =>
  skillFixture({
    key,
    timelineBlockFrames: 30,
    scheduledSequences: [],
    actionGraph: { main: { nodes: {} }, macros: {} },
  });
const buff = perlica.buffDefinitions!.buff_chr_0004_pelica_potential_3!;
const entity = perlica.abilityEntityDefinitions!.abilityentity_chr_0004_pelica_ultimate_skill!;
const definition = (keys: string[] = ['same']): OperatorDefinition => ({
  ...perlica,
  skillGroups: [{ ...perlica.skillGroups[0]!, skills: keys.map(skill) }],
  skillSlots: [],
  dodgeSkill: undefined,
  buffDefinitions: {},
  abilityEntityDefinitions: {},
});
const operator = (id: string, custom = false, value = definition()): WorkspaceAssetSource => ({
  id,
  kind: 'operator',
  kindName: 'Operator',
  name: id,
  custom,
  edit: { kind: 'operator', definition: value },
});
const common = (id: string, keys: string[]): CommonDefinitionSource => ({
  id,
  buffDefinitions: Object.fromEntries(keys.map(key => [key, buff])),
});
const sharedAsset = (source: string, id: string): WorkspaceAssetSource => ({
  id: sharedBuffAssetId(source, id),
  kind: 'buff',
  kindName: 'Buff',
  name: id,
  custom: false,
  edit: { kind: 'buff', id, definition: buff },
});

describe('workspace reference catalogs with asset ownership and navigation', () => {
  it('isolates a project clone from its same-slug builtin and another project owner', () => {
    const builtin = operator('operator:perlica');
    const clone = operator('project:operator:clone', true);
    const other = operator('project:operator:other', true, definition(['same', 'foreign-only']));
    const assets = [builtin, clone, other];
    for (const current of assets) {
      const choices = workspaceReferenceChoices(current, assets, []);
      const resolution = resolveReference('skill', 'same', choices.skill);
      expect(resolution.state).toBe('valid');
      expect(resolution.matches).toHaveLength(1);
      expect(resolution.selected).toMatchObject({
        owner: current.id,
        source: { id: current.id, kind: current.custom ? 'project' : 'builtin' },
        writable: current.custom,
        target: { assetId: current.id, resourcePath: ['skillGroups', 0, 'skills', 0] },
      });
      expect(choices.skill!.candidates.filter(choice => choice.value === 'same')).toHaveLength(3);
      expect(new Set(choices.skill!.candidates.map(choice => choice.identity)).size).toBe(4);
      if (current !== other) {
        expect(resolveReference('skill', 'foreign-only', choices.skill).state).toBe('invisible');
        expect(resolution.candidates.map(choice => choice.value)).not.toContain('foreign-only');
      }
    }
  });

  it('retains local/shared and shared/shared collisions and source-qualified targets', () => {
    const current = operator('operator:perlica', false, {
      ...definition(),
      buffDefinitions: { collision: buff },
    });
    const sources = [
      common('common:a', ['collision', 'shared-duplicate', 'unique']),
      common('common:b', ['shared-duplicate']),
    ];
    const assets = [
      current,
      ...sources.flatMap(source =>
        Object.keys(source.buffDefinitions!).map(id => sharedAsset(source.id, id)),
      ),
    ];
    const catalog = workspaceReferenceChoices(current, assets, sources).buff;
    for (const value of ['collision', 'shared-duplicate']) {
      const result = resolveReference('buff', value, catalog);
      expect(result.state).toBe('ambiguous');
      expect(result.matches).toHaveLength(2);
      expect(result.selected).toBeUndefined();
      expect(
        result.candidates
          .filter(choice => choice.value === value)
          .every(choice => !choice.selectable),
      ).toBe(true);
    }
    const duplicateTargets = catalog!.candidates.filter(
      choice => choice.value === 'shared-duplicate',
    );
    expect(duplicateTargets.map(choice => choice.target!.assetId)).toEqual([
      sharedBuffAssetId('common:a', 'shared-duplicate'),
      sharedBuffAssetId('common:b', 'shared-duplicate'),
    ]);
    expect(duplicateTargets[0]!.target!.assetId).not.toBe(duplicateTargets[1]!.target!.assetId);
    const unique = resolveReference('buff', 'unique', catalog);
    expect(unique.state).toBe('valid');
    expect(unique.candidates.find(choice => choice.value === 'unique')).toMatchObject({
      writable: false,
      selectable: true,
      scope: 'shared',
      source: { id: 'common:a' },
      target: { assetId: sharedBuffAssetId('common:a', 'unique'), resourcePath: [] },
    });
    expect(sharedBuffAssetId('a:b', 'c')).not.toBe(sharedBuffAssetId('a', 'b:c'));
  });

  it('distinguishes a known empty directory from a missing shared context and standalone scope', () => {
    const current = operator('operator:empty', false, definition([]));
    expect(
      resolveReference('buff', 'missing', workspaceReferenceChoices(current, [current], []).buff),
    ).toMatchObject({ state: 'invalid', catalogState: 'empty' });
    expect(
      resolveReference(
        'buff',
        'missing',
        workspaceReferenceChoices(current, [current], undefined).buff,
      ),
    ).toMatchObject({ state: 'contextUnknown', catalogState: 'contextUnknown' });
    expect(
      resolveReference(
        'skill',
        'missing',
        workspaceReferenceChoices(current, [current], undefined).skill,
      ),
    ).toMatchObject({ state: 'invalid', catalogState: 'empty' });
    const standalone = sharedAsset('common', 'buff');
    const choices = workspaceReferenceChoices(
      standalone,
      [current, standalone],
      [common('common', ['buff'])],
    );
    expect(resolveReference('buff', 'buff', choices.buff)).toMatchObject({
      state: 'contextUnknown',
    });
    expect(choices.buff!.candidates).toHaveLength(1);
    expect(resolveReference('buff', 'buff', choices.buff).candidates[0]!.selectable).toBe(false);
  });

  it('excludes entity child display skills from the operator skill namespace', () => {
    const current = operator('operator:entity', false, {
      ...definition(),
      abilityEntityDefinitions: { entity },
    });
    const child = describeWorkspaceResources(current.edit, item => item.identity).find(
      resource => resource.definitionResource.kind === 'abilityEntityChildSkill',
    )!;
    expect(child.kind).toBe('skill');
    const choices = workspaceReferenceChoices(current, [current], []);
    expect(choices.skill!.candidates.map(choice => choice.value)).toEqual(['same']);
    expect(resolveReference('skill', child.definitionResource.identity, choices.skill).state).toBe(
      'invalid',
    );
    expect(resolveReference('abilityEntity', 'entity', choices.abilityEntity).state).toBe('valid');
  });

  it('uses actual readonly reference targets for navigation back and forward independently of edit history', () => {
    const current = operator('operator:perlica');
    const external = sharedAsset('common', 'external');
    const choices = workspaceReferenceChoices(
      current,
      [current, external],
      [common('common', ['external'])],
    );
    const skillTarget = resolveReference('skill', 'same', choices.skill).selected!;
    const buffTarget = resolveReference('buff', 'external', choices.buff).selected!;
    expect(skillTarget.writable).toBe(false);
    expect(buffTarget.writable).toBe(false);
    expect(fieldValueAt(current.edit.definition, skillTarget.target!.resourcePath)).toHaveProperty(
      'key',
      'same',
    );
    const navigation = new WorkspaceNavigation();
    const locations = [skillTarget, buffTarget].map(choice => ({
      document: choice.target!.assetId,
      resource: JSON.stringify(choice.target!.resourcePath),
      page: choice.target!.page ?? 'overview',
      graphOpen: false,
    }));
    locations.forEach(location => navigation.record(location));
    expect(navigation.travel(-1)).toEqual(locations[0]);
    expect(navigation.travel(1)).toEqual(locations[1]);
    const session = new WorkspaceAssetSession(current);
    expect(session.history.canUndo).toBe(false);
    expect(() => session.change(['rarity'], 6)).toThrow();
    expect(resolveReference('skill', 'same', choices.skill).candidates[0]!.selectable).toBe(true);
  });
});

describe('reference catalog transactions use the real asset session', () => {
  it('offers a gear-set clone only after publication, using its runtime target ID rather than the stale draft slug', () => {
    const definition = gearSetDefinitions[0]!;
    const builtin: WorkspaceAssetSource = {
      id: `gearSet:${definition.slug}`,
      kind: 'gearSet',
      kindName: 'Gear set',
      name: definition.slug,
      custom: false,
      edit: { kind: 'gearSet', definition },
    };
    const session = new WorkspaceAssetSession(builtin, 'project:gearSet:reference-clone');
    const clone = (published: boolean) => ({
      ...builtin,
      id: session.targetId,
      custom: true,
      edit: session.current.edit,
      catalogId: session.targetId,
      published,
    });
    const before = workspaceReferenceChoices(builtin, [builtin, clone(false)], []).gearSet;
    expect(before!.candidates).toHaveLength(1);
    expect(resolveReference('gearSet', definition.slug, before).selected?.target?.assetId).toBe(
      builtin.id,
    );
    expect(resolveReference('gearSet', session.targetId, before).state).toBe('invalid');

    const request = session.saveRequest();
    const saved = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'test' }),
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    expect(saved.definitionLibrary?.gearSets[session.targetId]).toBeDefined();
    session.saved();
    expect(session.current.edit.definition).toHaveProperty('slug', definition.slug);
    expect(session.dirty).toBe(false);
    const after = workspaceReferenceChoices(builtin, [builtin, clone(true)], []).gearSet;
    expect(after!.candidates).toHaveLength(2);
    const original = resolveReference('gearSet', definition.slug, after);
    const derived = resolveReference('gearSet', session.targetId, after);
    expect(original.state).toBe('valid');
    expect(derived.state).toBe('valid');
    expect(original.selected).toMatchObject({
      writable: false,
      target: { assetId: builtin.id, resourcePath: [] },
    });
    expect(derived.selected).toMatchObject({
      writable: true,
      target: { assetId: session.targetId, resourcePath: [] },
    });
    expect(derived.selected!.identity).not.toBe(original.selected!.identity);
  });

  it('rebuilds from current draft through optional reference replacement, skill deletion and undo/redo', () => {
    const source = operator('operator:perlica', false, perlica);
    const session = new WorkspaceAssetSession(source, 'project:operator:reference-history');
    const current = (): WorkspaceAssetSource => ({
      ...source,
      id: session.targetId,
      custom: true,
      edit: session.current.edit,
    });
    const catalog = () => workspaceReferenceChoices(current(), [source, current()], []).skill;
    const initial = catalog();
    const path = ['skillGroups', 0, 'skills', 0, 'timelineContinuationSkillId'] as const;
    const beforeReference = fieldValueAt(session.current.edit.definition, path);
    session.editOperatorResources({ kind: 'addSkill', group: 0 });
    const added = catalog()!.candidates.find(
      choice => choice.owner === session.targetId && choice.value.startsWith('custom_skill_'),
    )!;
    expect(resolveReference('skill', added.value, catalog()).state).toBe('valid');
    session.change(path, added.value);
    expect(fieldValueAt(session.current.edit.definition, path)).toBe(added.value);
    const index = added.target!.resourcePath.at(-1) as number;
    const referencedSnapshot = session.current;
    expect(() => session.editOperatorResources({ kind: 'removeSkill', group: 0, index })).toThrow(
      'skillReferenced',
    );
    expect(session.current).toBe(referencedSnapshot);
    expect(resolveReference('skill', added.value, catalog()).state).toBe('valid');
    const replacement = catalog()!.candidates.find(
      choice => choice.owner === session.targetId && choice.value !== added.value,
    )!;
    session.change(path, replacement.value);
    expect(fieldValueAt(session.current.edit.definition, path)).toBe(replacement.value);
    session.change(path, undefined);
    expect(fieldValueAt(session.current.edit.definition, path)).toBeUndefined();
    session.editOperatorResources({ kind: 'removeSkill', group: 0, index });
    expect(resolveReference('skill', added.value, catalog()).state).toBe('invalid');
    expect(session.history.undo()).toBe(true);
    expect(resolveReference('skill', added.value, catalog()).selected).toEqual(added);
    expect(session.history.undo()).toBe(true);
    expect(fieldValueAt(session.current.edit.definition, path)).toBe(replacement.value);
    expect(session.history.undo()).toBe(true);
    expect(fieldValueAt(session.current.edit.definition, path)).toBe(added.value);
    expect(session.history.undo()).toBe(true);
    expect(fieldValueAt(session.current.edit.definition, path)).toEqual(beforeReference);
    expect(session.history.undo()).toBe(true);
    expect(catalog()).toEqual(initial);
    for (let i = 0; i < 5; i++) expect(session.history.redo()).toBe(true);
    expect(resolveReference('skill', added.value, catalog()).state).toBe('invalid');
    expect(fieldValueAt(session.current.edit.definition, path)).toBeUndefined();
    expect(source.edit.definition).toBe(perlica);
    expect(session.saveRequest().draft.edit.definition).toEqual(session.current.edit.definition);
  });
});
