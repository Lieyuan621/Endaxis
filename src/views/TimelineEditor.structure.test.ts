import { describe, expect, test } from 'vitest';
import source from './TimelineEditor.vue?raw';

describe('TimelineEditor right rail icons', () => {
  test('gives the inspector rail button its own image icon', () => {
    const inspectorIcon = source.match(/<img[\s\S]*?activity-bar__image-icon--inspector[\s\S]*?>/);

    expect(inspectorIcon).not.toBeNull();
    expect(inspectorIcon![0]).toMatch(/src="[^"]+\.webp"/);
  });

  test('labels all activity bar buttons for hover tooltips and accessibility', () => {
    const openings = source
      .split('class="activity-bar__button')
      .slice(1)
      .map(chunk => chunk.slice(0, chunk.indexOf('>')));

    expect(openings.length).toBeGreaterThan(0);
    for (const opening of openings) {
      expect(opening).toContain(':aria-label=');
      expect(opening).toContain(':data-tooltip=');
      expect(opening).not.toContain(':title=');
    }
  });

  test('adds visible hover motion to activity bar icons', () => {
    expect(source).toContain('.activity-bar__button::before');
    expect(source).toContain('content: attr(data-tooltip)');
    expect(source).toContain('.activity-bar__button:hover::before');
    expect(source).toContain('transform: translateY(-1px)');
    expect(source).toContain('.activity-bar__button:hover .activity-bar__icon');
    expect(source).toContain('.activity-bar__button.is-active:hover .activity-bar__icon');
    expect(source).toContain('.activity-bar__button.is-active:hover .activity-bar__image-icon');
    expect(source).toContain('translateY(-2px)');
    expect(source).toContain('drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2))');
  });
});
