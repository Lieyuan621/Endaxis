import type { RuntimeEnvironment } from '../../platform/runtimeEnvironment';

/** 时间轴的产品策略，不用于文件能力、手势或其他页面的设备分类。 */
export function resolveTimelineLayout(environment: RuntimeEnvironment): 'mobile' | 'desktop' {
  if (environment.host === 'endaxis-app') return 'mobile';
  if (environment.viewport.width > 1366) return 'desktop';
  const { identity, platform } = environment.browser;
  // Android Chrome 请求桌面网站后声明 X11/Linux 或 CrOS；触摸输入不能覆盖这项声明。
  // 同样尊重真正 Linux / ChromeOS 触屏桌面的身份，不改 Windows 触屏与 iPad 的既有策略。
  if (identity === 'desktop' && (platform === 'linux' || platform === 'chromeos')) {
    return 'desktop';
  }
  return identity === 'mobile' ||
    identity === 'ipad-desktop' ||
    environment.input.primaryPointer === 'coarse'
    ? 'mobile'
    : 'desktop';
}
