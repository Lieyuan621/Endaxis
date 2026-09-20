import { describe, expect, it } from 'vitest';
import { createGameDataRepository } from '../../data/gameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import { gearDefinitions, gearSetDefinitions, weaponDefinitions } from '../../data/equipment';
import { createEmptyProject, createEmptyScenario } from './createProject';
import { validateProjectWithGameData } from './definitionValidation';
import { parseProjectDocument, serializeProjectDocument } from './serialization';
import type { GearDefinition, WeaponDefinition } from '../game-data/equipmentDefinition';
import {
  allocateProjectTemplateId,
  createProjectGameDataRepository,
  deriveProjectGearTemplate,
  deriveProjectGearSetTemplateInLibrary,
  deriveProjectGearSetTemplate,
  deriveProjectGearTemplateInLibrary,
  deriveProjectOperatorTemplate,
  deriveProjectWeaponTemplate,
  deriveProjectWeaponTemplateInLibrary,
  getProjectDefinitionLibrary,
  replaceProjectGearTemplateDefinition,
  replaceProjectGearSetTemplateDefinition,
  replaceProjectOperatorTemplateDefinition,
  replaceProjectWeaponTemplateDefinition,
  switchTrackToCompatibleGearTemplate,
  switchTrackToCompatibleOperatorTemplate,
  switchTrackToCompatibleWeaponTemplate,
} from './projectDefinitionLibrary';

function operatorInstance(operatorSlug: string) {
  return {
    operatorSlug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 100,
    skillLevels: { basicAttack: 1, battleSkill: 1, comboSkill: 1, ultimate: 1 },
    talentStates: {},
  };
}

describe('projectDefinitionLibrary', () => {
  it('allocates template ids from persisted library contents instead of page state', () => {
    const library = {
      operators: {
        'project:operator:2': {} as never,
        'project:operator:named': {} as never,
        'project:operator:7': {} as never,
      },
      weapons: {},
      gears: {},
      gearSets: {},
    };

    expect(allocateProjectTemplateId(library, 'operator')).toBe('project:operator:8');
    expect(allocateProjectTemplateId(library, 'weapon')).toBe('project:weapon:1');
  });

  it('materializes a project operator template with immutable project identity and provenance', () => {
    const project = createEmptyProject({
      createdWith: 'test',
    });
    const next = deriveProjectOperatorTemplate(project, {
      id: 'project:operator:perlica-copy',
      name: '自定义佩丽卡',
      baseTemplateId: perlica.slug,
      definition: perlica,
    });

    const template = getProjectDefinitionLibrary(next).operators['project:operator:perlica-copy']!;
    expect(template.definition.slug).toBe('project:operator:perlica-copy');
    expect(template.definition.assetSlug).toBe(perlica.slug);
    expect(template.definition.displayName).toBe('自定义佩丽卡');
    expect(template.origin).toEqual({
      templateId: perlica.slug,
    });
    expect(perlica.slug).toBe('perlica');
  });

  it('exposes project templates to the same repository used by selectors and compilers', () => {
    const base = createGameDataRepository({ revision: 'definitions:test', operators: [perlica] });
    const project = deriveProjectOperatorTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:operator:perlica-copy',
      name: '自定义佩丽卡',
      baseTemplateId: perlica.slug,
      definition: perlica,
    });
    const repository = createProjectGameDataRepository(base, getProjectDefinitionLibrary(project));

    expect(repository.getOperator('project:operator:perlica-copy')?.assetSlug).toBe('perlica');
    expect(repository.getOperators().map(value => value.slug)).toEqual([
      'perlica',
      'project:operator:perlica-copy',
    ]);
  });

  it('stores custom weapons, gear and gear sets in the same project catalog', () => {
    const weapon = weaponDefinitions[0]!;
    const gear = gearDefinitions[0]!;
    const gearSet = gearSetDefinitions[0]!;
    let library = getProjectDefinitionLibrary(createEmptyProject({ createdWith: 'test' }));
    library = deriveProjectWeaponTemplateInLibrary(library, {
      id: 'project:weapon:copy',
      name: '自定义武器',
      baseTemplateId: weapon.slug,
      definition: weapon,
    });
    library = deriveProjectGearTemplateInLibrary(library, {
      id: 'project:gear:copy',
      name: '自定义装备',
      baseTemplateId: gear.slug,
      definition: gear,
    });
    library = deriveProjectGearSetTemplateInLibrary(library, {
      id: 'project:gearSet:copy',
      name: '自定义套装',
      baseTemplateId: gearSet.slug,
      definition: gearSet,
    });

    expect(library.weapons['project:weapon:copy']?.definition).toMatchObject({
      slug: 'project:weapon:copy',
      assetSlug: weapon.assetSlug,
    });
    expect(library.gears['project:gear:copy']?.definition).toMatchObject({
      slug: 'project:gear:copy',
      assetSlug: gear.slug,
    });
    expect(library.gearSets['project:gearSet:copy']?.definition.slug).toBe('project:gearSet:copy');
  });

  it('derives and atomically switches an equipped weapon template', () => {
    const weapon = weaponDefinitions[0]!;
    const project = deriveProjectWeaponTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:weapon:1',
      name: '自定义武器',
      baseTemplateId: weapon.slug,
      definition: weapon,
    });
    const scenario = createEmptyScenario('scenario', 'Scenario');
    scenario.tracks[0] = {
      id: 'track:weapon',
      operator: operatorInstance(perlica.slug),
      weapon: {
        weaponSlug: weapon.slug,
        level: 90,
        tuned: true,
        potential: 2,
        traitLevels: weapon.traits.map(() => 9),
      },
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const custom = getProjectDefinitionLibrary(project).weapons['project:weapon:1']!.definition;

    const next = switchTrackToCompatibleWeaponTemplate(scenario, 0, custom.slug, custom);

    expect(next.tracks[0]!.weapon).toEqual({
      ...scenario.tracks[0]!.weapon,
      weaponSlug: 'project:weapon:1',
    });

    const secondScenario = structuredClone(next);
    secondScenario.id = 'scenario:second';
    secondScenario.tracks[0]!.id = 'track:weapon:second';
    const projectWithScenario = { ...project, scenarios: [next, secondScenario] };
    const replacement: WeaponDefinition = {
      ...custom,
      displayName: '调整后的武器',
      traits: custom.traits.map((trait, index) =>
        index === 0 ? { key: trait.key, levelCount: 2 } : trait,
      ),
    };
    const replaced = replaceProjectWeaponTemplateDefinition(
      projectWithScenario,
      custom.slug,
      replacement,
    );

    expect(getProjectDefinitionLibrary(replaced).weapons[custom.slug]?.name).toBe('调整后的武器');
    expect(replaced.scenarios[0]?.tracks[0]?.weapon?.traitLevels[0]).toBe(2);
    expect(replaced.scenarios[1]?.tracks[0]?.weapon?.traitLevels[0]).toBe(2);
    expect(projectWithScenario.scenarios[0]?.tracks[0]?.weapon?.traitLevels[0]).toBe(9);
    expect(projectWithScenario.scenarios[1]?.tracks[0]?.weapon?.traitLevels[0]).toBe(9);
  });

  it('derives, switches and replaces a project gear template across referencing slots', () => {
    const gear = gearDefinitions[0]!;
    const project = deriveProjectGearTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:gear:1',
      name: '自定义装备',
      baseTemplateId: gear.slug,
      definition: gear,
    });
    const scenario = createEmptyScenario('scenario', 'Scenario');
    scenario.tracks[0] = {
      id: 'track:gear',
      operator: operatorInstance(perlica.slug),
      weapon: null,
      gears: {
        armor: { gearSlug: gear.slug, artificingLevels: gear.traits.map(() => 3) },
        gloves: null,
        accessory1: null,
        accessory2: null,
      },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const custom = getProjectDefinitionLibrary(project).gears['project:gear:1']!.definition;
    const switched = switchTrackToCompatibleGearTemplate(scenario, 0, 'armor', custom.slug, custom);
    const replacement: GearDefinition = {
      ...custom,
      displayName: '调整后的装备',
      traits: custom.traits.map((trait, index) =>
        index === 0
          ? {
              key: trait.key,
              levelCount: 2,
              display: {
                kind: 'modifier',
                modifier: {
                  kind: 'attribute',
                  attribute: 'strength',
                  operation: 'flat',
                  value: [1],
                },
              },
            }
          : trait,
      ),
    };
    const secondScenario = structuredClone(switched);
    secondScenario.id = 'scenario:gear:second';
    secondScenario.tracks[0]!.id = 'track:gear:second';
    const projectWithScenarios = { ...project, scenarios: [switched, secondScenario] };
    const replaced = replaceProjectGearTemplateDefinition(
      projectWithScenarios,
      custom.slug,
      replacement,
    );

    const replacedGear = replaced.scenarios[0]?.tracks[0]?.gears.armor;
    expect(replacedGear?.gearSlug).toBe(custom.slug);
    expect(replacedGear?.artificingLevels[0]).toBe(1);
    expect(replacedGear?.artificingLevels).toHaveLength(custom.traits.length);
    expect(replaced.scenarios[1]?.tracks[0]?.gears.armor?.artificingLevels[0]).toBe(1);
    expect(projectWithScenarios.scenarios[0]?.tracks[0]?.gears.armor?.artificingLevels[0]).toBe(3);
    expect(projectWithScenarios.scenarios[1]?.tracks[0]?.gears.armor?.artificingLevels[0]).toBe(3);
    expect(getProjectDefinitionLibrary(replaced).gears[custom.slug]?.name).toBe('调整后的装备');
  });

  it('materializes and replaces a project gear set without rewriting gear references implicitly', () => {
    const gearSet = gearSetDefinitions[0]!;
    const project = deriveProjectGearSetTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:gearSet:1',
      name: '自定义套装',
      baseTemplateId: gearSet.slug,
      definition: gearSet,
    });
    const custom = getProjectDefinitionLibrary(project).gearSets['project:gearSet:1']!.definition;
    const replaced = replaceProjectGearSetTemplateDefinition(project, custom.slug, {
      ...custom,
      displayName: '调整后的套装',
    });

    expect(getProjectDefinitionLibrary(replaced).gearSets[custom.slug]).toMatchObject({
      name: '调整后的套装',
      definition: { slug: custom.slug, displayName: '调整后的套装' },
    });
    expect(replaced.scenarios).toBe(project.scenarios);
  });

  it('rejects invalid equipment definitions before they can enter project history', () => {
    const emptyProject = createEmptyProject({
      createdWith: 'test',
    });
    const weapon = weaponDefinitions[0]!;
    expect(() =>
      deriveProjectWeaponTemplate(emptyProject, {
        id: 'project:weapon:invalid-source',
        name: '非法来源武器',
        baseTemplateId: weapon.slug,
        definition: { ...weapon, baseAttackAtLevelNodes: [] },
      }),
    ).toThrow(/invalid project weapon definition/);
    const weaponProject = deriveProjectWeaponTemplate(emptyProject, {
      id: 'project:weapon:invalid-guard',
      name: '武器校验边界',
      baseTemplateId: weapon.slug,
      definition: weapon,
    });
    const customWeapon =
      getProjectDefinitionLibrary(weaponProject).weapons['project:weapon:invalid-guard']!
        .definition;
    expect(() =>
      replaceProjectWeaponTemplateDefinition(weaponProject, customWeapon.slug, {
        ...customWeapon,
        baseAttackAtLevelNodes: [],
      }),
    ).toThrow(/invalid project weapon definition/);

    const gear = gearDefinitions[0]!;
    const gearProject = deriveProjectGearTemplate(emptyProject, {
      id: 'project:gear:invalid-guard',
      name: '装备校验边界',
      baseTemplateId: gear.slug,
      definition: gear,
    });
    const customGear =
      getProjectDefinitionLibrary(gearProject).gears['project:gear:invalid-guard']!.definition;
    expect(() =>
      replaceProjectGearTemplateDefinition(gearProject, customGear.slug, {
        ...customGear,
        baseDefense: -1,
      }),
    ).toThrow(/invalid project gear definition/);

    const gearSet = gearSetDefinitions[0]!;
    const gearSetProject = deriveProjectGearSetTemplate(emptyProject, {
      id: 'project:gearSet:invalid-guard',
      name: '套装校验边界',
      baseTemplateId: gearSet.slug,
      definition: gearSet,
    });
    const customGearSet =
      getProjectDefinitionLibrary(gearSetProject).gearSets['project:gearSet:invalid-guard']!
        .definition;
    expect(() =>
      replaceProjectGearSetTemplateDefinition(gearSetProject, customGearSet.slug, {
        ...customGearSet,
        blackboard: { invalid: [] },
      }),
    ).toThrow(/invalid project gear set definition/);
  });

  it('switches a track to a freshly derived compatible template without changing casts', () => {
    const scenario = createEmptyScenario('scenario', 'Scenario');
    const battleGroup = perlica.skillGroups.find(group => group.key === 'battleSkill')!;
    const battleSkill = Array.isArray(battleGroup.skills)
      ? battleGroup.skills[0]!
      : battleGroup.skills;
    scenario.tracks[0] = {
      id: 'track:1',
      operator: operatorInstance(perlica.slug),
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        {
          id: 'cast:1',
          source: {
            kind: 'operatorSkill',
            skillGroupKey: battleGroup.key,
            skillKey: battleSkill.key,
          },
          placement: { startFrame: 30 },
        },
      ],
    };
    const custom = structuredClone({ ...perlica, slug: 'project:operator:perlica-copy' });

    const next = switchTrackToCompatibleOperatorTemplate(scenario, 0, perlica, custom.slug, custom);

    expect(next.tracks[0]!.operator?.operatorSlug).toBe(custom.slug);
    expect(next.tracks[0]!.skillCasts).toEqual(scenario.tracks[0]!.skillCasts);
    expect(next.tracks[0]!.skillCasts).toBe(scenario.tracks[0]!.skillCasts);
  });

  it('atomically replaces an operator definition only while every placed skill remains valid', () => {
    const templateId = 'project:operator:replace-guard';
    let project = deriveProjectOperatorTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: templateId,
      name: '干员替换边界',
      baseTemplateId: perlica.slug,
      definition: perlica,
    });
    const definition = getProjectDefinitionLibrary(project).operators[templateId]!.definition;
    const battleGroup = definition.skillGroups.find(group => group.key === 'battleSkill')!;
    const battleSkill = Array.isArray(battleGroup.skills)
      ? battleGroup.skills[0]!
      : battleGroup.skills;
    const scenario = createEmptyScenario('operator-replace', 'Operator replace');
    scenario.tracks[0] = {
      id: 'track:operator-replace',
      operator: operatorInstance(templateId),
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        {
          id: 'cast:operator-replace',
          source: {
            kind: 'operatorSkill',
            skillGroupKey: battleGroup.key,
            skillKey: battleSkill.key,
          },
          placement: { startFrame: 30 },
        },
      ],
    };
    project = { ...project, scenarios: [scenario], activeScenarioId: scenario.id };

    const replaced = replaceProjectOperatorTemplateDefinition(project, templateId, {
      ...definition,
      displayName: '已修改干员',
    });
    expect(getProjectDefinitionLibrary(replaced).operators[templateId]?.name).toBe('已修改干员');
    expect(replaced.scenarios).toBe(project.scenarios);

    expect(() =>
      replaceProjectOperatorTemplateDefinition(project, templateId, {
        ...definition,
        skillGroups: definition.skillGroups.filter(group => group.key !== battleGroup.key),
      }),
    ).toThrow(/cannot preserve cast 'cast:operator-replace'/);
  });

  it('round-trips project templates and resolves their instances through base-data validation', () => {
    const base = createGameDataRepository({ revision: 'definitions:test', operators: [perlica] });
    let project = deriveProjectOperatorTemplate(createEmptyProject({ createdWith: 'test' }), {
      id: 'project:operator:persisted',
      name: '项目干员',
      baseTemplateId: perlica.slug,
      definition: perlica,
    });
    const scenario = project.scenarios[0]!;
    scenario.tracks[0] = {
      id: 'track:project-template',
      operator: operatorInstance('project:operator:persisted'),
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    project = { ...project, scenarios: [scenario] };

    expect(validateProjectWithGameData(project, base).ok).toBe(true);
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.definitionLibrary?.operators['project:operator:persisted']?.name).toBe(
      '项目干员',
    );
  });
});
