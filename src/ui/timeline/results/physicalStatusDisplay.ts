/**
 * 物理异常展示投影。
 *
 * 原生 Buff 生命周期是战斗事实，但 Main 的物理异常行并不直接绘制全部 Buff：
 * `NoGuard` 只保存破防层数，界面绘制每次物理异常输入产生的瞬时代表标记；
 * 击飞、倒地与碎甲另外保留真实持续段，猛击只保留瞬时标记。
 */
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { PhysicalInflictionType } from '../../../../packages/game-data-contract/src/primitives';
import {
  projectBuffIconTimelineMetadata,
  type BuffTimelineSegment,
  type DisplayBuffTimelineSegment,
} from '../../../core/projection/buffTimelineViz';

const NO_GUARD = 'buff_physical_no_guard';

/** 时间轴和对象来源图的物理异常入口沿用原生 termicon；Buff 自身的原生 presentation 保持原样。 */
const actionIcons: Readonly<Record<PhysicalInflictionType, string>> = {
  airborne: '/icons/icon_term_ba_airborne.webp',
  knockDown: '/icons/icon_term_ba_knockdown.webp',
  crush: '/icons/icon_term_ba_crush.webp',
  fracture: '/icons/icon_term_ba_fracture.webp',
};
const physicalActions: Readonly<Record<string, PhysicalInflictionType>> = {
  buff_physical_airborne: 'airborne',
  buff_physical_knockdown: 'knockDown',
  buff_physical_crushed: 'crush',
  buff_physical_do_fracture: 'fracture',
};
const consumingActions = new Set<PhysicalInflictionType>(['crush', 'fracture']);
const controlActions = new Set<PhysicalInflictionType>(['airborne', 'knockDown']);
const PHYSICAL_CONTROL_SUPER_ARMOR_THRESHOLD = 30;

interface PhysicalStatusDisplayOptions {
  readonly enemySuperArmor: number;
}

interface ConsumedGuard {
  readonly entry: CombatReceiptEntry;
  readonly layers: number;
}

export function physicalStatusIconPath(buffId: string): string | undefined {
  const action = physicalActions[buffId];
  return action === undefined ? undefined : actionIcons[action];
}

/** 这一行仅包含四种物理异常和破防；不按颜色、图标或头顶栏位置判断。 */
export function isPhysicalStatusRowBuff(buff: Pick<BuffTimelineSegment, 'buffId'>): boolean {
  return buff.buffId === NO_GUARD || physicalActions[buff.buffId] !== undefined;
}

function instanceKey(targetId: string, instanceId: number): string {
  return `${targetId}\u0000${instanceId}`;
}

function receiptString(entry: CombatReceiptEntry, key: string): string | undefined {
  const value = entry.data?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function receiptNumber(entry: CombatReceiptEntry, key: string): number | undefined {
  const value = entry.data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function sameOptionalIdentity(left: string | undefined, right: string | undefined): boolean {
  return left === undefined || right === undefined || left === right;
}

function belongsToPhysicalInput(consumed: ConsumedGuard, input: CombatReceiptEntry): boolean {
  return (
    consumed.entry.frame === input.frame &&
    consumed.entry.targetId === input.targetId &&
    sameOptionalIdentity(consumed.entry.sourceId, input.sourceId) &&
    sameOptionalIdentity(receiptString(consumed.entry, 'castId'), receiptString(input, 'castId'))
  );
}

function relatedGuardSegments(
  action: BuffTimelineSegment,
  segments: readonly BuffTimelineSegment[],
  entriesBySequence: ReadonlyMap<number, CombatReceiptEntry>,
): readonly BuffTimelineSegment[] {
  return segments.filter(segment => {
    if (segment.buffId !== NO_GUARD || segment.startSequence === undefined) return false;
    const producer = entriesBySequence.get(segment.startSequence)?.producedBy;
    return (
      producer?.kind === 'buff' &&
      producer.ownerId === action.targetId &&
      producer.instanceId === action.instanceId
    );
  });
}

/**
 * 复刻 Main 的物理异常显示语义：
 * - 首次普通物理异常只显示“破防 1”，不借用未实际成立的异常图标；
 * - 猛击/碎甲显示消费前的破防层数；
 * - 击飞/倒地显示施加后的破防层数，且只在敌人霸体值低于 30 时保留控制持续时间；
 * - 破防与猛击本身只产生瞬时标记，不绘制伪持续条。
 */
export function projectPhysicalStatusDisplay(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  options: PhysicalStatusDisplayOptions,
): readonly DisplayBuffTimelineSegment[] {
  const physicalEntries = [...entries]
    .filter(
      entry =>
        typeof entry.data?.buffId === 'string' &&
        (entry.data.buffId === NO_GUARD || physicalActions[entry.data.buffId] !== undefined),
    )
    .sort((left, right) => left.sequence - right.sequence);

  const segments = projectBuffIconTimelineMetadata(
    physicalEntries.map(entry => {
      const iconPath = physicalStatusIconPath(String(entry.data?.buffId));
      return iconPath === undefined || entry.event !== 'BuffApplied'
        ? entry
        : {
            ...entry,
            data: { ...entry.data, visible: true, abnormalColorType: 'Physical', iconPath },
          };
    }),
    endFrame,
  );
  if (segments.length === 0) return [];

  const entriesBySequence = new Map(physicalEntries.map(entry => [entry.sequence, entry]));
  const segmentsByStartSequence = new Map(
    segments
      .filter(segment => segment.startSequence !== undefined)
      .map(segment => [segment.startSequence!, segment] as const),
  );
  const guardLayers = new Map<string, number>();
  const guardLayersAtFrameEnd = new Map<string, number>();
  const pendingConsumedGuards: ConsumedGuard[] = [];
  const result: DisplayBuffTimelineSegment[] = [];

  const currentGuardLayers = (targetId: string): number =>
    [...guardLayers]
      .filter(([key]) => key.startsWith(`${targetId}\u0000`))
      .reduce((sum, [, layers]) => sum + layers, 0);

  for (const entry of physicalEntries) {
    const buffId = receiptString(entry, 'buffId');
    const instanceId = receiptNumber(entry, 'instanceId');
    const targetId = entry.targetId;
    if (buffId === undefined || instanceId === undefined || targetId === undefined) continue;

    if (buffId === NO_GUARD) {
      const key = instanceKey(targetId, instanceId);
      if (entry.event === 'BuffApplied' || entry.event === 'BuffStackChanged') {
        guardLayers.set(key, Math.max(0, receiptNumber(entry, 'layers') ?? 0));
      } else if (entry.event === 'BuffFinished' || entry.event === 'BuffReleased') {
        guardLayers.delete(key);
      } else if (entry.event === 'BuffConsumed') {
        guardLayers.delete(key);
        pendingConsumedGuards.push({
          entry,
          layers: Math.max(0, receiptNumber(entry, 'layers') ?? 0),
        });
      }
      // 同一技能可以先施加击飞/倒地，再在同帧额外叠加破防。
      // Main 按该帧完整的破防状态显示代表图标，而不是停在控制 Buff 刚施加时的层数。
      const frameKey = `${targetId}\u0000${entry.frame}`;
      guardLayersAtFrameEnd.set(frameKey, currentGuardLayers(targetId));
    }

    const inputType = receiptString(entry, 'physicalInflictionType') as
      PhysicalInflictionType | undefined;
    if (entry.event !== 'BuffApplied' || inputType === undefined) continue;

    const primary = segmentsByStartSequence.get(entry.sequence);
    if (primary === undefined) continue;
    const actualAction = physicalActions[buffId];
    const isGuardOnly = buffId === NO_GUARD;
    const consumed = consumingActions.has(inputType)
      ? pendingConsumedGuards.filter(candidate => belongsToPhysicalInput(candidate, entry))
      : [];
    for (const candidate of consumed) {
      pendingConsumedGuards.splice(pendingConsumedGuards.indexOf(candidate), 1);
    }

    const rawLayers = isGuardOnly
      ? (receiptNumber(entry, 'layers') ?? currentGuardLayers(targetId))
      : consumingActions.has(inputType)
        ? consumed.reduce((sum, candidate) => sum + candidate.layers, 0)
        : currentGuardLayers(targetId);
    const layers = Math.min(4, Math.max(1, rawLayers || primary.layers || 1));
    const related = isGuardOnly ? [] : relatedGuardSegments(primary, segments, entriesBySequence);
    const windows = [primary, ...related];
    const keepsDuration =
      actualAction === 'fracture' ||
      (actualAction !== undefined &&
        controlActions.has(actualAction) &&
        options.enemySuperArmor < PHYSICAL_CONTROL_SUPER_ARMOR_THRESHOLD);

    result.push({
      ...primary,
      layers,
      durationEndFrame: keepsDuration
        ? (primary.durationEndFrame ?? primary.endFrame)
        : primary.startFrame,
      members: windows,
      windows,
    });
  }

  return result
    .map(segment => {
      const action = physicalActions[segment.buffId];
      if (segment.buffId !== NO_GUARD && (action === undefined || !controlActions.has(action))) {
        return segment;
      }
      const frameEndLayers =
        guardLayersAtFrameEnd.get(`${segment.targetId}\u0000${segment.startFrame}`) ?? 0;
      return frameEndLayers > segment.layers
        ? { ...segment, layers: Math.min(4, frameEndLayers) }
        : segment;
    })
    .sort(
      (left, right) =>
        left.startFrame - right.startFrame ||
        (left.startSequence ?? 0) - (right.startSequence ?? 0),
    );
}
