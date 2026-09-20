/** 执行本次已经提交的技能输入并记录结果，不保存或查询之后的技能安排。 */
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatSkillInput, ScheduledSkillInput } from '../state/environmentState';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';

export type TryStartCombatSkill = (
  operatorId: string,
  skillId: string,
  castId?: string,
  action?: CombatSkillInput['action'],
  simulationInputs?: CombatSkillInput['simulationInputs'],
) => boolean;

/** 排程器可提交的事实只限于当前输入和组阻断，不接触活动战斗对象。 */
export interface CombatInputExecution {
  submit(input: ScheduledSkillInput, actualFrame: number): boolean;
  groupBlocked(input: {
    readonly frame: number;
    readonly operatorId: string;
    readonly anchorCastId: string;
    readonly castId: string;
    readonly previousCastId: string;
    readonly reason: 'inputRejected' | 'interruptedByFixedInput';
    readonly interruptingCastId?: string;
  }): void;
}

export function createCombatInputExecution(
  tryStartSkill: TryStartCombatSkill,
  receipt: CombatReceiptSink,
): CombatInputExecution {
  return {
    submit: (input, frame) => processCombatSkillInput(input, frame, tryStartSkill, receipt),
    groupBlocked: ({ frame, operatorId, ...data }) =>
      receipt.record({
        frame,
        time: frame / COMBAT_FRAMES_PER_SECOND,
        event: 'SkillInputGroupBlocked',
        sourceId: operatorId,
        data,
      }),
  };
}

export function processCombatSkillInput(
  input: ScheduledSkillInput,
  actualFrame: number,
  tryStartSkill: TryStartCombatSkill,
  receipt: CombatReceiptSink,
): boolean {
  const accepted =
    input.simulationInputs !== undefined
      ? tryStartSkill(
          input.operatorId,
          input.skillId,
          input.castId,
          input.action,
          input.simulationInputs,
        )
      : input.action === undefined
        ? tryStartSkill(input.operatorId, input.skillId, input.castId)
        : tryStartSkill(input.operatorId, input.skillId, input.castId, input.action);
  receipt.record({
    frame: actualFrame,
    time: actualFrame / COMBAT_FRAMES_PER_SECOND,
    event: 'SkillInputProcessed',
    sourceId: input.operatorId,
    data: {
      skillId: input.skillId,
      ...(input.castId === undefined ? {} : { castId: input.castId }),
      accepted,
      scheduledActualFrame: input.frame,
    },
  });
  return accepted;
}
