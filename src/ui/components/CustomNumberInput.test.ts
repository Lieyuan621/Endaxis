import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, test } from 'vitest';
import CustomNumberInput from './CustomNumberInput.vue';

describe('CustomNumberInput', () => {
  test('supports theme variables as border colors without invalid hexadecimal output', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(CustomNumberInput, { modelValue: 1, borderColor: 'var(--ea-gold)' }),
      }),
    );
    expect(html).toContain('color-mix(in srgb, var(--ea-gold) 70%, white)');
    expect(html).not.toContain('NaN');
  });
  test('places the provided input id on the editable native input', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(CustomNumberInput, { modelValue: 100, inputId: 'enemy-hp' }),
      }),
    );

    expect(html).toMatch(/<input[^>]*id="enemy-hp"/);
  });
});
