import { describe, expect, it } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import { createEmptyProject } from '../../core/project/createProject';
import { saveProjectTemplateDefinition } from '../../application/editor/projectTemplateCommands';
import { WorkspaceAssetSession, type WorkspaceAssetSource } from './workspaceSession';
import { consumableDefinitions } from '../../data/consumables';
import { generatedEnemyDefinitions } from '../../data/enemies/generated/index.generated';
import { commonBuffDefinitions } from '../../data/buffs/commonDefinitions';
import { describeWorkspaceResources } from './workspaceResources';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import { fieldSchemaForValue } from '../definition-editor/definitionFieldRuntime';
import { GLOBAL_EFFECT_PRESETS } from '../../data/globalEffectPresets';
import { contingencyContractTags } from '../../data/mechanics/contingencyContractCatalog';
import { addResourceNode } from '../../application/editor/actionGraphResourceEditing';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import { resourcePresentationKey } from '../definition-editor/definitionResources';
import { addSkillTimelineSchedule } from '../../application/editor/actionGraphEditing';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';

const source: WorkspaceAssetSource = {
  id: 'operator:perlica',
  kind: 'operator',
  kindName: '干员',
  name: '佩丽卡',
  custom: false,
  edit: { kind: 'operator', definition: perlica },
};

describe('工作区资产草稿', () => {
  it('输入窗口条目按字段编辑，保留同一条目的其他值并支持撤销', () => {
    const session = new WorkspaceAssetSession(source, 'project:operator:windows');
    const path = ['skillGroups', 0, 'skills', 0, 'inputWindows', 'commandMappings', 0] as const;
    const before = fieldValueAt(session.current.edit.definition, path) as Record<string, unknown>;
    session.change([...path, 'startFrame'], 6);
    expect(fieldValueAt(session.current.edit.definition, path)).toEqual({
      ...before,
      startFrame: 6,
    });
    session.history.undo();
    expect(fieldValueAt(session.current.edit.definition, path)).toEqual(before);
  });
  it('子技能字段使用自己的契约：可清除可选字段、修改数值，身份和图仍不可绕过', () => {
    const session = new WorkspaceAssetSession(source, 'project:operator:fields');
    const path = ['skillGroups', 0, 'skills', 0] as const;
    const before = session.current;
    for (const field of [
      'skillType',
      'nativeSkillType',
      'levelSource',
      'naturalDurationFrames',
      'exclusiveFrame',
      'offsetRecordFrame',
    ]) {
      expect(() => session.change([...path, field], undefined)).toThrow();
    }
    session.change([...path, 'timelineContinuationSkillId'], undefined);
    expect(
      fieldValueAt(session.current.edit.definition, [...path, 'timelineContinuationSkillId']),
    ).toBeUndefined();
    session.change([...path, 'timelineBlockFrames'], 45);
    expect(fieldValueAt(session.current.edit.definition, [...path, 'timelineBlockFrames'])).toBe(
      45,
    );
    expect(() => session.change([...path, 'key'], 'replaced')).toThrow(/read-only/);
    expect(() =>
      session.change([...path, 'actionGraph'], { main: { nodes: {} }, macros: {} }),
    ).toThrow();
    session.history.undo();
    session.history.undo();
    expect(session.current).toBe(before);
  });
  it('技能列表操作受只读保护，派生后可撤销重做且不改变内置定义', () => {
    const readonly = new WorkspaceAssetSession(source);
    expect(() => readonly.editOperatorResources({ kind: 'addSkill', group: 0 })).toThrow();
    const session = new WorkspaceAssetSession(source, 'project:operator:list');
    const before = session.current;
    session.editOperatorResources({ kind: 'addSkill', group: 0 });
    const added = session.current;
    expect(added).not.toBe(before);
    session.history.undo();
    expect(session.current).toBe(before);
    session.history.redo();
    expect(session.current).toBe(added);
    expect(source.edit.definition).toBe(perlica);
  });
  it('时间线命令读取当前技能，跨属性和时间线操作共享历史且保存保留调度', () => {
    const session = new WorkspaceAssetSession(source, 'project:operator:timeline');
    const resource = describeWorkspaceResources(source.edit, item => item.identity).find(
      item => item.definitionResource.kind === 'skill',
    )!;
    const path = resource.definitionResource.path;
    const readSkill = () => fieldValueAt(session.current.edit.definition, path) as SkillDefinition;
    const initial = readSkill();
    session.changeGraph(path, owner => addSkillTimelineSchedule(owner as SkillDefinition, 123));
    const afterSchedule = session.current;
    session.rename('时间线测试');
    const afterName = session.current;
    session.changeGraph(path, owner => addSkillTimelineSchedule(owner as SkillDefinition, 456));
    expect(
      readSkill()
        .scheduledSequences.slice(-2)
        .map(item => item.startFrame),
    ).toEqual([123, 456]);
    const exported = fieldValueAt(
      session.saveRequest().draft.edit.definition,
      path,
    ) as SkillDefinition;
    expect(exported.scheduledSequences).toEqual(readSkill().scheduledSequences);
    session.history.undo();
    expect(session.current).toBe(afterName);
    session.history.undo();
    expect(session.current).toBe(afterSchedule);
    session.history.undo();
    expect(readSkill()).toBe(initial);
    expect(session.history.canUndo).toBe(false);
    expect(
      (fieldValueAt(source.edit.definition, path) as SkillDefinition).scheduledSequences,
    ).toEqual(initial.scheduledSequences);
  });
  it('属性、图和布局交错修改按同一顺序撤销，失败的图命令不留下历史', () => {
    const session = new WorkspaceAssetSession(source, 'project:operator:history');
    const resource = describeWorkspaceResources(source.edit, item => item.identity).find(
      item => item.definitionResource.kind === 'skill',
    )!;
    const path = resource.definitionResource.path;
    const initial = session.current;
    session.change(['rarity'], perlica.rarity === 5 ? 6 : 5);
    const afterField = session.current;
    session.changeGraph(path, owner =>
      addResourceNode(owner, { kind: 'main' }, 'workspace_test', {
        kind: 'dealStagger',
        parameters: { value: 2 },
      }),
    );
    const afterGraph = session.current;
    expect(
      fieldValueAt(afterGraph.edit.definition, [
        ...path,
        'actionGraph',
        'main',
        'nodes',
        'workspace_test',
      ]),
    ).toHaveProperty('action.parameters.value', 2);
    const layout = {
      main: { nodePositions: { workspace_test: { x: 40, y: 80 } }, entryPositions: {} },
    };
    session.changeGraph(path, owner => owner, layout);
    const afterLayout = session.current;
    expect(
      afterLayout.graphPresentations[resourcePresentationKey(afterLayout.edit.definition, path)],
    ).toBe(layout);
    expect(() =>
      session.changeGraph(path, owner => ({
        ...owner,
        actionGraph: {
          ...owner.actionGraph,
          main: {
            ...owner.actionGraph.main,
            nodes: {
              ...owner.actionGraph.main.nodes,
              broken: {
                action: { kind: 'dealStagger', parameters: { value: 1 } },
                next: 'missing_node',
              },
            },
          },
        },
      })),
    ).toThrow();
    expect(session.current).toBe(afterLayout);
    expect(session.changeGraph(path, owner => owner)).toBe(false);
    for (const snapshot of [afterGraph, afterField, initial]) {
      expect(session.history.undo()).toBe(true);
      expect(session.current).toBe(snapshot);
    }
    expect(session.history.undo()).toBe(false);
    for (const snapshot of [afterField, afterGraph, afterLayout]) {
      expect(session.history.redo()).toBe(true);
      expect(session.current).toBe(snapshot);
    }
    const readonly = new WorkspaceAssetSession(source);
    let called = false;
    expect(() =>
      readonly.changeGraph(path, owner => {
        called = true;
        return owner;
      }),
    ).toThrow('read-only');
    expect(called).toBe(false);
    expect(
      fieldValueAt(source.edit.definition, [
        ...path,
        'actionGraph',
        'main',
        'nodes',
        'workspace_test',
      ]),
    ).toBeUndefined();
  });
  it('敌人抗性中的每种属性都有可查看的数值字段', () => {
    const enemy = generatedEnemyDefinitions[0]!;
    const schema = definitionSchemas.enemy.fields.resistances;
    expect(schema.kind).toBe('object');
    expect(Object.keys(schema.fields).sort()).toEqual(Object.keys(enemy.resistances).sort());
    for (const field of Object.values(schema.fields)) expect(field.kind).toBe('number');
  });
  it('只读资产可以查看字段，但不能通过派生绕过只读边界', () => {
    const [buffId, buff] = Object.entries(commonBuffDefinitions)[0]!;
    const edits = [
      { kind: 'buff' as const, id: buffId, definition: buff },
      { kind: 'consumable' as const, definition: consumableDefinitions[0]! },
      { kind: 'enemy' as const, definition: generatedEnemyDefinitions[0]! },
      { kind: 'contract' as const, definition: contingencyContractTags[0]! },
    ];
    for (const edit of edits) {
      const asset: WorkspaceAssetSource = {
        id: edit.kind,
        name: edit.kind,
        kind: edit.kind,
        kindName: edit.kind,
        custom: false,
        edit,
      };
      const session = new WorkspaceAssetSession(asset);
      expect(session.history.editable).toBe(false);
      expect(() => session.rename('changed')).toThrow('read-only');
      expect(() => session.saveRequest()).toThrow('read-only');
      expect(() => new WorkspaceAssetSession(asset, 'custom')).toThrow('read-only');
      const resources = describeWorkspaceResources(edit, resource => resource.identity);
      expect(resources).toHaveLength(1);
      expect(resources[0]!.definitionResource.path).toEqual([]);
      const schema = fieldSchemaForValue(definitionSchemas[edit.kind], edit.definition);
      expect(schema.kind).toBe('object');
    }
  });
  it('打开内置定义保持只读，只有派生的副本可以修改和撤销', () => {
    const readonly = new WorkspaceAssetSession(source);
    expect(() => readonly.change(['rarity'], 5)).toThrow('read-only');
    expect(() => readonly.saveRequest()).toThrow('read-only');
    const custom = new WorkspaceAssetSession(source, 'project:operator:workspace-test');
    const original = perlica.rarity;
    custom.change(['rarity'], 5);
    expect(custom.current.edit.definition).toHaveProperty('rarity', 5);
    expect(perlica.rarity).toBe(original);
    custom.history.undo();
    expect(custom.current.edit.definition).toHaveProperty('rarity', original);
    custom.history.redo();
    expect(custom.current.edit.definition).toHaveProperty('rarity', 5);
    expect(readonly.current.edit.definition).toBe(perlica);
  });

  it('派生和保存只增加资产库对象，不替换场景干员；之后保存替换同一资产', () => {
    const session = new WorkspaceAssetSession(source, 'project:operator:workspace-test');
    session.rename('工作区测试干员');
    const project = createEmptyProject({ createdWith: 'test' });
    const request = session.saveRequest();
    expect(request.replace).toBe(false);
    const saved = saveProjectTemplateDefinition(
      project,
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    expect(saved.scenarios).toEqual(project.scenarios);
    expect(saved.definitionLibrary?.operators[request.targetId]?.name).toBe('工作区测试干员');
    expect(session.dirty).toBe(true);
    session.saved();
    expect(session.dirty).toBe(false);
    expect(session.saveRequest().replace).toBe(true);
    session.rename('再次修改');
    expect(session.dirty).toBe(true);
    session.history.undo();
    expect(session.dirty).toBe(false);
  });

  it('内置全局效果只读，派生副本保存为项目资产且定义 ID 改写为项目 ID', () => {
    const effect = GLOBAL_EFFECT_PRESETS[0]!;
    const effectSource: WorkspaceAssetSource = {
      id: `globalEffect:${effect.id}`,
      kind: 'globalEffect',
      kindName: '全局效果',
      name: '连携加速',
      custom: false,
      edit: { kind: 'globalEffect', definition: effect },
    };
    const readonly = new WorkspaceAssetSession(effectSource);
    expect(readonly.history.editable).toBe(false);
    expect(() => readonly.saveRequest()).toThrow('read-only');
    const session = new WorkspaceAssetSession(effectSource, 'project:globalEffect:test-effect');
    expect(() => session.change(['id'], 'another-effect')).toThrow('identity is read-only');
    expect(session.current.edit.definition).toHaveProperty('buff');
    expect(session.sourceId).toBe(effect.id);
    expect(session.targetId).toBe('project:globalEffect:test-effect');
    session.rename('测试全局效果');
    session.change(['buff', 'attributeModifiers', 0, 'value'], 0.25);
    const project = createEmptyProject({ createdWith: 'test' });
    const request = session.saveRequest();
    expect(request.replace).toBe(false);
    // 草稿保留源效果 ID；保存命令负责改写为项目 ID。
    expect(request.draft.edit.definition).toHaveProperty('id', effect.id);
    const saved = saveProjectTemplateDefinition(
      project,
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    expect(saved.scenarios).toEqual(project.scenarios);
    const template = saved.definitionLibrary?.globalEffects?.[request.targetId];
    expect(template?.name).toBe('测试全局效果');
    expect(template?.definition.id).toBe(request.targetId);
    expect(template?.definition.buff.attributeModifiers![0]?.value).toBe(0.25);
    expect(effect.buff.attributeModifiers[0]!.value).not.toBe(0.25);
    session.saved();
    expect(session.saveRequest().replace).toBe(true);
    const replaced = saveProjectTemplateDefinition(
      saved,
      session.saveRequest().draft.edit,
      session.sourceId,
      session.targetId,
      session.current.name,
      true,
      session.current.graphPresentations,
    );
    expect(replaced.definitionLibrary?.globalEffects?.[session.targetId]?.definition.id).toBe(
      session.targetId,
    );
  });
});
