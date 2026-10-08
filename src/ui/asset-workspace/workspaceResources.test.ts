import { describe, expect, it } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import {
  describeWorkspaceResources,
  workspaceResourcePath,
  workspaceActionReferences,
  type WorkspaceResource,
} from './workspaceResources';

describe('资产内部资源导航', () => {
  it('只将无歧义的公共 Buff 指向外部资产，不覆盖同名私有定义', () => {
    const definition = {
      actionGraph: {
        main: {
          nodes: {
            apply: {
              action: { kind: 'applyBuff', parameters: { buffId: 'shared', target: 'caster' } },
            },
          },
        },
        macros: {},
      },
    };
    const root: WorkspaceResource = {
      id: '[]',
      kind: 'buff',
      name: '来源',
      definitionResource: { kind: 'buff', path: [], identity: 'source' },
    };
    const shared = { id: 'shared', assetId: 'buff:shared', name: '公共状态' };
    expect(workspaceActionReferences(definition, [root], [shared])).toEqual([
      { from: '[]', to: '[]', kind: 'uses', targetAsset: { id: 'buff:shared', name: '公共状态' } },
    ]);
    const local: WorkspaceResource = {
      id: 'local',
      kind: 'buff',
      name: '私有',
      definitionResource: { kind: 'buff', path: ['missing'], identity: 'shared' },
    };
    expect(workspaceActionReferences(definition, [root, local], [shared])).toEqual([]);
    expect(
      workspaceActionReferences(definition, [root], [shared, { ...shared, assetId: 'duplicate' }]),
    ).toEqual([]);
  });
  it('识别条件节点中的资源引用，不把标签当成 Buff 身份', () => {
    const graph = {
      nodes: {},
      dataNodes: {
        check: {
          type: 'boolean',
          expression: {
            kind: 'all',
            conditions: [
              { kind: 'conditionNode', nodeId: 'not' },
              { kind: 'conditionNode', nodeId: 'tag' },
            ],
          },
        },
        not: {
          type: 'boolean',
          expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'match' } },
        },
        match: { type: 'boolean', expression: { kind: 'eventBuffIdMatch', buffIds: ['buff'] } },
        tag: {
          type: 'boolean',
          expression: {
            kind: 'buffBlackboardValueCompare',
            query: { kind: 'tag', buffTags: ['tag'] },
            desiredKey: 'value',
            outputKey: 'value',
            operator: 'gt',
            value: 0,
            target: 'caster',
          },
        },
      },
    };
    const definition = { skill: { actionGraph: { main: graph, macros: {} } }, buff: {}, tag: {} };
    const resources: WorkspaceResource[] = ['skill', 'buff', 'tag'].map(id => ({
      id,
      name: id,
      kind: id === 'skill' ? 'skill' : 'buff',
      definitionResource: { kind: id === 'skill' ? 'skill' : 'buff', path: [id], identity: id },
    }));
    expect(workspaceActionReferences(definition, resources)).toEqual([
      { from: 'skill', to: 'buff', kind: 'uses' },
    ]);
  });
  it('静态引用去重，动态身份和普通变量字符串不会被当成资源引用', () => {
    const apply = (buffId: unknown) => ({
      action: { kind: 'applyBuff', parameters: { buffId, target: 'caster' } },
    });
    const definition = {
      skill: {
        blackboard: { description: 'buff' },
        actionGraph: {
          main: { nodes: { a: apply('buff'), b: apply({ blackboardKey: 'buff' }) } },
          macros: { repeat: { graph: { nodes: { c: apply('buff') } } } },
        },
      },
      buff: {},
      unrelated: {},
    };
    const resources: WorkspaceResource[] = [
      {
        id: 'skill',
        kind: 'skill',
        name: '技能',
        definitionResource: { kind: 'skill', path: ['skill'], identity: 'skill' },
      },
      {
        id: 'buff',
        kind: 'buff',
        name: '状态',
        definitionResource: { kind: 'buff', path: ['buff'], identity: 'buff' },
      },
      {
        id: 'unrelated',
        kind: 'buff',
        name: '其他',
        definitionResource: { kind: 'buff', path: ['unrelated'], identity: 'description' },
      },
    ];
    expect(workspaceActionReferences(definition, resources)).toEqual([
      { from: 'skill', to: 'buff', kind: 'uses' },
    ]);
    expect(
      workspaceActionReferences(definition, [...resources, { ...resources[1]!, id: 'ambiguous' }]),
    ).toEqual([]);
  });
  it('真实干员的子资源全部定位到原定义，编排包装不增加导航层', () => {
    const resources = describeWorkspaceResources(
      { kind: 'operator', definition: perlica },
      resource => resource.identity,
    );
    const root = resources.find(resource => resource.parent === undefined)!;
    const byId = new Map(resources.map(resource => [resource.id, resource]));
    expect(root.definitionResource.path).toEqual([]);
    expect(resources.some(resource => resource.kind === 'skill')).toBe(true);
    expect(resources.some(resource => resource.kind === 'buff')).toBe(true);
    expect(
      resources.some(resource => ['skillGroup', 'skillGroupVariant'].includes(resource.kind)),
    ).toBe(false);
    for (const resource of resources) {
      expect(fieldValueAt(perlica, resource.definitionResource.path)).toBeDefined();
      expect(workspaceResourcePath(byId, resource.id)[0]).toBe(root.id);
    }
  });

  it('所属路径保留实体这一层，不把实体技能当作另一个顶级资产', () => {
    const resources = [
      { id: 'operator' },
      { id: 'entity', parent: 'operator' },
      { id: 'skill', parent: 'entity' },
      { id: 'other' },
    ];
    const byId = new Map(resources.map(resource => [resource.id, resource]));
    expect(workspaceResourcePath(byId, 'skill')).toEqual(['operator', 'entity', 'skill']);
    expect(workspaceResourcePath(byId, 'other')).toEqual(['other']);
    expect(workspaceResourcePath(byId, 'missing')).toEqual([]);
  });

  it('无效的包含关系明确报错，避免导航无限循环', () => {
    expect(() =>
      workspaceResourcePath(
        new Map(
          [
            { id: 'a', parent: 'b' },
            { id: 'b', parent: 'a' },
          ].map(resource => [resource.id, resource]),
        ),
        'a',
      ),
    ).toThrow('cyclic asset containment');
  });
});
