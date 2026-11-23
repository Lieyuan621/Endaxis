import { test, expect, openPerlica } from './helpers';
import { createDefaultOperatorInstance } from '../../src/application/editor/loadoutBuildFactory';
import { perlica, ember } from '../../src/data/operators';

test('预设默认当前干员，文件往返返回原筛选且应用到空轨道可撤销', async ({ page }) => {
  await openPerlica(page);
  await page.getByRole('button', { name: '干员预设', exact: true }).click();
  const manager = page.getByRole('dialog', { name: '干员预设', exact: true });
  const filter = manager.getByRole('button', { name: '筛选干员', exact: true });
  await expect(filter).toContainText('佩丽卡');
  await expect(filter).toContainText('0');
  await expect(manager.getByRole('button', { name: '导出预设', exact: true })).toBeDisabled();
  await manager.getByRole('button', { name: '保存为新预设', exact: true }).click();
  await manager.getByRole('textbox', { name: '预设名称', exact: true }).fill('回归预设');
  await manager.getByRole('button', { name: '保存', exact: true }).click();
  await expect(filter).toContainText('佩丽卡');
  await expect(filter).toContainText('1');
  const card = manager.locator('article').first();
  await expect(card.getByRole('button', { name: '重命名', exact: true })).toHaveCount(0);
  await card.getByRole('button', { name: '查看完整配置 · 回归预设', exact: true }).click();
  await expect(card.locator('.preset-build__expanded')).toBeVisible();
  await expect(card.getByRole('textbox')).toHaveCount(0);
  await card
    .getByRole('group', { name: '管理预设：回归预设', exact: true })
    .getByRole('button', { name: '重命名', exact: true })
    .click();
  const rename = page.getByRole('dialog', { name: '重命名', exact: true });
  await rename.getByRole('textbox', { name: '预设名称', exact: true }).fill('回归预设重命名');
  await rename.getByRole('button', { name: '保存', exact: true }).click();
  await expect(rename).toBeHidden();
  await expect(card.getByText('回归预设重命名', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: '收起详情 · 回归预设重命名', exact: true }).click();
  await expect(card.getByRole('button', { name: '重命名', exact: true })).toHaveCount(0);
  await manager.getByRole('textbox', { name: '搜索预设、干员、武器或装备' }).fill('回归');
  await manager.getByRole('button', { name: '导出预设', exact: true }).click();
  const exporter = page.getByRole('dialog', { name: '导出', exact: true });
  await expect(exporter.getByRole('tab', { name: '干员预设', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const downloadPromise = page.waitForEvent('download');
  await exporter.getByRole('button', { name: '导出所选', exact: true }).click();
  const download = await downloadPromise;
  const file = await download.path();
  if (!file) throw new Error('预设文件没有下载');
  await expect(manager).toBeVisible();
  await expect(manager.getByRole('textbox', { name: '搜索预设、干员、武器或装备' })).toHaveValue(
    '回归',
  );
  const chooserPromise = page.waitForEvent('filechooser');
  await manager.getByRole('button', { name: '导入预设', exact: true }).click();
  await (await chooserPromise).setFiles(file);
  await page.getByRole('button', { name: '导入所选', exact: true }).click();
  await expect(manager).toBeVisible();
  await expect(manager.locator('article')).toHaveCount(2);
  await manager.getByRole('button', { name: '关闭此对话框' }).click();
  await expect(manager).toBeHidden();
  await page
    .getByRole('button', { name: '点击更换干员 按住Ctrl点击打开干员预设面板', exact: true })
    .nth(1)
    .click({ modifiers: ['Control'] });
  await expect(filter).toContainText('全部干员');
  await expect(filter).toContainText('2');
  await manager.getByRole('button', { name: '应用预设', exact: true }).first().click();
  await expect(manager).toBeHidden();
  await expect(page.getByRole('button', { name: '干员预设', exact: true })).toHaveCount(2);
  await page.keyboard.press('Control+z');
  await expect(page.getByRole('button', { name: '干员预设', exact: true })).toHaveCount(1);
});

test('标题栏文件入口保留干员范围，搜索提示和匹配数量随筛选变化', async ({ page }) => {
  const preset = (id: string, name: string, operator = perlica) => ({
    id,
    name,
    build: {
      operator: createDefaultOperatorInstance(operator),
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    },
  });
  await page.addInitScript(
    items => {
      localStorage.setItem('endaxis.operator-build-presets', JSON.stringify(items));
    },
    [preset('a', 'Alpha'), preset('b', 'Beta'), preset('c', 'Alpha other', ember)],
  );
  await openPerlica(page);
  await page.getByRole('button', { name: '干员预设', exact: true }).click();
  const manager = page.getByRole('dialog', { name: '干员预设', exact: true });
  const header = manager.locator('.operator-presets__dialog-heading');
  const filter = manager.getByRole('button', { name: '筛选干员', exact: true });
  const picker = page.getByRole('group', { name: '筛选干员', exact: true });
  const search = manager.getByRole('textbox', { name: '搜索预设、干员、武器或装备', exact: true });
  await expect(search).toHaveAttribute('placeholder', '搜索名称、武器或装备');
  await expect(manager.locator('.operator-presets__result-count')).toHaveCount(0);
  await search.fill('Alpha');
  await expect(manager.locator('.operator-presets__result-count')).toHaveText('找到 1 个预设');
  await header.getByRole('button', { name: '导出预设', exact: true }).click();
  const exporter = page.getByRole('dialog', { name: '导出', exact: true });
  await expect(exporter.locator('article')).toHaveCount(2);
  await exporter.getByRole('button', { name: '关闭此对话框', exact: true }).click();
  await expect(manager).toBeVisible();
  await expect(search).toHaveValue('Alpha');
  await filter.click();
  await picker.getByRole('button', { name: '全部干员 3', exact: true }).click();
  await expect(search).toHaveAttribute('placeholder', '搜索预设、干员、武器或装备');
  await expect(manager.locator('.operator-presets__result-count')).toHaveText('找到 2 个预设');
  await expect(manager.locator('article')).toHaveCount(2);
  await filter.click();
  await picker.getByRole('button', { name: '余烬', exact: true }).click();
  await expect(filter).toContainText('余烬');
  await expect(manager.locator('article')).toHaveCount(1);
  await expect(manager.locator('article')).toContainText('Alpha other');
  await header.getByRole('button', { name: '导出预设', exact: true }).click();
  await expect(exporter.locator('article')).toHaveCount(1);
  await expect(exporter.locator('article')).toContainText('Alpha other');
  await exporter.getByRole('button', { name: '关闭此对话框', exact: true }).click();
  await expect(filter).toContainText('余烬');
  await expect(search).toHaveValue('Alpha');
  await filter.click();
  await picker.getByRole('button', { name: '全部干员 3', exact: true }).click();
  await search.fill('no results');
  await expect(manager.locator('.operator-presets__result-count')).toHaveText('找到 0 个预设');
  await expect(manager.getByText('没有匹配的预设', { exact: true })).toBeVisible();
  await search.fill('');
  await expect(manager.locator('.operator-presets__result-count')).toHaveCount(0);
  for (const width of [1440, 680, 390]) {
    await page.setViewportSize({ width, height: 1200 });
    const operator = await filter.boundingBox();
    const input = await manager
      .locator('.operator-presets__filter-toolbar > .ea-input')
      .boundingBox();
    expect(Math.abs(operator!.height - input!.height)).toBeLessThan(1);
    if (width > 600) expect(Math.abs(operator!.y - input!.y)).toBeLessThan(1);
    else expect(input!.y).toBeGreaterThan(operator!.y + operator!.height);
    const transfer = await header
      .getByRole('button', { name: '导出预设', exact: true })
      .boundingBox();
    const close = await manager
      .getByRole('button', { name: '关闭此对话框', exact: true })
      .boundingBox();
    expect(transfer!.x + transfer!.width).toBeLessThanOrEqual(close!.x);
    expect(await manager.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await page.mouse.move(0, 0);
    await manager
      .locator('.el-dialog')
      .screenshot({ path: `.local/preset-avatar-filters-${width}.png`, animations: 'disabled' });
    await filter.click();
    await expect(picker).toBeVisible();
    await manager
      .locator('.el-dialog')
      .screenshot({ path: `.local/preset-avatar-picker-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(picker).toBeHidden();
    await expect(filter).toBeFocused();
  }
});

test('零预设保留当前干员，保存定位到当前干员，删除后仍保持零数量筛选', async ({ page }) => {
  await page.addInitScript(
    preset => {
      localStorage.setItem('endaxis.operator-build-presets', JSON.stringify([preset]));
    },
    {
      id: 'other',
      name: 'Other build',
      build: {
        operator: createDefaultOperatorInstance(ember),
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      },
    },
  );
  await openPerlica(page);
  await page.getByRole('button', { name: '干员预设', exact: true }).click();
  const manager = page.getByRole('dialog', { name: '干员预设', exact: true });
  const filter = manager.getByRole('button', { name: '筛选干员', exact: true });
  const picker = page.getByRole('group', { name: '筛选干员', exact: true });
  await expect(filter).toContainText('佩丽卡');
  await expect(filter).toContainText('0');
  await expect(manager.locator('article')).toHaveCount(0);
  await filter.focus();
  await page.keyboard.press('Enter');
  await expect(picker.getByRole('button', { name: '佩丽卡', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(picker).toBeHidden();
  await expect(filter).toBeFocused();
  await filter.click();
  await picker.getByRole('button', { name: '余烬', exact: true }).click();
  const search = manager.getByRole('textbox', { name: '搜索预设、干员、武器或装备', exact: true });
  await search.fill('Other');
  await manager.getByRole('button', { name: '保存为新预设', exact: true }).click();
  await manager.getByRole('textbox', { name: '预设名称', exact: true }).fill('New current');
  await manager.getByRole('button', { name: '保存', exact: true }).click();
  await expect(filter).toContainText('佩丽卡');
  await expect(filter).toContainText('1');
  await expect(search).toHaveValue('');
  await manager.getByRole('button', { name: '查看完整配置 · New current', exact: true }).click();
  await manager.locator('article').getByRole('button', { name: '删除', exact: true }).click();
  await page.locator('.el-message-box').getByRole('button', { name: '确定', exact: true }).click();
  await expect(filter).toContainText('佩丽卡');
  await expect(filter).toContainText('0');
  await expect(manager.locator('article')).toHaveCount(0);
  await expect(manager.getByRole('button', { name: '导出预设', exact: true })).toBeDisabled();
  await filter.click();
  await picker.getByRole('button', { name: '全部干员 1', exact: true }).click();
  await expect(manager.locator('article')).toHaveCount(1);
  await expect(manager.locator('article')).toContainText('Other build');
});
