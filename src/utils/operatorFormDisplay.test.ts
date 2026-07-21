import { describe, expect, test } from 'vitest';
import { getOperatorFormName } from '@/data/gameText';
import { getTrackOperatorFormName } from './operatorFormDisplay';

describe('operator form display', () => {
  test('resolves arcane form labels from game text', () => {
    expect(getOperatorFormName('arcane', 'int', 'zh-CN')).toBe('阵诀·智');
    expect(getOperatorFormName('arcane', 'will', 'zh-CN')).toBe('阵诀·意');
    expect(getOperatorFormName('arcane', 'int', 'en')).toBe('Array Arcana · INT');
  });

  test('returns null without a track operator instance', () => {
    expect(getTrackOperatorFormName(null)).toBeNull();
    expect(getTrackOperatorFormName({ id: 'arcane' } as never)).toBeNull();
  });
});
