import { expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import TimelineEnemyOverview from './TimelineEnemyOverview.vue';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { EnemyHealthCurve } from '../../../core/projection/enemyHealthCurves';

it.each([false, true])(
  '主目标切换只分割状态变化的轨道，且不受草稿影响（切换：%s）',
  async switching => {
    const entries: CombatReceiptEntry[] = ['enemy:a', 'enemy:b', 'enemy:c'].map(
      (targetId, sequence) => ({
        frame: 0,
        time: 0,
        sequence,
        targetId,
        event: 'EnemyLifecycleChanged',
        data: { current: 'present' },
      }),
    );
    const app = createSSRApp({
      render: () =>
        h(TimelineEnemyOverview, {
          enemies: [
            { id: 'enemy:b', name: 'B' },
            { id: 'enemy:a', name: 'A' },
            { id: 'enemy:c', name: 'C' },
          ],
          targetSwitches: [{ id: 'draft', frame: 0, targetId: 'enemy:b' }],
          publishedTargetSelection: {
            order: ['enemy:a', 'enemy:b', 'enemy:c'],
            switches: switching
              ? [
                  { frame: 30, targetId: 'enemy:b' },
                  { frame: 60, targetId: 'enemy:a' },
                ]
              : [],
          },
          publishedInitialFrame: 0,
          publishedEndFrame: 90,
          entries,
          selectedId: 'enemy:a',
          endFrame: 120,
          initialFrame: 0,
          minimumEditableFrame: 0,
          automaticDeath: false,
          framePx: frame => frame * 4,
          pxFrame: px => px / 4,
          scrollLeft: 0,
          snapFrames: 1,
          headerWidth: 180,
          timelineWidth: 480,
          durationFrames: 120,
          prepFrames: 0,
          prepEndFrame: 0,
          prepExpanded: true,
          pxPerFrame: 4,
          readOnly: false,
          statusLanes: () => 0,
        }),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'test',
        missingWarn: false,
        fallbackWarn: false,
        messages: { test: { timeline: { enemies: { present: '在场', mainTarget: '主目标' } } } },
      }),
    );
    const html = await renderToString(app);
    expect(html).toContain('aria-label="A · 在场 · 主目标"');
    expect(html).toContain('aria-label="B · 在场"');
    expect(html.includes('aria-label="B · 在场 · 主目标"')).toBe(switching);
    expect(html.match(/aria-label="C · 在场"/g)).toHaveLength(1);
    expect(html.match(/aria-label="A · 在场 · 主目标"/g)).toHaveLength(switching ? 2 : 1);
    expect(html.match(/aria-label="B · 在场"/g)).toHaveLength(switching ? 2 : 1);
  },
);

it('血量归零本身不画死亡终点，模拟死亡事件才画终点', async () => {
  const health: EnemyHealthCurve = {
    resource: 'enemyHealth',
    maxValue: 100,
    points: [
      { frame: 0, time: 0, sequence: null, value: 100 },
      { frame: 30, time: 1, sequence: 1, value: 0 },
    ],
  };
  const present: CombatReceiptEntry = {
    frame: 0,
    time: 0,
    sequence: 0,
    targetId: 'enemy:a',
    event: 'EnemyLifecycleChanged',
    data: { current: 'present' },
  };
  const dead: CombatReceiptEntry = {
    frame: 60,
    time: 2,
    sequence: 2,
    targetId: 'enemy:a',
    event: 'EnemyLifecycleChanged',
    data: { current: 'dead' },
  };
  async function render(entries: CombatReceiptEntry[], automaticDeath: boolean) {
    const app = createSSRApp({
      render: () =>
        h(TimelineEnemyOverview, {
          enemies: [{ id: 'enemy:a', name: 'A' }],
          healthCurve: health,
          selectedId: 'enemy:a',
          entries,
          automaticDeath,
          publishedTargetSelection: { order: ['enemy:a'], switches: [] },
          publishedInitialFrame: 0,
          publishedEndFrame: 90,
          initialFrame: 0,
          minimumEditableFrame: 0,
          endFrame: 90,
          framePx: frame => frame * 4,
          pxFrame: px => px / 4,
          scrollLeft: 0,
          snapFrames: 1,
          headerWidth: 180,
          timelineWidth: 360,
          durationFrames: 90,
          prepFrames: 0,
          prepEndFrame: 0,
          prepExpanded: true,
          pxPerFrame: 4,
          readOnly: false,
          statusLanes: () => 0,
        }),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'test',
        missingWarn: false,
        fallbackWarn: false,
        messages: {
          test: {
            timeline: { enemies: { title: '敌人总览', present: '在场', death: '死亡' } },
            resourceMonitor: { labels: { enemyHp: '敌人血量' } },
          },
        },
      }),
    );
    return renderToString(app);
  }

  const zeroHealth = await render([present], false);
  expect(zeroHealth).toContain('enemy-health-mini__line');
  expect(zeroHealth).toContain('d="M 0 2 H 120 V 14 H 360"');
  expect(zeroHealth).not.toContain('enemy-overview__death-terminal');

  const actualDeath = await render([present, dead], true);
  expect(actualDeath).not.toContain('enemy-overview__death-terminal');
  expect(actualDeath).toContain('enemy-overview__death');
  expect(actualDeath).toContain('ea-close-icon');
  expect(actualDeath).toContain('d="M 0 2 H 120 V 14 H 240"');
});
