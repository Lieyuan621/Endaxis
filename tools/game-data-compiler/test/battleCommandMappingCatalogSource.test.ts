import { describe, expect, it } from 'vitest';
import {
  parseBattleCommandMappingCatalogDumpSource,
  renderBattleCommandMappingCatalogModule,
} from '../src/source/battleCommandMappingCatalogSource.ts';

const dump = `MonoBehaviour Base
\tSerializeFieldDictionary\`2 defaultCacheTimeMap
\t\tvector _keyData
\t\t\tArray Array
\t\t\tint size = 6
${[0, 1, 2, 3, 4, 5].map(index => `\t\t\t\t[${index}]\n\t\t\t\tint data = ${index}`).join('\n')}
\t\tvector _valueData
\t\t\tArray Array
\t\t\tint size = 6
${[0.15, 0.2, 0.1, 0.1, 0.1, 0.1].map((value, index) => `\t\t\t\t[${index}]\n\t\t\t\tfloat data = ${value}`).join('\n')}
\tfloat dashOffsetCacheTime = 1
\tfloat skillOffsetCacheTime = 1
\tfloat jumpOffsetCacheTime = 1
\tfloat attackCacheTimeInDash = 0.4
\tfloat blockAttackTimeInDash = 0.1
\tfloat allowAttackTimeAfterDash = 0.35
\tfloat attackCacheTimeInPerfectDodge = 0.3
\tfloat blockAttackTimeInPerfectDodge = 0.1
\tfloat allowAttackTimeAfterPerfectDodge = 0.25
\tfloat allowDashInPerfectDodge = 0.5
`;

describe('BattleCommandMappingConfig catalog source', () => {
  it('reads every command cache and transition window without quantizing seconds', () => {
    const source = parseBattleCommandMappingCatalogDumpSource(dump, 'fixture');
    expect(source).toMatchObject({
      defaultCacheTimes: [0.15, 0.2, 0.1, 0.1, 0.1, 0.1],
      attackCacheTimeInDash: 0.4,
      blockAttackTimeInDash: 0.1,
      allowAttackTimeAfterDash: 0.35,
      attackCacheTimeInPerfectDodge: 0.3,
      blockAttackTimeInPerfectDodge: 0.1,
      allowAttackTimeAfterPerfectDodge: 0.25,
      allowDashInPerfectDodge: 0.5,
    });
    expect(renderBattleCommandMappingCatalogModule(source)).toContain(
      '"allowAttackTimeAfterDash": 0.35',
    );
  });

  it('rejects incomplete or reordered command maps', () => {
    expect(() =>
      parseBattleCommandMappingCatalogDumpSource(
        dump.replace('int size = 6', 'int size = 5'),
        'count',
      ),
    ).toThrow('six default cache');
    expect(() =>
      parseBattleCommandMappingCatalogDumpSource(
        dump.replace('int data = 3', 'int data = 4'),
        'keys',
      ),
    ).toThrow('0..5');
  });
});
