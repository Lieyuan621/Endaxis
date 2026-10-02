import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import enMessages from '../../../i18n/locales/en.json';
import zhMessages from '../../../i18n/locales/zh-CN.json';
import Dialog from './TimelineBuffDetailDialog.vue';
import { initialBuffDetailInstanceIndex, type BuffDetailTarget } from './buffDetail';

// 只替换传送到 body 的弹窗外壳与页面输入区域；详情内容按真实组件模板渲染。
vi.mock('../../../design-system/index', async importOriginal => {
  const original = await importOriginal<typeof import('../../../design-system/index')>();
  const { defineComponent, h } = await import('vue');
  return {
    ...original,
    EaDialog: defineComponent({
      setup:
        (_props, { slots }) =>
        () =>
          h('section', slots.default?.()),
    }),
  };
});

vi.mock('../../keyboard/InputRegionBoundary.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      inheritAttrs: false,
      setup:
        (_props, { slots }) =>
        () =>
          slots.default?.(),
    }),
  };
});

async function render(target: BuffDetailTarget, locale: 'en' | 'zh-CN') {
  const messages = locale === 'en' ? enMessages : zhMessages;
  const detail = messages.timeline.buffDetail;
  const app = createSSRApp({
    render: () =>
      h(Dialog, {
        visible: true,
        target,
        fps: 30,
        labels: {
          ...detail,
          frames: value => `${value}f`,
        },
      }),
  });
  app.use(createI18n({ legacy: false, locale, messages: { [locale]: messages } }));
  return renderToString(app);
}

const target: BuffDetailTarget = {
  title: 'Candidate status',
  buffId: 'status',
  targetId: 'enemy',
  instanceId: 2,
  enabled: true,
  enhanceCount: 7,
  displayCount: 4,
  layers: 4,
  startFrame: 10,
  endFrame: 30,
  instances: [
    {
      instanceId: 1,
      enabled: false,
      enhanceCount: 2,
      displayCount: 4,
      layers: 4,
      startFrame: 0,
      endFrame: 10,
      startReason: 'stackChanged',
      endReason: 'enabledChanged',
    },
    {
      instanceId: 1,
      enabled: true,
      enhanceCount: 3,
      displayCount: 4,
      layers: 4,
      startFrame: 10,
      endFrame: 30,
      startReason: 'enabledChanged',
      endReason: 'simulationEnd',
    },
    {
      instanceId: 2,
      enabled: true,
      enhanceCount: 4,
      displayCount: 2,
      layers: 2,
      startFrame: 10,
      endFrame: 30,
      startReason: 'applied',
      endReason: 'simulationEnd',
    },
  ],
};

it('opens the clicked effective phase and representative, retaining earlier windows for inspection', () => {
  expect(initialBuffDetailInstanceIndex(target)).toBe(2);
  expect(initialBuffDetailInstanceIndex({ ...target, instanceId: undefined })).toBe(1);
  const previous = { ...target.instances![0]!, enabled: true };
  expect(
    initialBuffDetailInstanceIndex({
      ...target,
      instanceId: 1,
      instances: [previous, ...target.instances!.slice(1)],
    }),
  ).toBe(1);
  const instantaneous = { ...target.instances![2]!, startFrame: 30, endFrame: 30 };
  expect(
    initialBuffDetailInstanceIndex({
      ...target,
      startFrame: 30,
      endFrame: 30,
      instances: [target.instances![2]!, instantaneous],
    }),
  ).toBe(1);
});

it('separates effective totals from the selected candidate’s raw count and displayed level', async () => {
  for (const locale of ['en', 'zh-CN'] as const) {
    const detail = (locale === 'en' ? enMessages : zhMessages).timeline.buffDetail;
    const html = await render(target, locale);
    expect(html).toMatch(new RegExp(`<dt[^>]*>${detail.effectiveCount}</dt><dd[^>]*>7</dd>`));
    expect(html).toMatch(
      new RegExp(`<dt[^>]*>${detail.effectiveDisplayCount}</dt><dd[^>]*>4</dd>`),
    );
    expect(html).toMatch(new RegExp(`<dt[^>]*>${detail.enhanceCount}</dt><dd[^>]*>4</dd>`));
    expect(html).toMatch(new RegExp(`<dt[^>]*>${detail.displayCount}</dt><dd[^>]*>2</dd>`));
    expect(html).toMatch(new RegExp(`<dd[^>]*>${detail.states.effective}</dd>`));
    expect(html).toContain('3 / 3');
    expect(html).not.toContain(detail.suppressedHint);

    // 同一历史候选可被单独查看，原始数量不能被聚合量或零覆盖。
    const candidate = target.instances![0]!;
    const suppressed = await render({ ...target, ...candidate, instances: [candidate] }, locale);
    expect(suppressed).toMatch(new RegExp(`<dt[^>]*>${detail.effectiveCount}</dt><dd[^>]*>0</dd>`));
    expect(suppressed).toMatch(new RegExp(`<dt[^>]*>${detail.enhanceCount}</dt><dd[^>]*>2</dd>`));
    expect(suppressed).toMatch(new RegExp(`<dt[^>]*>${detail.displayCount}</dt><dd[^>]*>4</dd>`));
    expect(suppressed).toMatch(new RegExp(`<dd[^>]*>${detail.states.suppressed}</dd>`));
    expect(suppressed).toContain(detail.startReasons.stackChanged);
    expect(suppressed).toContain(detail.endReasons.enabledChanged);
    expect(suppressed).toContain(detail.suppressedHint);
  }
  const ordinary = await render({ ...target, instances: undefined, displayCount: undefined }, 'en');
  expect(ordinary).not.toContain(enMessages.timeline.buffDetail.displayCount);
  expect(ordinary).not.toContain(enMessages.timeline.buffDetail.effectiveDisplayCount);
});
