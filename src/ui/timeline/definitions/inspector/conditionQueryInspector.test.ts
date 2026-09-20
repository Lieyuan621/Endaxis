import { effectScope, shallowRef } from 'vue';
import { describe, expect, it } from 'vitest';
import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions';
import { conditionInspectorFields } from './conditionInspectorSchema';
import { parameterInspectorField } from './parameterInspectorSchema';
import {
  initialInspectorValue,
  matchesInspectorValue,
  inspectorFieldIssues,
} from './inspectorFields';
import { validateComparisonInspector } from './combatInspectorFields';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';

const original: CombatCondition = {
  kind: 'buffBlackboardValueCompare',
  target: 'enemy',
  query: { kind: 'id', buffIds: ['buff/a', 'buff/b'] },
  desiredKey: 'amount',
  outputKey: 'saved',
  operator: 'greater',
  value: { kind: 'constant', value: 1 },
};
const query = conditionInspectorFields(original.kind)!.find(field => field.key === 'query')!;

describe('查询对象是当前节点参数', () => {
  it('从契约生成对象分支及全部字段，没有手写查询字段数组', () => {
    expect(query.editor).toBe('union');
    const variants = query.variants!;
    expect(variants.map(shape => Object.keys(shape.properties!))).toEqual([
      ['kind', 'buffIds'],
      ['kind', 'tagQueryType', 'buffTags'],
    ]);
    expect(variants.findIndex(shape => matchesInspectorValue(shape, original.query))).toBe(0);
    const tag = variants[1]!;
    expect(matchesInspectorValue(tag, { kind: 'tag', buffTags: [] })).toBe(true);
    expect(initialInspectorValue(tag)).toEqual({
      kind: 'tag',
      tagQueryType: 'hasAny',
      buffTags: [],
    });
  });

  it('切换只替换 query，丢弃旧分支字段，撤销恢复完整原查询', () => {
    const next = query.write(original, initialInspectorValue(query.variants![1]!));
    expect(next.query).not.toHaveProperty('buffIds');
    expect(next).toEqual({
      ...original,
      query: { kind: 'tag', tagQueryType: 'hasAny', buffTags: [] },
    });
    const scope = effectScope();
    const current = shallowRef(original);
    const history = scope.run(() =>
      useDefinitionDraftHistory(
        () => current.value,
        value => {
          current.value = value;
        },
      ),
    )!;
    try {
      history.commit(next, { path: 'condition' });
      history.restore('undo');
      expect(current.value).toEqual(original);
      history.restore('redo');
      expect(current.value).toEqual(next);
    } finally {
      scope.stop();
    }
  });

  it('编辑子参数保留对象其他字段，领域错误归属外层 query', () => {
    const shape = query.variants![1]!.properties!;
    const tag = { kind: 'tag', tagQueryType: 'hasAny', buffTags: ['Entity/Enemy'] };
    const field = parameterInspectorField<Record<string, unknown>>('buffTags', shape.buffTags!);
    const updated = field.write(tag, ['Entity/Target']);
    expect(updated).toEqual({ ...tag, buffTags: ['Entity/Target'] });
    expect(tag.buffTags).toEqual(['Entity/Enemy']);
    const invalid = query.write(original, {
      kind: 'tag',
      tagQueryType: 'invalid',
      buffTags: ['123'],
    });
    expect(
      inspectorFieldIssues(validateComparisonInspector(invalid), 'query').length,
    ).toBeGreaterThan(0);
    expect(query.write(original, { kind: 'unknown' })).toBe(original);
  });
});
