import { test, expect, box, openPerlica, startPlacement, placeBasicGroup } from './helpers';

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
