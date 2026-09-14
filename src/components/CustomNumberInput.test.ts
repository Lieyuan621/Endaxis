import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, test } from 'vitest';
import CustomNumberInput from './CustomNumberInput.vue';

describe('CustomNumberInput', () => {
  test('places the provided input id on the editable native input', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(CustomNumberInput, { modelValue: 100, inputId: 'enemy-hp' }),
      }),
    );

    expect(html).toMatch(/<input[^>]*id="enemy-hp"/);
  });
});
