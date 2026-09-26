import { expect, it } from 'vitest';
import { copyCustomGraphDocument, freezeGraphDocument } from './immutableGraphDocument';

it('只读图的数组、参数、宏和坐标均不能被原地修改', () => {
  const graph = freezeGraphDocument({
    nodes: [{ parameters: { value: 1 } }],
    macros: { m: { value: 2 } },
    layout: { x: 3 },
  });
  expect(() => {
    graph.nodes.push({ parameters: { value: 4 } });
  }).toThrow();
  expect(() => {
    graph.nodes[0]!.parameters.value = 9;
  }).toThrow();
  expect(() => {
    graph.macros.m.value = 9;
  }).toThrow();
  expect(() => {
    graph.layout.x = 9;
  }).toThrow();
  expect(graph.nodes[0]!.parameters.value).toBe(1);
});
it('自定义复制不与源对象共享任何嵌套对象，快照本身仍不可变', () => {
  const source = freezeGraphDocument({ a: { values: [1, 2] }, b: { nested: { x: 0 } } });
  const custom = copyCustomGraphDocument(source);
  expect(custom).toEqual(source);
  expect(custom.a).not.toBe(source.a);
  expect(custom.a.values).not.toBe(source.a.values);
  expect(custom.b.nested).not.toBe(source.b.nested);
  expect(() => {
    custom.b.nested.x = 1;
  }).toThrow();
});
it('外层已经冻结也不能跳过内层，共享引用和循环不会反复遍历', () => {
  const child = { value: 1 };
  const root = Object.freeze({ child, other: child });
  freezeGraphDocument(root);
  expect(Object.isFrozen(child)).toBe(true);
  const cycle: { self?: object } = {};
  cycle.self = cycle;
  expect(freezeGraphDocument(cycle)).toBe(cycle);
});
