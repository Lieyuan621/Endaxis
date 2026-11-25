import { test, expect, _electron, type ElectronApplication, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { placeBasicGroup } from '../../tests/browser/helpers';

test('便携程序共享编辑器、销毁提示条与设置，移动目录后仍能读取存档', async () => {
  test.skip(process.platform !== 'win32', '此交付目标为 Windows x64 便携版');
  const source = path.resolve(
    process.env.ENDAXIS_DESKTOP_EXECUTABLE ?? 'desktop/release/win-unpacked/Endaxis.exe',
  );
  await fs.access(source);
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-desktop-'));
  let directory = path.join(temporary, '便携版 A');
  let application: ElectronApplication | undefined;
  const errors: string[] = [];
  const launch = async () => {
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) env[key] = value;
    }
    delete env.ELECTRON_RUN_AS_NODE;
    application = await _electron.launch({
      executablePath: path.join(directory, path.basename(source)),
      env,
      timeout: 30_000,
    });
    application.on('window', page => page.on('pageerror', error => errors.push(error.message)));
    await application.context().tracing.start({ screenshots: true, snapshots: true });
    return application.firstWindow();
  };
  const nextWindow = (pathname: string) =>
    application!.waitForEvent('window', {
      predicate: async page => {
        await page.waitForLoadState('domcontentloaded');
        return new URL(page.url()).pathname === pathname;
      },
    });
  const closeNative = async (page: Page) => {
    const closed = page.waitForEvent('close');
    const nativeWindow = await application!.browserWindow(page);
    await nativeWindow.evaluate(window => window.close());
    await closed;
  };
  try {
    await fs.cp(path.dirname(source), directory, {
      recursive: true,
      filter: entry => path.relative(path.dirname(source), entry).split(path.sep)[0] !== 'data',
    });
    const editor = await launch();
    await expect(editor.locator('.track-header .avatar-trigger').first()).toBeVisible();
    await editor.evaluate(() => localStorage.setItem('endaxis_locale', 'zh-CN'));
    await editor.reload();
    await expect(editor.locator('.track-header .avatar-trigger').first()).toBeVisible();
    expect(new URL(editor.url()).protocol).toBe('app:');
    expect(application!.windows()).toHaveLength(1);
    const profile = await application!.evaluate(({ app }) => app.getPath('userData'));
    expect(path.relative(directory, profile).split(path.sep)[0]).toBe('data');

    await editor.locator('.track-header .avatar-trigger').first().click();
    await editor.getByText('佩丽卡', { exact: true }).click();
    await expect(editor.locator('.skill-card').first()).toBeVisible();
    await editor.bringToFront();
    await expect(editor.locator('#boot-loader')).toHaveCount(0);
    await placeBasicGroup(editor);
    // 拖放的第一组动作在约 4 秒处，超出默认的 3 秒预览；暂停时也要能验证图标。
    await editor.evaluate(() =>
      localStorage.setItem(
        'endaxis_overlay_prefs_v1',
        JSON.stringify({ startDelaySeconds: 0, secondsAhead: 10 }),
      ),
    );
    const openingHud = nextWindow('/overlay');
    const openingToolbar = nextWindow('/overlay-toolbar');
    await editor.locator('.command-button--overlay').click();
    const hud = await openingHud;
    const toolbar = await openingToolbar;
    await expect(hud.locator('.ov-hud')).toBeVisible();

    const openingSettings = nextWindow('/overlay-settings');
    await toolbar.getByTitle('设置', { exact: true }).click();
    let settings = await openingSettings;
    await expect(settings.getByRole('button', { name: '多行错开', exact: true })).toBeVisible();
    await settings.getByRole('button', { name: '多行错开', exact: true }).click();
    await settings.getByRole('checkbox', { name: '显示普攻', exact: true }).check();
    await expect(hud.locator('.ov-item img').first()).toBeVisible();
    await settings.screenshot({ path: test.info().outputPath('settings.png') });
    await hud.screenshot({ path: test.info().outputPath('hud.png') });
    await expect
      .poll(() =>
        hud.evaluate(
          () => JSON.parse(localStorage.getItem('endaxis_overlay_prefs_v1') ?? '{}').layoutMode,
        ),
      )
      .toBe('staggered');
    await closeNative(settings);
    expect(hud.isClosed()).toBe(false);
    const reopeningSettings = nextWindow('/overlay-settings');
    await toolbar.getByTitle('设置', { exact: true }).click();
    settings = await reopeningSettings;
    await expect(settings.getByRole('button', { name: '多行错开', exact: true })).toHaveClass(
      /is-active/,
    );
    await toolbar.getByRole('button', { name: '开始', exact: true }).click();
    await expect(hud.locator('.ov-playback')).toHaveText('播放中');
    const settingsClosed = settings.waitForEvent('close');
    const hudClosed = hud.waitForEvent('close');
    await toolbar.getByTitle('关闭提示条', { exact: true }).click();
    await hudClosed;
    await settingsClosed;
    expect(application!.windows()).toHaveLength(1);
    expect(
      await application!.evaluate(({ globalShortcut }) =>
        ['Control+Alt+O', 'Control+Alt+R', 'Control+Alt+Space', 'Control+Alt+Home'].some(key =>
          globalShortcut.isRegistered(key),
        ),
      ),
    ).toBe(false);

    const reopeningHud = nextWindow('/overlay');
    await editor.locator('.command-button--overlay').click();
    const freshHud = await reopeningHud;
    await expect(freshHud.locator('.ov-hud')).toBeVisible();
    await expect(freshHud.locator('.ov-playback')).toHaveText('就绪');
    expect(freshHud).not.toBe(hud);
    await closeNative(freshHud);
    await application!.close();
    application = undefined;

    const relocated = path.join(temporary, '移动后的便携版 B');
    // Windows 可能在进程退出后短暂保留文件句柄；仍必须实际移动成功才能继续。
    await expect(async () => {
      await fs.rename(directory, relocated);
    }).toPass({ timeout: 10_000, intervals: [100, 250, 500] });
    directory = relocated;
    const restored = await launch();
    await expect(restored.locator('.timeline-action-block')).toHaveCount(4);
    const persisted = await restored.evaluate(
      () => JSON.parse(localStorage.getItem('endaxis_overlay_prefs_v1') ?? '{}').layoutMode,
    );
    expect(persisted).toBe('staggered');
    expect(errors).toEqual([]);
  } catch (error) {
    await application
      ?.context()
      .tracing.stop({ path: test.info().outputPath('electron-trace.zip') });
    for (const [index, page] of (application?.windows() ?? []).entries()) {
      await page
        .screenshot({ path: test.info().outputPath(`failure-window-${index}.png`) })
        .catch(() => {});
      await page
        .content()
        .then(html => fs.writeFile(test.info().outputPath(`failure-window-${index}.html`), html))
        .catch(() => {});
    }
    throw error;
  } finally {
    await application?.close();
    // 只清理本测试刚创建的临时目录，绝不删除用户指定的程序目录。
    if (
      path.dirname(temporary) !== path.resolve(os.tmpdir()) ||
      !path.basename(temporary).startsWith('endaxis-desktop-')
    ) {
      throw new Error('unexpected desktop test directory');
    }
    await fs.rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
