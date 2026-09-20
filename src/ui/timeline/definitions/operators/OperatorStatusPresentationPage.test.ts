import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { it, expect } from 'vitest';
import Page from './OperatorStatusPresentationPage.vue';
it('edits entity presence with a definition, icon and translation key only', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Page, {
          value: {
            kind: 'abilityEntityCount',
            abilityEntityId: 'entity',
            icon: '/entity.webp',
            nameKey: 'entities.example',
          },
        }),
    }),
  );
  for (const value of ['能力实体数量', 'entity', '/entity.webp', 'entities.example'])
    expect(html).toContain(value);
  expect(html).not.toContain('显示上限');
  expect(html).not.toContain('剩余回复次数');
});
it('shows an explicit add action for absent configuration', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(Page, {}) }));
  expect(html).toContain('添加状态指示器');
  expect(html).not.toContain('显示上限');
});
it('renders all buff counter fields without exposing other variants', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Page, {
          value: {
            kind: 'buffCounters',
            appearance: 'typhoeaArrows',
            reserveArrowBuffId: 'reserve',
            battleArrowBuffId: 'battle',
            pointBuffId: 'points',
            maximumArrows: 3,
            maximumPoints: 5,
          },
        }),
    }),
  );
  for (const field of ['reserve', 'battle', 'points', '箭矢显示上限', '点数显示上限'])
    expect(html).toContain(field);
  expect(html).not.toContain('普通状态 Buff');
  expect(html).toContain('箭矢两组共用显示上限');
  for (const field of [
    'reserveArrowBuffId',
    'battleArrowBuffId',
    'pointBuffId',
    'maximumArrows',
    'maximumPoints',
  ]) {
    expect(html).toContain(`data-property-path="[&quot;${field}&quot;]"`);
  }
  expect(html.indexOf('箭矢显示上限')).toBeLessThan(html.indexOf('点数 Buff'));
});
it('explains the numeric event source without implying a buff binding', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Page, {
          value: { kind: 'numeric', appearance: 'laevatainCounter', maximum: 4, activeAt: 2 },
        }),
    }),
  );
  expect(html).toContain('CharacterPassiveUiValueChanged');
  expect(html).toContain('启用阈值高亮');
  expect(html).not.toContain('启用满层高亮');
  expect(html).not.toContain('储备箭矢 Buff');
  for (const field of ['appearance', 'maximum', 'activeAt']) {
    expect(html).toContain(`data-property-path="[&quot;${field}&quot;]"`);
  }
});
