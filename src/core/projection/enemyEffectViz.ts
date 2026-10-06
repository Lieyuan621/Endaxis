/**
 * 把敌人元素效果的瞬时回执整理成时间轴标记。
 *
 * 元素附着和法术异常在原生 HUD 中由其可见 Buff 与 GPUIBuffNode 展示；
 * `ElementalInflictionApplied` / `ElementalReactionApplied` 是战斗语义事实，不是第二份 UI 状态。
 */
import type { CombatReceiptEntry, CombatReceiptValue } from '../combat/receipt/combatReceipt';
import { CombatObjectOrigins } from './combatObjectOrigins';
import {
  findBuffTimelineSegmentForDamage,
  projectBuffIconTimelineMetadata,
  type BuffTimelineSegment,
} from './buffTimelineViz';

export function isBuffDamageReceipt(entry: CombatReceiptEntry): boolean {
  return (
    entry.event === 'DamageApplied' &&
    typeof entry.data?.buffId === 'string' &&
    typeof entry.data.buffOwnerId === 'string' &&
    Number.isInteger(entry.data.buffInstanceId)
  );
}

/**
 * 没有独立可视 Buff 身份、但完整继承了技能释放身份的 Buff 伤害属于技能追加命中。
 * 它应回挂技能块并使用触发命中样式，而不是在敌人状态区制造默认图标。
 */
export function isSkillFollowupBuffDamageReceipt(
  entry: CombatReceiptEntry,
  visibleBuffSegments: readonly BuffTimelineSegment[],
  displayOwners: Readonly<Record<number, BuffTimelineSegment>> = {},
): boolean {
  if (
    !isBuffDamageReceipt(entry) ||
    displayOwners[entry.sequence] !== undefined ||
    entry.targetId !== entry.data?.buffOwnerId ||
    (entry.producedBy?.kind !== 'buff' && entry.producedBy?.kind !== 'globalBuff')
  ) {
    return false;
  }
  const data = entry.data;
  if (data === undefined) return false;
  return (
    typeof data.castId === 'string' &&
    data.castId.length > 0 &&
    typeof data.hitId === 'string' &&
    data.hitId.length > 0 &&
    typeof data.stepKey === 'string' &&
    data.stepKey.length > 0 &&
    typeof data.skillType === 'string' &&
    data.skillType.length > 0 &&
    findBuffTimelineSegmentForDamage(entry, visibleBuffSegments) === undefined
  );
}

/** 一个不由持续 Buff 段表达的瞬时效果标记。 */
export interface EnemyEffectMarker {
  readonly frame: number;
  readonly kind: 'burst' | 'reactionConsumed' | 'attachmentTrigger';
  /** 只参与转换的输入元素，不代表创建了持续附着。 */
  readonly element?: string;
  readonly burstType?: string;
  readonly reaction?: string;
  readonly level?: number;
}

export interface EnemyEffectViz {
  /** 隐藏伤害执行者对应的可见祖先；仅为展示寻址，不改写伤害来源。 */
  readonly damageDisplayOwners?: Readonly<Record<number, BuffTimelineSegment>>;
  readonly markers: readonly EnemyEffectMarker[];
  /** 实际伤害回执本身提供身份与详情，不按时间匹配爆发图标。 */
  readonly damageHits?: readonly CombatReceiptEntry[];
  /** 伤害来源的展示元数据；即便头顶状态栏隐藏，仍可用于瞬时伤害图标。 */
  readonly damageBuffs?: readonly BuffTimelineSegment[];
  readonly attachmentConversions?: readonly AttachmentConversion[];
}

export function projectBuffDamageDisplayOwners(
  entries: readonly CombatReceiptEntry[],
  segments: readonly BuffTimelineSegment[],
  entityBuffs: ReadonlyMap<string, string> = new Map(),
): Readonly<Record<number, BuffTimelineSegment>> {
  const owners: Record<number, BuffTimelineSegment> = {};
  let origins: CombatObjectOrigins | undefined;
  if (entityBuffs.size) {
    origins = new CombatObjectOrigins(entries);
    const entitySegments = new Map<number, BuffTimelineSegment[]>();
    for (const segment of segments) {
      const buff = origins.get({
        kind: 'buff',
        ownerId: segment.targetId,
        instanceId: segment.instanceId,
      });
      const producer = buff.fact?.producedBy;
      if (producer?.kind !== 'abilityEntity') continue;
      const id = origins.get(producer).fact?.data?.abilityEntityId;
      if (typeof id !== 'string' || entityBuffs.get(id) !== segment.buffId) continue;
      const values = entitySegments.get(producer.instanceId) ?? [];
      values.push(segment);
      entitySegments.set(producer.instanceId, values);
    }
    for (const entry of entries) {
      if (entry.event !== 'DamageApplied' || entry.producedBy?.kind !== 'abilityEntity') continue;
      // 按创建实例归属；状态已结束后的巨浪仍挂在最后一段，不延长状态寿命。
      const candidates = entitySegments
        .get(entry.producedBy.instanceId)
        ?.filter(
          segment => segment.targetId === entry.targetId && segment.startFrame <= entry.frame,
        );
      const segment = candidates?.sort((a, b) => b.startFrame - a.startFrame)[0];
      if (segment) owners[entry.sequence] = segment;
    }
  }
  for (const entry of entries) {
    if (
      !isBuffDamageReceipt(entry) ||
      entry.targetId !== entry.data?.buffOwnerId ||
      findBuffTimelineSegmentForDamage(entry, segments)
    )
      continue;
    origins ??= new CombatObjectOrigins(entries);
    // 仅沿创建关系查找；增益提供者、触发事件和运行来源都不是展示父级。
    const result = origins.findAncestor(
      origins.get({ kind: 'receipt', sequence: entry.sequence }),
      node => {
        if (node.ref.kind !== 'buff' || node.ref.ownerId !== entry.targetId) return false;
        const buffId = node.fact?.data?.buffId;
        if (typeof buffId !== 'string') return false;
        const segment = findBuffTimelineSegmentForDamage(
          {
            ...entry,
            data: {
              ...entry.data,
              buffId,
              buffOwnerId: node.ref.ownerId,
              buffInstanceId: node.ref.instanceId,
            },
          },
          segments,
        );
        if (segment) owners[entry.sequence] = segment;
        return segment !== undefined;
      },
      // Start 可先产生伤害再写入出生回执；时间归属由状态段检查，不截断同帧出生关系。
      { relations: ['producedBy'], throughSequence: Infinity },
    );
    if (result.status !== 'found') delete owners[entry.sequence];
  }
  return owners;
}

export interface AttachmentConversion {
  readonly frame: number;
  readonly targetId: string;
  readonly consumedBuffId: string;
  readonly consumedInstanceId: number;
  readonly outputBuffId: string;
  readonly outputInstanceId: number;
}

function requireData(entry: CombatReceiptEntry): Readonly<Record<string, CombatReceiptValue>> {
  if (entry.data === undefined) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no data`);
  }
  return entry.data;
}

function requireNumber(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): number {
  const value = data[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no finite ${key}`);
  }
  return value;
}

function requireString(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): string {
  const value = data[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no ${key}`);
  }
  return value;
}

function requireBoolean(
  entry: CombatReceiptEntry,
  data: Readonly<Record<string, CombatReceiptValue>>,
  key: string,
): boolean {
  const value = data[key];
  if (typeof value !== 'boolean') {
    throw new Error(`receipt ${entry.sequence} '${entry.event}' has no boolean ${key}`);
  }
  return value;
}

/**
 * 持续状态不在这里生成 segment：原生可见 Buff 生命周期是唯一展示身份。
 * `ElementalReactionApplied` 也不生成瞬时标记：它的持续状态由原生可见 Buff 唯一表达。
 */
export function projectEnemyEffectViz(
  entries: readonly CombatReceiptEntry[],
  endFrame: number,
  entityBuffs: ReadonlyMap<string, string> = new Map(),
): EnemyEffectViz {
  if (!Number.isInteger(endFrame) || endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  const markers: EnemyEffectMarker[] = [];
  const damageHits: CombatReceiptEntry[] = [];
  const attachmentConversions: AttachmentConversion[] = [];
  const buffSegments = projectBuffIconTimelineMetadata(entries, endFrame);
  const damageDisplayOwners = projectBuffDamageDisplayOwners(entries, buffSegments, entityBuffs);
  for (const entry of entries) {
    const enemyBuffDamage =
      isBuffDamageReceipt(entry) &&
      entry.targetId === entry.data?.buffOwnerId &&
      !isSkillFollowupBuffDamageReceipt(entry, buffSegments, damageDisplayOwners);
    if (
      (entry.event === 'DamageApplied' && typeof entry.data?.spellBurstType === 'string') ||
      enemyBuffDamage ||
      damageDisplayOwners[entry.sequence] !== undefined
    ) {
      damageHits.push(entry);
      if (typeof entry.data?.spellBurstType === 'string') {
        markers.push({ frame: entry.frame, kind: 'burst', burstType: entry.data.spellBurstType });
      }
      continue;
    }
    if (entry.event === 'ElementalInflictionApplied') {
      const data = requireData(entry);
      if (data.outcomeKind === 'compoundStatus') {
        markers.push({
          frame: entry.frame,
          kind: 'attachmentTrigger',
          element: requireString(entry, data, 'requestedElement'),
        });
      }
      continue;
    }
    if (entry.event === 'ElementalAttachmentConverted') {
      const data = requireData(entry);
      if (!entry.targetId) throw new Error(`receipt ${entry.sequence} has no conversion target`);
      attachmentConversions.push({
        frame: entry.frame,
        targetId: entry.targetId,
        consumedBuffId: requireString(entry, data, 'consumedBuffId'),
        consumedInstanceId: requireNumber(entry, data, 'consumedInstanceId'),
        outputBuffId: requireString(entry, data, 'outputBuffId'),
        outputInstanceId: requireNumber(entry, data, 'outputInstanceId'),
      });
      continue;
    }
    // 爆发瞬时标记与命中点均以同一笔 DamageApplied 为准；旧摘要不再独立生成标记。
    if (entry.event === 'ElementalReactionConsumed') {
      const data = requireData(entry);
      if (!requireBoolean(entry, data, 'consumed')) continue;
      markers.push({
        frame: entry.frame,
        kind: 'reactionConsumed',
        reaction: requireString(entry, data, 'reaction'),
        level: requireNumber(entry, data, 'level'),
      });
    }
  }
  return {
    markers,
    ...(Object.keys(damageDisplayOwners).length ? { damageDisplayOwners } : {}),
    ...(damageHits.length ? { damageHits } : {}),
    ...(damageHits.length && buffSegments.length ? { damageBuffs: buffSegments } : {}),
    ...(attachmentConversions.length ? { attachmentConversions } : {}),
  };
}
