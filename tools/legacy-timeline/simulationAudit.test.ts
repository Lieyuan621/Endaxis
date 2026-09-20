import { expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../src/core/project/createProject';
import type { CombatReceiptEntry } from '../../src/core/combat/receipt/combatReceipt';
import { auditScenarioSimulation } from './simulationAudit';

function hit(frame: number, damage: number, castId?: string): CombatReceiptEntry {
  return {
    sequence: frame,
    frame,
    time: frame / 30,
    event: 'DamageApplied',
    data: { expectedDamage: damage, ...(castId === undefined ? {} : { castId }) },
  };
}

it('伤害审计同时保留强制执行的告警及原始证据，两种截止范围各自投影', async () => {
  const scenario = createEmptyScenario('warnings', '告警并非拒绝输入');
  scenario.battle.durationFrames = 100;
  scenario.battle.simulationRange = { endFrame: 50 };
  const warning = (frame: number, event: string, data = {}): CombatReceiptEntry => ({
    sequence: frame,
    frame,
    time: frame / 30,
    event,
    sourceId: 'track:operator',
    data: { skillId: 'comboSkill', castId: 'requested', ...data },
  });
  const entries = [
    warning(1, 'SkillCostUnavailableAtStart'),
    warning(2, 'SkillInputCannotInterruptCurrentSkill', {
      currentSkillId: 'basicAttack3',
      currentSkillTimelineFrame: 21,
    }),
    warning(3, 'SkillInputProcessed', { accepted: true }),
    hit(4, 10),
    warning(60, 'ComboWindowUnavailableAtStart', { reason: 'windowMissing' }),
    warning(61, 'SkillCostRejected'),
  ];
  const before = structuredClone(entries);
  const report = await auditScenarioSimulation(
    {
      simulate: async (_scenario, endFrame) => ({
        receiptEntries: entries.filter(e => e.frame <= endFrame),
      }),
    },
    scenario,
  );
  expect(report.configured.diagnostics.availability).toHaveLength(2);
  expect(report.configured.diagnostics.comboWindow).toEqual([]);
  expect(report.configured.diagnostics.execution).toEqual([]);
  expect(report.configured.diagnostics.castIssues).toEqual([
    {
      castId: 'requested',
      reasons: ['resourceUnavailable', 'skillInterruptUnavailable'],
      receiptSequences: [1, 2],
    },
  ]);
  expect(report.configured.diagnostics.evidence).toEqual(entries.slice(0, 2));
  expect(report.fullDuration.diagnostics.comboWindow[0]?.reasons).toEqual(['windowMissing']);
  expect(report.fullDuration.diagnostics.execution[0]?.reasons).toEqual(['costPaymentRejected']);
  expect(report.fullDuration.diagnostics.castIssues).toEqual([
    {
      castId: 'requested',
      reasons: [
        'resourceUnavailable',
        'skillInterruptUnavailable',
        'windowMissing',
        'costPaymentRejected',
      ],
      receiptSequences: [1, 2, 60, 61],
    },
  ]);
  expect(report.fullDuration.diagnostics.evidence.map(e => e.sequence)).toEqual([1, 2, 60, 61]);
  expect(report.configured.expectedDamage).toBe(10);
  expect(entries).toEqual(before);
});

it('分别计算存档结束线与完整时长，保留尾部无 castId 的伤害', async () => {
  const scenario = createEmptyScenario('audit', '审计');
  scenario.battle.durationFrames = 3600;
  scenario.battle.simulationRange = { endFrame: 2231 };
  const snapshot = structuredClone(scenario);
  const simulate = vi.fn(async (_scenario, endFrame) => ({
    receiptEntries: [hit(2218, 100), hit(2231, 20), hit(2237, 30)].filter(e => e.frame <= endFrame),
  }));
  const report = await auditScenarioSimulation({ simulate }, scenario);
  expect(simulate.mock.calls.map(call => call[1])).toEqual([2231, 3600]);
  expect(report.configured).toMatchObject({
    endFrame: 2231,
    damageRecordCount: 2,
    expectedDamage: 120,
  });
  expect(report.configured.damageRecords).toEqual([
    expect.objectContaining({ frame: 2218, expectedDamage: 100 }),
    expect.objectContaining({ frame: 2231, expectedDamage: 20 }),
  ]);
  expect(report.fullDuration).toMatchObject({
    endFrame: 3600,
    damageRecordCount: 3,
    expectedDamage: 150,
  });
  expect(report.damageAfterConfiguredEnd).toEqual([
    expect.objectContaining({ frame: 2237, expectedDamage: 30 }),
  ]);
  expect(scenario).toEqual(snapshot);
});

it('未设结束线时只执行一次，空轴伤害为零', async () => {
  const scenario = createEmptyScenario('empty', '空轴');
  delete scenario.battle.simulationRange;
  const simulate = vi.fn(async () => ({ receiptEntries: [] }));
  const report = await auditScenarioSimulation({ simulate }, scenario);
  expect(simulate).toHaveBeenCalledTimes(1);
  expect(report.configured).toEqual(report.fullDuration);
  expect(report.configured).toMatchObject({
    damageRecordCount: 0,
    expectedDamage: 0,
    lastDamageFrame: null,
  });
});

it('不把缺失期望伤害或非有限值静默计为零', async () => {
  const invalidData: CombatReceiptEntry['data'][] = [
    {},
    { expectedDamage: NaN },
    { expectedDamage: Infinity },
  ];
  for (const data of invalidData) {
    const scenario = createEmptyScenario('invalid', '无效回执');
    const simulate = async () => ({ receiptEntries: [{ ...hit(0, 1), data }] });
    await expect(auditScenarioSimulation({ simulate }, scenario)).rejects.toThrow(
      'finite expectedDamage',
    );
  }
});

it('按完整来源身份拆账，零伤害、无施法和无来源的公共伤害均不丢失', async () => {
  const scenario = createEmptyScenario('sources', '来源拆账');
  scenario.battle.durationFrames = 100;
  scenario.battle.simulationRange = { endFrame: 50 };
  const entries = [
    { ...hit(1, 10), sourceId: 'track:0:perlica' },
    { ...hit(2, 0), sourceId: 'track:0:perlica' },
    { ...hit(3, 20), sourceId: 'track:1:perlica' },
    hit(4, 5),
    { ...hit(60, 7), sourceId: 'ability:perlica' },
  ];
  const report = await auditScenarioSimulation(
    {
      simulate: async (_scenario, endFrame) => ({
        receiptEntries: entries.filter(e => e.frame <= endFrame),
      }),
    },
    scenario,
  );
  expect(report.configured.sources).toEqual([
    { sourceId: 'track:0:perlica', damageRecordCount: 2, expectedDamage: 10, lastDamageFrame: 2 },
    { sourceId: 'track:1:perlica', damageRecordCount: 1, expectedDamage: 20, lastDamageFrame: 3 },
    { sourceId: null, damageRecordCount: 1, expectedDamage: 5, lastDamageFrame: 4 },
  ]);
  expect(report.fullDuration.sources.at(-1)).toEqual({
    sourceId: 'ability:perlica',
    damageRecordCount: 1,
    expectedDamage: 7,
    lastDamageFrame: 60,
  });
  for (const horizon of [report.configured, report.fullDuration]) {
    expect(horizon.sources.reduce((sum, source) => sum + source.expectedDamage, 0)).toBe(
      horizon.expectedDamage,
    );
    expect(horizon.sources.reduce((sum, source) => sum + source.damageRecordCount, 0)).toBe(
      horizon.damageRecordCount,
    );
  }
});

it('按完整 castId 拆账并保留关联 Buff 步骤与无施法伤害', async () => {
  const scenario = createEmptyScenario('casts', '逐施法审计');
  scenario.battle.durationFrames = 100;
  const entries: CombatReceiptEntry[] = [
    {
      ...hit(10, 12, 'cast:a'),
      sourceId: 'operator:a',
      data: {
        expectedDamage: 12,
        castId: 'cast:a',
        sourceActionId: 'skill:a',
        stepKey: 'direct',
        skillType: 'battleSkill',
        spellBurstType: 'Pulse',
        damageType: 'electric',
        buffId: 'status:sample',
        value: 10,
        actualDamage: 9,
        attack: 100,
        baseDamage: 12,
        finalAttackValue: 100,
        standardCalculation: true,
        skillMultiplierPercent: 12,
        calculationMultiplier: 0.3,
        damageScaleMultiplier: 1.5,
        resistanceMultiplier: 0.8,
        criticalRate: 0.25,
        criticalDamageIncrease: 0.6,
        isCritical: true,
        criticalMultiplier: 1.6,
        criticalExpectationMultiplier: 1.025,
      },
    },
    {
      ...hit(20, 8, 'cast:a'),
      sourceId: 'operator:a',
      data: {
        expectedDamage: 8,
        castId: 'cast:a',
        sourceActionId: 'buff:a',
        stepKey: 'buff-hit',
      },
    },
    hit(30, 5),
  ];
  const report = await auditScenarioSimulation(
    { simulate: async () => ({ receiptEntries: entries }) },
    scenario,
  );
  expect(report.configured.damageRecords[0]).toMatchObject({
    skillType: 'battleSkill',
    spellBurstType: 'Pulse',
    damageType: 'electric',
    buffId: 'status:sample',
    value: 10,
    actualDamage: 9,
    attack: 100,
    baseDamage: 12,
    finalAttackValue: 100,
    standardCalculation: true,
    skillMultiplierPercent: 12,
    calculationMultiplier: 0.3,
    damageScaleMultiplier: 1.5,
    resistanceMultiplier: 0.8,
    criticalRate: 0.25,
    criticalDamageIncrease: 0.6,
    isCritical: true,
    criticalMultiplier: 1.6,
    criticalExpectationMultiplier: 1.025,
  });
  expect(report.configured.casts).toEqual([
    {
      castId: 'cast:a',
      sourceId: 'operator:a',
      sourceActionIds: ['skill:a', 'buff:a'],
      stepKeys: ['direct', 'buff-hit'],
      damageRecordCount: 2,
      expectedDamage: 20,
      firstDamageFrame: 10,
      lastDamageFrame: 20,
    },
    {
      castId: null,
      sourceId: null,
      sourceActionIds: [],
      stepKeys: [],
      damageRecordCount: 1,
      expectedDamage: 5,
      firstDamageFrame: 30,
      lastDamageFrame: 30,
    },
  ]);
});
