import { describe, expect, it } from 'vitest';
import { compileScript, compileStyle, compileTemplate, parse } from '@vue/compiler-sfc';
import source from './TimelineResourceCurves.vue?raw';
import sectionsSource from './TimelineEnemyStatusSections.vue?raw';
import { monitorSectionBodyMinimums } from './monitorSectionMinimums';

describe('TimelineResourceCurves compilation', () => {
  it('uses the theme gold and legacy SP title typography', () => {
    expect(source).toMatch(/\.curve-row--sp\s*\{\s*color: var\(--ea-gold\)/);
    expect(source).toMatch(/\.curve-row--sp \.curve-label strong\s*\{\s*font:\s*700 11px\/1 Inter/);
  });

  it('uses measured SP height without clamping negative facts onto the display floor', () => {
    expect(source).toContain("row.kind === 'sp' ? spBodyHeight.value : ROW_HEIGHT");
    expect(source).toContain("row.kind === 'sp' ? rawRatio : clamp(rawRatio, 0, 1)");
    expect(source).toContain('Math.round(height * 0.07)');
    expect(source).toContain('Math.round(height * 0.09)');
    expect(source).toContain('Math.max(topPadding, height - 18 - bottomPadding)');
  });

  it('matches the old stagger dots, maximum line and 26px minimum body', () => {
    expect(source).toMatch(
      /\.curve-row--poise \.curve-point,\s*\.curve-row--sp \.curve-point\s*\{\s*stroke: none;/,
    );
    expect(source).toContain('class="poise-maximum-line"');
    expect(source).toContain('background: rgba(255, 156, 110, 0.32)');
    expect(monitorSectionBodyMinimums().poise).toBe(26);
    expect(sectionsSource).toContain('monitorSectionBodyMinimums()');
    expect(sectionsSource).toContain('minimumBodyHeight[key] + MONITOR_SECTION_TOPBAR_HEIGHT');
  });
  it('renders receipt intervals using measured poise height and shared timeline coordinates', () => {
    expect(source).toContain('new ResizeObserver(update)');
    expect(source).toContain('sizeObserver?.disconnect()');
    expect(source).toContain('rowHeight(row) / 2 + 4');
    expect(source).toContain('pointX(segment.endFrame) - pointX(segment.startFrame)');
    expect(source).toContain('<TimelineMonitorGrid');
    expect(source).toMatch(/<\/script>\s*<template>/);
    expect(source).toContain("row.kind === 'poise' ? Math.round(value) : value");
    expect(source).toContain('formatNumber(readoutValue(row))');
  });

  it('keeps the template, script bindings and scoped styles valid', () => {
    const { descriptor, errors } = parse(source);
    expect(errors).toEqual([]);
    const script = compileScript(descriptor, { id: 'resource-curves-test' });
    const template = compileTemplate({
      source: descriptor.template!.content,
      filename: 'TimelineResourceCurves.vue',
      id: 'resource-curves-test',
      compilerOptions: { bindingMetadata: script.bindings },
    });
    expect(template.errors).toEqual([]);
    for (const style of descriptor.styles) {
      expect(
        compileStyle({
          source: style.content,
          filename: 'TimelineResourceCurves.vue',
          id: 'resource-curves-test',
          scoped: true,
        }).errors,
      ).toEqual([]);
    }
  });
});
