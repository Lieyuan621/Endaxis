import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it } from 'vitest';
import Bands from './TimelineOperatorPassiveUiBands.vue';

it('renders the configured entity icon, translated name and count without a HUD skin', async () => {
  const app = createSSRApp({
    render: () =>
      h(Bands, {
        operatorName: 'Owner',
        prepFrames: 0,
        prepExpanded: true,
        pxPerFrame: 2,
        actionTop: 100,
        segments: [
          {
            kind: 'abilityEntityCount',
            abilityEntityId: 'crystal',
            nameKey: 'entities.crystal',
            icon: '/custom-entity.webp',
            operatorId: 'owner',
            startFrame: 10,
            endFrame: 50,
            lane: 0,
            entities: [
              { kind: 'abilityEntity', instanceId: 1 },
              { kind: 'abilityEntity', instanceId: 2 },
            ],
          },
        ],
      }),
  });
  app.use(
    createI18n({
      legacy: false,
      locale: 'en',
      messages: { en: { entities: { crystal: 'Configured crystal' } } },
    }),
  );
  const html = await renderToString(app);
  expect(html).toContain('/custom-entity.webp');
  expect(html).toContain('Owner · Configured crystal × 2');
  expect(html).not.toContain('operator-passive-widget');
});
