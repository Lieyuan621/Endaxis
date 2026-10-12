import type { CompiledValueInput } from './compiledGraphData.ts';
/** 动作、Buff 与技能宿主共用的等级数值解析。 */
import type { LevelValues } from '../game-data/operatorDefinition';
export function resolveLevelValue(value: LevelValues, skillLevel: number, path: string): number {
  if (skillLevel === 0 && typeof value !== 'number') {
    throw new TypeError(`${path} must not depend on a skill level inside an operator Buff`);
  }
  const resolved = typeof value === 'number' ? value : value[skillLevel - 1];
  if (resolved === undefined) {
    throw new RangeError(`${path} has no value for skill level ${skillLevel}`);
  }
  if (!Number.isFinite(resolved)) throw new TypeError(`${path} must resolve to a finite number`);
  return resolved;
}

export function resolveLevelValueOrActionOperand(
  value: LevelValues | CompiledValueInput,
  skillLevel: number,
  path: string,
): number | CompiledValueInput {
  if (typeof value === 'object' && 'kind' in value) return value;
  return resolveLevelValue(value as LevelValues, skillLevel, path);
}
