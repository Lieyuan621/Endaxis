import { useI18n } from 'vue-i18n';
import { desktopMessages } from '../../../i18n';

/** 同一组资源供桌面 HUD、设置页和编辑器导出入口使用。 */
export function useOverlayI18n() {
  return useI18n({ useScope: 'local', inheritLocale: true, messages: desktopMessages });
}
