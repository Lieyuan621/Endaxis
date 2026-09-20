import type { CombatReceiptEntry } from '../../src/core/combat/receipt/combatReceipt';
import type { ScenarioDocument } from '../../src/core/project/schema';
import { projectSkillAvailabilityDiagnostics } from '../../src/core/projection/skillAvailabilityDiagnostics';
import { projectComboWindowDiagnostics } from '../../src/core/projection/comboWindowDiagnostics';
import { projectSkillExecutionDiagnostics } from '../../src/core/projection/skillExecutionDiagnostics';

interface SimulationReader {
  simulate(
    scenario: ScenarioDocument,
    endFrame: number,
  ): Promise<{
    readonly receiptEntries: readonly CombatReceiptEntry[];
  }>;
}

function damageEntries(entries: readonly CombatReceiptEntry[]) {
  return entries
    .filter(entry => entry.event === 'DamageApplied')
    .map(entry => {
      const expectedDamage = entry.data?.expectedDamage;
      if (typeof expectedDamage !== 'number' || !Number.isFinite(expectedDamage)) {
        throw new Error(`DamageApplied ${entry.sequence} has no finite expectedDamage`);
      }
      return {
        frame: entry.frame,
        sourceId: entry.sourceId,
        castId: entry.data?.castId,
        sourceActionId: entry.data?.sourceActionId,
        stepKey: entry.data?.stepKey,
        skillType: entry.data?.skillType,
        spellBurstType: entry.data?.spellBurstType,
        damageType: entry.data?.damageType,
        buffId: entry.data?.buffId,
        value: entry.data?.value,
        actualDamage: entry.data?.actualDamage,
        attack: entry.data?.attack,
        baseDamage: entry.data?.baseDamage,
        finalAttackValue: entry.data?.finalAttackValue,
        standardCalculation: entry.data?.standardCalculation,
        skillMultiplierPercent: entry.data?.skillMultiplierPercent,
        calculationMultiplier: entry.data?.calculationMultiplier,
        damageScaleMultiplier: entry.data?.damageScaleMultiplier,
        resistanceMultiplier: entry.data?.resistanceMultiplier,
        criticalRate: entry.data?.criticalRate,
        criticalDamageIncrease: entry.data?.criticalDamageIncrease,
        isCritical: entry.data?.isCritical,
        criticalMultiplier: entry.data?.criticalMultiplier,
        criticalExpectationMultiplier: entry.data?.criticalExpectationMultiplier,
        expectedDamage,
      };
    });
}

/** 与正式技能块使用相同投影；保留关联回执，不在审计器另造判定规则。 */
function summarizeDiagnostics(entries: readonly CombatReceiptEntry[]) {
  const availability = projectSkillAvailabilityDiagnostics(entries);
  const comboWindow = projectComboWindowDiagnostics(entries);
  const execution = projectSkillExecutionDiagnostics(entries);
  const diagnostics = [...availability, ...comboWindow, ...execution];
  const sequences = new Set(diagnostics.flatMap(d => d.receiptSequences));
  const evidence = entries.filter(entry => sequences.has(entry.sequence));
  const evidenceBySequence = new Map(evidence.map(entry => [entry.sequence, entry]));
  const issuesByCast = new Map<
    string,
    { castId: string; reasons: Set<string>; receiptSequences: Set<number> }
  >();
  for (const diagnostic of diagnostics) {
    const castIds = new Set(
      diagnostic.receiptSequences
        .map(sequence => evidenceBySequence.get(sequence)?.data?.castId)
        .filter((castId): castId is string => typeof castId === 'string'),
    );
    for (const castId of castIds) {
      let issue = issuesByCast.get(castId);
      if (issue === undefined) {
        issue = { castId, reasons: new Set<string>(), receiptSequences: new Set<number>() };
        issuesByCast.set(castId, issue);
      }
      diagnostic.reasons.forEach(reason => issue.reasons.add(reason));
      diagnostic.receiptSequences.forEach(sequence => issue.receiptSequences.add(sequence));
    }
  }
  return {
    availability,
    comboWindow,
    execution,
    castIssues: [...issuesByCast.values()].map(({ castId, reasons, receiptSequences }) => ({
      castId,
      reasons: [...reasons],
      receiptSequences: [...receiptSequences],
    })),
    evidence,
  };
}

/** 按回执原始来源拆账；不截取 ID，不把能力实体或无来源伤害猜成某位干员。 */
function summarizeSources(entries: ReturnType<typeof damageEntries>) {
  const sources = new Map<
    string | null,
    {
      sourceId: string | null;
      damageRecordCount: number;
      expectedDamage: number;
      lastDamageFrame: number;
    }
  >();
  for (const entry of entries) {
    const sourceId = entry.sourceId ?? null;
    let summary = sources.get(sourceId);
    if (summary === undefined) {
      summary = { sourceId, damageRecordCount: 0, expectedDamage: 0, lastDamageFrame: entry.frame };
      sources.set(sourceId, summary);
    }
    summary.damageRecordCount++;
    summary.expectedDamage += entry.expectedDamage;
    summary.lastDamageFrame = Math.max(summary.lastDamageFrame, entry.frame);
  }
  return [...sources.values()];
}

/** 按完整施法身份拆账；无 castId 的公共伤害保留在 null 组，不能被遗漏。 */
function summarizeCasts(entries: ReturnType<typeof damageEntries>) {
  const casts = new Map<
    string | null,
    {
      castId: string | null;
      sourceId: string | null;
      sourceActionIds: Set<string>;
      stepKeys: Set<string>;
      damageRecordCount: number;
      expectedDamage: number;
      firstDamageFrame: number;
      lastDamageFrame: number;
    }
  >();
  for (const entry of entries) {
    const castId = typeof entry.castId === 'string' ? entry.castId : null;
    let summary = casts.get(castId);
    if (summary === undefined) {
      summary = {
        castId,
        sourceId: entry.sourceId ?? null,
        sourceActionIds: new Set<string>(),
        stepKeys: new Set<string>(),
        damageRecordCount: 0,
        expectedDamage: 0,
        firstDamageFrame: entry.frame,
        lastDamageFrame: entry.frame,
      };
      casts.set(castId, summary);
    } else if (summary.sourceId !== (entry.sourceId ?? null)) {
      summary.sourceId = null;
    }
    if (typeof entry.sourceActionId === 'string') summary.sourceActionIds.add(entry.sourceActionId);
    if (typeof entry.stepKey === 'string') summary.stepKeys.add(entry.stepKey);
    summary.damageRecordCount++;
    summary.expectedDamage += entry.expectedDamage;
    summary.firstDamageFrame = Math.min(summary.firstDamageFrame, entry.frame);
    summary.lastDamageFrame = Math.max(summary.lastDamageFrame, entry.frame);
  }
  return [...casts.values()].map(({ sourceActionIds, stepKeys, ...summary }) => ({
    ...summary,
    sourceActionIds: [...sourceActionIds],
    stepKeys: [...stepKeys],
  }));
}

/** 两种截止帧分别重算，不移动技能，不将完整轴尾部伤害算进存档结束线。 */
export async function auditScenarioSimulation(
  service: SimulationReader,
  scenario: ScenarioDocument,
) {
  const configuredEndFrame =
    scenario.battle.simulationRange?.endFrame ?? scenario.battle.durationFrames;
  const fullEndFrame = scenario.battle.durationFrames;
  const configuredRun = await service.simulate(scenario, configuredEndFrame);
  const fullRun =
    configuredEndFrame === fullEndFrame
      ? configuredRun
      : await service.simulate(scenario, fullEndFrame);
  const configuredDamage = damageEntries(configuredRun.receiptEntries);
  const fullDamage = damageEntries(fullRun.receiptEntries);
  const summarize = (endFrame: number, entries: ReturnType<typeof damageEntries>) => ({
    endFrame,
    damageRecordCount: entries.length,
    expectedDamage: entries.reduce((sum, entry) => sum + entry.expectedDamage, 0),
    lastDamageFrame: entries.at(-1)?.frame ?? null,
    // 汇总值只用于定位差异；逐条回执才是核对帧、来源和施法身份的依据。
    damageRecords: entries,
    sources: summarizeSources(entries),
    casts: summarizeCasts(entries),
  });
  return {
    scenarioId: scenario.id,
    name: scenario.name,
    skillCastCount: scenario.tracks.reduce(
      (sum, track) => sum + (track?.skillCasts.length ?? 0),
      0,
    ),
    configured: {
      ...summarize(configuredEndFrame, configuredDamage),
      diagnostics: summarizeDiagnostics(configuredRun.receiptEntries),
    },
    fullDuration: {
      ...summarize(fullEndFrame, fullDamage),
      diagnostics: summarizeDiagnostics(fullRun.receiptEntries),
    },
    // 包括没有 castId 的公共伤害，不用施法身份作为计入总账的门槛。
    damageAfterConfiguredEnd: fullDamage.filter(entry => entry.frame > configuredEndFrame),
  };
}
