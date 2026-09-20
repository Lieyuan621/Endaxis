import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import TimelineResourceCurves from './TimelineResourceCurves.vue';

describe('失衡资源曲线的节点显示', () => {
  it('显示节点位置和跨越节点后的条纹时段', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(TimelineResourceCurves, {
            spCurve: {
              resource: 'sp',
              maxValue: 300,
              points: [{ frame: 0, time: 0, sequence: null, value: 0 }],
            },
            poiseCurve: {
              resource: 'poise',
              maxValue: 300,
              points: [
                { frame: 0, time: 0, sequence: null, value: 300 },
                { frame: 20, time: 20 / 30, sequence: 1, value: 140 },
              ],
            },
            poiseKnotThresholds: [0.5],
            poiseKnotSegments: [{ startFrame: 20, endFrame: 80 }],
            visibleKinds: ['poise'],
            timelineWidth: 600,
            durationFrames: 120,
            cursorFrame: 20,
            prepFrames: 0,
            pxPerFrame: 2,
            trackHeaderWidth: 180,
            scrollLeft: 0,
            prepExpanded: true,
          }),
      }),
    );
    expect(html).toContain('class="label-readout-knot"');
    expect(html).toContain('left:50%');
    expect(html).toContain('class="poise-knot-zone"');
    expect(html).toContain('url(#poise-knot-pattern)');
  });
});
