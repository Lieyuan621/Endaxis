import { type SkillSimulationInputs } from '../state/foundationState';

export function sameSkillSimulationInputs(
  left: SkillSimulationInputs = {},
  right: SkillSimulationInputs = {},
): boolean {
  const a = left.criticalOverrides ?? {};
  const b = right.criticalOverrides ?? {};
  return (
    left.randomSeed === right.randomSeed &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.entries(a).every(([key, value]) => Object.hasOwn(b, key) && b[key] === value)
  );
}
