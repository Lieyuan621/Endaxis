import { extractGraphDataNodes } from '../src/compiler/extractGraphDataNodes.ts';
import { describe, expect, it } from 'vitest';

import { renderEquipmentSuitDefinitionFiles } from '../src/index.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import {
  createRenderContext,
  renderGraphValue,
  renderValue,
} from '../src/compiler/optimization/actionGraphSourceRenderer.ts';

describe('装备套装运行时定义渲染', () => {
  it('按输入顺序渲染资源及嵌套字段，不额外重排', () => {
    const actionGraph = { main: { nodes: {} }, macros: {} };
    const definitions = [
      {
        actionGraph,
        slug: 'fixture',
        buffDefinitions: { buff: { actionGraph, stackingType: 'unique' } },
      },
      {
        slug: 'fixture',
        buffDefinitions: { buff: { stackingType: 'unique', actionGraph } },
        actionGraph,
      },
    ];
    for (const definition of definitions) {
      for (const rendered of [
        renderGraphValue(definition),
        renderValue(definition, createRenderContext()),
      ]) {
        expect(JSON.stringify(JSON.parse(rendered))).toBe(JSON.stringify(definition));
      }
    }
  });

  it('按套装身份生成定义和索引，不把审计中间产物写入正式目录', () => {
    const graph = createActionGraphBuilder();
    const initializationSequence = graph.node({
      kind: 'applyBuff',
      parameters: {
        buffs: [{ buffId: 'buff_fixture' }],
        targets: { kind: 'fixed', target: 'caster' },
      },
    });
    const files = renderEquipmentSuitDefinitionFiles({
      definitions: [
        {
          slug: 'suit_fixture',
          modifiers: [],
          buffDefinitions: {
            buff_fixture: {
              stackingType: 'unique',
              priority: 0,
              maxStackCount: 0,
              applyTags: [],
              extendTags: [],
              blackboard: {},
              attributeModifiers: [],
            },
          },
          actionGraph: { main: extractGraphDataNodes(graph.finish()), macros: {} },
          initializationSequence,
        },
      ],
      diagnostics: [
        {
          status: 'scenario-omitted',
          sourcePath: 'BuffData.buff_vfx',
          reason: 'particle-only stack effect',
        },
      ],
    });
    expect(files.map(file => file.relativePath)).toEqual([
      'index.generated.ts',
      'suit_fixture.generated.ts',
    ]);
    expect(files.some(file => file.relativePath.endsWith('.audit.json'))).toBe(false);
  });

  it('fails closed on blocked diagnostics and unsafe identities', () => {
    expect(() =>
      renderEquipmentSuitDefinitionFiles({
        definitions: [],
        diagnostics: [{ status: 'blocked', sourcePath: 'x', reason: 'missing evidence' }],
      }),
    ).toThrow('1 blocked diagnostics');
    expect(() =>
      renderEquipmentSuitDefinitionFiles({
        definitions: [{ slug: '../escape', modifiers: [] }],
        diagnostics: [],
      }),
    ).toThrow('filesystem-safe stable identity');
  });
});
