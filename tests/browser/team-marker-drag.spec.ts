import { readFile } from 'node:fs/promises';
import { test, expect, box } from './helpers';

test('team cooldown markers can be dragged from their visible badges and labels', async ({
  page,
}) => {
  await page.goto('/timeline');
  await page.getByRole('button', { name: '项目', exact: true }).click();
  await page.locator('.header-project-panel').getByRole('button', { name: '导出' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.export-dialog-shell .export-action-card').first().click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  exported.scenarios[0].battle.prepFrames = 0;
  exported.scenarios[0].battle.externalEventMarkers = [
    {
      id: 'ready',
      frame: 30,
      target: { scope: 'team' },
      event: { kind: 'comboCooldownControl', mode: 'ready' },
    },
    {
      id: 'cooldown',
      frame: 60,
      target: { scope: 'team' },
      event: { kind: 'comboCooldownControl', mode: 'cooldown' },
    },
  ];
  await page.keyboard.press('Escape');
  await page
    .locator('.track-lane')
    .first()
    .evaluate((lane, content) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([content], 'markers.json', { type: 'application/json' }));
      lane.dispatchEvent(
        new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }),
      );
      lane.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    }, JSON.stringify(exported));
  const importDialog = page.getByRole('dialog', { name: '导入项目内容' });
  await importDialog.getByRole('radio', { name: '完整覆盖' }).click();
  await importDialog.getByRole('button', { name: '确认完整覆盖' }).click();

  const markers = page.locator('.team-event-marker');
  await expect(markers).toHaveCount(2);
  for (const [index, marker] of (await markers.all()).entries()) {
    const badge = marker.locator('span');
    const before = await badge.textContent();
    const handle = marker.locator(index === 0 ? 'span' : 'b');
    const handleBox = await box(handle);
    const x = handleBox.x + handleBox.width / 2;
    const y = handleBox.y + handleBox.height / 2;
    await expect
      .poll(() => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, { x, y }))
      .toBe(index === 0 ? 'SPAN' : 'B');
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 80, y, { steps: 10 });
    await page.mouse.up();
    await expect(badge).not.toHaveText(before ?? '');
  }
});
