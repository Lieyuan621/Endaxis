import { type SkillSimulationInputs } from '../state/foundationState';

export function sameSkillSimulationInputs(
  left: SkillSimulationInputs = {},
  right: SkillSimulationInputs = {},
): boolean {
  return (
    Object.keys(left.initialBlackboard ?? {}).length ===
      Object.keys(right.initialBlackboard ?? {}).length &&
    Object.entries(left.initialBlackboard ?? {}).every(
      ([key, value]) =>
        Object.hasOwn(right.initialBlackboard ?? {}, key) &&
        right.initialBlackboard?.[key] === value,
    ) &&
    left.randomSeed === right.randomSeed
  );
}
