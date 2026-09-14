import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import actionItemSource from '../components/ActionItem.vue?raw';
import actionLibrarySource from '../components/ActionLibrary.vue?raw';
import contextMenuSource from '../components/ContextMenu.vue?raw';
import damageAnalysisSource from '../components/DamageAnalysisDialog.vue?raw';
import enemySettingsSource from '../components/EnemySettingsPanel.vue?raw';
import hitEditorSource from '../components/HitEditorDialog.vue?raw';
import propertiesPanelSource from '../components/PropertiesPanel.vue?raw';
import resourceMonitorSource from '../components/ResourceMonitor.vue?raw';
import timelineResetSource from '../components/TimelineResetDialog.vue?raw';
import mobileTimelineSource from '../views/MobileTimelineViewer.vue?raw';
import timelineGridSource from '../components/TimelineGrid.vue?raw';
import timelineEditorSource from '../views/TimelineEditor.vue?raw';

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

  test('keeps shared drawers on the panel surface with an unpadded content body', () => {
    const drawerRule = getRuleBody(dialogStyles, '.ea-drawer.el-drawer');
    const bodyRule = getRuleBody(dialogStyles, '.ea-drawer .el-drawer__body');

    expect(drawerRule).toContain('background: var(--ea-panel) !important;');
    expect(bodyRule).toContain('padding: 0 !important;');
    expect(bodyRule).toContain('background: var(--ea-panel) !important;');
  });

  test('gives dialog close controls one square, background-free interaction contract', () => {
    const closeRule = getRuleBody(
      dialogStyles,
      ':is(.ea-dialog .el-dialog__headerbtn, .ea-dialog-close-button.ea-button)',
    );
    const hoverMedia = getBlockBody(dialogStyles, '@media (hover: hover) and (pointer: fine)');
    const hoverRule = getRuleBody(
      hoverMedia,
      ':is(.ea-dialog .el-dialog__headerbtn, .ea-dialog-close-button.ea-button):hover',
    );

    expect(closeRule).toContain('width: 32px;');
    expect(closeRule).toContain('height: 32px;');
    expect(closeRule).toContain('background: transparent;');
    expect(hoverRule).toContain('background: transparent;');
    expect(hoverRule).toContain('color: var(--ea-gold);');
  });

  test('routes custom dialog close buttons through the shared close contract', () => {
    expect(timelineResetSource).toMatch(
      /class="ea-dialog-close-button timeline-reset-dialog__close"/,
    );
    expect(hitEditorSource).not.toMatch(/\.el-dialog__close:hover/);
  });

  test('limits shared hover feedback to devices with a fine hover pointer', () => {
    const hoverMedia = getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)');
    const allHoverRules = controlStyles.match(/:hover/g)?.length ?? 0;
    const guardedHoverRules = hoverMedia.match(/:hover/g)?.length ?? 0;

    expect(guardedHoverRules).toBe(allHoverRules);
  });

  test('keeps pressed buttons visually selected while hovered', () => {
    const hoverMedia = getBlockBody(controlStyles, '@media (hover: hover) and (pointer: fine)');
    const rule = getRuleBody(hoverMedia, ".ea-button[aria-pressed='true']:hover:not(:disabled)");

    expect(rule).toContain('border-color: var(--ea-gold);');
    expect(rule).toContain('color: var(--ea-gold);');
  });

  test('lets mobile loadout compound cards grow around their content', () => {
    for (const selector of ['.loadout-header', '.loadout-item']) {
      const rule = getRuleBody(mobileTimelineSource, selector);

      expect(rule).toContain('height: auto;');
    }
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

  test('keeps resource monitor collapse controls transparent on hover', () => {
    const rule = getRuleBody(resourceMonitorSource, '.section-toggle-btn:hover');

    expect(rule).toMatch(/\bbackground:\s*transparent\s*;/);
  });

  test('keeps scrolling property cards free of expensive blur and catch-all transitions', () => {
    for (const selector of ['.tick-item', '.connection-card']) {
      const rule = getRuleBody(propertiesPanelSource, selector);

      expect(rule).not.toMatch(/\bbackdrop-filter\s*:/);
      expect(rule).not.toMatch(/\btransition:\s*all\b/);
      expect(rule).not.toMatch(/\bclip-path\s*:/);
    }
  });

  test('keeps activity-bar hover feedback flat and position-stable', () => {
    const rule = getRuleBody(controlStyles, '.ea-activity-rail-button:hover');

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
