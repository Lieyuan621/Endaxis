import type { SkillInputGroup } from '../../core/combat/runtime/combatInputRuntime';
import type {
  CombatSkillInput,
  ConsumableUseInput,
  DodgeInput,
  ExternalCombatEventInput,
} from '../../core/combat/state/environmentState';
import {
  compileScenarioDodgeInputs,
  compileScenarioExternalEventInputs,
} from '../../core/compiler/compileScenarioRuntimeAssembly';
import { compileSkillCastPlayerInput } from '../../core/compiler/compileScenarioTimeline';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { ScenarioDocument } from '../../core/project/schema';
import { getSkillCastPlacementChains } from '../../core/project/skillCastPlacement';
import type { ScheduledCombatFrameInput } from './combatInputSchedule';

/**
 * 旧轴修复把各段拆成固定帧后，仅解析其人工输入，不编译技能动作或构筑。
 * 连续组仍需要动态排程；自定义技能程序由应用层另行编译，并在对应输入提交时绑定。
 */
export function compileFixedCombatInputSchedule(
  scenario: ScenarioDocument,
  index: Pick<GameDataRepository, 'getOperator'> &
    Partial<Pick<GameDataRepository, 'getConsumable'>>,
): readonly ScheduledCombatFrameInput[] {
  if (
    scenario.tracks.some(track =>
      track?.skillCasts.some(
        cast => !cast.presentation?.disabled && cast.customDefinition !== undefined,
      ),
    )
  ) {
    throw new Error('custom skill definitions require a compiled input schedule');
  }
  const schedule = compileCombatInputSchedule(scenario, index);
  if (schedule.groups.length > 0) throw new Error('casts require a continuation schedule');
  return schedule.inputs;
}

/** 只解析人工排程；连续组的实际接续帧由输入阶段决定。 */
export function compileCombatInputSchedule(
  scenario: ScenarioDocument,
  index: Pick<GameDataRepository, 'getOperator'> &
    Partial<Pick<GameDataRepository, 'getConsumable'>>,
): { inputs: readonly ScheduledCombatFrameInput[]; groups: readonly SkillInputGroup[] } {
  const groups: SkillInputGroup[] = [];
  let declarationOrder = 0;
  const frames = new Map<
    number,
    {
      frame: number;
      controlledOperatorId?: string | null;
      consumableUses: ConsumableUseInput[];
      dodges?: DodgeInput[];
      skills: (CombatSkillInput & { declarationOrder: number })[];
      externalEvents: ExternalCombatEventInput[];
    }
  >();
  const at = (frame: number) => {
    if (!Number.isSafeInteger(frame)) throw new RangeError('input frame must be a safe integer');
    let input = frames.get(frame);
    if (input === undefined) {
      input = { frame, consumableUses: [], skills: [], externalEvents: [] };
      frames.set(frame, input);
    }
    return input;
  };
  for (const track of scenario.tracks) {
    if (track === null) continue;
    if ((track.consumableUses?.length ?? 0) > 0 && track.operator === null) {
      throw new Error(`track '${track.id}' cannot use a consumable without an operator`);
    }
    for (const use of track.consumableUses ?? []) {
      if (index.getConsumable === undefined) {
        throw new Error('consumable game data is required by the input schedule');
      }
      if (index.getConsumable(use.consumableId) === null) {
        throw new Error(`unknown consumable '${use.consumableId}'`);
      }
      at(use.frame).consumableUses.push({
        useId: use.id,
        operatorId: track.id,
        consumableId: use.consumableId,
      });
    }
    const anchors = new Map<string, number>();
    for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
      for (const cast of chain.casts) anchors.set(cast.id, chain.anchor.placement.startFrame!);
      const enabled = chain.casts.filter(cast => !cast.presentation?.disabled);
      if (chain.casts.length > 1 && enabled.length > 0) {
        groups.push({ anchorCastId: chain.anchor.id, castIds: enabled.map(cast => cast.id) });
      }
    }
    for (const cast of track.skillCasts) {
      const order = declarationOrder++;
      if (cast.presentation?.disabled) continue;
      const operator =
        track.operator === null ? null : index.getOperator(track.operator.operatorSlug);
      if (operator === null) throw new Error(`track '${track.id}' has no operator definition`);
      const { frame, ...input } = compileSkillCastPlayerInput(
        track.id,
        cast,
        operator,
        anchors.get(cast.id)!,
      );
      at(frame).skills.push({ ...input, declarationOrder: order });
    }
  }
  // 与 resolveControlTimeline 一致：同帧只采用存档数组的最后一次切换。
  for (const control of scenario.battle.controlSwitches) {
    at(control.frame).controlledOperatorId = scenario.tracks[control.trackIndex]?.id ?? null;
  }
  for (const { frame, ...event } of compileScenarioExternalEventInputs(scenario)) {
    at(frame).externalEvents.push(event);
  }
  for (const { frame, ...dodge } of compileScenarioDodgeInputs(scenario)) {
    const input = at(frame);
    (input.dodges ??= []).push(dodge);
  }
  return { inputs: [...frames.values()].sort((left, right) => left.frame - right.frame), groups };
}
