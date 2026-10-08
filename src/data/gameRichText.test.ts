import { describe, expect, test } from 'vitest';
import { getRichTextStyle, parseGameRichText, resolveRichTextImage } from './gameRichText';

describe('game rich text', () => {
  test('parses style and term tags without dropping plain text', () => {
    expect(
      parseGameRichText('Deal <@ba.fire>Heat DMG</> and apply <#ba.burning>Combustion</>'),
    ).toEqual([
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
    expect(resolveRichTextImage('/icons/icon_energy_fusion_fire.webp')).toBe(
      '/icons/icon_energy_fusion_fire.webp',
    );
    expect(resolveRichTextImage('/images/../private.webp')).toBeNull();
  });

  test('preserves contract colors, nested terms and text after closing tags', () => {
    expect(parseGameRichText('获得<color=#009cad><#ba.crystinflict>寒冷附着</></color>。')).toEqual(
      [
        { type: 'text', text: '获得' },
        {
          type: 'style',
          id: '#009cad',
          children: [
            { type: 'term', id: 'ba.crystinflict', children: [{ type: 'text', text: '寒冷附着' }] },
          ],
        },
        { type: 'text', text: '。' },
      ],
    );
    expect(getRichTextStyle('#009cad')).toEqual({ color: '#009cad', icon: null });
    expect(parseGameRichText('<color=invalid>内容</color>后文')).toEqual([
      { type: 'text', text: '<color=invalid>内容</color>后文' },
    ]);
  });
});
