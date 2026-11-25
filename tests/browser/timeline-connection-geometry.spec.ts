import { test, expect, box } from './helpers';
import { createEmptyProject } from '../../src/core/project/createProject';
import { createDefaultOperatorInstance } from '../../src/application/editor/loadoutBuildFactory';
import { perlica, ember } from '../../src/data/operators';
import { placeSkillGroup } from '../../src/ui/timeline/interaction/placeSkillGroup';
import type { Page } from '@playwright/test';

async function expectAttached(page: Page) {
  const error = await page.locator('.connector-group .connection-hit-area').evaluate(path => {
    const curve = path as SVGPathElement;
    const matrix = curve.getScreenCTM()!;
    const start = curve.getPointAtLength(0).matrixTransform(matrix);
    const end = curve.getPointAtLength(curve.getTotalLength()).matrixTransform(matrix);
    const source = document
      .querySelector('[data-timeline-action-id="geometry-source"]')!
      .getBoundingClientRect();
    const target = document
      .querySelector('[data-timeline-action-id="geometry-target"]')!
      .getBoundingClientRect();
    return Math.max(
      Math.abs(start.x - source.right),
      Math.abs(start.y - (source.top + source.height / 2)),
      Math.abs(end.x - (target.left + target.width / 2)),
      Math.abs(end.y - target.top),
    );
  });
  expect(error, '连线端点应贴合技能块实际显示边缘').toBeLessThan(1);
}

test('连线和预览贴合被截断的技能块，拖动、缩放和准备区折叠后仍对齐', async ({ page }) => {
  const project = createEmptyProject({ createdWith: 'connection-geometry-test' });
  let scenario = project.scenarios[0]!;
  scenario.editor.prepExpanded = true;
  for (const [index, operator] of [
    [0, perlica],
    [1, ember],
  ] as const)
    scenario.tracks[index] = {
      id: `geometry-track-${index}`,
      operator: createDefaultOperatorInstance(operator),
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
  for (const [id, trackIndex, operator, skillGroupKey, startFrame] of [
    ['geometry-source', 0, perlica, 'battleSkill', 0],
    ['geometry-cut', 0, perlica, 'comboSkill', 15],
    ['geometry-target', 1, ember, 'battleSkill', 60],
  ] as const)
    scenario = placeSkillGroup({
      scenario,
      trackIndex,
      operator,
      skillGroupKey,
      startFrame,
      ids: { allocate: () => id },
    }).scenario;
  scenario.connections = [
    {
      id: 'geometry-connection',
      consumption: false,
      from: { kind: 'skillCast', skillCastId: 'geometry-source', port: 'right' },
      to: { kind: 'skillCast', skillCastId: 'geometry-target', port: 'top' },
    },
  ];
  project.scenarios[0] = scenario;
  await page.goto('/timeline');
  await expect(page.locator('.track-lane')).toHaveCount(4);
  await page.evaluate(
    content =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('endaxis-timeline', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const transaction = database.transaction('projects', 'readwrite');
          transaction.objectStore('projects').put(content, 'current');
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    JSON.stringify(project),
  );
  await page.reload();
  await expect(page.locator('.connector-group')).toHaveCount(1);
  await expectAttached(page);
  await page.getByRole('button', { name: 'SCALE +', exact: true }).click();
  await expectAttached(page);
  await page.locator('.prep-expanded-collapse button').click();
  await expectAttached(page);
  await page.locator('.prep-collapsed-entry button').click();
  await page.locator('.timeline-scroll').evaluate(element => {
    element.scrollLeft = 80;
  });
  await expectAttached(page);

  const targetBlock = page.locator('[data-timeline-action-id="geometry-target"]');
  const targetBounds = await box(targetBlock);
  await page.mouse.move(targetBounds.x + targetBounds.width / 2, targetBounds.y + 25);
  await page.mouse.down();
  await page.mouse.move(targetBounds.x + targetBounds.width / 2 + 80, targetBounds.y + 25, {
    steps: 12,
  });
  expect((await box(targetBlock)).x).toBeGreaterThan(targetBounds.x + 20);
  await expectAttached(page);
  await page.mouse.up();
  await expectAttached(page);

  await page.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByText('连线编辑', { exact: true }).click();
  await page.getByRole('button', { name: '更多', exact: true }).click();
  const source = page.locator('[data-timeline-action-id="geometry-source"]');
  await source.hover();
  const port = await box(source.locator('[data-connection-port="top"]'));
  await page.mouse.move(port.x + port.width / 2, port.y + port.height / 2);
  await page.mouse.down();
  await page.mouse.move(port.x + 200, port.y + 100, { steps: 10 });
  const previewError = await page
    .locator('.timeline-connector-stroke.is-preview path')
    .evaluate(path => {
      const curve = path as SVGPathElement;
      const start = curve.getPointAtLength(0).matrixTransform(curve.getScreenCTM()!);
      const rect = document
        .querySelector('[data-timeline-action-id="geometry-source"]')!
        .getBoundingClientRect();
      return Math.max(Math.abs(start.x - rect.left - rect.width / 2), Math.abs(start.y - rect.top));
    });
  expect(previewError).toBeLessThan(1);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.locator('.timeline-connector-stroke.is-preview')).toHaveCount(0);
  await expectAttached(page);
});
