import { test, expect, box, openPerlica, startPlacement, placeBasicGroup } from './helpers';

// 合成浏览器声明覆盖选择逻辑；不把它当作真实 Android Chrome 菜单切换的验收。
const desktopUA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const androidUA =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

test.describe('touch browser declaring desktop identity', () => {
  test.use({ userAgent: desktopUA, hasTouch: true, viewport: { width: 980, height: 740 } });

  test('980px and 740px keep all desktop panels and toolbar actions reachable', async ({
    page,
  }) => {
    await page.goto('/timeline');
    const shell = page.locator('.workbench-layout');
    await expect(shell).toBeVisible();
    await expect(page.locator('.mobile-viewer-root')).toHaveCount(0);
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    for (const width of [980, 740]) {
      await page.setViewportSize({ width, height: 740 });
      expect(await shell.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      const inspector = page.locator('.activity-button--inspector');
      await inspector.scrollIntoViewIfNeeded();
      await expect(inspector).toBeInViewport({ ratio: 1 });
      await inspector.tap();
      await expect(page.locator('.right-panel')).toBeHidden();
      await inspector.tap();
      await expect(page.locator('.right-panel')).toBeVisible();
      const log = page.locator('.activity-button--battle-log');
      await log.tap();
      await expect(log).toHaveAttribute('aria-pressed', 'true');
      await inspector.tap();

      await page.getByRole('button', { name: '重命名当前方案', exact: true }).tap();
      const rename = page.locator('.ts-title-input input');
      await expect(rename).toBeVisible();
      await rename.fill(`桌面 ${width}`);
      await rename.press('Enter');
      await expect(page.locator('.ts-title-text')).toHaveText(`桌面 ${width}`);
      await page.getByRole('button', { name: '复制当前方案', exact: true }).tap();
      await expect(page.locator('.ts-tab-item')).toHaveCount(width === 980 ? 2 : 3);
      const analysis = page.locator('.command-button--analysis');
      await analysis.scrollIntoViewIfNeeded();
      await expect(analysis).toBeInViewport({ ratio: 1 });
      await analysis.tap();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(shell).toBeVisible();
    await expect(page.locator('.left-panel')).toBeVisible();
    await expect(page.locator('.right-panel')).toBeVisible();
    expect(await shell.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (let count = 3; count < 14; count++) {
      await page.getByRole('button', { name: '复制当前方案', exact: true }).tap();
      await expect(page.locator('.ts-tab-item')).toHaveCount(count + 1);
    }
    expect(
      await page
        .locator('.ts-tabs-group')
        .evaluate(element => element.scrollWidth > element.clientWidth),
    ).toBe(true);
    await expect(page.locator('.header-controls')).toBeInViewport({ ratio: 1 });
    await page.locator('.ts-tab-item').last().tap();
    await expect(page.locator('.ts-tab-item').last()).toHaveAttribute('aria-current', 'page');
  });

  test('native touch pans blank space but preserves editing gestures on blocks', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Chromium 的 CDP 用于派发原生触摸输入，不能用 DOM 事件替代',
    );
    await openPerlica(page);
    await placeBasicGroup(page);
    const client = await page.context().newCDPSession(page);
    const swipe = async (x: number, y: number, delta: number) => {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
      });
      for (let step = 1; step <= 8; step++) {
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: x + (delta * step) / 8, y }],
        });
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const viewport = page.locator('.timeline-scroll');
    const block = page.locator('.timeline-action-block').first();
    const original = await box(block);
    await swipe(original.x + 10, original.y + 25, 60);
    await expect.poll(async () => (await box(block)).x - original.x).toBeCloseTo(60, 0);
    await expect(page.locator('.timeline-action-block.is-moving')).toHaveCount(0);
    expect(await viewport.evaluate(element => element.scrollLeft)).toBe(0);
    const positions = await page
      .locator('.timeline-action-block')
      .evaluateAll(elements => elements.map(element => (element as HTMLElement).style.left));
    const bounds = await box(viewport);
    const lane = await box(page.locator('.track-lane').first());
    await swipe(bounds.x + bounds.width - 40, lane.y + lane.height - 20, -150);
    await expect.poll(() => viewport.evaluate(element => element.scrollLeft)).toBeGreaterThan(50);
    await expect(page.locator('.timeline-action-block')).toHaveCount(4);
    expect(
      await page
        .locator('.timeline-action-block')
        .evaluateAll(elements => elements.map(element => (element as HTMLElement).style.left)),
    ).toEqual(positions);
    await client.detach();
  });

  test('short viewport and saved wide panels can scroll, close, and reopen without losing state', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('endaxis:appearance:v1', 'light');
      localStorage.setItem(
        'endaxis:timeline-workbench-layout:v1',
        JSON.stringify({ leftPanelWidth: 480, rightPanelWidth: 480 }),
      );
    });
    await page.setViewportSize({ width: 740, height: 400 });
    await page.goto('/timeline');
    const shell = page.locator('.workbench-layout');
    await expect(shell).toBeVisible();
    expect(await shell.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
    const global = page.locator('.activity-button--global');
    await global.scrollIntoViewIfNeeded();
    await global.tap();
    const bottom = page.locator('.bottom-panel');
    await bottom.scrollIntoViewIfNeeded();
    await expect(bottom).toBeInViewport();
    expect((await bottom.boundingBox())!.height).toBeGreaterThanOrEqual(138);
    const library = page.locator('.activity-button--library');
    await library.scrollIntoViewIfNeeded();
    await library.tap();
    await expect(page.locator('.left-panel')).toBeHidden();
    await library.tap();
    await expect(page.locator('.left-panel')).toBeVisible();
    expect((await page.locator('.left-panel').boundingBox())!.width).toBe(480);
    const viewport = page.locator('.timeline-scroll');
    await viewport.evaluate(element => {
      element.scrollLeft = 180;
    });
    await expect
      .poll(() =>
        page.locator('.timeline-horizontal-scrollbar').evaluate(element => element.scrollLeft),
      )
      .toBe(180);
  });
});

test.describe('mobile browser lifecycle', () => {
  test.use({ userAgent: androidUA, hasTouch: true, viewport: { width: 980, height: 740 } });

  test('resize and orientation preserve the mobile policy and restore the desktop shell', async ({
    page,
  }) => {
    await page.goto('/timeline');
    await expect(page.locator('.mobile-viewer-root')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('.workbench-layout')).toBeVisible();
    await expect(page.locator('.mobile-viewer-root')).toHaveCount(0);
    const expectTracksFillViewport = async () => {
      await expect
        .poll(() =>
          page.locator('.timeline-scroll').evaluate(element => {
            const rows = Array.from(element.querySelectorAll('.track-row'));
            const total = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0);
            return Math.abs(total - (element.clientHeight - 60));
          }),
        )
        .toBeLessThanOrEqual(4);
    };
    await expectTracksFillViewport();
    await openPerlica(page);
    await startPlacement(page);
    await page.setViewportSize({ width: 740, height: 980 });
    await page.evaluate(() => dispatchEvent(new Event('orientationchange')));
    await expect(page.locator('.mobile-viewer-root')).toBeVisible();
    await expect(page.locator('.workbench-layout')).toHaveCount(0);
    await expect(page.locator('#custom-drag-ghost')).toHaveCount(0);
    await page.mouse.up();
    await expect(page.locator('.mobile-action-block')).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.workbench-layout')).toBeVisible();
    await expectTracksFillViewport();
    await page.setViewportSize({ width: 1500, height: 1100 });
    await expectTracksFillViewport();
    await page.setViewportSize({ width: 740, height: 980 });
    await page.reload();
    await expect(page.locator('.mobile-viewer-root')).toBeVisible();
  });
});

test.describe('native wrapper', () => {
  test.use({ userAgent: `${desktopUA} EndaxisApp/1.0`, viewport: { width: 1920, height: 1080 } });
  test('native identity keeps the mobile workbench even in a wide viewport', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page.locator('.mobile-viewer-root')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/native-app/);
    await expect(page.locator('.workbench-layout')).toHaveCount(0);
  });
});
