import { describe, expect, test } from 'vitest';
import {
  getRichTextTerm,
  parseGameRichText,
} from './gameRichText';

describe('game rich text', () => {
  test('parses style and term tags without dropping plain text', () => {
    expect(parseGameRichText('Deal <@ba.fire>Heat DMG</> and apply <#ba.burning>Combustion</>')).toEqual([
      { type: 'text', text: 'Deal ' },
      { type: 'style', id: 'ba.fire', children: [{ type: 'text', text: 'Heat DMG' }] },
      { type: 'text', text: ' and apply ' },
      { type: 'term', id: 'ba.burning', children: [{ type: 'text', text: 'Combustion' }] },
    ]);
  });

  test('parses converted internal image tags', () => {
    expect(parseGameRichText('<image="/icons/icon_energy_fusion_fire.webp">')).toEqual([
      { type: 'image', path: '/icons/icon_energy_fusion_fire.webp' },
    ]);
  });

  test('resolves localized battle term descriptions', () => {
    expect(getRichTextTerm('ba.fireburst', 'zh-CN')?.name).toBe('\u6cd5\u672f\u7206\u53d1 - \u707c\u70ed');
    expect(getRichTextTerm('ba.fireburst', 'en')?.name).toBe('Arts Burst: Heat');
  });

});
