import { describe, expect, it } from 'vitest';

import { projectNativeDamageElement, parseNativeDamageElementSource } from '../src/index.ts';

describe('公共原生元素投影', () => {
  it('原生别名先解析身份，再映射为正式元素', () => {
    expect(parseNativeDamageElementSource('Cold', 'fixture')).toBe('Cryst');
    expect(projectNativeDamageElement('Cold', 'fixture')).toBe('cryo');
  });

  it('电属性沿用游戏的 Pulse 身份', () => {
    expect(projectNativeDamageElement('Pulse', 'fixture')).toBe('electric');
  });

  it('拒绝没有证据的原生身份', () => {
    expect(() => projectNativeDamageElement('Ether', 'fixture')).toThrow(
      'unsupported native damage element "Ether"',
    );
  });
});
