import { describe, expect, it } from 'vitest';
import type {
  ContingencyContractShareLayout,
  ContingencyContractTagDefinition,
} from '../../../packages/game-data-contract/src/mechanics';
import {
  decodeContractShareCode,
  encodeContractShareCode,
  replaceContractSeasonSelection,
} from './shareCode';
import { contingencyContractShareLayouts } from './shareLayouts.generated';

function tag(
  tagId: number,
  extra: Partial<ContingencyContractTagDefinition> = {},
): ContingencyContractTagDefinition {
  return {
    tagId,
    columnId: '1',
    conflictId: '',
    keyId: '',
    lockIds: [],
    score: 1,
    romanNumSuffix: '',
    icon: 'icons:test',
    blackboard: {},
    ...extra,
  };
}
const layout: ContingencyContractShareLayout = {
  gameId: 'test',
  maxColumn: 24,
  columns: { '1': { '1': 1, '2': 2 }, '2': { '1': 3 }, '24': { '3': 4 } },
};
const tags = [tag(1), tag(2), tag(3), tag(4)];
describe('原生合约分享码', () => {
  it('按原生列行位权编码，保留超过 Number 安全范围的高位与末尾空列', () => {
    expect(encodeContractShareCode(layout, [])).toBe('000000000000000');
    expect(encodeContractShareCode(layout, [1, 3])).toBe('000000000000009');
    expect(encodeContractShareCode(layout, [4, 1])).toBe('200000000000001');
    expect(decodeContractShareCode(layout, tags, '200000000000001')).toEqual({
      ok: true,
      tagIds: [1, 4],
      score: 2,
    });
  });
  it('支持带文案的码与小写，拒绝错误字符、多组括号、溢出和空行', () => {
    expect(decodeContractShareCode(layout, tags, '分享\n<00000000000000b>')).toEqual({
      ok: true,
      tagIds: [1, 2, 3],
      score: 3,
    });
    for (const code of [
      '00000000000000I',
      '800000000000000',
      '000000000000004',
      '<000000000000000><000000000000000>',
      '00000000000000',
    ]) {
      expect(decodeContractShareCode(layout, tags, code)).toEqual({ ok: false, error: 'invalid' });
    }
  });
  it('只校验指标的互斥与前置，不依赖账号解锁状态；缺失指标不可静默丢弃', () => {
    expect(
      decodeContractShareCode(
        layout,
        [tag(1, { conflictId: 'a' }), tag(2, { conflictId: 'a' })],
        encodeContractShareCode(layout, [1, 2]),
      ),
    ).toEqual({ ok: false, error: 'conflict' });
    const locked = [tag(1, { keyId: 'key' }), tag(2, { lockIds: ['key'] })];
    expect(decodeContractShareCode(layout, locked, encodeContractShareCode(layout, [2]))).toEqual({
      ok: false,
      error: 'prerequisite',
    });
    expect(
      decodeContractShareCode(layout, locked, encodeContractShareCode(layout, [1, 2])).ok,
    ).toBe(true);
    expect(decodeContractShareCode(layout, [], encodeContractShareCode(layout, [1]))).toEqual({
      ok: false,
      error: 'unavailable',
    });
    expect(() => encodeContractShareCode(layout, [999])).toThrow();
  });
  it('两期完整布局的每个指标都能往返，替换只影响当前期数', () => {
    expect(
      contingencyContractShareLayouts.map(item => Math.ceil((item.maxColumn * 3) / 5)),
    ).toEqual([15, 14]);
    for (const item of contingencyContractShareLayouts) {
      const ids = Object.values(item.columns).flatMap(rows => Object.values(rows));
      const definitions = ids.map(id => tag(id));
      for (const id of ids)
        expect(
          decodeContractShareCode(item, definitions, encodeContractShareCode(item, [id])),
        ).toEqual({ ok: true, tagIds: [id], score: 1 });
    }
    expect(replaceContractSeasonSelection([1, 2, 99], new Set([1, 2, 3]), [3])).toEqual([99, 3]);
    expect(replaceContractSeasonSelection([1, 99], new Set([1, 2, 3]), [])).toEqual([99]);
  });
});
