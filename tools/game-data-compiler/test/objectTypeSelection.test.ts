import { describe, expect, it } from 'vitest';
import { projectObjectTypeSelection } from '../src/source/objectType';

describe('对象类型只在来源边界解码', () => {
  it.each([
    ['Character, Projectile', ['character', 'projectile']],
    [64, ['projectile']],
    [512, ['abilityEntity']],
    [16400, ['enemy', 'enemyPart']],
    [0, []],
    [-1, 'all'],
  ])('转换 %j', (input, expected) => {
    expect(projectObjectTypeSelection(input, 'probe')).toEqual(expected);
  });
  it.each([2, 4, 65536, -2, 'Unknown'])('拒绝无法翻译的来源 %j', value => {
    expect(() => projectObjectTypeSelection(value, 'probe')).toThrow();
  });
});
