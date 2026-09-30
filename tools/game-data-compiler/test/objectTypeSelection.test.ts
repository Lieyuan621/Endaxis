import { describe, expect, it } from 'vitest';
import { projectObjectTypeSelection } from '../src/source/objectType';

describe('对象类型只在来源边界解码', () => {
  it.each([
    ['Character, Projectile', ['character', 'projectile']],
    [16400, ['enemy', 'enemyPart']],
    [0, []],
    [-1, 'all'],
  ])('转换 %j', (input, expected) => {
    expect(projectObjectTypeSelection(input, 'probe')).toEqual(expected);
  });
  it('拒绝无法翻译的来源', () => {
    expect(() => projectObjectTypeSelection('Unknown', 'probe')).toThrow();
  });
});
