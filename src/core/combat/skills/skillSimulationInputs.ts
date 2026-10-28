import { type SkillSimulationInputs } from '../state/foundationState';

export function sameSkillSimulationInputs(
  left: SkillSimulationInputs = {},
  right: SkillSimulationInputs = {},
): boolean {
  const a = left.criticalOverrides ?? {};
  const b = right.criticalOverrides ?? {};
  return (
    Object.keys(left.initialBlackboard ?? {}).length ===
      Object.keys(right.initialBlackboard ?? {}).length &&
    Object.entries(left.initialBlackboard ?? {}).every(
      ([key, value]) =>
        Object.hasOwn(right.initialBlackboard ?? {}, key) &&
        right.initialBlackboard?.[key] === value,
    ) &&
    left.randomSeed === right.randomSeed &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.entries(a).every(([key, value]) => Object.hasOwn(b, key) && b[key] === value)
  );
}
