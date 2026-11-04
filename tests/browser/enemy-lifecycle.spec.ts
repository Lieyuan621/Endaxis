import { test, expect, box } from './helpers';
import type { Page, Locator } from '@playwright/test';

async function addEnemy(page: Page) {
  await page.locator('.enemy-overview header').click({ button: 'right' });
  await page
    .locator('.enemy-overview-menu')
    .getByRole('button', { name: '添加敌人', exact: true })
    .click();
}

async function addTimedMarker(
  page: Page,
  lane: Locator,
  action: string,
  markerName: string,
  seconds: number,
) {
  const bounds = await box(lane);
  await page.mouse.click(bounds.x + bounds.width - 8, bounds.y + Math.min(8, bounds.height / 2), {
    button: 'right',
  });
  const menu = page.locator('.enemy-life-menu');
  await menu.getByRole('button', { name: action, exact: true }).click();
  const marker = lane.getByRole('button', { name: markerName, exact: true });
  await marker.click({ button: 'right' });
  await menu.locator('input').first().fill(String(seconds));
  await menu.locator('input').first().press('Tab');
  await page.keyboard.press('Escape');
}

test('敌人总览的可见入口能添加敌人、打开操作和详情', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');

  const overview = page.locator('.enemy-overview');
  await overview.locator('header').getByRole('button', { name: '添加敌人' }).click();
  await expect(overview.locator('.enemy-overview__row')).toHaveCount(2);
  await expect(page.locator('.enemy-settings-panel .enemy-name-line')).toContainText('2.');

  await overview
    .locator('.enemy-overview__row')
    .first()
    .getByRole('button', { name: /更多操作/ })
    .click();
  const menu = page.locator('.enemy-overview-menu');
  await expect(menu.locator('.menu-header')).toContainText('1.');
  await expect(menu.getByRole('button', { name: '添加敌人' })).toHaveCount(0);
  await menu.getByRole('button', { name: '查看敌人详情' }).click();
  const returnButton = page.getByRole('button', { name: '返回敌人总览' });
  await expect(returnButton).toBeVisible();
  const hudBounds = await box(page.locator('.enemy-hud-snapshot'));
  expect((await box(returnButton)).x).toBeLessThan(hudBounds.x + hudBounds.width);
  await expect(page.locator('.enemy-settings-panel .enemy-name-line')).toContainText('1.');

  await returnButton.click();
  await expect(overview.locator('.enemy-overview__row-action')).toHaveCount(2);
  await overview.locator('.enemy-overview__row.is-selected .enemy-overview__avatar').dblclick();
  await expect(page.getByRole('button', { name: '返回敌人总览' })).toBeVisible();
});

test('多敌人右键菜单与主时间轴使用同一套外观', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');

  await page.locator('.enemy-overview header').click({ button: 'right' });
  const overview = page.locator('.enemy-overview-menu');
  await expect(overview).toHaveClass(/timeline-context-menu/);
  await expect(overview.getByRole('button', { name: '添加敌人', exact: true })).toHaveClass(
    /menu-item/,
  );
  const surfaceStyle = await overview.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      borderRadius: style.borderRadius,
      font: style.font,
    };
  });

  const lane = page.locator('.enemy-life-track').first();
  const bounds = await box(lane);
  await page.mouse.click(bounds.x + bounds.width - 8, bounds.y + Math.min(8, bounds.height / 2), {
    button: 'right',
  });
  const lifecycle = page.locator('.enemy-life-menu');
  await expect(lifecycle).toHaveClass(/timeline-context-menu/);
  await expect(
    lifecycle.getByRole('button', { name: '切出' }).locator('svg.enemy-lifecycle-menu-icon'),
  ).toHaveCount(1);
  await expect(
    lifecycle
      .getByRole('button', { name: '设为主攻击目标' })
      .locator('svg.enemy-lifecycle-menu-icon'),
  ).toHaveCount(1);
  expect(
    await lifecycle.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        borderRadius: style.borderRadius,
        font: style.font,
      };
    }),
  ).toEqual(surfaceStyle);
});

test('敌人生命周期拖动可取消，正常提交只需一次撤销', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  const marker = page.locator('.life-avatar').first();
  await expect(marker).toBeVisible();
  const original = await marker.getAttribute('title');
  const begin = async () => {
    const rect = await box(marker);
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2 + 150, rect.y + rect.height / 2, { steps: 6 });
    await expect(marker.locator('.drag-time')).toBeVisible();
  };
  await begin();
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(marker.locator('.drag-time')).toHaveCount(0);
  await expect(marker).toHaveAttribute('title', original!);
  await begin();
  // 显式派发浏览器失焦事件，验证组件和共享会话的失焦处理。
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.mouse.up();
  await expect(marker.locator('.drag-time')).toHaveCount(0);
  await expect(marker).toHaveAttribute('title', original!);
  await begin();
  // 在指针仍按下时卸载监控区，不以 mouseup 提前提交来替代卸载验收。
  await page.getByRole('button', { name: '全局配置', exact: true }).dispatchEvent('click');
  await expect(marker).toHaveCount(0);
  await page.mouse.up();
  await page.getByRole('button', { name: '资源监控', exact: true }).click();
  await expect(marker).toHaveAttribute('title', original!);
  await begin();
  await page.mouse.up();
  await expect(marker).not.toHaveAttribute('title', original!);
  await page.keyboard.press('Control+z');
  await expect(marker).toHaveAttribute('title', original!);
});

test('准备区折叠时敌人标记不能拖入隐藏帧，展开后可以', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  const avatar = page.locator('.life-avatar').first();
  const dragBy = async (deltaX: number) => {
    const rect = await box(avatar);
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + deltaX, y, { steps: 6 });
    await page.mouse.up();
  };
  await dragBy(180);
  await dragBy(-300);
  await expect(avatar).toHaveAttribute('title', /0\.00s$/);

  await page.locator('.prep-collapsed-entry button').click();
  await dragBy(-100);
  await expect(avatar).toHaveAttribute('title', /-\d+\.\d{2}s$/);
});

test('新增敌人独立编辑生命周期，删除后可撤销恢复', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  const avatars = page.locator('.life-avatar');
  await expect(avatars).toHaveCount(1);
  await addEnemy(page);
  await expect(avatars).toHaveCount(2);
  await expect(avatars.nth(1)).toHaveClass(/selected/);
  const firstTitle = await avatars.first().getAttribute('title');
  const second = page.locator('.enemy-life-track').nth(1);
  const menu = page.locator('.enemy-life-menu');
  await addTimedMarker(page, second, '切出', '切出', 10);
  await expect(second.getByRole('button', { name: '切出', exact: true })).toHaveCount(1);
  await expect(
    page.locator('.enemy-life-track').first().getByRole('button', { name: '切出', exact: true }),
  ).toHaveCount(0);
  await expect(avatars.first()).toHaveAttribute('title', firstTitle!);
  await addTimedMarker(page, second, '切入', '切入', 20);
  await expect(second.getByRole('button', { name: '切入', exact: true })).toHaveAttribute(
    'title',
    /20.00s$/,
  );
  await addTimedMarker(page, second, '手动死亡', '死亡', 30);
  await expect(second.getByRole('button', { name: '死亡', exact: true })).toHaveAttribute(
    'title',
    /30.00s$/,
  );
  await avatars.nth(1).click({ button: 'right' });
  await menu.getByRole('button', { name: '删除', exact: true }).click();
  await expect(avatars).toHaveCount(1);
  await expect(avatars.first()).toHaveClass(/selected/);
  await page.keyboard.press('Control+z');
  await expect(avatars).toHaveCount(2);
  await expect(second.getByRole('button', { name: '切出', exact: true })).toHaveCount(1);
  await expect(second.getByRole('button', { name: '死亡', exact: true })).toHaveAttribute(
    'title',
    /30.00s$/,
  );
});

test('自动死亡模式仍显示手动死亡标记并允许编辑', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.enemy-health-mini')).toHaveCount(1);
  const avatar = page.locator('.life-avatar').first();
  const lane = page.locator('.enemy-life-track').first();
  const menu = page.locator('.enemy-life-menu');
  await addTimedMarker(page, lane, '手动死亡', '死亡', 15);
  await expect(lane.locator('.enemy-overview__death-terminal')).toHaveCount(0);
  await expect(lane.getByRole('button', { name: '死亡', exact: true })).toHaveAttribute(
    'title',
    /15.00s$/,
  );
  await expect(
    lane.getByRole('button', { name: '死亡', exact: true }).locator('svg.ea-close-icon'),
  ).toHaveCount(1);
  const toggle = async (enabled: boolean) => {
    await page.getByRole('button', { name: '方案设置', exact: true }).click();
    const setting = page.getByRole('button', { name: '敌人自动死亡', exact: true });
    await setting.click();
    await expect(setting).toHaveAttribute('aria-pressed', String(enabled));
    await page.keyboard.press('Escape');
  };
  await toggle(true);
  await expect(lane.getByRole('button', { name: '死亡', exact: true })).toHaveAttribute(
    'title',
    /15.00s$/,
  );
  await avatar.click({ button: 'right' });
  await expect(menu.getByRole('button', { name: '手动死亡', exact: true })).toBeVisible();
  await expect(
    menu.getByRole('button', { name: '手动死亡', exact: true }).locator('svg.ea-close-icon'),
  ).toHaveCount(1);
  await page.keyboard.press('Escape');
  await toggle(false);
  await expect(lane.getByRole('button', { name: '死亡', exact: true })).toHaveAttribute(
    'title',
    /15.00s$/,
  );
});

test('头像选择同步敌人属性，修改第二敌人不会覆盖首敌', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  const avatars = page.locator('.life-avatar');
  const hp = page.locator('.stats-summary .summary-value').first();
  await expect(hp).toBeVisible();
  const original = await hp.innerText();
  await addEnemy(page);
  await page.getByRole('button', { name: '自定义属性', exact: true }).click();
  const dialog = page.getByRole('dialog').filter({ has: page.locator('input') });
  await dialog.locator('input').first().fill('123456');
  await dialog.locator('input').first().press('Tab');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await expect(hp).toHaveText('123,456');
  await avatars.first().click();
  await expect(hp).toHaveText(original);
  await expect(page.locator('.enemy-overview')).toBeVisible();
  await avatars.nth(1).click();
  await expect(hp).toHaveText('123,456');
});

test('多敌人显式启用、详情返回、折叠以及关闭限制', async ({ page }) => {
  await page.goto('/timeline');
  const sections = page.locator('.enemy-status-section');
  await expect(sections).toHaveCount(3);
  await expect(page.locator('.enemy-overview')).toHaveCount(0);
  const settings = async () => page.getByRole('button', { name: '方案设置', exact: true }).click();
  await settings();
  const toggle = page.getByRole('button', { name: '多敌人模式', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(sections).toHaveCount(2);
  await expect(page.locator('.enemy-overview')).toBeVisible();
  await sections.first().locator('.section-toggle').click();
  await expect(sections.first()).toHaveClass(/is-collapsed/);
  await sections.first().locator('.section-toggle').click();
  await page.locator('.life-avatar').first().click();
  await expect(sections).toHaveCount(2);
  await page.locator('.life-avatar').first().dblclick();
  await expect(sections).toHaveCount(3);
  await expect(page.locator('.enemy-overview')).toHaveCount(0);
  await page.getByRole('button', { name: '返回敌人总览', exact: false }).click();
  await expect(sections).toHaveCount(2);
  await settings();
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(sections).toHaveCount(3);
  await expect(page.getByRole('button', { name: '返回敌人总览', exact: false })).toHaveCount(0);
  await settings();
  await toggle.click();
  await page.keyboard.press('Escape');
  await addEnemy(page);
  await settings();
  await expect(toggle).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.life-avatar')).toHaveCount(2);
  await settings();
  await expect(toggle).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(toggle).not.toBeVisible();
  await page.locator('.life-avatar').last().click();
  await expect(page.locator('.life-avatar').last()).toHaveClass(/selected/);
  await page.locator('.life-avatar').last().dblclick();
  const returnButton = page.getByRole('button', { name: '返回敌人总览', exact: false });
  expect((await box(returnButton)).height).toBeLessThanOrEqual(28);
});

test('单个敌人的非默认生命周期也阻止关闭，恢复后可以关闭', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  const toggle = page.getByRole('button', { name: '多敌人模式', exact: true });
  await toggle.click();
  await page.keyboard.press('Escape');
  await page.locator('.life-avatar').first().click({ button: 'right' });
  const menu = page.locator('.enemy-life-menu');
  await menu.getByRole('button', { name: '切出', exact: true }).click();
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await expect(toggle).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.enemy-status-section')).toHaveCount(3);
  await expect(page.locator('.enemy-overview')).toHaveCount(0);
});

test('关卡批量应用确认、取消与撤销', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByText('自定义敌人', { exact: true }).first().click();
  await page.getByRole('button', { name: '关卡变种', exact: true }).click();
  const groups = page.locator('.stage-list button');
  for (let index = 0; index < (await groups.count()); index++) {
    await groups.nth(index).click();
    if (
      await page
        .locator('.stage-difficulty button:enabled')
        .filter({ hasText: '应用全部敌人' })
        .count()
    )
      break;
  }
  const section = page
    .locator('.stage-difficulty')
    .filter({
      has: page
        .getByRole('button', { name: '应用全部敌人', exact: true })
        .and(page.locator(':enabled')),
    })
    .first();
  const counts = await section.locator('.stage-enemy-count').allTextContents();
  const count = counts.reduce((sum, label) => sum + Number(label.replace('×', '')), 0);
  expect(count).toBeGreaterThan(1);
  await section.getByRole('button', { name: '应用全部敌人', exact: true }).click();
  const confirm = page.locator('.el-message-box');
  await expect(confirm).toContainText('开启多敌人模式');
  await confirm.getByRole('button', { name: '取消', exact: true }).click();
  await expect(page.locator('.enemy-overview')).toHaveCount(0);
  await expect(section).toBeVisible();
  await section.getByRole('button', { name: '应用全部敌人', exact: true }).click();
  await confirm.getByRole('button', { name: '开启并应用', exact: true }).click();
  await expect(page.locator('.life-avatar')).toHaveCount(count);
  await expect(page.locator('.enemy-status-section')).toHaveCount(2);
  await page.keyboard.press('Control+z');
  await expect(page.locator('.enemy-overview')).toHaveCount(0);
  await expect(page.locator('.enemy-status-section')).toHaveCount(3);
  await page.keyboard.press('Control+Shift+z');
  await expect(page.locator('.life-avatar')).toHaveCount(count);
});

test('敌人条提示与高亮，拖动排序、删除首轨和主目标标记', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  await addEnemy(page);
  const rows = page.locator('.enemy-overview__row');
  const menu = page.locator('.enemy-life-menu');
  await rows.nth(1).locator('.life-avatar').click({ button: 'right' });
  const nameInput = menu.locator('input').last();
  await nameInput.fill('第二目标');
  await nameInput.press('Tab');
  await page.keyboard.press('Escape');
  const strip = rows.nth(1).locator('.enemy-overview__segment').first();
  await expect(strip).toHaveAttribute('aria-label', /第二目标/);
  await expect(strip).not.toHaveAttribute('aria-label', /主攻击目标/);
  await expect(rows.first().locator('.enemy-overview__segment').first()).toHaveAttribute(
    'aria-label',
    /主攻击目标/,
  );
  await strip.hover();
  await expect.poll(() => strip.evaluate(el => getComputedStyle(el).filter)).not.toBe('none');
  const avatar = rows.nth(1).locator('.life-avatar');
  const avatarBackground = await avatar.evaluate(el => getComputedStyle(el).backgroundColor);
  await avatar.hover();
  await expect
    .poll(() => avatar.evaluate(el => getComputedStyle(el).backgroundColor))
    .toBe(avatarBackground);
  await expect.poll(() => avatar.evaluate(el => getComputedStyle(el).filter)).not.toBe('none');
  await page
    .locator('.enemy-overview__avatar')
    .nth(1)
    .dragTo(page.locator('.enemy-overview__avatar').first(), { targetPosition: { x: 2, y: 10 } });
  await expect(rows.first().locator('.life-avatar')).toHaveAttribute('aria-label', '第二目标');
  await addTimedMarker(
    page,
    rows.first().locator('.enemy-life-track'),
    '设为主攻击目标',
    '主攻击目标',
    2,
  );
  await expect(
    rows.first().getByRole('button', { name: '主攻击目标', exact: true }),
  ).toHaveAttribute('title', /2.00s/);
  // 删除非选中轨道后，所选实例及其目标标记保留。
  await rows.nth(1).locator('.life-avatar').click({ button: 'right' });
  await menu.getByRole('button', { name: '删除', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('.life-avatar')).toHaveAttribute('aria-label', '第二目标');
  await expect(rows.first().getByRole('button', { name: '主攻击目标', exact: true })).toBeVisible();
  await page.keyboard.press('Control+z');
  await expect(rows).toHaveCount(2);
  await rows.first().locator('.life-avatar').click({ button: 'right' });
  await menu.getByRole('button', { name: '删除', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await page.reload();
  await expect(rows).toHaveCount(1);
});

test('删除初始敌人后重新加载，可以直接编辑剩余敌人并切回单敌人', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  await addEnemy(page);
  const rows = page.locator('.enemy-overview__row');
  await rows.first().locator('.life-avatar').click({ button: 'right' });
  await page.locator('.enemy-life-menu').getByRole('button', { name: '删除', exact: true }).click();
  await expect(rows).toHaveCount(1);
  await page.reload();
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: '自定义属性', exact: true }).click();
  const dialog = page.getByRole('dialog').filter({ has: page.locator('input') });
  await dialog.locator('input').first().fill('123456');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.locator('.stats-summary .summary-value').first()).toHaveText('123,456');
  await page.getByRole('button', { name: '方案设置', exact: true }).click();
  await page.getByRole('button', { name: '多敌人模式', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.enemy-overview')).not.toBeVisible();
  await page.reload();
  await expect(page.locator('.enemy-overview')).not.toBeVisible();
  await expect(page.locator('.stats-summary .summary-value').first()).toHaveText('123,456');
});
