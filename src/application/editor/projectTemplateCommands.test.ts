import { describe, expect, it } from 'vitest';
import type { GearSetDefinition } from '../../../packages/game-data-contract/src/equipment';
import { perlica } from '../../data/operators/perlica.generated';
import { gearDefinitions, gearSetDefinitions, weaponDefinitions } from '../../data/equipment';
import { createEmptyProject, createEmptyScenario } from '../../core/project/createProject';
import { resolveScenarioBuilds } from '../../core/compiler/resolveScenarioBuilds';
import { resolveOperatorPanel } from '../../core/compiler/resolveOperatorPanel';
import { createGameDataRepository } from '../../data/createGameDataRepository';
import { getProjectDefinitionLibrary } from '../../core/project/projectDefinitionLibrary';
import { GLOBAL_EFFECT_PRESETS } from '../../data/globalEffectPresets';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { ProjectEditorSession } from './projectEditorSession';
import { saveProjectTemplateDefinition } from './projectTemplateCommands';
import { duplicateDefinitionRecordResource } from './definitionDraftSession';
import { emptyDefinitionActionGraph } from '../../ui/definition-editor/definitionFieldRuntime';

describe('object definition project transaction', () => {
  it.each([
    { kind: 'weapon' as const, definition: weaponDefinitions[0]!, collection: 'weapons' as const },
    { kind: 'gear' as const, definition: gearDefinitions[0]!, collection: 'gears' as const },
    {
      kind: 'gearSet' as const,
      definition: gearSetDefinitions[0]!,
      collection: 'gearSets' as const,
    },
  ])(
    'round-trips a derived $kind template without changing its built-in source',
    ({ kind, definition, collection }) => {
      const id = `project:${kind}:editor-test`;
      const sourceSlug = definition.slug;
      const saved = saveProjectTemplateDefinition(
        createEmptyProject({ createdWith: 'test' }),
        { kind, definition } as Parameters<typeof saveProjectTemplateDefinition>[1],
        sourceSlug,
        id,
        '自定义对象',
        false,
        {},
      );
      const parsed = parseProjectDocument(serializeProjectDocument(saved));
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        const template = getProjectDefinitionLibrary(parsed.value)[collection][id];
        expect(template?.definition.slug).toBe(id);
        expect(template?.name).toBe('自定义对象');
      }
      expect(definition.slug).toBe(sourceSlug);
    },
  );
  it('saves a derived definition and graph layout in one undoable project command', () => {
    const session = new ProjectEditorSession(createEmptyProject({ createdWith: 'test' }));
    const source = perlica;
    const layout = {
      'skillGroups/0/skills': {
        main: { nodePositions: { action: { x: 40, y: 10 } }, entryPositions: {} },
      },
    };
    expect(
      session.commit('saveDefinitionTemplate', project =>
        saveProjectTemplateDefinition(
          project,
          { kind: 'operator', definition: source },
          source.slug,
          'project:operator:perlica-edited',
          '编辑后的佩丽卡',
          false,
          layout,
        ),
      ),
    ).toBe(true);
    const current = session.snapshot.project;
    const template =
      getProjectDefinitionLibrary(current).operators['project:operator:perlica-edited']!;
    expect(template.definition.slug).toBe(template.id);
    expect(template.graphPresentations).toMatchObject(layout);
    expect(source.slug).toBe('perlica');
    const parsed = parseProjectDocument(serializeProjectDocument(current));
    expect(parsed.ok).toBe(true);
    if (parsed.ok)
      expect(
        parsed.value.definitionLibrary?.operators[template.id]?.graphPresentations,
      ).toMatchObject(layout);
    expect(session.undo()).toBe(true);
    expect(
      getProjectDefinitionLibrary(session.snapshot.project).operators[template.id],
    ).toBeUndefined();
    expect(session.redo()).toBe(true);
    expect(
      getProjectDefinitionLibrary(session.snapshot.project).operators[template.id],
    ).toBeDefined();
  });

  it('saves a derived global effect and its buff graph layout in one undoable command', () => {
    const session = new ProjectEditorSession(createEmptyProject({ createdWith: 'test' }));
    const source = GLOBAL_EFFECT_PRESETS[0]!;
    const layout = {
      buff: { main: { nodePositions: { action: { x: 40, y: 10 } }, entryPositions: {} } },
    };
    expect(
      session.commit('saveDefinitionTemplate', project =>
        saveProjectTemplateDefinition(
          project,
          { kind: 'globalEffect', definition: source },
          source.id,
          'project:globalEffect:edited',
          '编辑后的全局效果',
          false,
          layout,
        ),
      ),
    ).toBe(true);
    const current = session.snapshot.project;
    const template =
      getProjectDefinitionLibrary(current).globalEffects!['project:globalEffect:edited']!;
    expect(template.definition.id).toBe(template.id);
    expect(template.name).toBe('编辑后的全局效果');
    expect(template.graphPresentations).toMatchObject(layout);
    expect(source.id).toBe('combo-cdr-50');
    // 保存资产不自动启用：方案引用保持不变。
    expect(current.scenarios[0]!.globalConfig.effects).toBeUndefined();
    const parsed = parseProjectDocument(serializeProjectDocument(current));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(
        parsed.value.definitionLibrary?.globalEffects?.[template.id]?.graphPresentations,
      ).toMatchObject(layout);
    }
    expect(session.undo()).toBe(true);
    expect(
      getProjectDefinitionLibrary(session.snapshot.project).globalEffects?.[template.id],
    ).toBeUndefined();
    expect(session.redo()).toBe(true);
    const replaced = session.snapshot.project;
    const draft = getProjectDefinitionLibrary(replaced).globalEffects![template.id]!.definition;
    expect(
      session.commit('saveDefinitionTemplate', project =>
        saveProjectTemplateDefinition(
          project,
          {
            kind: 'globalEffect',
            definition: {
              ...draft,
              buff: {
                stackingType: 'unlimited',
                attributeModifiers: [
                  { attribute: 'criticalRate', slot: 'baseAddition' as const, value: 0.2 },
                ],
              },
            },
          },
          template.id,
          template.id,
          '更新名称',
          true,
          layout,
        ),
      ),
    ).toBe(true);
    const saved = getProjectDefinitionLibrary(session.snapshot.project).globalEffects![
      template.id
    ]!;
    expect(saved.name).toBe('更新名称');
    expect(saved.definition.buff.attributeModifiers![0]!.value).toBe(0.2);
  });

  it('uses the template name as the single display-name source when replacing a custom definition', () => {
    const sourceId = perlica.slug;
    const templateId = 'project:operator:perlica-edited';
    const created = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'test' }),
      { kind: 'operator', definition: perlica },
      sourceId,
      templateId,
      '初始名称',
      false,
      {},
    );
    const saved = saveProjectTemplateDefinition(
      created,
      {
        kind: 'operator',
        definition: getProjectDefinitionLibrary(created).operators[templateId]!.definition,
      },
      templateId,
      templateId,
      '更新名称',
      true,
      {},
    );
    expect(getProjectDefinitionLibrary(saved).operators[templateId]?.name).toBe('更新名称');
    expect(getProjectDefinitionLibrary(saved).operators[templateId]?.definition.displayName).toBe(
      '更新名称',
    );
    expect(perlica.displayName).not.toBe('更新名称');
  });

  it('compiles a derived operator build with its changed attributes while preserving the built-in build', () => {
    const templateId = 'project:operator:perlica-attack';
    const modified = {
      ...perlica,
      attributes: {
        ...perlica.attributes,
        baseAttack: perlica.attributes.baseAttack.map(value => value + 100),
      },
    };
    const saved = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'test' }),
      { kind: 'operator', definition: modified },
      perlica.slug,
      templateId,
      '攻击调整',
      false,
      {},
    );
    const custom = getProjectDefinitionLibrary(saved).operators[templateId]!.definition;
    const repository = createGameDataRepository({
      revision: 'definition-editor-test',
      operators: [perlica, custom],
      commonDefinitionSources: [],
    });
    const scenario = createEmptyScenario('definition-editor-test', 'definition-editor-test');
    const operator = (operatorSlug: string) => ({
      operatorSlug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 0,
      skillLevels: {},
      talentStates: {},
    });
    const build = (operatorSlug: string) => {
      scenario.tracks[0] = {
        id: 'track:0',
        operator: operator(operatorSlug),
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      return resolveOperatorPanel(resolveScenarioBuilds(scenario, repository)[0]!).attack;
    };
    expect(build(templateId)).toBeGreaterThan(build(perlica.slug));
    expect(perlica.attributes.baseAttack).toEqual(
      modified.attributes.baseAttack.map(value => value - 100),
    );
  });
  it('saves a copied owned Buff through the same formal operator validation', () => {
    const sourceId = Object.keys(perlica.buffDefinitions ?? {})[0]!;
    const copy = duplicateDefinitionRecordResource(
      perlica,
      'buffDefinitions',
      sourceId,
      'editor_test_buff',
    );
    const id = 'project:operator:perlica-with-buff';
    const saved = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'test' }),
      { kind: 'operator', definition: copy },
      perlica.slug,
      id,
      '新增状态',
      false,
      {},
    );
    expect(
      getProjectDefinitionLibrary(saved).operators[id]?.definition.buffDefinitions
        ?.editor_test_buff,
    ).toEqual(perlica.buffDefinitions?.[sourceId]);
    expect(perlica.buffDefinitions).not.toHaveProperty('editor_test_buff');
  });
  it('round-trips changed weapon, gear, and set values without altering built-ins', () => {
    const weapon = weaponDefinitions[0]!;
    const gear = gearDefinitions[0]!;
    const set = gearSetDefinitions.find(item => item.modifiers?.length)!;
    const changedWeapon = {
      ...weapon,
      baseAttackAtLevelNodes: weapon.baseAttackAtLevelNodes.map(value => value + 7),
    };
    const changedGear = { ...gear, baseDefense: gear.baseDefense + 7 };
    const changedSet = {
      ...set,
      modifiers: set.modifiers!.map((modifier, index) =>
        index === 0 && modifier.kind === 'attribute'
          ? { ...modifier, value: modifier.value + 7 }
          : modifier,
      ),
    };
    let project = createEmptyProject({ createdWith: 'test' });
    project = saveProjectTemplateDefinition(
      project,
      { kind: 'weapon', definition: changedWeapon },
      weapon.slug,
      'project:weapon:changed',
      '调整武器',
      false,
      {},
    );
    project = saveProjectTemplateDefinition(
      project,
      { kind: 'gear', definition: changedGear },
      gear.slug,
      'project:gear:changed',
      '调整装备',
      false,
      {},
    );
    project = saveProjectTemplateDefinition(
      project,
      { kind: 'gearSet', definition: changedSet },
      set.slug,
      'project:gearSet:changed',
      '调整套装',
      false,
      {},
    );
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const library = getProjectDefinitionLibrary(parsed.value);
    expect(library.weapons['project:weapon:changed']?.definition.baseAttackAtLevelNodes[0]).toBe(
      weapon.baseAttackAtLevelNodes[0]! + 7,
    );
    expect(library.gears['project:gear:changed']?.definition.baseDefense).toBe(
      gear.baseDefense + 7,
    );
    expect(library.gearSets['project:gearSet:changed']?.definition.modifiers?.[0]).toEqual(
      changedSet.modifiers[0],
    );
    expect(weapon.baseAttackAtLevelNodes[0]).not.toBe(changedWeapon.baseAttackAtLevelNodes[0]);
    expect(gear.baseDefense).not.toBe(changedGear.baseDefense);
    expect(set.modifiers?.[0]).not.toEqual(changedSet.modifiers[0]);
  });
  it('saves a formally valid empty graph for a set whose built-in definition has no graph', () => {
    const source: GearSetDefinition = gearSetDefinitions.find(item => !('actionGraph' in item))!;
    const id = 'project:gearSet:with-graph';
    const saved = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'test' }),
      { kind: 'gearSet', definition: { ...source, actionGraph: emptyDefinitionActionGraph() } },
      source.slug,
      id,
      '带图套装',
      false,
      {},
    );
    expect(getProjectDefinitionLibrary(saved).gearSets[id]?.definition.actionGraph).toEqual(
      emptyDefinitionActionGraph(),
    );
    expect(source.actionGraph).toBeUndefined();
  });
});
