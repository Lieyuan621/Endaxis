import { describe, expect, it } from 'vitest';
import { renderContingencyContractDefinitionsFromCompiled } from '../scripts/generateContingencyContractDefinitions';

describe('合约产物命名与元数据', () => {
  it.each(['indie_contract001', 'indie_contract002'])(
    '按原生期数 %s 统一命名，不写导出版本',
    async gameId => {
      const result = await renderContingencyContractDefinitionsFromCompiled(
        {
          gameId,
          tags: [],
          buffDefinitions: {},
          initializationPlans: [],
          scope: {
            supportedTagIds: new Set(),
            blockedTagReasons: new Map(),
            omittedTagReasons: new Map(),
          },
        },
        'off',
      );
      expect(result.files).toHaveLength(1);
      expect(result.files[0]!.relativePath).toBe(`contingencyContract.${gameId}.generated.ts`);
      expect(result.files[0]!.content).not.toMatch(/DefinitionRevision|sourceSha256|installed-/);
    },
  );
});
