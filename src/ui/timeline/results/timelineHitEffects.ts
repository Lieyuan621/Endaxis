/**
 * 把模拟日志里的伤害、附着，对应到具体技能块的命中点上。
 *
 * 伤害步骤带步骤键时按键精确对应；没有键就按"第几帧、谁打的"对应；
 * 附着按"第几帧、谁打的、哪个技能"对应。本模块只做对应，不做任何计算。
 */
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  projectHitDamageReceipts,
  projectHitInflictionReceipts,
} from '../../../core/projection/hitEffectProjection';
import {
  findBuffTimelineSegmentForDamage,
  projectBuffIconTimelineMetadata,
} from '../../../core/projection/buffTimelineViz';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import {
  isBuffDamageReceipt,
  isSkillFollowupBuffDamageReceipt,
  projectBuffDamageDisplayOwners,
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

/** 一个命中点上的全部效果，键是命中点的 id。 */
export interface TimelineHitEffectLabel {
  readonly damage: readonly TimelineHitDamageEffect[];
  readonly infliction: readonly TimelineHitInflictionEffect[];
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
  const segments = projectBuffIconTimelineMetadata(entries, endFrame);
  const displayOwners = projectBuffDamageDisplayOwners(entries, segments);
  return entries.filter(
    entry =>
      (!isBuffDamageReceipt(entry) ||
        entry.targetId !== entry.data?.buffOwnerId ||
        isSkillFollowupBuffDamageReceipt(entry, segments, displayOwners)) &&
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
      stackIndex: number;
      linkBuffed: boolean;
      label: TimelineHitEffectLabel;
      entityInstanceId?: number;
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
      ...(entriesBySequence.get(hit.sequence)?.producedBy?.kind === 'abilityEntity'
        ? {
            entityInstanceId: (
              entriesBySequence.get(hit.sequence)!.producedBy as { instanceId: number }
            ).instanceId,
          }
        : {}),
      triggered,
      stackIndex: 0,
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
      },
    });
    byCast.set(hit.castId, list);
  }
  // 同帧的不同伤害操作分别可点选；普通命中也需要错开，不能由后画的固定伤害遮住附加伤害。
  for (const list of byCast.values()) {
    const byFrame = new Map<number, typeof list>();
    for (const hit of list) {
      const frameHits = byFrame.get(hit.frame) ?? [];
      frameHits.push(hit);
      byFrame.set(hit.frame, frameHits);
    }
    for (const frameHits of byFrame.values()) {
      let index = 0;
      for (const hit of frameHits) if (!hit.triggered) hit.stackIndex = index++;
      index = Math.max(1, index);
      for (const hit of frameHits) if (hit.triggered) hit.stackIndex = index++;
    }
  }
  return byCast;
}

/**
 * 取得指定执行帧的完整回执组；省略帧时兼容首次执行入口。伤害按 castId + hitId 精确匹配；
 * 同帧附着按 castId 归组，和块上提示使用相同边界，不依赖能力实体的 sourceId。
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
    return entry.event === 'ElementalInflictionApplied';
  });
}

/** 把一次释放的命中标记与回执事实归因；键为 `hitId`。 */
export function projectTimelineHitReceipts(entries: readonly CombatReceiptEntry[]) {
  return {
    damages: projectHitDamageReceipts(excludeStandaloneEffectDamage(entries)),
    inflictions: projectHitInflictionReceipts(entries),
  };
}
