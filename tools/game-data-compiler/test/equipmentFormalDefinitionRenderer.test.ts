import { describe, expect, it } from 'vitest';

import {
  renderEquipmentDefinitionFiles,
  type CompiledEquipmentDefinitionBatchSource,
  type CompiledGearDefinitionSource,
} from '../src/index.ts';

describe('单件装备正式定义渲染', () => {
  it('按稳定身份生成分套装单文件和索引，不把审计中间产物写入正式目录', () => {
    const files = renderEquipmentDefinitionFiles({
      definitions: [gear('gear-b', 'set-b'), gear('gear-a', undefined)],
      diagnostics: [
        {
          status: 'scenario-omitted',
          sourcePath: 'EquipTable.gear-b.equipAttrModifiers[2]',
          reason: 'playerDamageTakenRequiresEnemyActiveDamage',
        },
      ],
    });

    expect(files.map(file => file.relativePath)).toEqual([
      '_standalone/gear-a.generated.ts',
      'index.generated.ts',
      'set-b/gear-b.generated.ts',
    ]);
    expect(files.find(file => file.relativePath === 'index.generated.ts')?.content).toContain(
      "import generatedGear0 from './_standalone/gear-a.generated';",
    );
    expect(files.some(file => file.relativePath.endsWith('.audit.json'))).toBe(false);
  });

  it('相同定义的输入顺序不影响输出', () => {
    const left = renderEquipmentDefinitionFiles(batch([gear('gear-a'), gear('gear-b')]));
    const right = renderEquipmentDefinitionFiles(batch([gear('gear-b'), gear('gear-a')]));
    expect(right).toEqual(left);
  });

  it('在 blocked、重复身份或危险路径存在时失败关闭', () => {
    expect(() =>
      renderEquipmentDefinitionFiles({
        definitions: [gear('gear-a')],
        diagnostics: [{ status: 'blocked', sourcePath: 'x', reason: 'missing evidence' }],
      }),
    ).toThrow('1 blocked diagnostics');
    expect(() => renderEquipmentDefinitionFiles(batch([gear('gear-a'), gear('gear-a')]))).toThrow(
      'duplicate rendered gear definition',
    );
    expect(() => renderEquipmentDefinitionFiles(batch([gear('../escape')]))).toThrow(
      'filesystem-safe stable identity',
    );
  });
});

function batch(
  definitions: readonly CompiledGearDefinitionSource[],
): CompiledEquipmentDefinitionBatchSource {
  return { definitions, diagnostics: [] };
}

function gear(slug: string, gearSetSlug?: string): CompiledGearDefinitionSource {
  return {
    slug,
    assetSlug: slug,
    iconPath: `/equipment/test/${slug}.webp`,
    slotType: 'armor',
    levelRequirement: 70,
    baseDefense: 48,
    traits: [
      {
        key: 'attribute-1',
        levelCount: 4,
        display: {
          kind: 'modifier',
          modifier: {
            kind: 'attribute',
            attribute: 'main',
            operation: 'flat',
            value: [1, 2, 3, 4],
          },
        },
        modifiers: [
          {
            kind: 'attribute',
            attribute: 'main',
            operation: 'flat',
            value: [74, 81, 88, 96],
          },
        ],
      },
    ],
    ...(gearSetSlug === undefined ? {} : { gearSetSlug }),
  };
}
