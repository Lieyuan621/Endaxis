import { describe, expect, test } from 'vitest';
import { parseGameRichText, resolveRichTextImage } from './gameRichText';

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
});
