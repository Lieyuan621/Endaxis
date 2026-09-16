import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import HitDamageDetailDialog from './HitDamageDetailDialog.vue';
import zh from '@/i18n/locales/zh-CN.json';
import en from '@/i18n/locales/en.json';
import { computeHitDamageWithBreakdown } from '@/data/stats/computeDamage';
import { computeStats } from '@/data/stats/computeStats';

const timelineStoreState = vi.hoisted(() => ({
  forcedCrit: false,
  simLog: [] as Array<Record<string, unknown>>,
}));

// This read-only render keeps simulation state local while exercising the real dialog output.
vi.mock('@/stores/timelineStore', () => ({
  useTimelineStore: () => ({
    get simLog() {
      return timelineStoreState.simLog;
    },
    isHitForcedCrit: () => timelineStoreState.forcedCrit,
    toggleHitForcedCrit: () => false,
  }),
}));

async function renderDetail(
  locale: string,
  defenseBased: boolean,
  critRateScale?: number,
  hitData: Record<string, unknown> = {},
  breakdownOverride?: Record<string, unknown>,
) {
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
  const breakdown =
    breakdownOverride ??
    computeHitDamageWithBreakdown(
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
    hitData: { _critRateScale: critRateScale, ...hitData },
  });
  app.provide(ID_INJECTION_KEY, { prefix: 1030, current: 0 });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  app.use(createI18n({ legacy: false, locale, messages: { 'zh-CN': zh, en } }));
  // Render dialog content without Element Plus's browser-only overlay/teleport.
  for (const name of ['ElDialog', 'ElIcon']) {
    app.component(
      name,
      defineComponent({
        setup:
          (_, { slots }) =>
          () =>
            h('div', [slots.default?.(), slots.footer?.()]),
      }),
    );
  }
  return renderToString(app);
}

describe('HitDamageDetailDialog', () => {
  beforeEach(() => {
    timelineStoreState.forcedCrit = false;
    timelineStoreState.simLog = [];
  });

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

  it('offers force crit for a keyed generated hit even at zero natural crit rate', async () => {
    const html = await renderDetail('zh-CN', false, undefined, {
      _hitKey: 'v1:source:enemy:generated:status-damage:0',
    });

    expect(html).toContain('强制暴击');
  });

  it('uses the latest simulated hit after force crit is turned off while the dialog stays open', async () => {
    const hitKey = 'v1:source:enemy:generated:status-damage:0';
    const normalBreakdown = computeHitDamageWithBreakdown(
      { multiplier: 500 },
      computeStats(
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
      ),
      100,
      undefined,
      'physical',
    );
    expect(normalBreakdown).not.toBeNull();
    if (!normalBreakdown) {
      throw new Error('Expected the normal hit to produce a damage breakdown');
    }
    const staleForcedBreakdown = {
      ...normalBreakdown,
      critRate: 1,
      critRateRaw: 1,
      critMult: normalBreakdown.critDmg,
      expectedDamage: normalBreakdown.critDamage,
    };
    timelineStoreState.simLog = [
      {
        type: 'DAMAGE_HIT',
        time: 1,
        payload: {
          targetId: 'enemy',
          sourceId: 'operator',
          stagger: 0,
          actionId: 'action-1',
          hitData: {
            _hitKey: hitKey,
            _canCrit: true,
            _damageBreakdown: normalBreakdown,
          },
        },
      },
      {
        type: 'DAMAGE_HIT',
        time: 2,
        payload: {
          targetId: 'enemy',
          sourceId: 'operator',
          stagger: 0,
          actionId: 'action-2',
          hitData: {
            _hitKey: 'v1:action:action-2:hit:0',
            _canCrit: true,
            _damageBreakdown: { ...normalBreakdown, expectedDamage: 999 },
          },
        },
      },
    ];

    const html = await renderDetail(
      'en',
      false,
      undefined,
      {
        _hitKey: hitKey,
        _canCrit: true,
        _damageBreakdown: staleForcedBreakdown,
      },
      staleForcedBreakdown,
    );
    const headline = html.match(/class="damage-value[^"]*"[^>]*>(.*?)<\/span>/)?.[1];

    expect(headline).toContain('2,500');
    expect(headline).not.toContain('3,750');
  });
});
