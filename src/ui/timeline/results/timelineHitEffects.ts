/**
 * 把模拟日志里的伤害、附着，对应到具体技能块的命中点上。
 *
 * 伤害按技能块、步骤键和执行帧对应；子技能未继承施放信息时沿对象产生链归属。
 * 附着按技能块和执行帧对应。本模块只做对应，不计算伤害。
 */
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import {
  projectHitDamageReceipts,
  projectHitDamageIdentity,
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
  readonly targetId: string;
  readonly value: number;
  readonly damageType: string;
  readonly isCritical: boolean;
}

/** 一个命中点上发生的元素附着。 */
export interface TimelineHitInflictionEffect {
  readonly targetId: string;
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
  targetId?: string,
) {
  const projected = projectTimelineHitReceipts(entries, origins);
  const receipts =
    targetId === undefined
      ? projected
      : {
          damages: projected.damages.filter(hit => hit.targetId === targetId),
          inflictions: projected.inflictions.filter(hit => hit.targetId === targetId),
        };
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
        damage: occurrenceDamages.map(({ targetId, value, damageType, isCritical }) => ({
          targetId,
          value,
          damageType,
          isCritical,
        })),
        infliction: receipts.inflictions
          .filter(item => item.castId === hit.castId && item.frame === hit.frame)
          .map(({ targetId, element, outcomeKind, currentLayers }) => ({
            targetId,
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
  targetId?: string,
): readonly CombatReceiptEntry[] {
  const skillEntries = excludeStandaloneEffectDamage(entries);
  const origins = new CombatObjectOrigins(entries);
  const damages = skillEntries.filter(entry => {
    if (entry.event !== 'DamageApplied' || (targetId !== undefined && entry.targetId !== targetId))
      return false;
    const hit = projectHitDamageIdentity(entry, origins);
    return hit.castId === castId && hit.hitId === hitId;
  });
  const frame = executionFrame ?? damages[0]?.frame;
  if (frame === undefined) return [];
  const sequences = new Set(damages.filter(hit => hit.frame === frame).map(hit => hit.sequence));
  if (!sequences.size) return [];
  return skillEntries.filter(entry => {
    if (entry.frame !== frame || (targetId !== undefined && entry.targetId !== targetId))
      return false;
    if (entry.event === 'DamageApplied') return sequences.has(entry.sequence);
    return entry.event === 'ElementalInflictionApplied' && entry.data?.castId === castId;
  });
}

/** 把一次释放的命中标记与回执事实归因；键为 `hitId`。 */
export function projectTimelineHitReceipts(
  entries: readonly CombatReceiptEntry[],
  origins = new CombatObjectOrigins(entries),
) {
  return {
    damages: projectHitDamageReceipts(excludeStandaloneEffectDamage(entries), origins),
    inflictions: projectHitInflictionReceipts(entries),
  };
}
