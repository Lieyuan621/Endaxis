import { expect, it } from 'vitest';
import { describeDefinitionHistory } from './definitionHistoryPresentation';

it('describes the recorded object and structural operation without reading the current page', () => {
  expect(
    describeDefinitionHistory({
      path: '',
      section: 'entities',
      objectId: 'a.b',
      operation: 'duplicate',
    }),
  ).toBe('复制能力实体「a.b」');
  expect(describeDefinitionHistory({ path: '', section: 'buffs', objectId: 'buff-1' })).toBe(
    '修改Buff「buff-1」',
  );
  expect(describeDefinitionHistory(undefined)).toBe('修改定义');
});
