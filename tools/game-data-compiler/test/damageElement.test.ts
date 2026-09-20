import { describe, expect, it } from 'vitest';

import {
  projectNativeDamageElement,
  parseNativeDamageElementSource,
  PROJECTED_DAMAGE_ELEMENTS,
} from '../src/index.ts';
import { DAMAGE_ELEMENTS } from '../../../packages/game-data-contract/src/primitives.ts';

describe('公共原生元素投影', () => {
  it('输出值域等于契约，但旧公共数组的遍历顺序不变', () => {
    expect(PROJECTED_DAMAGE_ELEMENTS).toEqual(['physical', 'heat', 'electric', 'cryo', 'nature']);
    expect([...PROJECTED_DAMAGE_ELEMENTS].sort()).toEqual([...DAMAGE_ELEMENTS].sort());
  });

  it.each([
    ['Heat', 'Fire', 'heat'],
    ['Cold', 'Cryst', 'cryo'],
    ['Nature', 'Natural', 'nature'],
  ])('原生别名 %s 保留解析身份 %s，再映射为 %s', (alias, native, formal) => {
    expect(parseNativeDamageElementSource(alias, 'fixture')).toBe(native);
    expect(projectNativeDamageElement(alias, 'fixture')).toBe(formal);
  });

  it('为角色、伤害和条件数据复用同一组稳定身份', () => {
    expect(projectNativeDamageElement('Physical', 'fixture')).toBe('physical');
    expect(projectNativeDamageElement('Fire', 'fixture')).toBe('heat');
    expect(projectNativeDamageElement('Pulse', 'fixture')).toBe('electric');
    expect(projectNativeDamageElement('Cryst', 'fixture')).toBe('cryo');
    expect(projectNativeDamageElement('Natural', 'fixture')).toBe('nature');
  });

  it('拒绝没有证据的原生身份', () => {
    expect(() => projectNativeDamageElement('Ether', 'fixture')).toThrow(
      'unsupported native damage element "Ether"',
    );
  });
});
