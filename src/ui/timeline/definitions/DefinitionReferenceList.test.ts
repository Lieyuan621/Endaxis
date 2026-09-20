import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Page from './DefinitionReferenceList.vue';
it('starts collapsed and labels reference owners without exposing internal owner kinds', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Page, {
          references: [
            {
              kind: 'buff',
              id: 'test',
              ownerKind: 'operatorEvent',
              ownerId: 'event-1',
              path: 'eventHandlers[0].sequence',
            },
          ],
        }),
    }),
  );
  expect(html).toContain('<details');
  expect(html).not.toMatch(/<details[^>]*\sopen/);
  expect(html).toContain('使用点 · 1');
  expect(html).toContain('角色事件 · event-1');
  expect(html).toContain('eventHandlers[0].sequence');
});
it('has no empty disclosure when the object is unused', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(Page, { references: [] }) }));
  expect(html).not.toContain('<details');
});
