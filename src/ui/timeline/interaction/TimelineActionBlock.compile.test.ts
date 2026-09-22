import { expect, it } from 'vitest';
import { compileScript, compileStyle, compileTemplate, parse } from '@vue/compiler-sfc';
import source from './TimelineActionBlock.vue?raw';

it('matches main label visibility and exposes selection semantics', () => {
  expect(source).toContain('if (props.pxPerFrame * PROJECT_FPS >= 30) return props.label;');
  expect(source).toContain('TYPE_SHORTHAND[props.skillType]');
  expect(source).toContain(':pressed="selected"');
  expect(source).toContain('flex: 0 0 auto;');
  expect(source).toContain('overflow: visible;');
  expect(source).toContain('text-overflow: clip;');
});

it('isolates action hover paint and follows the main action paint recipe', () => {
  expect(source).toContain('@media (hover: hover) and (pointer: fine)');
  expect(source).toContain('.timeline-action-block.ea-button:hover:not(:disabled)');
  expect(source).toContain('hexToRgba(accent, 0.15)');
  expect(source).toContain('hexToRgba(accent, 0.5)');
  expect(source).toContain('hexToRgba(accent, 0.2)');
  expect(source).toContain('hexToRgba(accent, 0.1)');
  expect(source).toContain("'--action-backdrop-filter': light ? 'none' : 'blur(4px)'");
  expect(source).toContain('var(--action-ultimate-edge) 100%');
  expect(source).toContain("? 'var(--ea-gold)'");
  expect(source).toContain("ultimate: '#00e5ff'");
});

it('distinguishes incomplete bars and keeps optional decorations under their view layer', () => {
  expect(source).toContain(
    'const decorationsVisible = computed(() => props.showDecorations !== false)',
  );
  expect(source).toContain(`:class="{ 'is-pending': !bar.completed }"`);
  expect(source).toContain('v-if="bar.completed" class="cooldown-timeline-bar__end"');
  expect(source).toContain('v-if="bar.completed" class="enhancement-timeline-bar__end"');
  expect(source).toContain("'--disabled-mark-right': `${2 + warningOffset}px`");
  expect(source).toContain("'--edited-mark-right': `${2 + warningOffset + disabledOffset}px`");
  expect(source).toContain("'is-link-buffed': hit.linkBuffed");
  expect(source).not.toContain("'is-critical': hit.critical");
  expect(source).not.toContain('.hit-marker.is-critical');
});

it('compiles the action block script, template, and scoped styles', () => {
  const { descriptor, errors } = parse(source);
  expect(errors).toEqual([]);
  expect(() => compileScript(descriptor, { id: 'timeline-action-block' })).not.toThrow();
  expect(
    compileTemplate({
      source: descriptor.template!.content,
      filename: 'TimelineActionBlock.vue',
      id: 'timeline-action-block',
    }).errors,
  ).toEqual([]);
  for (const style of descriptor.styles)
    expect(
      compileStyle({
        source: style.content,
        filename: 'TimelineActionBlock.vue',
        id: 'timeline-action-block',
        scoped: true,
      }).errors,
    ).toEqual([]);
});
