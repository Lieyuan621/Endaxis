import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import TimelineMonitorGrid from './TimelineMonitorGrid.vue';

describe('timeline monitor preparation background', () => {
  it('keeps the collapsed preparation rail styled like the main timeline', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(TimelineMonitorGrid, {
            width: 900,
            durationFrames: 600,
            prepFrames: 90,
            prepExpanded: false,
            prepEndFrame: 0,
            pxPerFrame: 1,
            trackHeaderWidth: 180,
            scrollLeft: 0,
          }),
      }),
    );

    expect(html).toContain('class="monitor-grid__prep"');
    expect(html).toContain('class="monitor-grid__zero"');
    expect(html).toContain('x="180"');
    expect(html).toContain('width="18"');
    expect(html).toContain('x2="198"');
  });
});
