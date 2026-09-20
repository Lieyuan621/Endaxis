import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { DamageType } from '../../../core/game-data/operatorDefinition';
import type { ScenarioDocument, TrackIndex } from '../../../core/project/schema';
import type { PublishedScenarioSimulation } from '../useScenarioSimulation';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import { projectHitDamageContribution } from '../../../core/projection/damageContribution';

/** 分析的归属、统计区间和回执必须来自同一次发布，不能混入正在编辑的场景。 */
export function projectPublishedTimelineDamageAnalysis(
  published: PublishedScenarioSimulation | null,
  operatorLabel: (slug: string | null) => string,
  damageTypeLabel: (damageType: DamageType) => string,
  operatorColor?: (slug: string | null) => string,
  damageTypeColor?: (damageType: DamageType) => string,
): TimelineDamageAnalysis {
  if (published === null)
    return {
      totalDamage: 0,
      rotationSeconds: 0,
      dps: 0,
      byOperator: [],
      byContribution: [],
      contributionParts: [],
      byDamageType: [],
      unattributedDamage: 0,
    };
  return projectTimelineDamageAnalysis(
    published.run.receiptHistory.entries(),
    published.scenario,
    index => operatorLabel(published.scenario.tracks[index]?.operator?.operatorSlug ?? null),
    damageTypeLabel,
    index => operatorColor?.(published.scenario.tracks[index]?.operator?.operatorSlug ?? null),
    damageTypeColor,
  );
}

export interface TimelineDamageAnalysisEntry {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly ratio: number;
  readonly color?: string;
}

export interface TimelineDamageAnalysis {
  readonly totalDamage: number;
  readonly rotationSeconds: number;
  readonly dps: number;
  readonly byOperator: readonly TimelineDamageAnalysisEntry[];
  readonly byContribution: readonly TimelineDamageAnalysisEntry[];
  readonly contributionParts: readonly (TimelineDamageAnalysisEntry & {
    readonly kind: 'self' | 'external';
  })[];
  readonly byDamageType: readonly TimelineDamageAnalysisEntry[];
  readonly unattributedDamage: number;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * 伤害分析只汇总模拟已经结算并写入回执的 value，不在 UI 重算伤害公式。
 * `actualDamage` 会被木桩剩余生命截断，不能代表本次攻击本应造成的伤害。
 */
export function projectTimelineDamageAnalysis(
  receipts: Iterable<CombatReceiptEntry>,
  scenario: ScenarioDocument,
  operatorLabel: (trackIndex: TrackIndex) => string,
  damageTypeLabel: (damageType: DamageType) => string,
  operatorColor?: (trackIndex: TrackIndex) => string | undefined,
  damageTypeColor?: (damageType: DamageType) => string | undefined,
): TimelineDamageAnalysis {
  const castToTrack = new Map<string, TrackIndex>();
  const history = [...receipts];
  const origins = new CombatObjectOrigins(history);
  const sourceToTrack = new Map<string, TrackIndex>();
  scenario.tracks.forEach((track, index) => {
    if (track === null) return;
    const trackIndex = index as TrackIndex;
    sourceToTrack.set(track.id, trackIndex);
    for (const cast of track.skillCasts) castToTrack.set(cast.id, trackIndex);
  });

  // 新版时间轴以 0 帧作为正式战斗起点，准备阶段使用负帧。`prepFrames` 只是
  // 可向前编辑的长度，不能当成统计起点，否则默认会漏掉 0 到 prepFrames 之间的伤害。
  const startFrame = scenario.battle.simulationRange?.startFrame ?? 0;
  const operatorTotals = new Map<TrackIndex, number>();
  const contributionTotals = new Map<TrackIndex, number>();
  const selfTotals = new Map<TrackIndex, number>();
  const externalTotals = new Map<TrackIndex, number>();
  const typeTotals = new Map<DamageType, number>();
  let totalDamage = 0;
  let unattributedDamage = 0;
  let lastDamageFrame = startFrame;

  for (const receipt of history) {
    if (receipt.event !== 'DamageApplied' || receipt.targetId !== 'enemy') continue;
    if (receipt.frame < startFrame) continue;
    const value = finiteNumber(receipt.data?.value);
    const damageType = receipt.data?.damageType;
    if (value === null || value <= 0 || typeof damageType !== 'string') continue;
    totalDamage += value;
    lastDamageFrame = Math.max(lastDamageFrame, receipt.frame);
    typeTotals.set(
      damageType as DamageType,
      (typeTotals.get(damageType as DamageType) ?? 0) + value,
    );
    const castId = typeof receipt.data?.castId === 'string' ? receipt.data.castId : null;
    const trackIndex =
      (castId === null ? undefined : castToTrack.get(castId)) ??
      (receipt.sourceId === undefined ? undefined : sourceToTrack.get(receipt.sourceId));
    if (trackIndex === undefined) unattributedDamage += value;
    else {
      operatorTotals.set(trackIndex, (operatorTotals.get(trackIndex) ?? 0) + value);
      const contribution = projectHitDamageContribution(
        origins,
        origins.get({ kind: 'receipt', sequence: receipt.sequence }),
        scenario.tracks[trackIndex]!.id,
      );
      let self = contribution.self;
      for (const item of contribution.external) {
        const providerTrack = sourceToTrack.get(item.providerOperatorId);
        if (providerTrack === undefined) self += item.value;
        else {
          contributionTotals.set(
            providerTrack,
            (contributionTotals.get(providerTrack) ?? 0) + item.value,
          );
          externalTotals.set(providerTrack, (externalTotals.get(providerTrack) ?? 0) + item.value);
        }
      }
      contributionTotals.set(trackIndex, (contributionTotals.get(trackIndex) ?? 0) + self);
      selfTotals.set(trackIndex, (selfTotals.get(trackIndex) ?? 0) + self);
    }
  }

  const entries = <K extends string | number>(
    totals: ReadonlyMap<K, number>,
    label: (key: K) => string,
    color?: (key: K) => string | undefined,
  ): TimelineDamageAnalysisEntry[] =>
    [...totals.entries()]
      .map(([key, value]) => {
        const entryColor = color?.(key);
        return {
          key: String(key),
          label: label(key),
          value,
          ratio: totalDamage <= 0 ? 0 : value / totalDamage,
          ...(entryColor === undefined ? {} : { color: entryColor }),
        };
      })
      .sort((left, right) => right.value - left.value);
  const rotationSeconds = Math.max(0, lastDamageFrame - startFrame) / 30;
  return {
    totalDamage,
    rotationSeconds,
    dps: rotationSeconds <= 0 ? 0 : totalDamage / rotationSeconds,
    byOperator: entries(operatorTotals, operatorLabel, operatorColor),
    byContribution: entries(contributionTotals, operatorLabel, operatorColor),
    contributionParts: [
      ...entries(selfTotals, operatorLabel, operatorColor).map(item => ({
        ...item,
        kind: 'self' as const,
      })),
      ...entries(externalTotals, operatorLabel, operatorColor).map(item => ({
        ...item,
        kind: 'external' as const,
      })),
    ],
    byDamageType: entries(typeTotals, damageTypeLabel, damageTypeColor),
    unattributedDamage,
  };
}
