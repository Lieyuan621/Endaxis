import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Gauge from './TimelineTrackGauge.vue';

function render(initialFrame: number, initialValue: number, prepExpanded = true) {
  return renderToString(
    createSSRApp({
      render: () =>
        h(Gauge, {
          curve: {
            resource: 'ultimateEnergy',
            operatorId: 'operator',
            maxValue: 100,
            points: [
              { frame: initialFrame, time: initialFrame / 30, sequence: null, value: initialValue },
              { frame: 30, time: 1, sequence: 1, value: 50 },
            ],
          },
          color: '#fff',
          prepFrames: 90,
          durationFrames: 60,
          pxPerFrame: 2,
          prepExpanded,
        }),
    }),
  );
}

it('draws the initial value through the whole preparation area before the first input', async () => {
  const html = await render(0, 25);
  expect(html).toContain('d="M 0 37.5 H 240 V 25 H 300"');
  expect(html).toContain('width="300"');
});

it('keeps negative-frame changes and full-energy highlighting aligned to the preparation start', async () => {
  const html = await render(-30, 100);
  expect(html).toContain('d="M 0 0 H 240 V 25 H 300"');
  expect(html).toContain('x1="0"');
  expect(html).toContain('x2="240"');
});
