import { test, expect, box, openPerlica, startPlacement, placeBasicGroup } from './helpers';

test('方案各自保留会话内滚动和缩放，新方案使用默认视图', async ({ page }) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: 'SCALE +', exact: true }).click();
  const zoom = await page.locator('.zoom-value').innerText();
  const viewport = page.locator('.timeline-scroll');
  await viewport.evaluate(el => {
    el.scrollLeft = 600;
  });
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(600);
  await page.locator('.ts-add-btn').click();
  await expect(page.locator('.zoom-value')).toHaveText('100%');
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(0);
  await page.locator('.ts-tab-item').first().click();
  await expect(page.locator('.zoom-value')).toHaveText(zoom);
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(600);
  await page.locator('.ts-tab-item').last().click();
  await expect(page.locator('.zoom-value')).toHaveText('100%');
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(0);
  await page.reload();
  await page.locator('.ts-tab-item').first().click();
  await expect(page.locator('.zoom-value')).toHaveText('100%');
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(0);
});

test('技能、闪避和切人共用选区，整体移动、右键删除和撤销', async ({ page }) => {
  await openPerlica(page);
  await placeBasicGroup(page);
  const lane = await box(page.locator('.track-lane').first());
  await page.mouse.click(lane.x + 430, lane.y + lane.height - 8, { button: 'right' });
  await page.getByRole('menuitem', { name: '在此处闪避', exact: true }).click();
  await page.mouse.click(lane.x + 510, lane.y + lane.height - 8, { button: 'right' });
  await page.getByRole('menuitem', { name: '在此处切入' }).hover();
  await page.locator('.submenu-list').getByRole('menuitem', { name: '佩丽卡' }).click();

  const skill = page.locator('.timeline-action-block').first();
  const dodge = page.locator('.dodge-marker').first();
  const control = page.locator('.track-switch-marker:not(.track-switch-marker--automatic)').first();
  await skill.click();
  await dodge.click({ modifiers: ['ControlOrMeta'] });
  await control.click({ modifiers: ['ControlOrMeta'] });
  await expect(skill).toHaveAttribute('data-selected', 'true');
  await expect(dodge).toHaveClass(/selected/);
  await expect(control).toHaveClass(/selected/);
  const before = await Promise.all([box(skill), box(dodge), box(control)]);
  await page.mouse.move(before[1]!.x + before[1]!.width / 2, before[1]!.y + 10);
  await page.mouse.down();
  await page.mouse.move(before[1]!.x + before[1]!.width / 2 + 60, before[1]!.y + 10, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.timeline-action-block.is-moving')).toHaveCount(0);
  for (const [i, locator] of [skill, dodge, control].entries()) {
    await expect.poll(async () => (await box(locator)).x - before[i]!.x).toBeCloseTo(60, 0);
  }
  await dodge.click({ button: 'right' });
  await expect(skill).toHaveAttribute('data-selected', 'true');
  await expect(page.getByRole('menuitem', { name: /复制/ })).toBeEnabled();
  await page.getByRole('menuitem', { name: /复制/ }).click();
  await page.mouse.move(lane.x + 680, lane.y + lane.height - 8);
  await page.keyboard.press('ControlOrMeta+v');
  await expect(page.locator('.timeline-action-block')).toHaveCount(5);
  await expect(page.locator('.dodge-marker')).toHaveCount(2);
  await expect(
    page.locator('.track-switch-marker:not(.track-switch-marker--automatic)'),
  ).toHaveCount(2);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.timeline-action-block')).toHaveCount(4);
  await skill.click();
  await dodge.click({ modifiers: ['ControlOrMeta'] });
  await control.click({ modifiers: ['ControlOrMeta'] });
  await dodge.click({ button: 'right' });
  await page.getByRole('menuitem', { name: /删除/ }).click();
  await expect(dodge).toHaveCount(0);
  await expect(control).toHaveCount(0);
  await expect(page.locator('.timeline-action-block')).toHaveCount(3);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(dodge).toHaveCount(1);
  await expect(control).toHaveCount(1);
  await expect(page.locator('.timeline-action-block')).toHaveCount(4);
  // 框选也必须收集标记；模拟产生的自动主控投影不能混进编辑集合。
  await page.keyboard.down('ControlOrMeta');
  await page.mouse.move(lane.x + 200, lane.y + 3);
  await page.mouse.down();
  await page.mouse.move(lane.x + 620, lane.y + lane.height - 4, { steps: 10 });
  await page.mouse.up();
  await page.keyboard.up('ControlOrMeta');
  await expect(skill).toHaveAttribute('data-selected', 'true');
  await expect(dodge).toHaveClass(/selected/);
  await expect(control).toHaveClass(/selected/);
  await expect(page.locator('.track-switch-marker--automatic[data-timeline-item-key]')).toHaveCount(
    0,
  );
});

test('拖入连续组后确认插入，并能撤销加入操作', async ({ page }) => {
  await openPerlica(page);
  await placeBasicGroup(page);
  const first = await box(page.locator('.timeline-action-block').nth(0));
  const second = await box(page.locator('.timeline-action-block').nth(1));
  await startPlacement(page, page.locator('.skill-card').nth(1));
  await page.mouse.move((first.x + second.x) / 2 + 10, first.y + 25, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('.timeline-action-context-menu')).toHaveCount(0);
  await page.getByRole('button', { name: '加入连续组', exact: true }).click();
  await expect(page.locator('.timeline-action-block')).toHaveCount(5);
  await expect(page.locator('.group-select-hitbox')).toHaveAttribute('aria-label', '连续 · 5');
  await page.mouse.click(100, 500);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('.timeline-action-block')).toHaveCount(5);
  await expect(page.locator('.group-select-hitbox')).toHaveAttribute('aria-label', '连续 · 4');
});

test('轴上独立技能移入连续组时提供加入选项', async ({ page }) => {
  await openPerlica(page);
  await placeBasicGroup(page);
  const lane = await box(page.locator('.track-lane').first());
  await startPlacement(page, page.locator('.skill-card').nth(1));
  await page.mouse.move(lane.x + 550, lane.y + 25, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('.timeline-action-block')).toHaveCount(5);
  const first = await box(page.locator('.timeline-action-block').nth(0));
  const second = await box(page.locator('.timeline-action-block').nth(1));
  const battle = await box(page.locator('.timeline-action-block').nth(4));
  await page.mouse.move(battle.x + 10, battle.y + 25);
  await page.mouse.down();
  await page.mouse.move((first.x + second.x) / 2 + 10, first.y + 25, { steps: 25 });
  await page.mouse.up();
  await expect(page.locator('.timeline-action-context-menu')).toHaveCount(0);
  await page.getByRole('button', { name: '加入连续组', exact: true }).click();
  await expect(page.locator('.group-select-hitbox')).toHaveAttribute('aria-label', '连续 · 5');
});

test('技能库整组和单段放置、取消及横向滚动', async ({ page }) => {
  await openPerlica(page);
  await placeBasicGroup(page);

  await startPlacement(page);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('#custom-drag-ghost')).toHaveCount(0);

  await startPlacement(page);
  await page.mouse.up();
  await page.mouse.click(100, 200, { button: 'right' });
  await expect(page.locator('#custom-drag-ghost')).toHaveCount(0);
  await expect(page.locator('.timeline-action-block')).toHaveCount(4);

  await startPlacement(page, page.locator('.attack-segment-chip[draggable="true"]').first());
  const lane = await box(page.locator('.track-lane').first());
  await page.mouse.move(lane.x + 400, lane.y + 25, { steps: 20 });
  await page.mouse.up();
  await expect(page.locator('.timeline-action-block')).toHaveCount(5);
  await expect(page.locator('#custom-drag-ghost')).toHaveCount(0);

  const scrollbar = await box(page.locator('.timeline-horizontal-scrollbar'));
  await page.mouse.move(scrollbar.x + 20, scrollbar.y + 7);
  await page.mouse.down();
  await page.mouse.move(scrollbar.x + 180, scrollbar.y + 7, { steps: 15 });
  await page.mouse.up();
  await expect
    .poll(() => page.locator('.timeline-scroll').evaluate(el => el.scrollLeft))
    .toBeGreaterThan(0);
});

for (const menuName of ['更多', '显示']) {
  test(`${menuName}打开时可以直接拖动技能，松手和取消都不会黏手`, async ({ page }) => {
    await openPerlica(page);
    await placeBasicGroup(page);
    const block = page.locator('.timeline-action-block').first();
    const before = await box(block);
    const menu = page.getByRole('button', { name: menuName, exact: true });
    await menu.click();
    await expect(
      page.locator(menuName === '更多' ? '.header-more-panel' : '.timeline-display-menu'),
    ).toBeVisible();
    await page.mouse.move(before.x + 10, before.y + 25);
    await page.mouse.down();
    await page.mouse.move(before.x + 110, before.y + 25, { steps: 10 });
    await expect(page.locator('.timeline-action-block.is-moving').first()).toBeVisible();
    await page.mouse.up();
    await expect(page.locator('.timeline-action-block.is-moving')).toHaveCount(0);
    await expect.poll(async () => (await box(block)).x).toBeGreaterThan(before.x + 50);
    const dropped = await box(block);
    await page.mouse.move(dropped.x + 180, dropped.y + 25);
    await expect.poll(async () => (await box(block)).x).toBeCloseTo(dropped.x, 0);
    await menu.click();
    await expect(
      page.locator(menuName === '更多' ? '.header-more-panel' : '.timeline-display-menu'),
    ).toBeVisible();
    await page.mouse.move(dropped.x + 10, dropped.y + 25);
    await page.mouse.down();
    await page.mouse.move(dropped.x + 70, dropped.y + 25, { steps: 10 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(page.locator('.timeline-action-block.is-moving')).toHaveCount(0);
    await expect.poll(async () => (await box(block)).x).toBeCloseTo(dropped.x, 0);
  });
}
