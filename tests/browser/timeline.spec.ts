import { test, expect, box, openPerlica, startPlacement, placeBasicGroup } from './helpers';

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
