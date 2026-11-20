import { test, expect, openPerlica } from './helpers';

test('预设默认当前干员，文件往返返回原筛选且应用到空轨道可撤销', async ({ page }) => {
  await openPerlica(page);
  await page.getByRole('button', { name: '干员预设', exact: true }).click();
  const manager = page.getByRole('dialog', { name: '干员预设', exact: true });
  await manager.getByRole('button', { name: '保存为新预设', exact: true }).click();
  await manager.getByRole('textbox', { name: '预设名称', exact: true }).fill('回归预设');
  await manager.getByRole('button', { name: '保存', exact: true }).click();
  await expect(manager.getByRole('tab', { name: '佩丽卡 (1)', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const card = manager.locator('article').first();
  await card.getByRole('button', { name: '查看完整配置', exact: true }).click();
  await card.getByRole('textbox', { name: '预设名称', exact: true }).fill('回归预设重命名');
  await card.getByRole('textbox', { name: '预设名称', exact: true }).press('Tab');
  await expect(card.getByText('回归预设重命名', { exact: true })).toBeVisible();
  await manager.getByRole('textbox', { name: '搜索预设、干员、武器或装备' }).fill('回归');
  await manager.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByRole('menuitem', { name: '导出预设', exact: true }).click();
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
  await manager.getByRole('button', { name: '更多', exact: true }).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('menuitem', { name: '导入预设', exact: true }).click();
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
  await expect(manager.getByRole('tab', { name: '全部预设（2）', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await manager.getByRole('button', { name: '应用预设', exact: true }).first().click();
  await expect(manager).toBeHidden();
  await expect(page.getByRole('button', { name: '干员预设', exact: true })).toHaveCount(2);
  await page.keyboard.press('Control+z');
  await expect(page.getByRole('button', { name: '干员预设', exact: true })).toHaveCount(1);
});
