import { readFileSync } from 'node:fs';
import { NodeTypes, baseParse } from '@vue/compiler-dom';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { describe, expect, test } from 'vitest';

const vueSources = import.meta.glob<string>('../**/*.vue', {
  eager: true,
  import: 'default',
  query: '?raw',
});
const featureSources = [
  ...Object.entries(vueSources).filter(
    ([path]) => path.startsWith('../') && !path.includes('/design-system/'),
  ),
  [
    '../components/armory/armoryDialogTheme.css',
    readFileSync(new URL('../components/armory/armoryDialogTheme.css', import.meta.url), 'utf8'),
  ],
  [
    '../components/selection/selectionDialog.css',
    readFileSync(new URL('../components/selection/selectionDialog.css', import.meta.url), 'utf8'),
  ],
] as Array<[string, string]>;

function filesMatching(pattern: RegExp) {
  return featureSources
    .filter(([, source]) => pattern.test(source))
    .map(([path]) => path)
    .sort();
}

function openingTagFor(sourcePath: string, className: string) {
  const source = featureSources.find(([path]) => path === sourcePath)?.[1] ?? '';
  return source.match(new RegExp(`<EaButton\\b[^>]*class="${className}"[^>]*>`))?.[0] ?? '';
}

function legacyEaButtonSelectionBindings() {
  const legacySelectionKey = /(?:^|[{,])\s*['"]?(?:active|selected|is-active|is-selected)['"]?\s*:/;
  const violations: string[] = [];

  for (const [path, source] of Object.entries(vueSources)) {
    const template = parseSfc(source, { filename: path }).descriptor.template?.content;
    if (!template) continue;

    const visit = (
      node: ReturnType<typeof baseParse> | ReturnType<typeof baseParse>['children'][number],
    ) => {
      if (node.type === NodeTypes.ELEMENT) {
        if (node.tag === 'EaButton') {
          const classBinding = node.props.find(
            prop =>
              prop.type === NodeTypes.DIRECTIVE &&
              prop.name === 'bind' &&
              prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
              prop.arg.content === 'class',
          );

          if (
            classBinding?.type === NodeTypes.DIRECTIVE &&
            classBinding.exp?.type === NodeTypes.SIMPLE_EXPRESSION &&
            legacySelectionKey.test(classBinding.exp.content)
          ) {
            violations.push(`${path}:${node.loc.start.line}`);
          }
        }

        for (const child of node.children) visit(child);
      } else if (node.type === NodeTypes.ROOT) {
        for (const child of node.children) visit(child);
      }
    };

    visit(baseParse(template));
  }

  return violations.sort();
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

  test('mobile drawers use EaDrawer instead of direct Element Plus drawers', () => {
    expect(filesMatching(/<el-drawer\b/)).toEqual([]);
    expect(filesMatching(/\.el-drawer__body/)).toEqual([]);
  });

  test('tooltips and popovers use design-system adapters', () => {
    expect(filesMatching(/<el-(?:tooltip|popover)\b/)).toEqual([]);
    expect(filesMatching(/\bEl(?:Tooltip|Popover)\b/)).toEqual([]);
  });

  test('feature dialogs leave shared mobile viewport geometry to EaDialog', () => {
    const sharedGeometry = [
      /width:\s*calc\(100vw - 16px\)\s*!important/,
      /max-width:\s*none/,
      /max-height:\s*calc\(100dvh - 16px\)/,
      /margin:\s*8px auto\s*!important/,
    ];
    const duplicates = featureSources
      .filter(([, source]) => sharedGeometry.every(pattern => pattern.test(source)))
      .map(([path]) => path)
      .sort();

    expect(duplicates).toEqual([]);
  });

  test('common form controls use design-system adapters', () => {
    expect(filesMatching(/<el-(?:input|input-number|select|switch|checkbox|radio)\b/)).toEqual([]);
  });

  test('equipment refine toggles expose their selected state through EaButton', () => {
    const refineButtons = [
      [
        openingTagFor('../components/armory/EditTrackGearLoadoutDialog.vue', 'refine-btn'),
        ':pressed="isUniformRefineActive(slot, level)"',
      ],
      [
        openingTagFor(
          '../components/selection/EquipmentSelectionDialog.vue',
          'equipment-refine-btn',
        ),
        ':pressed="refineTier === tier"',
      ],
    ];

    for (const [button, selectedState] of refineButtons) {
      expect(button).toContain(selectedState);
    }
  });

  test('EaButton selection state does not depend on legacy class bindings', () => {
    expect(legacyEaButtonSelectionBindings()).toEqual([]);
  });

  test('feature select overrides stay limited to deliberate subsystem surfaces', () => {
    const allowedOverrides = [
      '../components/HitEditorDialog.vue',
      '../views/MobileTimelineViewer.vue',
    ];

    expect(filesMatching(/\.el-select__wrapper/)).toEqual(allowedOverrides);
    expect(filesMatching(/\.el-select-dropdown__item/)).toEqual(allowedOverrides);
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
