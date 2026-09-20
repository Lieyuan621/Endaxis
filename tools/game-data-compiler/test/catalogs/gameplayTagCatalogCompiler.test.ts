import { describe, expect, it } from 'vitest';

import {
  compileGameplayTagCatalogSource,
  parseGameplayTagConfigDumpSource,
  renderGameplayTagCatalogModule,
} from '../../src/index.ts';

describe('GameplayTagConfig 转换', () => {
  it('按 _keyData 声明顺序读取并生成原生 CRC-32 身份', () => {
    const source = parseGameplayTagConfigDumpSource(
      new TextEncoder().encode(`
vector _keyData
  Array Array
    int size = 2
      string data = "Entity/Water"
      string data = "Entity/Water/Deep"
`),
      'fixture.dump',
    );
    const catalog = compileGameplayTagCatalogSource(source);
    expect(catalog.paths).toEqual(['Entity/Water', 'Entity/Water/Deep']);
    expect(catalog.definitions.map(value => value.id)).toEqual([-2062165986, -142617929]);
  });

  it('拒绝数量不符，原样保留重复来源供完整配置集投影处理', () => {
    expect(() =>
      parseGameplayTagConfigDumpSource(
        new TextEncoder().encode('vector _keyData Array Array int size = 2 string data = "A"'),
        'fixture.dump',
      ),
    ).toThrow(/expected 2 tag paths/);
    expect(
      parseGameplayTagConfigDumpSource(
        new TextEncoder().encode(
          'vector _keyData Array Array int size = 2 string data = "A" string data = "A"',
        ),
        'fixture.dump',
      ),
    ).toEqual({ paths: ['A', 'A'] });
  });

  it('确定性渲染版本化模块并保留来源哈希', () => {
    const rendered = renderGameplayTagCatalogModule(
      compileGameplayTagCatalogSource({ paths: ["Entity/Owner's"] }),
      '0'.repeat(64),
    );
    expect(rendered).toContain("'Entity/Owner\\'s'");
    expect(rendered).toContain(`Source SHA-256: ${'0'.repeat(64)}`);
    expect(rendered).toContain('npm run generate:game-data:gameplay-tags');
  });
});
