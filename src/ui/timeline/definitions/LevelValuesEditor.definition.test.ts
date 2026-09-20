import { createSSRApp, h, provide } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Editor from './LevelValuesEditor.vue';
import { definitionAllLevelsKey } from './definitionLevelEditing';
it('shows the complete table without an active-level marker on definition pages', async () => {
  const html = await renderToString(
    createSSRApp({
      setup() {
        provide(definitionAllLevelsKey, true);
        return () => h(Editor, { value: [0.2, 0.3], currentLevel: 9 });
      },
    }),
  );
  expect(html).toContain('0.2');
  expect(html).toContain('0.3');
  expect(html).toContain('1 级');
  expect(html).toContain('2 级');
  expect(html).not.toContain('（当前）');
  expect(html).not.toContain('级未定义');
});
it('preserves the current-level indication outside definition pages', async () => {
  const html = await renderToString(
    createSSRApp({ render: () => h(Editor, { value: [0.2, 0.3], currentLevel: 2 }) }),
  );
  expect(html).toContain('2 级（当前）');
});
