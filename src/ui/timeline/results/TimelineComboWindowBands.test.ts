import { expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Bands from './TimelineComboWindowBands.vue';

it('renders perfect slices with the solid-line class and their own title', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Bands, {
          segments: [
            {
              sequence: 0,
              operatorId: 'a',
              nextSkillKey: 'combo',
              startFrame: 0,
              endFrame: 15,
              outcome: 'consumed',
            },
            {
              sequence: 0,
              operatorId: 'a',
              nextSkillKey: 'combo',
              startFrame: 15,
              endFrame: 30,
              outcome: 'consumed',
              perfectTiming: true,
            },
          ],
          prepFrames: 0,
          pxPerFrame: 2,
          actionTop: 0,
          prepExpanded: true,
          label: '连携窗口',
          perfectLabel: '精准衔接',
        }),
    }),
  );
  expect(html).toContain('perfect-timing-bar');
  expect(html).toContain('title="精准衔接"');
  expect(html).toContain('title="连携窗口"');
  expect(html).toContain('left:30px;width:30px');
});
