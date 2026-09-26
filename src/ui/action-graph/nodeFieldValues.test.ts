import { expect, it } from 'vitest';
it('替换短路条件的第一个数据输入时保留数组与后续条件', () => {
  const value = {
    conditions: [
      { kind: 'constant', value: false },
      { kind: 'constant', value: true },
    ],
  };
  const changed = writeNodeField(value, ['conditions', '0'], {
    kind: 'conditionNode',
    nodeId: 'check',
  });
  expect(changed).toEqual({
    conditions: [{ kind: 'conditionNode', nodeId: 'check' }, value.conditions[1]],
  });
  expect(value.conditions[0]!.value).toBe(false);
});
import { actionNodeSchemas } from './actionNodeSchemas.generated';

it('枚举列表保留空选择与未设置的区别，并拒绝未知选项', () => {
  const field = actionNodeSchemas.dealDamage.fields.find(field => field.path.at(-1) === 'tags')!;
  expect(parseNodeField('[]', field)).toEqual([]);
  expect(() => parseNodeField('', field)).toThrow();
  expect(parseNodeField('', { ...field, required: false })).toBeUndefined();
  expect(parseNodeField('["plungingAttack"]', field)).toEqual(['plungingAttack']);
  expect(() => parseNodeField('["unknown"]', field)).toThrow();
  expect(() => parseNodeField('"plungingAttack"', field)).toThrow();
});
import {
  containsActionGraph,
  formatNodeField,
  parseNodeField,
  readNodeField,
  writeNodeField,
} from './nodeFieldValues';

it('字段更新保留兄弟参数与执行出口，不修改输入定义', () => {
  const action = {
    kind: 'dealStagger',
    parameters: { value: 2, targets: ['enemy'] },
    key: 'stable',
  };
  const changed = writeNodeField(action, ['parameters', 'value'], 0);
  expect(changed).toEqual({ ...action, parameters: { ...action.parameters, value: 0 } });
  expect(action.parameters.value).toBe(2);
  expect(readNodeField(changed, ['parameters', 'targets'])).toBe(action.parameters.targets);
});

it('可选字段清空会删除字段，数值零仍保留', () => {
  const field = actionNodeSchemas.dealStagger.fields.find(
    field => field.path.join('.') === 'parameters.value',
  )!;
  expect(parseNodeField('0', field)).toBe(0);
  const key = actionNodeSchemas.dealStagger.fields.find(field => field.path[0] === 'key')!;
  expect(parseNodeField('', key)).toBeUndefined();
  expect(writeNodeField({ key: 'old' }, key.path, undefined)).toEqual({});
});

it('复杂联合字段完整读写，不把数组改成对象或丢失合法字段', () => {
  const field = actionNodeSchemas.switch.fields.find(field => field.path[0] === 'options')!;
  const value = [
    { value: 2, sequence: { $sequence: 'a' } },
    { value: 3, sequence: { $sequence: null } },
  ];
  expect(parseNodeField(formatNodeField(value, field), field)).toEqual(value);
});

it('识别藏在实体模板和回调数组中的独立图，不把普通控制引用当成资源', () => {
  expect(
    containsActionGraph({ childSkills: [{ actionGraph: { main: { nodes: {} }, macros: {} } }] }),
  ).toBe(true);
  expect(containsActionGraph({ body: { $sequence: 'a' } })).toBe(false);
});
