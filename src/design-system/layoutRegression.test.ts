import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import actionItemSource from '../components/ActionItem.vue?raw';
import actionLibrarySource from '../components/ActionLibrary.vue?raw';
import contextMenuSource from '../components/ContextMenu.vue?raw';
import damageAnalysisSource from '../components/DamageAnalysisDialog.vue?raw';
import enemySettingsSource from '../components/EnemySettingsPanel.vue?raw';
import globalConfigPresetSource from '../components/GlobalConfigPresetPanel.vue?raw';
import hitEditorSource from '../components/HitEditorDialog.vue?raw';
import propertiesPanelSource from '../components/PropertiesPanel.vue?raw';
import resourceMonitorSource from '../components/ResourceMonitor.vue?raw';
import timelineResetSource from '../components/TimelineResetDialog.vue?raw';
import equipmentSelectionSource from '../components/selection/EquipmentSelectionDialog.vue?raw';
import operatorSelectionSource from '../components/selection/OperatorSelectionDialog.vue?raw';
import weaponSelectionSource from '../components/selection/WeaponSelectionDialog.vue?raw';
import mobileAppShellSource from '../views/MobileAppShell.vue?raw';
import mobileTimelineSource from '../views/MobileTimelineViewer.vue?raw';
import timelineGridSource from '../components/TimelineGrid.vue?raw';
import timelineDisplayMenuSource from '../components/TimelineDisplayMenu.vue?raw';
import timelineEditorSource from '../views/TimelineEditor.vue?raw';
import timelineBuffLayerSource from '../components/TimelineBuffLayer.vue?raw';

const elementPlusStyles = readFileSync(
  new URL('./styles/element-plus.css', import.meta.url),
  'utf8',
);
const controlStyles = readFileSync(new URL('./styles/controls.css', import.meta.url), 'utf8');
const dialogStyles = readFileSync(new URL('./styles/dialogs.css', import.meta.url), 'utf8');
const patternStyles = readFileSync(new URL('./styles/patterns.css', import.meta.url), 'utf8');
const selectionDialogStyles = readFileSync(
  new URL('../components/selection/selectionDialog.css', import.meta.url),
  'utf8',
);
const tokenStyles = readFileSync(new URL('./styles/tokens.css', import.meta.url), 'utf8');
const featureVueSources = import.meta.glob<string>(
  ['../components/**/*.vue', '../views/**/*.vue'],
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
);
const featureSources = [
  ...Object.entries(featureVueSources),
  [
    '../components/armory/armoryDialogTheme.css',
    readFileSync(new URL('../components/armory/armoryDialogTheme.css', import.meta.url), 'utf8'),
  ],
  ['../components/selection/selectionDialog.css', selectionDialogStyles],
] as Array<[string, string]>;

function getRuleBody(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`))?.[1] ?? '';
}

function getBlockBody(source: string, header: string) {
  const headerIndex = source.indexOf(header);
  if (headerIndex < 0) return '';

  const openingBrace = source.indexOf('{', headerIndex + header.length);
  if (openingBrace < 0) return '';

  let depth = 1;
  for (let index = openingBrace + 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  return '';
}

function normalizeCssWhitespace(source: string) {
  return source.replace(/\s+/g, ' ').trim();
}

function unguardedHoverCount(source: string) {
  const styleBlocks = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
  const styleSource = styleBlocks.length ? styleBlocks.map(match => match[1]).join('\n') : source;
  const tokens = styleSource.match(
    /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{|:hover|[{}]/g,
  );
  if (!tokens) return 0;

  const guardedStack = [false];
  let count = 0;

  for (const token of tokens) {
    if (token.startsWith('@media')) {
      guardedStack.push(true);
    } else if (token === '{') {
      guardedStack.push(guardedStack.at(-1) || false);
    } else if (token === '}') {
      if (guardedStack.length > 1) guardedStack.pop();
    } else if (!guardedStack.at(-1)) {
      count += 1;
    }
  }

  return count;
}

describe('design-system layout regressions', () => {
  test('lets the enemy summary compound button grow around its content', () => {
    const rule = getRuleBody(enemySettingsSource, '.enemy-select-module');

    expect(rule).toMatch(/\bheight:\s*auto\s*;/);
  });

  test('keeps the generic popper arrow fill overridable by feature poppers', () => {
    expect(elementPlusStyles).toContain(
      ':where(.el-popper[data-popper-placement] > .el-popper__arrow)::before',
    );
    expect(elementPlusStyles).not.toContain(
      '.el-popper.el-popper.el-popper[data-popper-placement] > .el-popper__arrow::before',
    );
  });

  test('gives shared tooltip and popover adapters one floating-surface contract', () => {
    const rule = getRuleBody(patternStyles, '.ea-floating-surface');

    expect(rule).toContain('background: var(--ea-floating-bg) !important;');
    expect(rule).toContain('border: 1px solid var(--ea-floating-border) !important;');
    expect(rule).toContain('box-shadow: var(--ea-floating-shadow) !important;');
  });

  test('keeps shared floating-surface arrows attached to the matching surface color', () => {
    const rule = getRuleBody(
      elementPlusStyles,
      '.ea-floating-surface.el-popper > .el-popper__arrow::before',
    );

    expect(rule).toContain('background: var(--ea-floating-bg) !important;');
  });

  test('routes Element Plus adapter surfaces through shared theme colors', () => {
    expect(elementPlusStyles).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    expect(elementPlusStyles).toContain('background-color: var(--ea-dialog-bg) !important;');
    expect(elementPlusStyles).toContain('background-color: var(--ea-fill-input) !important;');
    expect(elementPlusStyles).toContain('color: var(--ea-control-placeholder) !important;');
    expect(elementPlusStyles).toContain('box-shadow: var(--ea-floating-shadow) !important;');
  });

  test('routes shared pattern colors through design tokens', () => {
    expect(patternStyles).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    expect(patternStyles).toContain('--ea-range-track: var(--ea-border-strong);');
    expect(patternStyles).toContain('color: var(--ea-fg-secondary);');
  });

  test('keeps shared drawers on the panel surface with an unpadded content body', () => {
    const drawerRule = getRuleBody(dialogStyles, '.ea-drawer.el-drawer');
    const bodyRule = getRuleBody(dialogStyles, '.ea-drawer .el-drawer__body');

    expect(drawerRule).toContain('background: var(--ea-panel) !important;');
    expect(bodyRule).toContain('padding: 0 !important;');
    expect(bodyRule).toContain('background: var(--ea-panel) !important;');
  });

  test('gives dialog close controls one square, background-free interaction contract', () => {
    const closeRule = getRuleBody(dialogStyles, '.ea-dialog .el-dialog__headerbtn');
    const closeComponentRule = getRuleBody(controlStyles, '.ea-close-button--md.ea-button');
    const hoverMedia = getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)');
    const hoverRule = getRuleBody(hoverMedia, '.ea-close-button.ea-button:hover:not(:disabled)');

    expect(closeRule).toContain('width: 32px;');
    expect(closeRule).toContain('height: 32px;');
    expect(closeRule).toContain('background: transparent;');
    expect(closeComponentRule).toContain('width: 32px;');
    expect(closeComponentRule).toContain('height: 32px;');
    expect(hoverRule).toContain('background: transparent;');
    expect(hoverRule).toContain('color: var(--ea-gold);');
    expect(dialogStyles).not.toContain('ea-dialog-close-button');
  });

  test('routes custom dialog close buttons through the shared close contract', () => {
    expect(timelineResetSource).toMatch(/<EaCloseButton\b/);
    expect(mobileTimelineSource.match(/<EaCloseButton\b/g)).toHaveLength(3);
    expect(mobileTimelineSource).not.toMatch(/mobile-resource-guide__close/);
    expect(hitEditorSource).not.toMatch(/\.el-dialog__close:hover/);
  });

  test('uses button contracts for menus, scenario tabs, and ordinary selection cards', () => {
    expect(contextMenuSource).not.toMatch(/<div\s+class="menu-item\b/);
    expect(contextMenuSource).toMatch(/<EaButton\b[^>]*class="menu-item\b/s);
    expect(timelineEditorSource).toMatch(
      /<EaButton\b[^>]*class="ts-tab-item"[^>]*:pressed="sc\.id === store\.activeScenarioId"/s,
    );
    expect(enemySettingsSource).not.toMatch(/<div\s+[^>]*class="enemy-card\b/s);

    for (const source of [
      operatorSelectionSource,
      weaponSelectionSource,
      equipmentSelectionSource,
    ]) {
      expect(source).not.toMatch(/<div\s+[^>]*class="roster-card\b/s);
      expect(source).toMatch(/<EaButton\b[^>]*class="roster-card\b/s);
    }
  });

  test('keeps sticky selection group headers on the shared dialog surface', () => {
    const rarityHeaderRule = getRuleBody(selectionDialogStyles, '.rarity-header');
    const lightRarityHeaderRule = getRuleBody(
      selectionDialogStyles,
      "html[data-theme='light'] .rarity-header",
    );

    expect(rarityHeaderRule).toContain('background: var(--ea-dialog-bg);');
    expect(lightRarityHeaderRule).not.toMatch(/\bbackground\s*:/);
  });

  test('keeps draggable library cards keyboard operable without changing their drag surface', () => {
    expect(actionLibrarySource).toMatch(
      /class="skill-card"[\s\S]*?role="button"[\s\S]*?tabindex="0"[\s\S]*?@keydown\.enter\.prevent/s,
    );
    expect(actionLibrarySource).toMatch(
      /class="attack-segment-chip"[\s\S]*?:aria-disabled=[\s\S]*?@keydown\.space\.stop\.prevent/s,
    );
  });

  test('guards feature hover feedback behind a fine hover pointer', () => {
    const sourcesToCheck: Array<[string, string]> = [
      ['./styles/element-plus.css', elementPlusStyles],
      ['./styles/patterns.css', patternStyles],
      ...featureSources,
    ];
    const violations = sourcesToCheck
      .filter(([, source]) => unguardedHoverCount(source) > 0)
      .map(([path]) => path)
      .sort();

    expect(violations).toEqual([]);
  });

  test('limits shared hover feedback to devices with a fine hover pointer', () => {
    const hoverMedia = getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)');
    const allHoverRules = controlStyles.match(/:hover/g)?.length ?? 0;
    const guardedHoverRules = hoverMedia.match(/:hover/g)?.length ?? 0;

    expect(guardedHoverRules).toBe(allHoverRules);
  });

  test('gives enabled checkboxes visible hover feedback without losing their checked state', () => {
    const hoverMedia = normalizeCssWhitespace(
      getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)'),
    );
    const labelRule = getRuleBody(hoverMedia, '.ea-checkbox:not(.ea-checkbox--disabled):hover');
    const boxRule = getRuleBody(
      hoverMedia,
      '.ea-checkbox:not(.ea-checkbox--disabled):hover .ea-checkbox__box',
    );
    const checkedBoxRule = getRuleBody(
      hoverMedia,
      '.ea-checkbox:not(.ea-checkbox--disabled):hover .ea-checkbox__input:checked + .ea-checkbox__box',
    );

    expect(labelRule).toContain('color: var(--ea-control-fg-hover);');
    expect(boxRule).toContain('border-color: var(--ea-control-border-hover);');
    expect(boxRule).toContain('background: var(--ea-control-bg-hover);');
    expect(checkedBoxRule).toContain('border-color: var(--ea-gold-hover);');
    expect(checkedBoxRule).toContain('background: var(--ea-gold-hover);');
  });

  test('limits switch hover feedback to its track and thumb', () => {
    const hoverMedia = getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)');
    const rootRule = getRuleBody(hoverMedia, '.ea-switch:hover:not(:disabled)');
    const trackRule = getRuleBody(hoverMedia, '.ea-switch:hover:not(:disabled) .ea-switch__track');
    const thumbRule = getRuleBody(hoverMedia, '.ea-switch:hover:not(:disabled) .ea-switch__thumb');

    expect(rootRule).not.toMatch(/\b(?:background|border-color)\s*:/);
    expect(trackRule).toContain('border-color: var(--ea-control-border-hover);');
    expect(trackRule).toContain('background: var(--ea-control-bg-hover);');
    expect(thumbRule).toContain('background: var(--ea-control-fg-hover);');
  });

  test('gives standard form controls hover feedback without overriding special states', () => {
    const hoverMedia = normalizeCssWhitespace(
      getBlockBody(elementPlusStyles, '@media (hover: hover) and (pointer: fine)'),
    );

    for (const selector of [
      '.ea-input:not(.is-disabled):not(.ea-input--invalid):not(.ea-input--inline) .el-input__wrapper:not(.is-focus):hover',
      '.ea-textarea:not(.is-disabled):not(.ea-textarea--invalid) .el-textarea__inner:not(:focus):hover',
      '.ea-number-input:not(.is-disabled):not(.ea-number-input--invalid) .el-input__wrapper:not(.is-focus):hover',
      '.ea-select:not(.is-disabled):not(.ea-select--invalid):not(.ea-select--inline) .el-select__wrapper:not(.is-focused):hover',
    ]) {
      expect(hoverMedia).toContain(selector);
    }

    expect(hoverMedia).toContain('background-color: var(--ea-control-bg-hover) !important;');
    expect(hoverMedia).toContain(
      'box-shadow: 0 0 0 1px var(--ea-control-border-hover) inset !important;',
    );
  });

  test('keeps pressed-button hover customizable while retaining the default gold feedback', () => {
    const hoverMedia = getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)');
    const rule = getRuleBody(hoverMedia, ".ea-button[aria-pressed='true']:hover:not(:disabled)");

    expect(rule).toContain('border-color: var(--ea-control-pressed-border-hover, var(--ea-gold));');
    expect(rule).toMatch(
      /background:\s*var\(\s*--ea-control-pressed-bg-hover,\s*color-mix\(in srgb, var\(--ea-gold\) 22%, transparent\)\s*\);/,
    );
    expect(rule).toContain('color: var(--ea-control-pressed-fg-hover, var(--ea-gold));');
  });

  test('lets specialized card and scenario buttons retain their own pressed chrome', () => {
    const rosterPressedRule = getRuleBody(
      selectionDialogStyles,
      ".roster-card.ea-button[aria-pressed='true']",
    );
    const timelineHoverMedia = getBlockBody(
      timelineEditorSource,
      '@media (hover: hover) and (pointer: fine)',
    );
    const scenarioRule = getRuleBody(timelineEditorSource, '.ts-tab-item');
    const selectedScenarioRule = getRuleBody(
      timelineEditorSource,
      ".ts-tab-item[aria-pressed='true']",
    );
    const inactiveScenarioHoverRule = getRuleBody(
      timelineHoverMedia,
      ".ts-tab-item.ea-button:hover:not(:disabled):not([aria-pressed='true'])",
    );

    expect(rosterPressedRule).toContain('border: 0;');
    expect(rosterPressedRule).toContain('background: transparent;');
    expect(rosterPressedRule).toContain('box-shadow: none;');
    expect(scenarioRule).toContain('--ea-control-pressed-border-hover: transparent;');
    expect(scenarioRule).toContain('--ea-control-pressed-bg-hover: var(--ea-tab-active-bg);');
    expect(scenarioRule).toContain('--ea-control-pressed-fg-hover: var(--ea-tab-active-fg);');
    expect(selectedScenarioRule).toContain('border-color: transparent;');
    expect(inactiveScenarioHoverRule).toContain('background-color: var(--ea-hover-fill);');
  });

  test('keeps custom pressed controls selected with restrained hover feedback', () => {
    const analysisHoverMedia = getBlockBody(
      damageAnalysisSource,
      '@media (hover: hover) and (pointer: fine)',
    );
    const presetHoverMedia = getBlockBody(
      globalConfigPresetSource,
      '@media (hover: hover) and (pointer: fine)',
    );
    const checkRowRule = getRuleBody(patternStyles, '\n.header-more-check-row');
    const selectedCheckRowRule = getRuleBody(
      patternStyles,
      ".header-more-check-row.ea-button[aria-pressed='true']",
    );
    const patternHoverMedia = getBlockBody(
      patternStyles,
      '@media (hover: hover) and (pointer: fine)',
    );
    const selectedCheckRowHoverRule = getRuleBody(
      patternHoverMedia,
      ".header-more-check-row.ea-button[aria-pressed='true']:hover:not(:disabled)",
    );
    const displayGuideRule = getRuleBody(timelineDisplayMenuSource, '.timeline-display-guide');
    const selectedDisplayGuideRule = getRuleBody(
      timelineDisplayMenuSource,
      ".timeline-display-guide.ea-button[aria-pressed='true']",
    );
    const displayGuideHoverMedia = getBlockBody(
      timelineDisplayMenuSource,
      '@media (hover: hover) and (pointer: fine)',
    );
    const selectedDisplayGuideHoverRule = getRuleBody(
      displayGuideHoverMedia,
      ".timeline-display-guide.ea-button[aria-pressed='true']:hover:not(:disabled)",
    );
    const miniToolRule = getRuleBody(timelineGridSource, '\n.mini-tool-btn');

    expect(getRuleBody(analysisHoverMedia, ".lmdi-mode-btn[aria-pressed='true']:hover")).toContain(
      'background: var(--ea-active-fill);',
    );
    expect(getRuleBody(presetHoverMedia, ".preset-tile[aria-pressed='true']:hover")).toContain(
      'background: color-mix(in srgb, var(--ea-gold, #ffe08a) 12%, var(--ea-keycap-bg, #333338));',
    );
    expect(checkRowRule).toContain('--ea-control-pressed-border-hover: var(--ea-border-strong);');
    expect(checkRowRule).toContain('--ea-control-pressed-bg-hover: var(--ea-hover-fill);');
    expect(checkRowRule).toContain('--ea-control-pressed-fg-hover: var(--ea-fg);');
    expect(selectedCheckRowRule).toContain('border-color: var(--ea-border-soft);');
    expect(selectedCheckRowRule).toContain('background: transparent;');
    expect(selectedCheckRowRule).toContain('color: var(--ea-fg-secondary);');
    expect(selectedCheckRowRule).toContain('box-shadow: none;');
    expect(selectedCheckRowHoverRule).toContain('border-color: var(--ea-border-strong);');
    expect(selectedCheckRowHoverRule).toContain('background: var(--ea-hover-fill);');
    expect(selectedCheckRowHoverRule).toContain('color: var(--ea-fg);');
    expect(displayGuideRule).toContain(
      '--ea-control-pressed-border-hover: var(--ea-border-strong);',
    );
    expect(displayGuideRule).toContain('--ea-control-pressed-bg-hover: var(--ea-hover-fill);');
    expect(displayGuideRule).toContain('--ea-control-pressed-fg-hover: var(--ea-fg);');
    expect(selectedDisplayGuideRule).toContain('border-color: var(--ea-border);');
    expect(selectedDisplayGuideRule).toContain('background: var(--ea-fill-soft);');
    expect(selectedDisplayGuideRule).toContain('color: var(--ea-fg-secondary);');
    expect(selectedDisplayGuideRule).toContain('box-shadow: none;');
    expect(selectedDisplayGuideHoverRule).toContain('border-color: var(--ea-border-strong);');
    expect(selectedDisplayGuideHoverRule).toContain('background: var(--ea-hover-fill);');
    expect(selectedDisplayGuideHoverRule).toContain('color: var(--ea-fg);');
    expect(miniToolRule).toContain('--ea-control-pressed-border-hover: var(--ea-gold);');
    expect(miniToolRule).toContain(
      '--ea-control-pressed-bg-hover: color-mix(in srgb, var(--ea-gold) 10%, transparent);',
    );
    expect(miniToolRule).toContain('--ea-control-pressed-fg-hover: var(--ea-gold);');
  });

  test('lets mobile loadout compound cards grow around their content', () => {
    for (const selector of ['.loadout-header', '.loadout-item']) {
      const rule = getRuleBody(mobileTimelineSource, selector);

      expect(rule).toContain('height: auto;');
    }
  });

  test('lets mobile bottom navigation buttons fill the bar instead of keeping control height', () => {
    const rule = getRuleBody(mobileAppShellSource, '.bottom-nav button');

    expect(rule).toContain('height: auto;');
    expect(rule).toContain('align-self: stretch;');
  });

  test('keeps damage analysis chrome aligned with the square control geometry', () => {
    for (const selector of [
      '.chart-card',
      '.lmdi-mode-toggle',
      '.summary-item',
      '.warning-banner',
      '.faq-collapse',
    ]) {
      const rule = getRuleBody(damageAnalysisSource, selector);

      expect(rule).toContain('border-radius: var(--ea-control-radius);');
    }

    expect(damageAnalysisSource).toMatch(/tooltip:\s*\{[\s\S]*?borderRadius:\s*0,/);
  });

  test('keeps custom context menus on the shared floating-surface chrome', () => {
    const rule = getRuleBody(contextMenuSource, '.custom-context-menu');

    expect(rule).not.toMatch(/\bbackground\s*:/);
    expect(rule).not.toMatch(/\bborder(?:-radius)?\s*:/);
    expect(rule).not.toMatch(/\bbox-shadow\s*:/);
  });

  test('sizes teleported select options with the matching control tokens', () => {
    for (const size of ['sm', 'md', 'lg']) {
      const rule = getRuleBody(
        elementPlusStyles,
        `.ea-select-popper--${size} .el-select-dropdown__item`,
      );

      expect(rule).toContain(`height: var(--ea-control-height-${size}) !important;`);
      expect(rule).toContain(`font-size: var(--ea-control-font-size-${size}) !important;`);
      expect(rule).toContain(`line-height: var(--ea-control-height-${size}) !important;`);
    }
  });

  test('maps standard Element Plus controls onto the shared control height scale', () => {
    const rule = getRuleBody(controlStyles, '.ea-select:not(.ea-select--inline)');

    expect(controlStyles).toMatch(
      /\.ea-input:not\(\.ea-input--inline\),\s*\.ea-number-input,\s*\.ea-select:not\(\.ea-select--inline\)/,
    );
    expect(rule).toContain('--el-component-size-small: var(--ea-control-height-sm);');
    expect(rule).toContain('--el-component-size: var(--ea-control-height-md);');
    expect(rule).toContain('--el-component-size-large: var(--ea-control-height-lg);');
  });

  test('overrides Element Plus select wrappers that hard-code their native size heights', () => {
    for (const size of ['sm', 'md', 'lg']) {
      const rule = getRuleBody(
        controlStyles,
        `.ea-select--${size}:not(.ea-select--inline) .el-select__wrapper`,
      );

      expect(rule).toContain(`min-height: var(--ea-control-height-${size});`);
    }
  });

  test('keeps resource monitor collapse controls transparent on hover', () => {
    const rule = getRuleBody(resourceMonitorSource, '.section-toggle-btn:hover');

    expect(rule).toMatch(/\bbackground:\s*transparent\s*;/);
  });

  test('keeps hit editor advanced settings hover flat while preserving its divider', () => {
    const rule = getRuleBody(hitEditorSource, '.advanced-settings-toggle');

    expect(rule).toContain('--ea-control-bg-hover: transparent;');
    expect(rule).toContain('--ea-control-border-hover: var(--ea-border-soft);');
    expect(rule).toContain('--ea-control-fg-hover: var(--ea-gold);');
  });

  test('centers the asymmetric Typhoeus Sign artwork inside its timeline icon box', () => {
    const rule = getRuleBody(
      timelineBuffLayerSource,
      ".timeline-buff-icon[src$='/deco_char_passive_typhoea_point.webp']",
    );

    expect(rule).toContain('transform: translate(1.5px, -0.5px);');
  });

  test('keeps scrolling property cards free of expensive blur and catch-all transitions', () => {
    for (const selector of ['.tick-item', '.connection-card']) {
      const rule = getRuleBody(propertiesPanelSource, selector);

      expect(rule).not.toMatch(/\bbackdrop-filter\s*:/);
      expect(rule).not.toMatch(/\btransition:\s*all\b/);
      expect(rule).not.toMatch(/\bclip-path\s*:/);
    }
  });

  test('keeps custom time bar controls separated by the shared spacing scale', () => {
    const listRule = getRuleBody(propertiesPanelSource, '.custom-bar-list');
    const cardRule = getRuleBody(propertiesPanelSource, '.custom-bar-card');
    const headerRule = getRuleBody(propertiesPanelSource, '.custom-bar-card__header');
    const fieldsRule = getRuleBody(propertiesPanelSource, '.custom-bar-card__fields');

    expect(listRule).toContain('gap: var(--ea-space-2);');
    expect(cardRule).toContain('padding: var(--ea-space-3) !important;');
    expect(cardRule).toContain('margin-bottom: 0 !important;');
    expect(headerRule).toContain('grid-template-columns: minmax(0, 1fr) auto;');
    expect(headerRule).toContain('gap: var(--ea-space-2);');
    expect(fieldsRule).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(fieldsRule).toContain('gap: var(--ea-space-2);');
  });

  test('keeps activity-bar hover feedback flat and position-stable', () => {
    const baseRule = getRuleBody(controlStyles, '.ea-activity-rail-button.ea-button');
    const rule = getRuleBody(controlStyles, '.ea-activity-rail-button:hover');

    expect(baseRule).toContain('--ea-control-pressed-border-hover: transparent;');
    expect(baseRule).toContain('--ea-control-pressed-bg-hover: transparent;');
    expect(rule).not.toMatch(/\bbackground\s*:/);
    expect(rule).not.toMatch(/\btransform\s*:/);
  });

  test('keeps the left activity-bar selection marker on the panel-facing edge', () => {
    const rule = getRuleBody(controlStyles, '.ea-activity-rail-button--left::after');

    expect(rule).toMatch(/\bright:\s*0\s*;/);
    expect(rule).toMatch(/\bleft:\s*auto\s*;/);
  });

  test('keeps the right activity-bar selection marker on the panel-facing edge', () => {
    const rule = getRuleBody(controlStyles, '.ea-activity-rail-button--right::after');

    expect(rule).toMatch(/\bleft:\s*0\s*;/);
    expect(rule).toMatch(/\bright:\s*auto\s*;/);
  });

  test('keeps panel chrome flat, still, and free of hover fills', () => {
    const chromeRule = getRuleBody(timelineEditorSource, '.panel-chrome');
    const chromeHoverRule = getRuleBody(timelineEditorSource, '.panel-chrome__btn:hover');

    expect(chromeRule).not.toMatch(/\bbackdrop-filter\s*:/);
    expect(chromeRule).not.toMatch(/\bborder-radius\s*:/);
    expect(chromeRule).not.toMatch(/\btransform\s*:/);
    expect(chromeRule).not.toMatch(/\bopacity:\s*0\.18\s*;/);
    expect(chromeHoverRule).not.toMatch(/\bbackground\s*:/);
  });

  test('avoids catch-all transitions in the high-frequency workbench surfaces', () => {
    for (const source of [
      actionLibrarySource,
      resourceMonitorSource,
      timelineGridSource,
      timelineEditorSource,
    ]) {
      expect(source).not.toMatch(/\btransition:\s*all\b/);
    }
  });

  test('avoids catch-all transitions in frequently interacted items and menus', () => {
    for (const source of [actionItemSource, contextMenuSource, selectionDialogStyles]) {
      expect(source).not.toMatch(/\btransition:\s*all\b/);
    }
  });

  test('does not expose the create-hit action with destructive button semantics', () => {
    expect(propertiesPanelSource).not.toMatch(
      /<EaButton[^>]*variant="danger"[^>]*@click\.stop="addDamageTick"/s,
    );
  });

  test('provides a shared four-pixel spacing scale', () => {
    expect(tokenStyles).toContain('--ea-space-1: 4px;');
    expect(tokenStyles).toContain('--ea-space-2: 8px;');
    expect(tokenStyles).toContain('--ea-space-3: 12px;');
    expect(tokenStyles).toContain('--ea-space-4: 16px;');
    expect(tokenStyles).toContain('--ea-space-6: 24px;');
  });
});
