/** 小型构筑预设独立于当前项目存储，重置或导入项目不会清除预设。 */
import type { OperatorBuildPreset } from '../application/editor/operatorBuildPreset';
import { parseOperatorBuildPresets } from '../application/editor/operatorBuildPresetFile';

const STORAGE_KEY = 'endaxis.operator-build-presets';

export function loadOperatorBuildPresets(): OperatorBuildPreset[] {
  const text = localStorage.getItem(STORAGE_KEY);
  if (text === null) return [];
  return parseOperatorBuildPresets(JSON.parse(text));
}

/** 先写成功，再由界面更新列表；存储被禁用或配额不足时不伪报保存成功。 */
export function saveOperatorBuildPresets(presets: readonly OperatorBuildPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
