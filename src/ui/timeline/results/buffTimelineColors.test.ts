import { expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import { projectBuffTimelineColors } from './buffTimelineColors';
import { normalizeDurationBarColorPrefs } from './durationBarColor';
import TimelineStatusSegment from './TimelineStatusSegment.vue';

it('附着转换把明确后继的颜色传到共享连接线，并遵循面板颜色设置', async () => {
  const head: BuffTimelineSegment = {
    targetId: 'enemy:a',
    buffId: 'buff_common_enemy_spell_fire_attached',
    instanceId: 1,
    startFrame: 0,
    endFrame: 10,
    layers: 1,
    enhanceCount: 1,
    enabled: true,
    placement: 'upper',
  };
  const tail = {
    ...head,
    buffId: 'buff_common_enemy_spell_pulse_attached',
    instanceId: 2,
    startFrame: 10,
    endFrame: 30,
  };
  const conversion = {
    frame: 10,
    targetId: head.targetId,
    consumedBuffId: head.buffId,
    consumedInstanceId: 1,
    outputBuffId: tail.buffId,
    outputInstanceId: 2,
  };
  const prefs = normalizeDurationBarColorPrefs({ surfaces: { track: false, enemy: true } });
  const colors = projectBuffTimelineColors([head, tail], [conversion], prefs, 'enemy');
  const from = colors.get(head)!;
  expect(from.color).toBeTruthy();
  expect(from.endColor).toBe(colors.get(tail)!.color);
  expect(from.endColor).not.toBe(from.color);
  const unlinked = projectBuffTimelineColors([head, tail], [], prefs, 'enemy').get(head)!;
  expect(unlinked.endColor).toBe(unlinked.color);
  const track = projectBuffTimelineColors([head, tail], [conversion], prefs, 'track').get(head)!;
  expect(track.color).toBe('#8c8c8c');
  expect(track.endColor).toBe(track.color);
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(TimelineStatusSegment, {
          left: 0,
          top: 0,
          width: 60,
          title: '附着转换',
          attachment: true,
          durationColor: from.color,
          endColor: from.endColor,
        }),
    }),
  );
  expect(html).toContain(`stop-color="${from.endColor}"`);
});
