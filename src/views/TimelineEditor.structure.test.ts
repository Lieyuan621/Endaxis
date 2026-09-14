import { describe, expect, test } from 'vitest';
import displayMenuSource from '../components/TimelineDisplayMenu.vue?raw';
import source from './TimelineEditor.vue?raw';

describe('TimelineEditor right rail icons', () => {
  test('leaves enough workspace height for a taller resource monitor', () => {
    const mainMinHeight = Number(
      source.match(/const TIMELINE_MAIN_MIN_HEIGHT = (\d+);/)?.[1] ?? Number.NaN,
    );
    const maxBottomPanelHeight = 900 - mainMinHeight - 1;

    expect(maxBottomPanelHeight).toBeGreaterThanOrEqual(379);
  });

  test('gives the inspector rail button its own image icon', () => {
    const inspectorButton = source.match(
      /<EaActivityRailButton[\s\S]*?:label="t\('timeline\.activityBar\.inspector'\)"[\s\S]*?\/>/,
    );

    expect(inspectorButton).not.toBeNull();
    expect(inspectorButton![0]).toContain('icon="/icons/btn_week_raid.webp"');
  });

  test('uses the Hongshan monster image for the resource monitor rail button', () => {
    const resourceMonitorButton = source.match(
      /<EaActivityRailButton[\s\S]*?:label="t\('timeline\.activityBar\.resourceMonitor'\)"[\s\S]*?\/>/,
    );

    expect(resourceMonitorButton).not.toBeNull();
    expect(resourceMonitorButton![0]).toContain(
      'icon="/icons/icon_wiki_group_monster_hongshan.webp"',
    );
    expect(source).not.toContain('enemyPanelMask');
    expect(source).not.toContain('activity-bar__icon');
  });

  test('labels all activity bar buttons for hover tooltips and accessibility', () => {
    const openings = source
      .split('<EaActivityRailButton')
      .slice(1)
      .map(chunk => chunk.slice(0, chunk.indexOf('/>')));

    expect(openings).toHaveLength(6);
    for (const opening of openings) {
      expect(opening).toContain(':label=');
      expect(opening).toContain(':active=');
    }
  });

  test('delegates activity rail visuals to the shared component', () => {
    expect(source).toContain('EaActivityRailButton');
    expect(source).not.toContain('class="activity-bar__button');
    expect(source).not.toContain('.activity-bar__button');
    expect(source).not.toContain('.activity-bar__image-icon');
  });

  test('keeps display settings separate from the more menu', () => {
    expect(source).toContain('v-model:visible="displayMenuOpen"');
    expect(source).toContain('<TimelineDisplayMenu />');
    expect(source).not.toContain("t('timeline.header.sectionView')");
  });

  test('promotes the guide line to the top of the display menu', () => {
    const guideIndex = displayMenuSource.indexOf('class="timeline-display-guide"');
    const scrollIndex = displayMenuSource.indexOf('class="timeline-display-scroll"');

    expect(guideIndex).toBeGreaterThan(-1);
    expect(guideIndex).toBeLessThan(scrollIndex);
    expect(displayMenuSource).toContain('Ctrl + G');
    expect(displayMenuSource).toContain(':pressed="store.showCursorGuide"');
  });
});
