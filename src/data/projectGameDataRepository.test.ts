import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../core/project/createProject';
import {
  deriveProjectGearTemplate,
  deriveProjectOperatorTemplate,
} from '../core/project/projectDefinitionLibrary';
import { openProject } from '../application/openProject';
import { createDefaultOperatorInstance } from '../application/editor/loadoutBuildFactory';
import { perlica } from './operators/perlica.generated';
import generatedGear from './equipment/generated/suit_wisdwill01/item_equip_t1_suit_wisdwill01_hand_01.generated';
import { createProjectGameDataRepository } from './projectGameDataRepository';

describe('project game data repository', () => {
  it('creates an empty-page repository without local preview files', async () => {
    const repository = await createProjectGameDataRepository(undefined);
    expect(repository.getOperators()).toEqual([]);
    expect(repository.getWeapons()).toEqual([]);
    expect(repository.getGears()).toEqual([]);
    expect(repository.getGearSets()).toEqual([]);
    expect(repository.hasAllDefinitions()).toBe(false);
  });
  it('loads only referenced definitions before the selection catalog is requested', async () => {
    const repository = await createProjectGameDataRepository({
      scenarios: [
        {
          operators: [
            {
              operatorSlug: 'perlica',
              weaponSlug: 'wpn_sword_0026',
              gearSlug: 'item_equip_t4_parts_wuling02_hand_02',
            },
            { operatorSlug: 'arcane', gearSetSlug: 'suit_wisdwill01' },
          ],
        },
      ],
    });

    expect(repository.getOperators().map(value => value.slug)).toEqual(['perlica', 'arcane']);
    expect(repository.getWeapons().map(value => value.slug)).toEqual(['wpn_sword_0026']);
    expect(repository.getGears().map(value => value.slug)).toEqual([
      'item_equip_t4_parts_wuling02_hand_02',
    ]);
    expect(repository.getGearSets().map(value => value.slug)).toEqual(['suit_wisdwill01']);
    expect(repository.getOperator('typhoeus')).toBeNull();
    expect(repository.hasAllDefinitions()).toBe(false);

    await repository.ensureAllDefinitions();

    expect(
      repository
        .getOperators()
        .map(value => value.slug)
        .sort(),
    ).toEqual(
      Object.keys(import.meta.glob('./operators/*.generated.ts'))
        .map(file => file.split('/').at(-1)!.replace('.generated.ts', ''))
        .sort(),
    );
    expect(repository.getWeapons().length).toBeGreaterThan(1);
    expect(repository.getOperator('purrchena')).not.toBeNull();
    expect(repository.getOperator('typhoeus')).not.toBeNull();
    expect(repository.hasAllDefinitions()).toBe(true);
  });

  it('does not look for project templates or their audit origins among generated files', async () => {
    const repository = await createProjectGameDataRepository({
      definitionLibrary: {
        operators: {
          'project:operator:1': {
            origin: { templateId: 'perlica' },
            definition: { slug: 'project:operator:1', operatorSlug: 'project:operator:1' },
          },
        },
        weapons: {},
        gears: {},
        gearSets: {},
      },
      scenarios: [{ tracks: [{ operator: { operatorSlug: 'project:operator:1' } }] }],
    });

    expect(repository.getOperators()).toEqual([]);
    expect(repository.hasAllDefinitions()).toBe(false);
  });

  it('opens a saved project whose track uses a materialized operator template', async () => {
    const project = deriveProjectOperatorTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:operator:1',
      name: '自定义佩丽卡',
      baseTemplateId: perlica.slug,
      definition: perlica,
    });
    project.scenarios[0]!.tracks[0] = {
      id: 'track:1',
      operator: {
        ...createDefaultOperatorInstance(perlica),
        operatorSlug: 'project:operator:1',
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };

    const repository = await createProjectGameDataRepository(project);
    const result = openProject(project, { gameDataRepository: repository });

    expect(result.ok).toBe(true);
    expect(repository.getOperators()).toEqual([]);
  });

  it('loads the built-in set referenced by a materialized project gear', async () => {
    const project = deriveProjectGearTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:gear:1',
      name: '自定义手套',
      baseTemplateId: generatedGear.slug,
      definition: generatedGear,
    });
    project.scenarios[0]!.tracks[0] = {
      id: 'track:1',
      operator: createDefaultOperatorInstance(perlica),
      weapon: null,
      gears: {
        armor: null,
        gloves: { gearSlug: 'project:gear:1', artificingLevels: generatedGear.traits.map(() => 1) },
        accessory1: null,
        accessory2: null,
      },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };

    const repository = await createProjectGameDataRepository(project);
    expect(repository.getGearSets().map(value => value.slug)).toContain(generatedGear.gearSetSlug);
    expect(openProject(project, { gameDataRepository: repository }).ok).toBe(true);
  });
});
