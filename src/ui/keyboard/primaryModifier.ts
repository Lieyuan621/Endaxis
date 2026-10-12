import { readRuntimeEnvironment, type RuntimeEnvironment } from '../../platform/runtimeEnvironment';

/** 按键判断和提示文字共用同一平台映射。 */
export function primaryModifier(
  platform: RuntimeEnvironment['browser']['platform'] = readRuntimeEnvironment().browser.platform,
) {
  return platform === 'macos'
    ? { key: 'metaKey' as const, label: 'Command (⌘)' }
    : { key: 'ctrlKey' as const, label: 'Ctrl' };
}
