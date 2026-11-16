import { box, expect, openPerlica, startPlacement, test } from './helpers';
import type { Page } from '@playwright/test';

async function placeSkill(page: Page, cardIndex: number, offset: number) {
  await startPlacement(page, page.locator('.skill-card').nth(cardIndex));
  const lane = await box(page.locator('.track-lane').first());
  await page.mouse.move(lane.x + offset, lane.y + 25, { steps: 20 });
  await page.mouse.up();
}

async function expectConnectionMatchesSkillColors(page: Page) {
  const accents = await page
    .locator('.timeline-action-block')
    .evaluateAll(elements =>
      elements.map(element => getComputedStyle(element).getPropertyValue('--action-accent').trim()),
    );
  const stops = await page
    .locator('.connector-group linearGradient stop')
    .evaluateAll(elements => elements.map(element => element.getAttribute('stop-color')));
  expect(stops).toEqual(accents);
}

test('连线颜色跟随两端技能、自定义颜色和主题', async ({ page }) => {
  await openPerlica(page);
  await placeSkill(page, 3, 250);
  await placeSkill(page, 5, 520);
  await expect(page.locator('.timeline-action-block')).toHaveCount(2);

  await page.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByText('连线编辑', { exact: true }).click();
  const blocks = page.locator('.timeline-action-block');
  await blocks.first().hover();
  const handle = await box(
    page.locator('[data-connection-action-id][data-connection-port="right"]').first(),
  );
  const target = await box(blocks.nth(1));
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, {
    steps: 20,
  });
  await page.mouse.up();

  await expect(page.locator('.connector-group')).toHaveCount(1);
  await expectConnectionMatchesSkillColors(page);

  await blocks.first().click({ button: 'right' });
  await page.locator('.timeline-action-context-menu .color-dot[title="灼热"]').click();
  await expectConnectionMatchesSkillColors(page);

  await page.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByRole('button', { name: '浅色', exact: true }).click();
  await expectConnectionMatchesSkillColors(page);
});
