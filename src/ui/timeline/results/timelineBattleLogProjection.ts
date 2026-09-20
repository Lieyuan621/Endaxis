import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { CombatReceiptView } from '../../../core/combat/receipt/combatReceiptHistory';

/** 手工刷新日志的完整单元：回执不能脱离它对应的技能/来源标签更新。 */
export interface TimelineBattleLogSnapshot {
  readonly history: CombatReceiptView;
  /** 只本地化已捕获的来源事实，不读取当前编辑文档或定义库。 */
  readonly resolveCastOwners: () => readonly TimelineBattleLogCastOwner[];
}

export interface TimelineBattleLogCastOwner {
  readonly castId: string;
  readonly label: string;
  readonly operatorLabel: string;
  readonly sourceId: string | null;
}

export interface TimelineBattleLogGroup {
  readonly key: string;
  readonly kind: 'cast' | 'operator' | 'runtime';
  readonly label: string;
  readonly secondaryLabel: string;
  readonly entries: readonly CombatReceiptEntry[];
  readonly firstFrame: number;
  readonly lastFrame: number;
  readonly damage: number;
  /** 仅显式归属到技能块时存在，用于日志定位；角色级和运行时分组保持 null。 */
  readonly castId: string | null;
}

function receiptCastId(entry: CombatReceiptEntry): string | null {
  const castId = entry.data?.castId;
  return typeof castId === 'string' && castId.length > 0 ? castId : null;
}

function damageValue(entry: CombatReceiptEntry): number {
  if (entry.event !== 'DamageApplied' || entry.targetId !== 'enemy') return 0;
  const value = entry.data?.value;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * 只用回执中明确冻结的 castId/sourceId 归属事件。没有身份的事件按类型独立成组，
 * 不采用“最近释放技能”启发式，以免能力实体、Buff 和延迟事件被错归给别的技能块。
 */
export function projectTimelineBattleLogGroups(
  entries: readonly CombatReceiptEntry[],
  owners: readonly TimelineBattleLogCastOwner[],
): readonly TimelineBattleLogGroup[] {
  const ownerByCast = new Map(owners.map(owner => [owner.castId, owner]));
  const ownerBySource = new Map<string, TimelineBattleLogCastOwner>();
  for (const owner of owners) {
    if (owner.sourceId !== null && !ownerBySource.has(owner.sourceId)) {
      ownerBySource.set(owner.sourceId, owner);
    }
  }
  const buckets = new Map<
    string,
    {
      kind: TimelineBattleLogGroup['kind'];
      label: string;
      secondaryLabel: string;
      entries: CombatReceiptEntry[];
    }
  >();
  for (const entry of entries) {
    const castId = receiptCastId(entry);
    const castOwner = castId === null ? undefined : ownerByCast.get(castId);
    const sourceOwner =
      castOwner === undefined && entry.sourceId !== undefined
        ? ownerBySource.get(entry.sourceId)
        : undefined;
    const key =
      castOwner !== undefined
        ? `cast:${castOwner.castId}`
        : sourceOwner !== undefined
          ? `operator:${sourceOwner.sourceId}`
          : `runtime:${entry.event}`;
    const bucket = buckets.get(key) ?? {
      kind: castOwner !== undefined ? 'cast' : sourceOwner !== undefined ? 'operator' : 'runtime',
      label: castOwner?.label ?? sourceOwner?.operatorLabel ?? entry.event,
      secondaryLabel:
        castOwner?.operatorLabel ??
        (sourceOwner === undefined ? '未归属运行时事件' : '角色级常驻行为'),
      entries: [],
    };
    bucket.entries.push(entry);
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([key, bucket]) => ({
      key,
      kind: bucket.kind,
      label: bucket.label,
      secondaryLabel: bucket.secondaryLabel,
      entries: bucket.entries,
      firstFrame: bucket.entries[0]!.frame,
      lastFrame: bucket.entries.at(-1)!.frame,
      damage: bucket.entries.reduce((sum, entry) => sum + damageValue(entry), 0),
      castId: bucket.kind === 'cast' ? key.slice('cast:'.length) : null,
    }))
    .sort((left, right) => left.firstFrame - right.firstFrame || left.key.localeCompare(right.key));
}
