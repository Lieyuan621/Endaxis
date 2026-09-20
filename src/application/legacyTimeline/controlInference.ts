/**
 * 为旧轴缺失的主控操作补出明确的切换标记。
 *
 * 旧版不使用主控身份参与模拟，但普攻、强化普攻、下落攻击和处决都来自当前操作干员。
 * 转换时以第 1 轨道为初始主控，保留旧轴已有标记，并在上述动作前按需补标记。
 * 输出仍是普通新版主控时间线，不向模拟器引入任何兼容模式。
 */
import type {
  ControlSwitchDocument,
  ScenarioDocument,
  SkillCastDocument,
} from '../../core/project/schema';

const INFERRED_CONTROL_SWITCH_PREFIX = 'legacy-inferred-control:';
const CONTROLLED_INPUT_GROUPS = new Set([
  'basicAttack',
  'enhancedBasicAttack',
  'plungingAttack',
  'finisher',
]);

export interface LegacyControlledInputCast {
  readonly castId: string;
  readonly trackIndex: number;
  readonly order: number;
}

export function isLegacyControlledInputCast(cast: SkillCastDocument): boolean {
  return (
    cast.source?.kind === 'operatorSkill' && CONTROLLED_INPUT_GROUPS.has(cast.source.skillGroupKey)
  );
}

export function isLegacyInferredControlSwitch(controlSwitch: ControlSwitchDocument): boolean {
  return controlSwitch.id.startsWith(INFERRED_CONTROL_SWITCH_PREFIX);
}

export function legacyInferredControlSwitchId(castId: string): string {
  return `${INFERRED_CONTROL_SWITCH_PREFIX}${castId}`;
}

/**
 * 用当前技能放置帧重建推断标记。重复调用会先清除上一次推断结果，因此可用于逐步模拟排程。
 */
export function synchronizeLegacyInferredControlSwitches(
  scenario: ScenarioDocument,
  casts: readonly LegacyControlledInputCast[],
): readonly ControlSwitchDocument[] {
  const explicitSwitches = (scenario.battle.controlSwitches ?? []).filter(
    controlSwitch => !isLegacyInferredControlSwitch(controlSwitch),
  );
  const events: Array<
    | {
        readonly kind: 'explicit';
        readonly frame: number;
        readonly trackIndex: number;
        order: number;
      }
    | {
        readonly kind: 'cast';
        readonly frame: number;
        readonly trackIndex: number;
        readonly castId: string;
        order: number;
      }
  > = explicitSwitches.map((controlSwitch, order) => ({
    kind: 'explicit',
    frame: controlSwitch.frame,
    trackIndex: controlSwitch.trackIndex,
    order,
  }));

  for (const item of casts) {
    const cast = scenario.tracks[item.trackIndex]?.skillCasts.find(
      candidate => candidate.id === item.castId,
    );
    if (cast === undefined || !isLegacyControlledInputCast(cast)) continue;
    const frame = cast.placement.startFrame;
    if (frame === undefined) continue;
    events.push({
      kind: 'cast',
      frame,
      trackIndex: item.trackIndex,
      castId: item.castId,
      order: item.order,
    });
  }

  events.sort(
    (left, right) =>
      left.frame - right.frame ||
      (left.kind === right.kind ? left.order - right.order : left.kind === 'explicit' ? -1 : 1),
  );

  let controlledTrackIndex = 0;
  const inferred: ControlSwitchDocument[] = [];
  for (const event of events) {
    if (event.kind === 'explicit') {
      controlledTrackIndex = event.trackIndex;
      continue;
    }
    if (event.trackIndex === controlledTrackIndex) continue;
    inferred.push({
      id: legacyInferredControlSwitchId(event.castId),
      frame: event.frame,
      trackIndex: event.trackIndex as ControlSwitchDocument['trackIndex'],
    });
    controlledTrackIndex = event.trackIndex;
  }
  scenario.battle.controlSwitches = [...explicitSwitches, ...inferred];
  return inferred;
}
