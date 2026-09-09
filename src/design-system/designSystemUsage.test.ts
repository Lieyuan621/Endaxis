import { describe, expect, test } from 'vitest';

const vueSources = import.meta.glob<string>('../**/*.vue', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const featureSources = Object.entries(vueSources).filter(
  ([path]) => path.startsWith('../') && !path.includes('/design-system/'),
);

function filesMatching(pattern: RegExp) {
  return featureSources
    .filter(([, source]) => pattern.test(source))
    .map(([path]) => path)
    .sort();
}

describe('design-system usage boundaries', () => {
  test('actions use EaButton instead of unmanaged native buttons', () => {
    expect(filesMatching(/<button\b/)).toEqual([]);
  });

  test('legacy ea-btn modifier classes are fully retired', () => {
    expect(filesMatching(/(?:class="[^"]*|\.)ea-btn(?:--[\w-]+)?\b/)).toEqual([]);
  });

  test('dialogs use EaDialog instead of direct Element Plus dialogs', () => {
    expect(filesMatching(/<el-dialog\b/)).toEqual([]);
  });

  test('common form controls use design-system adapters', () => {
    expect(filesMatching(/<el-(?:input|input-number|select|switch|checkbox|radio)\b/)).toEqual([]);
  });

  test('select options stay behind design-system adapters', () => {
    expect(filesMatching(/<el-option(?:-group)?\b/)).toEqual([]);
  });

  test('native selects and textareas use design-system adapters', () => {
    expect(filesMatching(/<(?:select|textarea)\b/)).toEqual([]);
  });

  test('dialog footers use the shared action layout', () => {
    const mismatches = featureSources
      .filter(([, source]) => {
        const footerCount = source.match(/<template\s+#footer>/g)?.length ?? 0;
        const actionsCount = source.match(/<EaDialogActions\b/g)?.length ?? 0;
        return footerCount !== actionsCount;
      })
      .map(([path]) => path)
      .sort();

    expect(mismatches).toEqual([]);
  });

  test('native text, number, and checkbox inputs stay limited to documented hot-path controls', () => {
    const owners = featureSources
      .filter(([, source]) =>
        [...source.matchAll(/<input\b[\s\S]*?>/g)].some(match => {
          const type = match[0].match(/type=["']([^"']+)["']/)?.[1] ?? 'text';
          return ['text', 'number', 'checkbox'].includes(type);
        }),
      )
      .map(([path]) => path)
      .sort();

    expect(owners).toEqual([
      '../components/CustomNumberInput.vue',
      '../components/TimelineGrid.vue',
    ]);
  });
});
