/**
 * 把模拟日志里的伤害、附着、反应，对应到具体技能块的命中点上。
 *
 * 伤害步骤带步骤键时按键精确对应；没有键就按"第几帧、谁打的"对应；
 * 附着按"第几帧、谁打的、哪个技能"对应。本模块只做对应，不做任何计算。
 */
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  projectHitDamageReceipts,
  projectHitInflictionReceipts,
  projectHitReactionReceipts,
} from '../../../core/projection/hitEffectProjection';
import type { ScenarioDocument } from '../../../core/project/schema';
import {
  findBuffTimelineSegmentForDamage,
  projectBuffTimelineViz,
} from '../../../core/projection/buffTimelineViz';
import type { TimelineHitMarker } from './timelineHitProjection';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import {
  isBuffDamageReceipt,
  isSkillFollowupBuffDamageReceipt,
} from '../../../core/projection/enemyEffectViz';

/** 一个命中点上发生的伤害（保持日志顺序）。 */
export interface TimelineHitDamageEffect {
  readonly value: number;
  readonly damageType: string;
  readonly isCritical: boolean;
}

/** 一个命中点上发生的元素附着。 */
export interface TimelineHitInflictionEffect {
  readonly element: string;
  readonly outcomeKind: string;
  readonly currentLayers: number;
}

/** 一个命中点上发生的反应施加或消费。 */
export interface TimelineHitReactionEffect {
  readonly reaction: string;
  readonly applied: boolean;
  readonly level: number;
  readonly previousLevel: number;
}

/** 一个命中点上的全部效果，键是命中点的 id。 */
export interface TimelineHitEffectLabel {
  readonly damage: readonly TimelineHitDamageEffect[];
  readonly infliction: readonly TimelineHitInflictionEffect[];
  readonly reactions: readonly TimelineHitReactionEffect[];
}

const COMBO_BUFF_DAMAGE_MODIFIER_ID = 'buff_common_affixes_skillimbue_atk';

function receivedComboBuff(
  hit: { readonly sequence: number },
  entriesBySequence: ReadonlyMap<number, CombatReceiptEntry>,
): boolean {
  return (
    entriesBySequence
      .get(hit.sequence)
      ?.appliedDamageModifiers?.some(
        modifier => modifier.buffId === COMBO_BUFF_DAMAGE_MODIFIER_ID,
      ) === true
  );
}

function excludeStandaloneEffectDamage(
  entries: readonly CombatReceiptEntry[],
): readonly CombatReceiptEntry[] {
  const endFrame = entries.reduce((maximum, entry) => Math.max(maximum, entry.frame), 0);
  const segments = projectBuffTimelineViz(entries, endFrame);
  return entries.filter(
    entry =>
      (!isBuffDamageReceipt(entry) ||
        entry.targetId !== entry.data?.buffOwnerId ||
        isSkillFollowupBuffDamageReceipt(entry, segments)) &&
      findBuffTimelineSegmentForDamage(entry, segments) === undefined &&
      !(entry.event === 'DamageApplied' && typeof entry.data?.spellBurstType === 'string'),
  );
}

/** 定义hitId可重复执行；帧区分可视命中，同帧同身份伤害仍合并查看。 */
export function projectTimelineHitOccurrences(
  entries: readonly CombatReceiptEntry[],
  origins = new CombatObjectOrigins(entries),
) {
  const receipts = projectTimelineHitReceipts(entries);
  const entriesBySequence = new Map(entries.map(entry => [entry.sequence, entry]));
  const byCast = new Map<
    string,
    {
      hitId: string;
      stepKey: string;
      frame: number;
      triggered: boolean;
      triggeredStackIndex: number;
      linkBuffed: boolean;
      label: TimelineHitEffectLabel;
    }[]
  >();
  for (const hit of receipts.damages) {
    if (!hit.castId || !hit.hitId || !hit.stepKey) continue;
    const list = byCast.get(hit.castId) ?? [];
    if (list.some(item => item.hitId === hit.hitId && item.frame === hit.frame)) continue;
    const occurrenceDamages = receipts.damages.filter(
      item => item.castId === hit.castId && item.hitId === hit.hitId && item.frame === hit.frame,
    );
    const triggered = occurrenceDamages.some(
      item =>
        origins.findAncestor(
          origins.get({ kind: 'receipt', sequence: item.sequence }),
          node => node.ref.kind === 'buff' || node.ref.kind === 'globalBuff',
        ).status === 'found',
    );
    list.push({
      triggered,
      triggeredStackIndex: triggered
        ? list.filter(item => item.frame === hit.frame && item.triggered).length
        : 0,
      hitId: hit.hitId,
      stepKey: hit.stepKey,
      frame: hit.frame,
      // main 只在该次命中实际吃到“连击”伤害 Buff 时染蓝；释放连携技本身不等于吃到 Buff。
      linkBuffed: occurrenceDamages.some(damage => receivedComboBuff(damage, entriesBySequence)),
      label: {
        damage: occurrenceDamages.map(({ value, damageType, isCritical }) => ({
          value,
          damageType,
          isCritical,
        })),
        infliction: receipts.inflictions
          .filter(item => item.castId === hit.castId && item.frame === hit.frame)
          .map(({ element, outcomeKind, currentLayers }) => ({
            element,
            outcomeKind,
            currentLayers,
          })),
        reactions: receipts.reactions
          .filter(item => item.castId === hit.castId && item.frame === hit.frame)
          .map(({ reaction, applied, level, previousLevel }) => ({
            reaction,
            applied,
            level,
            previousLevel,
          })),
      },
    });
    byCast.set(hit.castId, list);
  }
  return byCast;
}

/**
 * 取得指定执行帧的完整回执组；省略帧时兼容首次执行入口。伤害按 castId + hitId 精确匹配；
 * 同帧附着与反应按 castId 归组，和块上提示使用相同边界，不依赖能力实体的 sourceId。
 */
export function projectTimelineHitDetailEntries(
  entries: readonly CombatReceiptEntry[],
  castId: string,
  hitId: string,
  executionFrame?: number,
): readonly CombatReceiptEntry[] {
  const skillEntries = excludeStandaloneEffectDamage(entries);
  const firstFrame = skillEntries.find(
    entry =>
      entry.event === 'DamageApplied' &&
      entry.data?.castId === castId &&
      entry.data?.hitId === hitId,
  )?.frame;
  const frame = executionFrame ?? firstFrame;
  if (frame === undefined) return [];
  if (
    !skillEntries.some(
      entry =>
        entry.event === 'DamageApplied' &&
        entry.frame === frame &&
        entry.data?.castId === castId &&
        entry.data.hitId === hitId,
    )
  )
    return [];
  return skillEntries.filter(entry => {
    if (entry.frame !== frame || entry.data?.castId !== castId) return false;
    if (entry.event === 'DamageApplied') return entry.data.hitId === hitId;
    return (
      entry.event === 'ElementalInflictionApplied' ||
      entry.event === 'ElementalReactionApplied' ||
      entry.event === 'ElementalReactionConsumed'
    );
  });
}

/** 每个稳定命中身份首次实际执行的战斗帧；周期重复执行仍只对应定义中的一个标记。 */
export function projectTimelineHitActualFrames(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  for (const receipt of projectHitDamageReceipts(excludeStandaloneEffectDamage(entries))) {
    if (receipt.castId === undefined || receipt.hitId === undefined || result.has(receipt.hitId)) {
      continue;
    }
    result.set(receipt.hitId, receipt.frame);
  }
  return result;
}

/** 把一次释放的命中标记与回执事实归因；键为 `hitId`。 */
export function projectTimelineHitReceipts(entries: readonly CombatReceiptEntry[]) {
  return {
    damages: projectHitDamageReceipts(excludeStandaloneEffectDamage(entries)),
    inflictions: projectHitInflictionReceipts(entries),
    reactions: projectHitReactionReceipts(entries),
  };
}

export function projectHitEffectsByCast(
  scenario: ScenarioDocument,
  entries: readonly CombatReceiptEntry[],
  castId: string,
  markers: readonly TimelineHitMarker[],
  receipts = projectTimelineHitReceipts(entries),
): ReadonlyMap<string, TimelineHitEffectLabel> {
  let targetTrack = null;
  let targetCast = null;
  for (const track of scenario.tracks) {
    const skillCast = track?.skillCasts.find(candidate => candidate.id === castId);
    if (track !== null && skillCast !== undefined) {
      targetTrack = track;
      targetCast = skillCast;
      break;
    }
  }
  if (targetTrack === null || targetCast === null || targetTrack.operator === null) {
    return new Map<string, TimelineHitEffectLabel>();
  }
  // 来源可以是技能创建的能力实体；归属与详情面板一样使用冻结的释放/命中身份，
  // 不能额外要求 sourceId 是干员本人，也不能用同帧的其他释放补齐。
  const damages = receipts.damages.filter(receipt => receipt.castId === castId);
  const inflictions = receipts.inflictions.filter(receipt => receipt.castId === castId);
  const reactions = receipts.reactions.filter(receipt => receipt.castId === castId);

  const byHitId = new Map<string, TimelineHitEffectLabel>();
  for (const marker of markers) {
    const matchingDamage = damages.filter(receipt => receipt.hitId === marker.hitId);
    const absoluteFrame = matchingDamage[0]?.frame;
    if (absoluteFrame === undefined) continue;
    const damage = damages
      .filter(receipt => receipt.hitId === marker.hitId && receipt.frame === absoluteFrame)
      .map(receipt => ({
        value: receipt.value,
        damageType: receipt.damageType,
        isCritical: receipt.isCritical,
      }));
    const infliction = inflictions
      .filter(receipt => receipt.frame === absoluteFrame)
      .map(receipt => ({
        element: receipt.element,
        outcomeKind: receipt.outcomeKind,
        currentLayers: receipt.currentLayers,
      }));
    const reactionEffects = reactions
      .filter(receipt => receipt.frame === absoluteFrame)
      .map(receipt => ({
        reaction: receipt.reaction,
        applied: receipt.applied,
        level: receipt.level,
        previousLevel: receipt.previousLevel,
      }));
    if (damage.length === 0 && infliction.length === 0 && reactionEffects.length === 0) continue;
    byHitId.set(marker.hitId, {
      damage,
      infliction,
      reactions: reactionEffects,
    });
  }
  return byHitId;
}
