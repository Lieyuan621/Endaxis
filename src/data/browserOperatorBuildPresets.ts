/** 小型构筑预设独立于当前项目存储，重置或导入项目不会清除预设。 */
import type { OperatorBuildPreset } from '../application/editor/operatorBuildPreset';
import {
  validateGearInstance,
  validateOperatorInstance,
  validateWeaponInstance,
} from '../core/project/scenarioValidation';
import { isObject, type ValidationIssue } from '../core/project/validationHelpers';

const STORAGE_KEY = 'endaxis.operator-build-presets';

export function loadOperatorBuildPresets(): OperatorBuildPreset[] {
  const text = localStorage.getItem(STORAGE_KEY);
  if (text === null) return [];
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('Invalid preset list');
  const ids = new Set<string>();
  for (const item of data) {
    if (
      !isObject(item) ||
      typeof item.id !== 'string' ||
      ids.has(item.id) ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      !isObject(item.build)
    )
      throw new Error('Invalid preset');
    ids.add(item.id);
    const build = item.build;
    if (!isObject(build.operator) || !isObject(build.gears))
      throw new Error('Invalid preset build');
    const issues: ValidationIssue[] = [];
    validateOperatorInstance(build.operator, 'operator', issues);
    if (build.weapon !== null) {
      if (!isObject(build.weapon)) throw new Error('Invalid preset weapon');
      validateWeaponInstance(build.weapon, 'weapon', issues);
    }
    for (const slot of ['armor', 'gloves', 'accessory1', 'accessory2']) {
      const gear = build.gears[slot];
      if (gear === null) continue;
      if (!isObject(gear)) throw new Error('Invalid preset gear');
      validateGearInstance(gear, slot, issues);
    }
    if (issues.length)
      throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  }
  return data as OperatorBuildPreset[];
}

/** 先写成功，再由界面更新列表；存储被禁用或配额不足时不伪报保存成功。 */
export function saveOperatorBuildPresets(presets: readonly OperatorBuildPreset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
