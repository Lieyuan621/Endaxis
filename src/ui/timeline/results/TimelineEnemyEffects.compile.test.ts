import { expect, it } from 'vitest';
import { compileScript, compileStyle, compileTemplate, parse } from '@vue/compiler-sfc';
import source from './TimelineEnemyEffects.vue?raw';

it('keeps legacy mouse-down activation and handles both keyboard activation keys', () => {
  expect(source).not.toContain('<EaButton');
  const hitStart = source.indexOf('v-for="hit in damageHits"');
  expect(hitStart).toBeGreaterThan(0);
  const hit = source.slice(
    source.lastIndexOf('<button', hitStart),
    source.indexOf('v-for="marker in markers"'),
  );
  expect(hit).toContain('<button');
  expect(hit).toContain('type="button"');
  expect(hit).toContain('@mousedown.stop="emit(\'open-damage-detail\', hit.sequence)"');
  expect(hit).toContain('@keydown.enter.stop.prevent="emit(\'open-damage-detail\', hit.sequence)"');
  expect(hit).toContain('@keydown.space.stop.prevent="emit(\'open-damage-detail\', hit.sequence)"');
});

it('uses the same icon shell and badge for instantaneous and persistent effects', () => {
  const marker = source.slice(
    source.indexOf('v-for="marker in markers"'),
    source.indexOf('v-for="buff in buffs"'),
  );
  expect(marker).toContain('class="anomaly-icon-box effect-marker"');
  expect(marker).toContain('class="anomaly-icon"');
  expect(marker).toContain('class="anomaly-stacks"');
  expect(marker).toContain('{{ marker.badge }}');
  expect(source).not.toContain('.effect-marker:hover');
  expect(source).not.toContain('.marker-icon');
});

it('keeps every effect icon above every duration segment without per-item stacking contexts', () => {
  const rule = (selector: string) => source.slice(source.indexOf(`${selector} {`)).split('}')[0]!;
  for (const selector of ['.effect-marker', '.anomaly-icon-box']) {
    expect(rule(selector)).toContain('z-index: 10;');
  }
  for (const selector of ['.anomaly-duration-bar', '.attachment-continuation']) {
    expect(rule(selector)).toContain('z-index: 1;');
  }
  // A parent stacking context would trap an icon beneath later siblings' duration bars.
  expect(rule('.attachment-item')).not.toMatch(/z-index|transform|isolation|opacity|filter/);
});

it('hides a duplicate physical icon without removing its retained duration segment', () => {
  const buff = source.slice(source.indexOf('v-for="buff in buffs"'), source.indexOf('</template>'));
  expect(source).toContain('const hideIcon = statusRows.value.hiddenIcons.has(buff);');
  expect(source).toContain('left: start + (hideIcon ? iconSize.value : 0)');
  expect(buff).toContain('v-if="!buff.hideIcon"');
  expect(buff).toContain('v-else-if="buff.barWidthPx > 0"');
});

it('compiles the enemy attachment animation and retained duration-bar branch', () => {
  const { descriptor, errors } = parse(source);
  expect(errors).toEqual([]);
  expect(() => compileScript(descriptor, { id: 'enemy-effects' })).not.toThrow();
  expect(
    compileTemplate({
      source: descriptor.template!.content,
      filename: 'TimelineEnemyEffects.vue',
      id: 'enemy-effects',
    }).errors,
  ).toEqual([]);
  for (const style of descriptor.styles)
    expect(
      compileStyle({
        source: style.content,
        filename: 'TimelineEnemyEffects.vue',
        id: 'enemy-effects',
        scoped: true,
      }).errors,
    ).toEqual([]);
});
