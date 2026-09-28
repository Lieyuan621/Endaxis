import { readFileSync } from 'node:fs';
import { NodeTypes, baseParse } from '@vue/compiler-dom';
import { compileStyle, parse as parseSfc } from '@vue/compiler-sfc';
import { describe, expect, test } from 'vitest';

const vueSources = import.meta.glob<string>('../**/*.vue', {
  eager: true,
  import: 'default',
  query: '?raw',
});
const uiCssSources = import.meta.glob<string>('../ui/**/*.css', {
  eager: true,
  import: 'default',
  query: '?raw',
});

// 新版界面与旧版的目录结构不同。只把已经接入设计系统的新版组件放进硬门禁，
// 其余页面迁移后再加入，不能因为合并上游就假装整个新版已经完成替换。
const adoptedFeaturePaths = new Set([
  '../ui/components/CustomNumberInput.vue',
  '../ui/timeline/TimelineEditor.vue',
  '../ui/action-graph/NodeInspectorFields.vue',
  '../ui/action-graph/NodeLevelValues.vue',
  '../ui/timeline/results/BattleLogPanel.vue',
  '../ui/timeline/components/ContingencyContractPanel.vue',
  '../ui/timeline/results/DamageAnalysisDialog.vue',
  '../ui/timeline/components/EnemySettingsPanel.vue',
  '../ui/timeline/library/GearInstanceDialog.vue',
  '../ui/timeline/library/GearLoadoutBuildDialog.vue',
  '../ui/timeline/library/GearSelectionDialog.vue',
  '../ui/timeline/components/GlobalResourcePanel.vue',
  '../ui/timeline/library/OperatorBuildDialog.vue',
  '../ui/timeline/library/OperatorPanelDialog.vue',
  '../ui/timeline/library/OperatorSelectionDialog.vue',
  '../ui/timeline/library/SkillLibraryCard.vue',
  '../ui/timeline/interaction/TimelineActionBlock.vue',
  '../ui/timeline/interaction/TimelineActionContextMenu.vue',
  '../ui/timeline/interaction/TimelineActionInspector.vue',
  '../ui/timeline/results/TimelineBuffDetailDialog.vue',
  '../ui/timeline/components/TimelineCornerToolbar.vue',
  '../ui/timeline/interaction/TimelineDocumentMarkerInspector.vue',
  '../ui/timeline/results/TimelineDurationBarColorControls.vue',
  '../ui/timeline/results/TimelineEnemyEffects.vue',
  '../ui/timeline/results/TimelineEnemyStatusSections.vue',
  '../ui/timeline/interaction/TimelineExternalEventInspector.vue',
  '../ui/timeline/components/TimelineHeaderToolbar.vue',
  '../ui/timeline/results/TimelineHitDetailDialog.vue',
  '../ui/timeline/library/TimelineLibrarySkillInspector.vue',
  '../ui/timeline/interaction/TimelineMarkerContextMenu.vue',
  '../ui/timeline/components/TimelineResetDialog.vue',
  '../ui/timeline/components/TimelineSmallImageExportDialog.vue',
  '../ui/timeline/components/TimelineRuler.vue',
  '../ui/timeline/interaction/TimelineShortcutHelpDialog.vue',
  '../ui/timeline/components/TimelineTrackHeader.vue',
  '../ui/timeline/components/TimelineWorkbenchShell.vue',
  '../ui/timeline/library/WeaponBuildDialog.vue',
  '../ui/timeline/library/WeaponSelectionDialog.vue',
  '../ui/timeline/results/CombatObjectOriginGraph.vue',
]);
const adoptedNewEditorAreas = [
  '../ui/action-graph/',
  '../ui/asset-workspace/',
  '../ui/definition-editor/',
  '../ui/editor/',
];
const featureSources: Array<[string, string]> = [
  ...Object.entries(vueSources).filter(
    ([path]) =>
      adoptedFeaturePaths.has(path) || adoptedNewEditorAreas.some(area => path.startsWith(area)),
  ),
  ...['armoryDialogTheme.css', 'selectionDialog.css'].map(
    name =>
      [
        `../ui/timeline/library/${name}`,
        readFileSync(new URL(`../ui/timeline/library/${name}`, import.meta.url), 'utf8'),
      ] as [string, string],
  ),
];

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

function unguardedHoverCount(source: string): number {
  const styles = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
  const css = styles.length > 0 ? styles.map(match => match[1]).join('\n') : source;
  const tokens = css.match(
    /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{|:hover|[{}]/g,
  );
  if (tokens === null) return 0;

  const guarded = [false];
  let violations = 0;
  for (const token of tokens) {
    if (token.startsWith('@media')) guarded.push(true);
    else if (token === '{') guarded.push(guarded.at(-1) ?? false);
    else if (token === '}') {
      if (guarded.length > 1) guarded.pop();
    } else if (!guarded.at(-1)) violations += 1;
  }
  return violations;
}

describe('design-system usage boundaries', () => {
  test('feature styles only reference declared theme variables', () => {
    const declarations = (source: string) =>
      [...source.matchAll(/(--ea-[\w-]+)\s*:/g)].map(match => match[1]!);
    const globalTokens = new Set(
      ['../styles/theme.css', './styles/tokens.css']
        .map(path => readFileSync(new URL(path, import.meta.url), 'utf8'))
        .flatMap(declarations),
    );
    const violations = [
      ...Object.entries(vueSources).filter(([path]) => path.startsWith('../ui/')),
      ...Object.entries(uiCssSources),
    ].flatMap(([path, source]) => {
      const localTokens = new Set(declarations(source));
      return [...source.matchAll(/var\(\s*(--ea-[\w-]+)/g)]
        .map(match => match[1]!)
        .filter(token => !globalTokens.has(token) && !localTokens.has(token))
        .map(token => `${path}: ${token}`);
    });
    expect([...new Set(violations)].sort()).toEqual([]);
  });

  test('action graph theme overrides target the canvas rather than only the document root', () => {
    const source = vueSources['../ui/action-graph/ActionGraphCanvas.vue'];
    expect(source).toBeDefined();
    const style = parseSfc(source!).descriptor.styles[0];
    const compiled = compileStyle({
      source: style!.content,
      filename: 'ActionGraphCanvas.vue',
      id: 'theme-check',
      scoped: true,
    });
    expect(compiled.errors).toEqual([]);
    expect(compiled.code).toContain("html[data-theme='light'] .action-graph-canvas {");
    expect(compiled.code).toContain('background-color: var(--graph-canvas-bg)');
  });

  test('native buttons are limited to dedicated timeline visuals', () => {
    const dedicatedButtonClasses = new Map<string, Set<string>>([
      ['../ui/timeline/interaction/TimelineActionBlock.vue', new Set(['timeline-action-block'])],
      [
        '../ui/timeline/components/TimelineTrackHeader.vue',
        new Set(['avatar-shell avatar-trigger', 'weapon-slot', 'gear-slot']),
      ],
      [
        '../ui/timeline/results/TimelineEnemyEffects.vue',
        new Set(['anomaly-icon-box last-hit-buff', 'enemy-damage-hit']),
      ],
      ['../ui/action-graph/BlackboardPanel.vue', new Set(['variable-item'])],
      ['../ui/timeline/results/CombatObjectOriginGraph.vue', new Set(['graph-node'])],
      [
        '../ui/action-graph/SkillTimelinePanel.vue',
        new Set([
          'order-grip',
          'row-choice',
          'point-marker',
          'range-body',
          'range-handle start-handle',
          'range-handle end-handle',
        ]),
      ],
      [
        '../ui/action-graph/ActionGraphCanvas.vue',
        new Set([
          'data-pin output',
          'data-pin input',
          'edit-timeline-button',
          'entry-item',
          'entry-output port-button',
          'input-port port-button',
          'output-port port-button',
          '',
        ]),
      ],
    ]);
    const violations: string[] = [];
    const nativeButtonCounts = new Map<string, number>();
    for (const [path, source] of featureSources) {
      const template = parseSfc(source, { filename: path }).descriptor.template?.content;
      if (!template) continue;
      const visit = (node: ReturnType<typeof baseParse>['children'][number]) => {
        if (node.type !== NodeTypes.ELEMENT) return;
        if (node.tag === 'button') {
          nativeButtonCounts.set(path, (nativeButtonCounts.get(path) ?? 0) + 1);
          const className = node.props.find(
            prop => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'class',
          );
          const value =
            className?.type === NodeTypes.ATTRIBUTE ? (className.value?.content ?? '') : '';
          if (!dedicatedButtonClasses.get(path)?.has(value))
            violations.push(`${path}:${node.loc.start.line}`);
        }
        for (const child of node.children) visit(child);
      };
      for (const child of baseParse(template).children) visit(child);
    }
    expect(violations).toEqual([]);
    for (const [path, count] of [
      ['../ui/action-graph/ActionGraphCanvas.vue', 10],
      ['../ui/action-graph/BlackboardPanel.vue', 1],
      ['../ui/action-graph/SkillTimelinePanel.vue', 6],
      ['../ui/timeline/results/CombatObjectOriginGraph.vue', 1],
    ] as const)
      expect(nativeButtonCounts.get(path)).toBe(count);
  });

  test('draggable skill-library cards keep keyboard selection and disabled segment semantics', () => {
    const source = vueSources['../ui/timeline/library/SkillLibraryCard.vue'];
    expect(source).toBeDefined();
    expect(source).toMatch(/class="skill-card"[\s\S]*?role="button"[\s\S]*?tabindex="0"/);
    expect(source).toMatch(/class="skill-card"[\s\S]*?@keydown\.enter\.prevent/);
    expect(source).toMatch(/class="skill-card"[\s\S]*?@keydown\.space\.stop\.prevent/);
    expect(source).toMatch(
      /class="attack-segment-chip"[\s\S]*?:aria-disabled="Boolean\(segment\.disabled\)"/,
    );
    expect(source).toMatch(/class="attack-segment-chip"[\s\S]*?@keydown\.space\.stop\.prevent/);
    expect(source).toContain('.skill-card:focus-visible');
    expect(source).toContain(".attack-segment-chip[aria-disabled='true']");
  });

  test('high-frequency visual surfaces avoid catch-all transitions', () => {
    for (const path of [
      '../ui/timeline/TimelineEditor.vue',
      '../ui/timeline/library/SkillLibraryCard.vue',
      '../ui/timeline/components/TimelineCornerToolbar.vue',
      '../ui/timeline/results/TimelineEnemyEffects.vue',
      '../ui/action-graph/ActionGraphCanvas.vue',
      '../ui/asset-workspace/AssetWorkspace.vue',
    ]) {
      expect(vueSources[path], path).not.toMatch(/\btransition:\s*all\b/);
    }
    expect(uiCssSources['../ui/asset-workspace/assetWorkspace.css']).not.toMatch(
      /\btransition:\s*all\b/,
    );
  });

  test('migrated editors and active timeline visuals limit hover to fine pointers', () => {
    const sources = [
      ...Object.entries(vueSources).filter(
        ([path]) =>
          adoptedNewEditorAreas.some(area => path.startsWith(area)) ||
          [
            '../ui/timeline/library/SkillLibraryCard.vue',
            '../ui/timeline/components/TimelineCornerToolbar.vue',
            '../ui/timeline/results/TimelineEnemyEffects.vue',
          ].includes(path),
      ),
      [
        '../ui/asset-workspace/assetWorkspace.css',
        uiCssSources['../ui/asset-workspace/assetWorkspace.css']!,
      ] as [string, string],
      [
        '../ui/timeline/library/selectionDialog.css',
        uiCssSources['../ui/timeline/library/selectionDialog.css']!,
      ] as [string, string],
    ];
    expect(
      sources.filter(([, source]) => unguardedHoverCount(source) > 0).map(([path]) => path),
    ).toEqual([]);
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

  test('small image export delegates dialog chrome to EaDialog while keeping preview scrolling', () => {
    const source = vueSources['../ui/timeline/components/TimelineSmallImageExportDialog.vue'];
    expect(source).toBeDefined();
    expect(source).not.toMatch(/\.small-image-export-dialog\s+\.el-dialog__(?:title|header)\s*\{/);
    expect(source).not.toMatch(/background-color:\s*var\(--ea-dialog-bg\)/);
    expect(source).toMatch(
      /\.small-image-export-dialog\s+\.el-dialog__body\s*\{\s*overflow-y:\s*auto/,
    );
  });

  test('common form controls use design-system adapters', () => {
    expect(filesMatching(/<el-(?:input|input-number|select|switch|checkbox|radio)\b/)).toEqual([]);
    expect(filesMatching(/<select\b/)).toEqual([]);
  });

  test('equipment refine toggles expose their selected state through EaButton', () => {
    const refineButtons = [
      [
        openingTagFor('../ui/timeline/library/GearLoadoutBuildDialog.vue', 'refine-btn'),
        ':pressed="isUniformLevel(slot.build, level)"',
      ],
      [
        openingTagFor('../ui/timeline/library/GearSelectionDialog.vue', 'equipment-refine-btn'),
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
    const allowedOverrides: string[] = [];

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

    expect(owners).toEqual(['../ui/components/CustomNumberInput.vue']);
  });
});
