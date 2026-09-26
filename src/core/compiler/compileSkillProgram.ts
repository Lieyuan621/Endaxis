/** 技能元数据的唯一编译规则；动作入口由程序编译器绑定。 */
import type { SkillDefinition, SkillType } from '../game-data/operatorDefinition';
import type { CompiledSkillProgram } from './combatProgram';
import type { CompiledGraphEntry } from './combatProgram';
import type { ActionGraphReference } from '../../../packages/game-data-contract/src/actionGraph';
import { createProgramDefinitionCompiler } from './compileProgramDefinitions';
import { resolveLevelValue } from './compileActionValues';

export interface CompileSkillProgramInput {
  readonly operatorId: string;
  readonly skillGroupKey: string;
  readonly skillType: SkillType;
  readonly skillLevel: number;
  readonly skill: SkillDefinition;
}

/** 仅解析等级化费用，供资源上限展示与完整技能编译共用。 */
export function compileSkillCosts(skill: Pick<SkillDefinition, 'costs'>, skillLevel: number) {
  return (skill.costs ?? []).map((cost, index) => ({
    resource: cost.resource,
    value: resolveLevelValue(cost.value, skillLevel, `costs[${index}].value`),
  }));
}

export function compileSkillProgram(
  input: CompileSkillProgramInput,
  compileEntry: (entry: ActionGraphReference, path: string) => CompiledGraphEntry,
): CompiledSkillProgram {
  const definitions = createProgramDefinitionCompiler(input.skillLevel, compileEntry);
  if (!Number.isInteger(input.skillLevel) || input.skillLevel <= 0) {
    throw new RangeError('skillLevel must be a positive integer');
  }
  if (!Number.isInteger(input.skill.timelineBlockFrames) || input.skill.timelineBlockFrames < 0) {
    throw new RangeError(
      `skill '${input.skill.key}' must use non-negative integer timelineBlockFrames`,
    );
  }
  if (
    input.skill.naturalDurationFrames !== undefined &&
    (!Number.isInteger(input.skill.naturalDurationFrames) || input.skill.naturalDurationFrames <= 0)
  ) {
    throw new RangeError(
      `skill '${input.skill.key}' must use positive integer naturalDurationFrames`,
    );
  }
  if (input.skill.eventHandlers?.length) {
    throw new Error(
      `skill '${input.skill.key}' uses legacy eventHandlers without a listener interval`,
    );
  }
  const costs = compileSkillCosts(input.skill, input.skillLevel);
  const initialBlackboard = definitions.blackboard(input.skill.blackboard, 'blackboard');
  if (
    input.skill.smartTarget !== undefined &&
    input.skill.smartTarget !== 'enemy' &&
    input.skill.smartTarget !== 'input' &&
    input.skill.smartTarget !== 'trigger'
  )
    throw new Error(`skill '${input.skill.key}' has unsupported smartTarget`);
  const cooldownFrames =
    input.skill.cooldownFrames === undefined
      ? undefined
      : resolveLevelValue(input.skill.cooldownFrames, input.skillLevel, 'cooldownFrames');
  if (costs.length > 1) {
    throw new Error(
      `skill '${input.skill.key}' has multiple costs, but native CastData has one cost`,
    );
  }
  if (
    input.skill.switchToBuffCast !== undefined &&
    input.skill.switchToBuffCast.asSkillCast !== true &&
    (costs.some(cost => cost.value !== 0) || cooldownFrames !== undefined)
  ) {
    throw new Error(
      `skill '${input.skill.key}' uses the strict zero-cost SwitchToAddBuff runtime subset`,
    );
  }
  if (costs.some(cost => cost.value < 0)) {
    throw new RangeError(`skill '${input.skill.key}' cost must not be negative`);
  }
  if (costs.length > 0 && input.skill.costFrame === undefined) {
    throw new Error(`skill '${input.skill.key}' has costs but no recovered costFrame`);
  }
  if (
    input.skill.costFrame !== undefined &&
    (!Number.isInteger(input.skill.costFrame) || input.skill.costFrame < 0)
  ) {
    throw new RangeError(`skill '${input.skill.key}' must use a non-negative integer costFrame`);
  }
  if (cooldownFrames !== undefined && (!Number.isInteger(cooldownFrames) || cooldownFrames <= 0)) {
    throw new RangeError(`skill '${input.skill.key}' must use positive integer cooldownFrames`);
  }
  const program: CompiledSkillProgram = {
    operatorId: input.operatorId,
    skillGroupKey: input.skillGroupKey,
    skillId: input.skill.key,
    skillType: input.skillType,
    ...(input.skill.nativeSkillType === undefined
      ? {}
      : { nativeSkillType: input.skill.nativeSkillType }),
    skillLevel: input.skillLevel,
    initialBlackboard,
    ...(input.skill.smartTarget === undefined ? {} : { smartTarget: input.skill.smartTarget }),
    timelineBlockFrames: input.skill.timelineBlockFrames,
    ...(input.skill.timelineBlockFollowUpSkillId === undefined
      ? {}
      : { timelineBlockFollowUpSkillId: input.skill.timelineBlockFollowUpSkillId }),
    ...(input.skill.timelineContinuationSkillId === undefined
      ? {}
      : { timelineContinuationSkillId: input.skill.timelineContinuationSkillId }),
    ...(input.skill.naturalDurationFrames === undefined
      ? {}
      : { naturalDurationFrames: input.skill.naturalDurationFrames }),
    ...(input.skill.exclusiveFrame === undefined
      ? {}
      : { exclusiveFrame: input.skill.exclusiveFrame }),
    ...(input.skill.offsetRecordFrame === undefined
      ? {}
      : { offsetRecordFrame: input.skill.offsetRecordFrame }),
    ...(input.skill.inputWindows === undefined ? {} : { inputWindows: input.skill.inputWindows }),
    ...(cooldownFrames === undefined ? {} : { cooldownFrames }),
    ...(input.skill.costFrame === undefined ? {} : { costFrame: input.skill.costFrame }),
    costs,
    ...(input.skill.switchToBuffCast === undefined
      ? {}
      : {
          switchToBuffCast: {
            ...(input.skill.switchToBuffCast.currentSkillTypes === undefined
              ? {}
              : { currentSkillTypes: input.skill.switchToBuffCast.currentSkillTypes }),
            ...(input.skill.switchToBuffCast.requiresCurrentSkillNotInterruptible === undefined
              ? {}
              : {
                  requiresCurrentSkillNotInterruptible:
                    input.skill.switchToBuffCast.requiresCurrentSkillNotInterruptible,
                }),
            ...(input.skill.switchToBuffCast.condition === undefined
              ? {}
              : { condition: input.skill.switchToBuffCast.condition }),
            asSkillCast: input.skill.switchToBuffCast.asSkillCast === true,
            sequence: compileEntry(
              input.skill.switchToBuffCast.sequence,
              'switchToBuffCast.sequence',
            ),
          },
        }),
    timelineActions: definitions.timeline(input.skill.scheduledSequences, 'scheduledSequences'),
  };
  return program;
}
