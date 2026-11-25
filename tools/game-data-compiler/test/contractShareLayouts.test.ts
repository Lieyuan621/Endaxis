import { expect, it } from 'vitest';
import { compileContractShareLayouts } from '../scripts/generateContingencyContractShareLayouts.ts';

it('分享位置来自原生 row 而非分数或数组顺序，总列数包含末尾空列', () => {
  const contracts = {
    test: {
      activityId: 'activity',
      contractColMap: {
        '2': { contractRowMap: { '3': { tagId: 42, column: 2, row: 3, score: 1 } } },
      },
    },
  };
  const activities = { activity: { tagMaxColumn: 24 } };
  expect(compileContractShareLayouts(contracts, activities)).toEqual([
    { gameId: 'test', maxColumn: 24, columns: { '2': { '3': 42 } } },
  ]);
  expect(() => compileContractShareLayouts(contracts, { activity: { tagMaxColumn: 1 } })).toThrow();
  contracts.test.contractColMap['2'].contractRowMap['3'].row = 1;
  expect(() => compileContractShareLayouts(contracts, activities)).toThrow();
});
