import { test, expect, placeBasicGroup } from './helpers';
import type { CountdownTriggerStatus } from '../../src/ui/overlay/desktopApi';

test('从当前模拟导出，播放中再次导出不重载，暂停后接收新轴与语言', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('endaxis_overlay_prefs_v1', JSON.stringify({ startDelaySeconds: 0 })),
  );
  await page.goto('/timeline');
  await page.locator('.track-header .avatar-trigger').first().click();
  await page.getByText('佩丽卡', { exact: true }).click();
  await expect(page.locator('.skill-card').first()).toBeVisible();
  await placeBasicGroup(page);
  const opened = page.waitForEvent('popup');
  await page.locator('.command-button--overlay').click();
  const hud = await opened;
  const errors: string[] = [];
  hud.on('pageerror', error => errors.push(error.message));
  await expect(hud.locator('.ov-hud')).toBeVisible();
  await expect(hud.locator('.ov-gauge')).toHaveCount(1);
  await hud.keyboard.press('Space');
  await expect(hud.locator('.ov-playback')).toHaveText('播放中');
  let navigations = 0;
  hud.on('framenavigated', frame => {
    if (frame === hud.mainFrame()) navigations++;
  });
  await page.locator('.command-button--overlay').click();
  await expect(hud.getByText('新轴已导出，暂停后载入', { exact: true })).toBeVisible();
  expect(navigations).toBe(0);
  await expect(hud.locator('.ov-playback')).toHaveText('播放中');
  await hud.keyboard.press('Space');
  await expect(hud.locator('.ov-playback')).toHaveText('就绪');
  // 控件在自己的窗口有焦点；cap 同样是可交互按钮。
  await hud.locator('.ov-cap').click();
  await expect(hud.locator('.ov-playback')).toHaveText('播放中');
  await hud.keyboard.press('Space');
  await hud.keyboard.press('Shift+ArrowRight');
  await expect(hud.getByText('提示已提前 0.25 秒', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '更多', exact: true }).click();
  await page.locator('.header-more-locale__btn').filter({ hasText: 'EN' }).click();
  await expect(page.locator('.command-button--overlay')).toHaveText('Overlay');
  await page.keyboard.press('Escape');
  await page.locator('.command-button--overlay').click();
  await expect(hud.locator('.ov-playback')).toHaveText('Ready');
  expect(navigations).toBe(0);
  expect(errors).toEqual([]);
});

test('空快照有导出指引，示例可播放并可返回真实导出', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('endaxis_overlay_prefs_v1', JSON.stringify({ startDelaySeconds: 0 })),
  );
  await page.goto('/overlay');
  await expect(
    page.getByText('请在同一浏览器的编辑器中点击「游戏内提示」导出当前轴'),
  ).toBeVisible();
  await page.getByRole('button', { name: '预览示例', exact: true }).click();
  await expect(page.locator('.overlay-source-label')).toHaveText('示例轴 · 仅用于预览');
  await expect(page.locator('.ov-next__item').first()).toBeVisible();
  await page.locator('.ov-cap').click();
  await expect(page.locator('.ov-playback')).toHaveText('播放中');
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyS');
  await page.getByRole('button', { name: '读取已导出的轴' }).click();
  await expect(page.locator('.overlay-message--empty')).toBeVisible();
});

test('桌面最大缩放不裁切，播放按钮、设置面板及其滑块可交互', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 400 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'endaxis_overlay_prefs_v1',
      JSON.stringify({ scale: 1.8, width: 1920, startDelaySeconds: 0 }),
    );
    window.endaxisDesktop = {
      isDesktop: true,
      info: async () => ({
        clickThrough: false,
        clickThroughAvailable: true,
        playbackShortcutsAvailable: true,
        countdownTriggerAvailable: true,
        url: location.href,
        alwaysOnTop: true,
      }),
      resize: async size => {
        localStorage.setItem('overlay-test-size', JSON.stringify(size));
      },
      toggleClickThrough: async () => false,
      openEditor: async () => {},
      quit: async () => {},
      onClickThrough: () => () => {},
      onPlaybackCommand: () => () => {},
    };
  });
  await page.goto('/overlay?demo=1');
  await expect(page.locator('.ov-hud')).toBeVisible();
  await expect(page.locator('#__vue-devtools-container__')).toBeHidden();
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const size = JSON.parse(localStorage.getItem('overlay-test-size') ?? '{}');
        const bounds = document.querySelector('.overlay-hud-anchor')!.getBoundingClientRect();
        return size.height >= bounds.bottom + 15;
      }),
    )
    .toBe(true);
  const bounds = await page.locator('.ov-hud').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1000);
  expect(
    await page
      .locator('.ov-cap')
      .evaluate(el => getComputedStyle(el).getPropertyValue('-webkit-app-region')),
  ).toBe('no-drag');
  await page.locator('.ov-cap').click();
  await expect(page.locator('.ov-playback')).toHaveText('播放中');
  await page.getByTitle('设置', { exact: true }).click();
  const settings = page.locator('.overlay-settings');
  await expect(settings).toBeVisible();
  // DOM 层级无法排除 Electron 底层 HUD 的原生拖拽命中，浮层须整体 no-drag。
  for (const panel of [settings, page.locator('.overlay-controls')]) {
    expect(
      await panel.evaluate(el => getComputedStyle(el).getPropertyValue('-webkit-app-region')),
    ).toBe('no-drag');
  }
  const portrait = settings.getByRole('button', { name: '干员头像', exact: true });
  await portrait.click();
  await expect(portrait).toHaveClass('is-active');
  const sliders = settings.locator('input[type="range"]');
  const expectedValues = ['12', '1.25', '1320', '0.6', '5'];
  for (const [index, expectedValue] of expectedValues.entries()) {
    const slider = sliders.nth(index);
    const bounds = (await slider.boundingBox())!;
    const position = await slider.evaluate(el => {
      const input = el as HTMLInputElement;
      return (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min));
    });
    const y = bounds.y + bounds.height / 2;
    await page.mouse.move(bounds.x + 8 + (bounds.width - 16) * position, y);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2, y, { steps: 5 });
    await page.mouse.up();
    await expect(slider).toHaveValue(expectedValue);
  }
  const preferences = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('endaxis_overlay_prefs_v1')!),
  );
  expect(preferences).toMatchObject({
    iconMode: 'portrait',
    secondsAhead: 12,
    scale: 1.25,
    width: 1320,
    hudOpacity: 0.6,
    startDelaySeconds: 5,
  });
});

test('默认等待显示在左侧，暂停保留剩余时间，归零后推进原轴，重播保持暂停', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.goto('/overlay?demo=1');
  await expect(page.locator('.ov-hud')).toBeVisible();
  await page.clock.pauseAt(new Date('2026-10-18T01:00:00Z'));
  const clock = page.locator('.ov-clock');
  const originalTime = await clock.textContent();
  const cap = page.locator('.ov-cap');
  await expect(cap.locator('.ov-cap__type')).toHaveText('等待开始');
  await expect(cap.locator('.ov-cap__value')).toHaveText('2.0');
  await cap.click();
  await expect(page.locator('.ov-playback')).toHaveText('等待中');
  await page.clock.runFor(500);
  await expect(cap.locator('.ov-cap__value')).toHaveText('1.5');
  await expect(clock).toHaveText(originalTime!);
  await page.keyboard.press('Space');
  await expect(page.locator('.ov-playback')).toHaveText('等待已暂停');
  await page.clock.runFor(3000);
  await expect(cap.locator('.ov-cap__value')).toHaveText('1.5');
  await page.keyboard.press('Space');
  await page.clock.runFor(2000);
  await expect(page.locator('.ov-playback')).toHaveText('播放中');
  await expect(clock).not.toHaveText(originalTime!);
  await page.keyboard.press('KeyR');
  await expect(page.locator('.ov-playback')).toHaveText('就绪');
  await expect(cap.locator('.ov-cap__value')).toHaveText('2.0');
  await expect(clock).toHaveText(originalTime!);
  await page.clock.runFor(3000);
  await expect(clock).toHaveText(originalTime!);
  await expect(cap.locator('.ov-cap__value')).toHaveText('2.0');
});

test('自动监测需明确开启，确认后跳过额外等待，回起点和手动开始能取消触发', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.addInitScript(() => {
    let state: CountdownTriggerStatus = { phase: 'ready', configured: true, armed: false };
    const publish = (phase: CountdownTriggerStatus['phase'], armed: boolean) => {
      state = { ...state, phase, armed };
      window.dispatchEvent(new CustomEvent('countdown-test-status', { detail: state }));
      return state;
    };
    window.endaxisDesktop = {
      isDesktop: true,
      info: async () => ({
        clickThrough: false,
        clickThroughAvailable: true,
        playbackShortcutsAvailable: true,
        countdownTriggerAvailable: true,
        url: location.href,
        alwaysOnTop: true,
      }),
      resize: async () => {},
      toggleClickThrough: async () => false,
      openEditor: async () => {},
      quit: async () => {},
      onClickThrough: () => () => {},
      onPlaybackCommand: () => () => {},
      countdownTrigger: {
        info: async () => state,
        selectRegion: async () => publish('ready', false),
        arm: async () => publish('watching', true),
        disarm: async () => publish('ready', false),
        clear: async () => {
          state.configured = false;
          return publish('unconfigured', false);
        },
        onStatus: callback => {
          const listener = (event: Event) =>
            callback((event as CustomEvent<CountdownTriggerStatus>).detail);
          window.addEventListener('countdown-test-status', listener);
          return () => window.removeEventListener('countdown-test-status', listener);
        },
        onTrigger: callback => {
          const listener = (event: Event) =>
            callback((event as CustomEvent<{ elapsedSeconds: number }>).detail);
          window.addEventListener('countdown-test-trigger', listener);
          return () => window.removeEventListener('countdown-test-trigger', listener);
        },
      },
    };
  });
  await page.goto('/overlay?demo=1');
  await expect(page.locator('.ov-hud')).toBeVisible();
  await page.clock.pauseAt(new Date('2026-10-18T01:00:00Z'));
  const clock = page.locator('.ov-clock');
  const start = (await clock.textContent())!;
  await page.keyboard.press('KeyS');
  await page.getByRole('button', { name: '开始监测', exact: true }).click();
  await expect(page.locator('.overlay-hud-anchor')).toContainText('正在监测参考画面出现');
  await page.keyboard.press('Escape');
  const trigger = () =>
    page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('countdown-test-status', {
          detail: { phase: 'triggered', configured: true, armed: false },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('countdown-test-trigger', { detail: { elapsedSeconds: 0.2 } }),
      );
    });
  await trigger();
  await expect(page.locator('.ov-playback')).toHaveText('播放中');
  await expect(page.locator('.ov-cap__type')).not.toHaveText('等待开始');
  await expect(clock).not.toHaveText(start);
  await page.keyboard.press('KeyR');
  await trigger();
  await expect(page.locator('.ov-playback')).toHaveText('就绪');
  await expect(clock).toHaveText(start);
  await page.keyboard.press('KeyS');
  await page.getByRole('button', { name: '开始监测', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.locator('.ov-cap').click();
  await trigger();
  await expect(page.locator('.ov-playback')).toHaveText('等待中');
  await expect(page.locator('.ov-cap__value')).toHaveText('2.0');
});
