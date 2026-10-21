import type {
  NumericPassiveUiDefinition,
  LiinoPassiveUiDefinition,
  TyphoeaPassiveUiDefinition,
  AbilityEntityCountPassiveUiDefinition,
} from '../../../packages/game-data-contract/src/operators';
import { projectAbilityEntityCountStatus } from './abilityEntityCountStatus';
import type { AbilityEntityTargetRef } from '../game-data/logicalAbilityEntity';
/**
 * 把已经完成的战斗投影采样为某一帧的 HUD 快照。
 *
 * 本模块不读取运行时对象，也不重算战斗结果。曲线提供数值，回执提供离散状态；
 * 同帧事实严格按 sequence 顺序处理。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import type { EnemyHealthCurve } from './enemyHealthCurves';
import { poiseMaximumAt, type PoiseCurve } from './poiseCurves';
import type { CombatResourceCurves, OperatorUltimateEnergyCurve } from './resourceCurves';
import { sampleStepCurve } from './curveSampling';
import {
  projectComboWindowTimelineViz,
  type ComboWindowTimelineSegment,
} from './comboWindowTimelineViz';
import {
  projectSkillCooldownTimelineViz,
  type SkillCooldownTimelineSegment,
} from './skillCooldownTimelineViz';
import type { OperatorPassiveUiDefinition } from '../game-data/operatorDefinition';

export interface CombatHudGaugeSnapshot {
  readonly current: number | null;
  readonly maximum: number;
  readonly ratio: number | null;
}

export type EnemyPoiseHudState = 'normal' | 'recovering' | 'brokenEndWindow';

export interface EnemyCombatHudSnapshot {
  readonly health: CombatHudGaugeSnapshot;
  readonly poise: (CombatHudGaugeSnapshot & { readonly state: EnemyPoiseHudState }) | null;
}

export interface OperatorCombatHudSnapshot {
  readonly operatorId: string;
  readonly ultimateEnergy: CombatHudGaugeSnapshot;
  readonly activeSkillId: string | null;
  readonly activeCastId: string | null;
  readonly skillSlots: readonly CombatHudSkillSlotSnapshot[];
  readonly cooldowns: readonly SkillCooldownTimelineSegment[];
  readonly comboWindows: readonly ComboWindowTimelineSegment[];
  readonly passiveUi: CombatHudPassiveUiSnapshot | null;
}

export type CombatHudPassiveUiSnapshot =
  | (AbilityEntityCountPassiveUiDefinition & {
      readonly entities: readonly AbilityEntityTargetRef[];
    })
  | {
      readonly kind: 'numeric';
      readonly appearance: NumericPassiveUiDefinition['appearance'];
      readonly value: number;
      readonly maximum: number;
      readonly active: boolean;
    }
  | {
      readonly kind: 'buffProgress';
      readonly appearance: LiinoPassiveUiDefinition['appearance'];
      readonly mode: 'normal' | 'ultimate';
      readonly buffId: string;
      readonly instanceId: number;
    }
  | {
      readonly kind: 'buffCounters';
      readonly appearance: TyphoeaPassiveUiDefinition['appearance'];
      readonly reserveArrows: number;
      readonly battleArrows: number;
      readonly points: number;
      readonly maximumArrows: number;
      readonly maximumPoints: number;
    };

export interface CombatHudSkillSlotSnapshot {
  readonly skillSlotKey: string;
  readonly currentSkillKey: string;
}

export interface CombatHudOperatorSkillSlotsInitial {
  readonly operatorId: string;
  readonly slots: readonly CombatHudSkillSlotSnapshot[];
}

export interface CombatHudOperatorPassiveUiInitial {
  readonly operatorId: string;
  readonly definition: OperatorPassiveUiDefinition;
}

export interface CombatHudSnapshot {
  readonly frame: number;
  readonly sp: CombatHudGaugeSnapshot;
  readonly enemy: EnemyCombatHudSnapshot;
  readonly operators: readonly OperatorCombatHudSnapshot[];
}

export interface CombatHudSnapshotInput {
  readonly frame: number;
  readonly endFrame: number;
  readonly enemyHealthCurve: EnemyHealthCurve;
  readonly poiseCurve: PoiseCurve;
  readonly resourceCurves: CombatResourceCurves;
  readonly receiptEntries: readonly CombatReceiptEntry[];
  readonly operatorSkillSlots?: readonly CombatHudOperatorSkillSlotsInitial[];
  readonly operatorPassiveUis?: readonly CombatHudOperatorPassiveUiInitial[];
}

function gauge(
  points: Parameters<typeof sampleStepCurve>[0],
  maximum: number,
  frame: number,
): CombatHudGaugeSnapshot {
  const current = sampleStepCurve(points, frame).value;
  return {
    current,
    maximum,
    ratio: current === null || maximum <= 0 ? null : Math.min(1, Math.max(0, current / maximum)),
  };
}

function booleanData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): boolean | undefined {
  const value = data?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function stringData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function numberData(
  data: Readonly<Record<string, CombatReceiptValue>> | undefined,
  key: string,
): number | undefined {
  const value = data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function enemyPoiseState(
  entries: readonly CombatReceiptEntry[],
  frame: number,
): EnemyPoiseHudState {
  let recovering = false;
  let brokenTag = false;
  for (const entry of entries) {
    if (entry.frame > frame) break;
    if (entry.event === 'PoiseApplied') {
      if (booleanData(entry.data, 'brokePoise') === true) recovering = true;
      brokenTag = booleanData(entry.data, 'hasPoiseBrokenTag') ?? brokenTag;
      continue;
    }
    if (entry.event === 'PoiseRecovered') {
      recovering = false;
      brokenTag = booleanData(entry.data, 'hasPoiseBrokenTag') ?? brokenTag;
      continue;
    }
    if (entry.event === 'PoiseBrokenTagEnded') {
      brokenTag = booleanData(entry.data, 'hasPoiseBrokenTag') ?? false;
    }
  }
  return recovering ? 'recovering' : brokenTag ? 'brokenEndWindow' : 'normal';
}

function activeSkillsAtFrame(
  entries: readonly CombatReceiptEntry[],
  frame: number,
): ReadonlyMap<string, { readonly skillId: string; readonly castId: string | null }> {
  const active = new Map<string, { skillId: string; castId: string | null }>();
  for (const entry of entries) {
    if (entry.frame > frame) break;
    const operatorId = entry.sourceId;
    if (operatorId === undefined) continue;
    if (entry.event === 'SkillStarted') {
      const skillId = stringData(entry.data, 'skillId');
      if (skillId === undefined) continue;
      active.set(operatorId, {
        skillId,
        castId: stringData(entry.data, 'castId') ?? null,
      });
      continue;
    }
    if (entry.event !== 'SkillEnded' && entry.event !== 'SkillInterrupted') continue;
    const current = active.get(operatorId);
    if (current === undefined) continue;
    const skillId = stringData(entry.data, 'skillId');
    const castId = stringData(entry.data, 'castId');
    if (
      (skillId === undefined || skillId === current.skillId) &&
      (castId === undefined || current.castId === null || castId === current.castId)
    ) {
      active.delete(operatorId);
    }
  }
  return active;
}

function skillSlotsAtFrame(
  entries: readonly CombatReceiptEntry[],
  frame: number,
  initial: readonly CombatHudOperatorSkillSlotsInitial[],
): ReadonlyMap<string, readonly CombatHudSkillSlotSnapshot[]> {
  const slots = new Map<string, Map<string, string>>();
  for (const operator of initial) {
    if (slots.has(operator.operatorId)) {
      throw new Error(`duplicate HUD skill-slot operator '${operator.operatorId}'`);
    }
    slots.set(
      operator.operatorId,
      new Map(operator.slots.map(slot => [slot.skillSlotKey, slot.currentSkillKey])),
    );
  }
  for (const entry of entries) {
    if (entry.frame > frame) break;
    if (entry.event !== 'SkillSlotChanged' || entry.sourceId === undefined) continue;
    const operatorSlots = slots.get(entry.sourceId);
    if (operatorSlots === undefined) continue;
    const skillSlotKey = stringData(entry.data, 'skillSlotKey');
    const targetSkillKey = stringData(entry.data, 'targetSkillKey');
    if (skillSlotKey === undefined || targetSkillKey === undefined) continue;
    if (!operatorSlots.has(skillSlotKey)) {
      throw new Error(
        `HUD skill-slot receipt ${entry.sequence} references unknown slot '${skillSlotKey}' on '${entry.sourceId}'`,
      );
    }
    operatorSlots.set(skillSlotKey, targetSkillKey);
  }
  return new Map(
    [...slots].map(([operatorId, operatorSlots]) => [
      operatorId,
      [...operatorSlots].map(([skillSlotKey, currentSkillKey]) => ({
        skillSlotKey,
        currentSkillKey,
      })),
    ]),
  );
}

function intervalContainsFrame(
  startFrame: number,
  endFrame: number,
  completed: boolean,
  frame: number,
): boolean {
  return frame >= startFrame && (frame < endFrame || (!completed && frame === endFrame));
}

function operatorSnapshot(
  curve: OperatorUltimateEnergyCurve,
  frame: number,
  activeSkills: ReadonlyMap<string, { readonly skillId: string; readonly castId: string | null }>,
  skillSlots: ReadonlyMap<string, readonly CombatHudSkillSlotSnapshot[]>,
  cooldowns: readonly SkillCooldownTimelineSegment[],
  comboWindows: readonly ComboWindowTimelineSegment[],
  passiveUi: CombatHudPassiveUiSnapshot | null,
): OperatorCombatHudSnapshot {
  const active = activeSkills.get(curve.operatorId);
  return {
    operatorId: curve.operatorId,
    ultimateEnergy: gauge(curve.points, curve.maxValue, frame),
    activeSkillId: active?.skillId ?? null,
    activeCastId: active?.castId ?? null,
    skillSlots: skillSlots.get(curve.operatorId) ?? [],
    cooldowns: cooldowns.filter(
      item =>
        item.operatorId === curve.operatorId &&
        intervalContainsFrame(item.startFrame, item.endFrame, item.completed, frame),
    ),
    comboWindows: comboWindows.filter(
      item =>
        item.operatorId === curve.operatorId &&
        frame >= item.startFrame &&
        (frame < item.endFrame || (item.outcome === 'pending' && frame === item.endFrame)),
    ),
    passiveUi,
  };
}

function passiveUiSnapshotsAtFrame(
  entries: readonly CombatReceiptEntry[],
  frame: number,
  definitions: readonly CombatHudOperatorPassiveUiInitial[],
): ReadonlyMap<string, CombatHudPassiveUiSnapshot> {
  const result = new Map<string, CombatHudPassiveUiSnapshot>();
  for (const { operatorId, definition } of definitions) {
    if (definition.kind === 'abilityEntityCount') {
      result.set(operatorId, {
        ...definition,
        entities: projectAbilityEntityCountStatus(
          entries,
          frame,
          operatorId,
          definition.abilityEntityId,
        ).entities,
      });
      continue;
    }
    if (definition.kind === 'numeric') {
      let value = 0;
      for (const entry of entries) {
        if (entry.frame > frame) break;
        if (entry.event !== 'CharacterPassiveUiValueChanged' || entry.targetId !== operatorId)
          continue;
        const next = numberData(entry.data, 'value');
        if (next !== undefined) value = next;
      }
      value = Math.min(definition.maximum, Math.max(0, Math.round(value)));
      result.set(operatorId, {
        kind: 'numeric',
        appearance: definition.appearance,
        value,
        maximum: definition.maximum,
        active: definition.activeAt !== undefined && value >= definition.activeAt,
      });
      continue;
    }
    if (definition.kind === 'buffCounters') {
      const counts = new Map<string, number>([
        [definition.reserveArrowBuffId, 0],
        [definition.battleArrowBuffId, 0],
        [definition.pointBuffId, 0],
      ]);
      for (const entry of entries) {
        if (entry.frame > frame || entry.targetId !== operatorId) continue;
        const buffId = stringData(entry.data, 'buffId');
        if (buffId === undefined || !counts.has(buffId)) continue;
        if (entry.event === 'BuffApplied') {
          counts.set(buffId, Math.max(0, Math.round(numberData(entry.data, 'layers') ?? 1)));
        } else if (entry.event === 'BuffFinished' || entry.event === 'BuffReleased')
          counts.set(buffId, 0);
      }
      result.set(operatorId, {
        kind: 'buffCounters',
        appearance: definition.appearance,
        reserveArrows: Math.min(
          definition.maximumArrows,
          counts.get(definition.reserveArrowBuffId) ?? 0,
        ),
        battleArrows: Math.min(
          definition.maximumArrows,
          counts.get(definition.battleArrowBuffId) ?? 0,
        ),
        points: Math.min(definition.maximumPoints, counts.get(definition.pointBuffId) ?? 0),
        maximumArrows: definition.maximumArrows,
        maximumPoints: definition.maximumPoints,
      });
      continue;
    }
    let pointer: {
      readonly mode: 'normal' | 'ultimate';
      readonly buffId: string;
      readonly instanceId: number;
    } | null = null;
    for (const entry of entries) {
      if (entry.frame > frame || entry.targetId !== operatorId) continue;
      const buffId = stringData(entry.data, 'buffId');
      const instanceId = numberData(entry.data, 'instanceId');
      if (buffId === undefined) continue;
      const mode =
        buffId === definition.normalBuffId
          ? ('normal' as const)
          : buffId === definition.ultimateBuffId
            ? ('ultimate' as const)
            : null;
      if (mode === null || instanceId === undefined) continue;
      if (entry.event === 'BuffApplied') pointer = { mode, buffId, instanceId };
      else if (
        (entry.event === 'BuffFinished' || entry.event === 'BuffReleased') &&
        pointer?.buffId === buffId &&
        pointer.instanceId === instanceId
      )
        pointer = null;
    }
    if (pointer === null) continue;
    const activePointer = pointer;
    result.set(operatorId, {
      kind: 'buffProgress',
      appearance: definition.appearance,
      mode: activePointer.mode,
      buffId: activePointer.buffId,
      instanceId: activePointer.instanceId,
    });
  }
  return result;
}

/** 在现实时间轴帧上采样一次只读 HUD 快照。 */
export function projectCombatHudSnapshot(input: CombatHudSnapshotInput): CombatHudSnapshot {
  if (!Number.isInteger(input.frame)) {
    throw new RangeError('HUD snapshot frame must be an integer');
  }
  if (!Number.isInteger(input.endFrame) || input.endFrame < input.frame) {
    throw new RangeError('HUD snapshot endFrame must be an integer not before frame');
  }
  const activeSkills = activeSkillsAtFrame(input.receiptEntries, input.frame);
  const skillSlots = skillSlotsAtFrame(
    input.receiptEntries,
    input.frame,
    input.operatorSkillSlots ?? [],
  );
  const cooldowns = projectSkillCooldownTimelineViz(input.receiptEntries, input.endFrame);
  const comboWindows = projectComboWindowTimelineViz(input.receiptEntries, input.endFrame);
  const passiveUis = passiveUiSnapshotsAtFrame(
    input.receiptEntries,
    input.frame,
    input.operatorPassiveUis ?? [],
  );
  return {
    frame: input.frame,
    sp: gauge(input.resourceCurves.sp.points, input.resourceCurves.sp.maxValue, input.frame),
    enemy: {
      health: gauge(input.enemyHealthCurve.points, input.enemyHealthCurve.maxValue, input.frame),
      poise:
        input.poiseCurve.maxValue <= 0
          ? null
          : {
              ...gauge(
                input.poiseCurve.points,
                poiseMaximumAt(input.poiseCurve, input.frame),
                input.frame,
              ),
              state: enemyPoiseState(input.receiptEntries, input.frame),
            },
    },
    operators: input.resourceCurves.ultimateEnergy.map(curve =>
      operatorSnapshot(
        curve,
        input.frame,
        activeSkills,
        skillSlots,
        cooldowns,
        comboWindows,
        passiveUis.get(curve.operatorId) ?? null,
      ),
    ),
  };
}
