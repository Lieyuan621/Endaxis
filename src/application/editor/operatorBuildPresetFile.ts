import type { OperatorBuildPreset } from './operatorBuildPreset';
import {
  validateGearInstance,
  validateOperatorInstance,
  validateWeaponInstance,
} from '../../core/project/scenarioValidation';
import { isObject, type ValidationIssue } from '../../core/project/validationHelpers';

export function parseOperatorBuildPresets(data: unknown): OperatorBuildPreset[] {
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

export function readOperatorPresetFile(text: string): OperatorBuildPreset[] {
  const data: unknown = JSON.parse(text);
  if (!isObject(data) || data.kind !== 'EndaxisPresets' || data.schemaVersion !== 1)
    throw new Error('Invalid preset file');
  return parseOperatorBuildPresets(data.presets);
}

export function serializeOperatorPresets(presets: readonly OperatorBuildPreset[]): string {
  return JSON.stringify({ kind: 'EndaxisPresets', schemaVersion: 1, presets }, null, 2);
}

export function operatorPresetFilename(date = new Date()): string {
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return `Endaxis_Preset-${day}.json`;
}
