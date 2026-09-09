import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import enemySettingsSource from '../components/EnemySettingsPanel.vue?raw';
import resourceMonitorSource from '../components/ResourceMonitor.vue?raw';

const elementPlusStyles = readFileSync(
  new URL('./styles/element-plus.css', import.meta.url),
  'utf8',
);

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
});
