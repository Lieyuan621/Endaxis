import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/design-system', async importOriginal => {
  const actual = await importOriginal<typeof import('@/design-system')>();
  return {
    ...actual,
    EaDialog: defineComponent({
      setup(_, { slots }) {
        return () => h('section', [slots.header?.(), slots.default?.(), slots.footer?.()]);
      },
    }),
  };
});

vi.mock('@/stores/timelineStore', () => ({
  useTimelineStore: () => ({
    systemConstants: {
      enemyHp: 100,
      maxStagger: 50,
      staggerNodeCount: 2,
      staggerNodeDuration: 3,
      staggerBreakDuration: 5,
      executionRecovery: 10,
      superArmor: 0,
      resistance: {
        physical: 0,
        heat: 0,
        cryo: 0,
        electric: 0,
        nature: 0,
      },
    },
    getColor: () => '#aaaaaa',
  }),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import EditEnemyBaseStatsDialog from './EditEnemyBaseStatsDialog.vue';

describe('EditEnemyBaseStatsDialog form fields', () => {
  test('associates standard enemy stat labels with their editable inputs', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(EditEnemyBaseStatsDialog, { visible: true }),
      }),
    );

    for (const id of [
      'enemy-base-hp',
      'enemy-base-max-stagger',
      'enemy-base-resistance-physical',
    ]) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toMatch(new RegExp(`<input[^>]*id="${id}"`));
    }
  });
});
