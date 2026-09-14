import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import actionLibrarySource from '../components/ActionLibrary.vue?raw';
import enemySettingsSource from '../components/EnemySettingsPanel.vue?raw';
import propertiesPanelSource from '../components/PropertiesPanel.vue?raw';
import resourceMonitorSource from '../components/ResourceMonitor.vue?raw';
import timelineGridSource from '../components/TimelineGrid.vue?raw';
import timelineEditorSource from '../views/TimelineEditor.vue?raw';

const elementPlusStyles = readFileSync(
  new URL('./styles/element-plus.css', import.meta.url),
  'utf8',
);
const controlStyles = readFileSync(new URL('./styles/controls.css', import.meta.url), 'utf8');
const tokenStyles = readFileSync(new URL('./styles/tokens.css', import.meta.url), 'utf8');

function getRuleBody(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`))?.[1] ?? '';
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
