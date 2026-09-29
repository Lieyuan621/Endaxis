import { expect, test as base, type Locator, type Page } from '@playwright/test';

export const test = base.extend<{ checkBrowserErrors: void }>({
  checkBrowserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await use();
      expect(errors, '页面不应出现未捕获异常').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function box(locator: Locator) {
  await expect(locator).toBeVisible();
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('元素没有可用位置');
  return bounds;
}

/** 每个测试使用独立浏览器存储，通过真实界面创建同一个最小场景。 */
export async function openPerlica(page: Page) {
  await page.goto('/timeline');
  await page.getByText('未设置干员', { exact: true }).nth(1).click();
  await page.getByText('佩丽卡', { exact: true }).click();
  await expect(page.locator('.skill-card').first()).toBeVisible();
}

export async function startPlacement(page: Page, source = page.locator('.skill-card').first()) {
  const bounds = await box(source);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 20, y, { steps: 8 });
  await expect(page.locator('#custom-drag-ghost')).toBeVisible();
}

export async function placeBasicGroup(page: Page) {
  await startPlacement(page);
  const lane = await box(page.locator('.track-lane').first());
  await page.mouse.move(lane.x + 250, lane.y + 25, { steps: 20 });
  await expect
    .poll(async () => (await box(page.locator('#custom-drag-ghost'))).x)
    .toBeCloseTo(lane.x + 240, 0);
  await page.mouse.up();
  await expect(page.locator('.timeline-action-block')).toHaveCount(4);
  await expect(page.locator('#custom-drag-ghost')).toHaveCount(0);
}
