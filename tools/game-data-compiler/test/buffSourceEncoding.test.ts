import { describe, expect, it } from 'vitest';
import { parseBlackboardAssignmentsSource } from '../src/source/assignments.ts';
import { parseBuffIconDuration } from '../src/source/buffActions.ts';

const assignment = {
  targetKey: 'duration',
  inputValueKey: 'source_duration',
  useDirectValue: false,
  directValueType: 'Numeric',
  numericValue: 3,
  stringValue: '',
};
const parseAssignment = (value: unknown, enabled = true) =>
  parseBlackboardAssignmentsSource([value], 'assignments', { enabled });

describe('Buff 公共载荷的来源编码', () => {
  it.each([
    [0, 'Numeric', false],
    [1, 'String', true],
  ])('赋值类型 %s / %s 产生相同来源 IR', (number, name, useDirectValue) => {
    expect(parseAssignment({ ...assignment, useDirectValue, directValueType: number })).toEqual(
      parseAssignment({ ...assignment, useDirectValue, directValueType: name }),
    );
  });

  it.each([2, 'Any'])('原生 Any=%s 已知，但当前赋值仍不支持', value => {
    expect(() => parseAssignment({ ...assignment, directValueType: value })).toThrow(
      'unsupported value Any',
    );
  });

  it.each([3, '0'])('不接受未知或强转的赋值类型 %j', value => {
    expect(() => parseAssignment({ ...assignment, directValueType: value })).toThrow(
      'assignments[0].directValueType',
    );
  });

  it('没有放宽启用赋值的键、重复键和完整字段校验', () => {
    expect(() => parseAssignment({ ...assignment, inputValueKey: '' })).toThrow(
      'requires an input key',
    );
    expect(() => parseAssignment({ ...assignment, targetKey: '' })).toThrow(
      'expected non-empty string',
    );
    expect(() =>
      parseBlackboardAssignmentsSource([assignment, assignment], 'a', { enabled: true }),
    ).toThrow('duplicate assignment');
    expect(() => parseAssignment({ ...assignment, extra: 1 })).toThrow('unexpected fields');
    expect(
      parseAssignment(
        { ...assignment, targetKey: '', inputValueKey: '', directValueType: 0 },
        false,
      ),
    ).toMatchObject([{ targetKey: '', inputValueKey: '', valueType: 'Numeric' }]);
  });

  it('图标时长保留两种来源和已确认的说明字段布局', () => {
    expect(
      parseBuffIconDuration({ durationSourceType: 0, timedMarkerId: 'marker' }, 'duration'),
    ).toEqual({
      durationSourceType: 'AbilityEntity',
      timedMarkerId: 'marker',
    });
    const timedMarker = { durationSourceType: 'TimedMarker', timedMarkerId: 'marker' };
    expect(parseBuffIconDuration({ ...timedMarker, durationSourceType: 1 }, 'duration')).toEqual(
      timedMarker,
    );
    expect(
      parseBuffIconDuration(
        {
          ...timedMarker,
          m_abilityEntityTypeInfo: '旧说明',
          m_timedMarkerInfo: '旧说明',
        },
        'duration',
      ),
    ).toEqual(timedMarker);
  });

  it.each([
    { durationSourceType: 0 },
    { durationSourceType: 0, timedMarkerId: '', extra: true },
    { durationSourceType: 2, timedMarkerId: '' },
  ])('拒绝缺失、未知字段和非法类型：%j', source => {
    expect(() => parseBuffIconDuration(source, 'duration')).toThrow('duration');
  });
});
