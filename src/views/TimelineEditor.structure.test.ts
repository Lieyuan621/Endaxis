import { describe, expect, test } from 'vitest';
import source from './TimelineEditor.vue?raw';

describe('TimelineEditor right rail icons', () => {
  test('uses a skill detail panel icon for the inspector rail button', () => {
    const inspectorIcon =
      source.match(/<svg[\s\S]*?activity-bar__icon--inspector[\s\S]*?<\/svg>/)?.[0] || '';

    expect(inspectorIcon).toContain('M7 6h18v20H7Z');
    expect(inspectorIcon).toContain('M11 12h10');
    expect(inspectorIcon).toContain('M11 18h7');
    expect(inspectorIcon).toContain('M22 6v6h-6Z');
  });

  test('uses monochrome inspector icon styling', () => {
    const inspectorIcon =
      source.match(/<svg[\s\S]*?activity-bar__icon--inspector[\s\S]*?<\/svg>/)?.[0] || '';

    expect(inspectorIcon).not.toContain('#2de2e6');
    expect(inspectorIcon).not.toContain('#f5c31e');
    expect(inspectorIcon).toContain('fill="currentColor"');
  });

  test('labels all activity bar buttons for hover tooltips and accessibility', () => {
    const activityButtons =
      source.match(/<button[\s\S]*?class="activity-bar__button[\s\S]*?>/g) || [];

    expect(activityButtons).toHaveLength(5);
    for (const button of activityButtons) {
      expect(button).toContain(':title=');
      expect(button).toContain(':aria-label=');
      expect(button).toContain(':data-tooltip=');
    }
  });

  test('adds visible hover motion to activity bar icons', () => {
    expect(source).toContain('.activity-bar__button::before');
    expect(source).toContain('content: attr(data-tooltip)');
    expect(source).toContain('.activity-bar__button:hover::before');
    expect(source).toContain('z-index: 50');
    expect(source).toContain('transform: translateY(-1px)');
    expect(source).toContain('.activity-bar__button:hover .activity-bar__icon');
    expect(source).toContain('.activity-bar__button.is-active:hover .activity-bar__icon');
    expect(source).toContain('.activity-bar__button.is-active:hover .activity-bar__image-icon');
    expect(source).toContain('translateY(-2px)');
    expect(source).toContain('drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2))');
  });
});
