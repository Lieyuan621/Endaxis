import type { CombatFrameInput } from '../../core/combat/runtime/combatFrameInput';
import type { ScenarioSimulationService } from '../simulation/scenarioSimulationService';
import type { LegacyPreservedInputRunner } from './heuristicRetiming';

/** 固定输入只向前执行；形态在输入阶段解析，不保存或复制战斗切面。 */
export function createLegacyPreservedInputRunner(
  simulation: Pick<ScenarioSimulationService, 'compileFixedInputs' | 'createInputCombatSession'>,
): LegacyPreservedInputRunner {
  return (scenario, resolve) => {
    const inputs = simulation.compileFixedInputs(scenario);
    const lastSkillFrame = inputs.findLast(input => (input.skills?.length ?? 0) > 0)?.frame;
    if (lastSkillFrame === undefined) return;
    const session = simulation.createInputCombatSession(scenario, Math.min(0, inputs[0]!.frame));
    for (const input of inputs) {
      if (input.frame > lastSkillFrame) break;
      const frameInput: CombatFrameInput = {
        ...input,
        skills: phase => {
          for (const skill of input.skills ?? []) {
            const scheduled = { ...skill, frame: input.frame };
            const resolution = phase.resolvePlayerInputSkill(scheduled);
            const replacement =
              resolution.status === 'mismatched' && skill.castId !== undefined
                ? resolve(skill.castId, resolution.actualSkillKey)
                : undefined;
            phase.submit(
              replacement === undefined ? scheduled : { ...scheduled, skillId: replacement },
              input.frame,
            );
          }
        },
      };
      if (session.runtime.initialInputPending) {
        if (input.frame === session.runtime.frame) {
          session.runtime.applyInitialInput(frameInput);
          continue;
        }
        session.runtime.applyInitialInput({});
      }
      session.advanceToFrame(input.frame - 1);
      session.runtime.advanceInputFrame(frameInput);
    }
  };
}
