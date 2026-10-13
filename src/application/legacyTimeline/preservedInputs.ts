import type { CombatFrameInput } from '../../core/combat/runtime/combatFrameInput';
import type { ScenarioSimulationService } from '../simulation/scenarioSimulationService';
import type { EndaxisProjectDocument, ScenarioDocument } from '../../core/project/schema';

type LegacyPreservedInputRunner = (
  scenario: ScenarioDocument,
  resolve: (castId: string, actualSkillKey: string) => string | undefined,
) => void;

export type LegacyRuntimeReplacementResolver = (input: {
  readonly scenario: ScenarioDocument;
  readonly trackIndex: number;
  readonly skillGroupKey: string;
  readonly expectedSkillKey: string;
  readonly actualSkillKey: string;
}) => { readonly skillGroupKey: string; readonly skillKey: string } | null;

export interface LegacySkillFormAdjustment {
  readonly scenarioId: string;
  readonly castId: string;
  readonly trackIndex: number;
  readonly sourceSkillKey: string;
  readonly resolvedSkillKey: string;
}

/** 输入时间固定，只在输入发生时解析技能形态，不搜索接续窗口或移动任何标记。 */
export function resolveLegacySkillForms(
  project: EndaxisProjectDocument,
  run: LegacyPreservedInputRunner,
  resolve: LegacyRuntimeReplacementResolver,
): LegacySkillFormAdjustment[] {
  const adjustments: LegacySkillFormAdjustment[] = [];
  for (const scenario of project.scenarios) {
    const casts = new Map(
      scenario.tracks.flatMap((track, trackIndex) =>
        (track?.skillCasts ?? [])
          .filter(cast => cast.presentation?.disabled !== true)
          .map(cast => [cast.id, { cast, trackIndex }] as const),
      ),
    );
    if (casts.size === 0) continue;
    run(scenario, (castId, actualSkillKey) => {
      const item = casts.get(castId);
      if (item === undefined) return;
      const { cast, trackIndex } = item;
      if (cast.source.kind !== 'operatorSkill') return;
      const replacement = resolve({
        scenario,
        trackIndex,
        skillGroupKey: cast.source.skillGroupKey,
        expectedSkillKey: cast.source.skillKey,
        actualSkillKey,
      });
      if (replacement === null || replacement.skillKey === cast.source.skillKey) return;
      adjustments.push({
        scenarioId: scenario.id,
        castId,
        trackIndex,
        sourceSkillKey: cast.source.skillKey,
        resolvedSkillKey: replacement.skillKey,
      });
      cast.source = { ...cast.source, ...replacement };
      return replacement.skillKey;
    });
  }
  return adjustments;
}

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
