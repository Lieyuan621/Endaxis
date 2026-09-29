import { test, expect, box, openPerlica, placeBasicGroup } from './helpers';
import type { Page } from '@playwright/test';

async function geometry(page: Page) {
  return page.locator('.graph-canvas').evaluate(canvas => {
    const node = canvas.querySelector('.graph-node')!;
    const path = canvas.querySelector<SVGPathElement>('.graph-edge path')!;
    const rect = node.getBoundingClientRect();
    const point = path.getPointAtLength(0);
    const screen = new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()!);
    return { x: rect.x, y: rect.y, width: rect.width, edgeX: screen.x, edgeY: screen.y };
  });
}

test('来源图的节点、连线和箭头同步平移缩放', async ({ page }) => {
  await openPerlica(page);
  await placeBasicGroup(page);
  await page.locator('.hit-marker').first().click();
  await page.locator('.open-origin-graph').click();
  await expect(page.locator('.graph-node').first()).toBeVisible();
  // opened 回调完成后才开始测量，避免把对话框入场动画计入位移。
  await expect(page.locator('.zoom-controls')).toContainText('80%');
  await expect
    .poll(() =>
      page
        .locator('.graph-canvas')
        .evaluate(
          el => el.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length,
        ),
    )
    .toBe(0);
  await expect(page.locator('.graph-edge').first()).toBeVisible();
  const colorsMatch = await page.locator('.graph-canvas').evaluate(canvas =>
    [...canvas.querySelectorAll('.graph-edge > path')].every(path => {
      const reference = path.getAttribute('marker-end')!;
      const id = reference.slice(reference.indexOf('#') + 1, -1);
      const arrow = document.getElementById(id)?.querySelector('path');
      return arrow && getComputedStyle(arrow).fill === getComputedStyle(path).stroke;
    }),
  );
  expect(colorsMatch).toBe(true);
  const before = await geometry(page);
  const canvas = await box(page.locator('.graph-canvas'));
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + 30);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width / 2 + 90, canvas.y + 90, { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await geometry(page)).x - before.x).toBeCloseTo(90, 0);
  const after = await geometry(page);
  expect(after.y - before.y).toBeCloseTo(60, 0);
  expect(after.edgeX - before.edgeX).toBeCloseTo(90, 0);
  expect(after.edgeY - before.edgeY).toBeCloseTo(60, 0);
  await page.mouse.wheel(0, -200);
  await expect.poll(async () => (await geometry(page)).width).toBeGreaterThan(after.width);
  const scaled = await geometry(page);
  const ratio = scaled.width / after.width;
  expect(scaled.edgeX - scaled.x).toBeCloseTo((after.edgeX - after.x) * ratio, 0);
  expect(scaled.edgeY - scaled.y).toBeCloseTo((after.edgeY - after.y) * ratio, 0);
  await page.locator('.graph-node').nth(1).click();
  await expect(page.locator('.graph-node').nth(1)).toHaveAttribute('aria-pressed', 'true');
});
