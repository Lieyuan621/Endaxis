import { describe, expect, it } from 'vitest';

import { renderEquipmentSuitDefinitionFiles } from '../src/index.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';

describe('装备套装运行时定义渲染', () => {
  it('稳定生成 GearSetDefinition 和索引，不把审计中间产物写入正式目录', () => {
    const graph = createActionGraphBuilder();
    const initializationSequence = graph.node({
      kind: 'applyBuff',
      parameters: { buffId: 'buff_fixture', target: 'caster' },
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
          actionGraph: { main: graph.finish(), macros: {} },
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
    expect(
      files.find(file => file.relativePath === 'suit_fixture.generated.ts')?.content,
    ).toContain('satisfies GearSetDefinition');
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
