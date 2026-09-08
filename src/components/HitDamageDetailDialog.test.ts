import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import HitDamageDetailDialog from './HitDamageDetailDialog.vue';
import zh from '@/i18n/locales/zh-CN.json';
import en from '@/i18n/locales/en.json';
import { computeHitDamageWithBreakdown } from '@/data/stats/computeDamage';
import { computeStats } from '@/data/stats/computeStats';

// This read-only render does not edit timeline state or exercise force-crit controls.
vi.mock('@/stores/timelineStore', () => ({
  useTimelineStore: () => ({ isHitForcedCrit: () => false }),
}));

async function renderDetail(locale: string, defenseBased: boolean, critRateScale?: number) {
  const status = computeStats(
    {
      level: 60,
      baseAtk: 1000,
      baseHp: 1000,
      weaponAtk: 0,
      baseAttrs: { strength: 0, agility: 0, intellect: 0, will: 0 },
      mainAttributeName: 'strength',
      secondaryAttributeName: 'will',
      intrinsicOverrides: { defense: 100, critRate: 0 },
    },
    [],
    [],
  );
  const breakdown = computeHitDamageWithBreakdown(
    {
      multiplier: 500 * (critRateScale ?? 1),
      ...(defenseBased ? { damageBase: { stat: 'defense' as const, flat: 300 } } : {}),
    },
    status,
    100,
    undefined,
    'physical',
  );
  const app = createSSRApp(HitDamageDetailDialog, {
    visible: true,
    breakdown,
    hitData: { _critRateScale: critRateScale },
  });
  app.use(createI18n({ legacy: false, locale, messages: { 'zh-CN': zh, en } }));
  // Render dialog content without Element Plus's browser-only overlay/teleport.
  for (const name of ['ElDialog', 'ElIcon', 'ElTooltip']) {
    app.component(
      name,
      defineComponent({
        setup:
          (_, { slots }) =>
          () =>
            h('div', slots.default?.()),
      }),
    );
  }
  return renderToString(app);
}

describe('HitDamageDetailDialog damage base', () => {
  it('does not reverse-scale the flat term when displaying a crit-scaled multiplier', async () => {
    const html = await renderDetail('en', true, 0.5);
    expect(html).toContain('800');
    expect(html).not.toContain('1,100');
  });
  it.each([
    { locale: 'zh-CN', defense: '防御', fixed: '固定基础伤害', attack: '攻击' },
    { locale: 'en', defense: 'Defense', fixed: 'Flat Base Damage', attack: 'Attack' },
  ])(
    'renders defense and flat damage instead of attack in $locale',
    async ({ locale, defense, fixed, attack }) => {
      const html = await renderDetail(locale, true);
      expect(html).toContain(defense);
      expect(html).toContain(fixed);
      expect(html).toContain('300');
      expect(html).toContain('800');
      const cellText = [...html.matchAll(/<td\b[^>]*>(.*?)<\/td>/g)].map(match =>
        match[1]!.replace(/<[^>]*>/g, '').trim(),
      );
      expect(cellText).not.toContain(attack);
    },
  );

  it('keeps the normal attack-based detail unchanged', async () => {
    const html = await renderDetail('en', false);
    expect(html).toContain('Attack');
    expect(html).not.toContain('Flat Base Damage');
    expect(html).toContain('5,000');
  });
});
