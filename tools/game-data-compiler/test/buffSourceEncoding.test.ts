import { describe, expect, it } from 'vitest';
import { parseBlackboardAssignmentsSource } from '../src/source/assignments.ts';
import { parseBuffIconDuration } from '../src/source/buffActions.ts';
import {
  readControlledStateDeadOption,
  readAbilityActionReturnTrueMethod,
} from '../src/source/controlEnums.ts';

const assignment = {
  targetKey: 'duration', inputValueKey: 'source_duration', useDirectValue: false,
  directValueType: 'Numeric', numericValue: 3, stringValue: '',
};
const parseAssignment = (value: unknown, enabled = true) =>
  parseBlackboardAssignmentsSource([value], 'assignments', { enabled });

describe('Buff 公共载荷的来源编码', () => {
  it.each([[0, 'Numeric'], [1, 'String']])('赋值类型 %s / %s 产生相同来源 IR', (number, name) => {
    for (const useDirectValue of [false, true]) {
      expect(parseAssignment({ ...assignment, useDirectValue, directValueType: number }))
        .toEqual(parseAssignment({ ...assignment, useDirectValue, directValueType: name }));
    }
  });

  it.each([2, 'Any'])('原生 Any=%s 已知，但当前赋值仍不支持', value => {
    expect(() => parseAssignment({ ...assignment, directValueType: value }))
      .toThrow('unsupported value Any');
  });

  it.each([-1, 3, '0', '', null])('不接受未知或强转的赋值类型 %j', value => {
    expect(() => parseAssignment({ ...assignment, directValueType: value }))
      .toThrow('assignments[0].directValueType');
  });

  it('没有放宽启用赋值的键、重复键和完整字段校验', () => {
    expect(() => parseAssignment({ ...assignment, inputValueKey: '' })).toThrow('requires an input key');
    expect(() => parseAssignment({ ...assignment, targetKey: '' })).toThrow('expected non-empty string');
    expect(() => parseBlackboardAssignmentsSource([assignment, assignment], 'a', { enabled: true }))
      .toThrow('duplicate assignment');
    expect(() => parseAssignment({ ...assignment, extra: 1 })).toThrow('unexpected fields');
    expect(parseAssignment({ ...assignment, targetKey: '', inputValueKey: '', directValueType: 0 }, false))
      .toMatchObject([{ targetKey: '', inputValueKey: '', valueType: 'Numeric' }]);
  });

  it.each([[0, 'AbilityEntity'], [1, 'TimedMarker']])('图标时长 %s / %s 的两种布局等价', (number, name) => {
    const expected = { durationSourceType: name, timedMarkerId: 'marker' };
    for (const durationSourceType of [number, name]) {
      const native = { durationSourceType, timedMarkerId: 'marker' };
      expect(parseBuffIconDuration(native, 'duration')).toEqual(expected);
      expect(parseBuffIconDuration({
        ...native, m_abilityEntityTypeInfo: '旧说明', m_timedMarkerInfo: '旧说明',
      }, 'duration')).toEqual(expected);
    }
  });

  it.each([
    { durationSourceType: 0 },
    { durationSourceType: 0, timedMarkerId: '', extra: true },
    { durationSourceType: 0, timedMarkerId: '', m_abilityEntityTypeInfo: '' },
    { durationSourceType: 0, timedMarkerId: '', m_abilityEntityTypeInfo: null, m_timedMarkerInfo: '' },
    { durationSourceType: 0, timedMarkerId: 1 },
    { durationSourceType: 2, timedMarkerId: '' },
    { durationSourceType: '0', timedMarkerId: '' },
  ])('拒绝缺失、未知字段和非法类型：%j', source => {
    expect(() => parseBuffIconDuration(source, 'duration')).toThrow('duration');
  });
});

describe('共享受控状态枚举', () => {
  it.each([[0, 'AllValid'], [1, 'OnlyAlive'], [2, 'OnlyDead']])('deadOption %s / %s', (number, name) => {
    expect(readControlledStateDeadOption(number, 'dead')).toBe(name);
    expect(readControlledStateDeadOption(name, 'dead')).toBe(name);
  });
  it.each([[0, 'Always'], [1, 'BothSuccessAndInterrupted'], [2, 'OnlySuccess'], [3, 'OnlyInterrupted']])(
    'returnTrueWhen %s / %s', (number, name) => {
      expect(readAbilityActionReturnTrueMethod(number, 'result')).toBe(name);
      expect(readAbilityActionReturnTrueMethod(name, 'result')).toBe(name);
    },
  );
  it.each([-1, 4, '0', 'Any', null, undefined])('拒绝未知/强转的控制选项 %j', value => {
    expect(() => readControlledStateDeadOption(value, 'dead')).toThrow('dead');
    expect(() => readAbilityActionReturnTrueMethod(value, 'result')).toThrow('result');
  });
});
