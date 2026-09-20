import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { createEditorSimulationService } from '../../../application/simulation/testSupport/editorSimulationService';
import { createEmptyScenario } from '../../../core/project/createProject';
import {
  projectTimelineDamageAnalysis,
  projectPublishedTimelineDamageAnalysis,
} from './timelineDamageAnalysis';
import { computed, shallowRef } from 'vue';
import type { PublishedScenarioSimulation } from '../useScenarioSimulation';
import { createTimelineSampleScenario } from '../timelineSampleScenario';
import { CombatReceiptCollector } from '../../../core/combat/receipt/combatReceipt';

function historyOf(entries: readonly CombatReceiptEntry[]) {
  const receipt = new CombatReceiptCollector();
  for (const { sequence: _sequence, ...entry } of entries) receipt.record(entry);
  return receipt.history.snapshot();
}

describe('projectTimelineDamageAnalysis', () => {
  it('按直接提供者汇总贡献，保留负贡献并与攻击者总伤害守恒', () => {
    const scenario = createTimelineSampleScenario();
    const attacker = scenario.tracks[0]!;
    const provider = scenario.tracks[1]!;
    const result = projectTimelineDamageAnalysis(
      [
        {
          sequence: 0,
          frame: 0,
          time: 0,
          event: 'DamageApplied',
          sourceId: attacker.id,
          targetId: 'enemy',
          data: { value: 80, damageType: 'physical', 'damageScale:normal:attacker': 0.8 },
          appliedDamageModifiers: [
            {
              kind: 'damageScale',
              zone: 'normal',
              side: 'attacker',
              sourceId: provider.id,
              buffId: 'negative',
              addition: -0.2,
            },
          ],
        },
      ],
      scenario,
      String,
      String,
    );
    expect(result.totalDamage).toBe(80);
    expect(result.byOperator[0]!.value).toBe(80);
    expect(result.byContribution.map(entry => entry.value)).toEqual([100, expect.closeTo(-20)]);
    expect(result.contributionParts.find(entry => entry.kind === 'external')!.value).toBeCloseTo(
      -20,
    );
    expect(result.byContribution.reduce((sum, entry) => sum + entry.value, 0)).toBeCloseTo(80);
  });

  it('projects real post-preparation simulation damage into chart data', async () => {
    const scenario = createTimelineSampleScenario();
    const cast = scenario.tracks[1]!.skillCasts[0]!;
    cast.presentation = { ...cast.presentation, disabled: false };
    const run = await createEditorSimulationService().simulate(
      scenario,
      scenario.battle.durationFrames,
    );
    const result = projectTimelineDamageAnalysis(run.receiptEntries, scenario, String, String);
    expect(result.totalDamage).toBeGreaterThan(0);
    expect(result.byOperator).toHaveLength(1);
    expect(result.byDamageType).toHaveLength(1);
  });

  it('keeps owner and analysis range paired with the published receipt across edits and publication', () => {
    const original = createEmptyScenario('snapshot', 'snapshot');
    original.battle.simulationRange = { startFrame: 0, endFrame: 300 };
    original.tracks[0] = {
      id: 'track:1',
      operator: {
        operatorSlug: 'perlica',
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 0,
        skillLevels: { basicAttack: 1, battleSkill: 1, comboSkill: 1, ultimate: 1 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const receipt: CombatReceiptEntry = {
      sequence: 1,
      frame: 90,
      time: 3,
      event: 'DamageApplied',
      sourceId: 'track:1',
      targetId: 'enemy',
      data: { value: 300, damageType: 'electric' },
    };
    const published = shallowRef<PublishedScenarioSimulation | null>({
      scenario: original,
      // 本投影只读取回执，完整模拟发布单元由 useScenarioSimulation 的测试覆盖。
      run: {
        receiptHistory: historyOf([receipt]),
      } as unknown as PublishedScenarioSimulation['run'],
    });
    const analysis = computed(() =>
      projectPublishedTimelineDamageAnalysis(published.value, String, String),
    );
    const edited = structuredClone(original);
    edited.tracks[0]!.operator!.operatorSlug = 'arclight';
    edited.battle.simulationRange!.startFrame = 60;
    // Waiting/failed runs retain this entire snapshot, not just its damage array.
    expect(analysis.value.byOperator[0]?.label).toBe('perlica');
    expect(analysis.value.dps).toBe(100);
    published.value = {
      scenario: edited,
      run: {
        receiptHistory: historyOf([receipt]),
      } as unknown as PublishedScenarioSimulation['run'],
    };
    expect(analysis.value.byOperator[0]?.label).toBe('arclight');
    expect(analysis.value.dps).toBe(300);
    published.value = null;
    expect(analysis.value.totalDamage).toBe(0);
    expect(analysis.value.byOperator).toEqual([]);
  });

  it('groups resolved damage by cast owner and type without capping to remaining health', () => {
    const scenario = createEmptyScenario('scenario:1', 'test');
    scenario.battle.prepFrames = 30;
    scenario.tracks[0] = {
      id: 'track:1',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        {
          id: 'cast:1',
          source: { kind: 'operatorSkill', skillGroupKey: 'g', skillKey: 's' },
          placement: { startFrame: 30 },
        },
      ],
    };
    const receipt = (frame: number, value: number, actualDamage: number): CombatReceiptEntry => ({
      frame,
      time: frame / 30,
      sequence: frame,
      event: 'DamageApplied',
      sourceId: 'ability-entity',
      targetId: 'enemy',
      data: {
        value,
        actualDamage,
        remainingHealth: 0,
        isCritical: false,
        damageType: 'heat',
        castId: 'cast:1',
      },
    });

    const result = projectTimelineDamageAnalysis(
      [receipt(60, 100, 10), receipt(90, 200, 0)],
      scenario,
      index => `干员 ${index + 1}`,
      type => type,
      () => '#112233',
      () => '#445566',
    );
    expect(result.totalDamage).toBe(300);
    expect(result.rotationSeconds).toBe(3);
    expect(result.dps).toBe(100);
    expect(result.byOperator[0]).toMatchObject({ label: '干员 1', value: 300, ratio: 1 });
    expect(result.byOperator[0]?.color).toBe('#112233');
    expect(result.byDamageType[0]).toMatchObject({
      key: 'heat',
      value: 300,
      color: '#445566',
    });
  });

  it('uses frame zero as the default analysis start and filters negative preparation damage', () => {
    const scenario = createEmptyScenario('scenario:1', 'test');
    scenario.battle.prepFrames = 30;
    const entries: CombatReceiptEntry[] = [
      {
        frame: -10,
        time: -1 / 3,
        sequence: 1,
        event: 'DamageApplied',
        sourceId: 'unknown',
        targetId: 'enemy',
        data: { value: 50, damageType: 'physical' },
      },
      {
        frame: 60,
        time: 2,
        sequence: 2,
        event: 'DamageApplied',
        sourceId: 'unknown',
        targetId: 'enemy',
        data: { value: 80, damageType: 'physical' },
      },
    ];
    const result = projectTimelineDamageAnalysis(entries, scenario, String, String);
    expect(result.totalDamage).toBe(80);
    expect(result.unattributedDamage).toBe(80);
  });

  it('honors an explicit negative simulation start inside the preparation range', () => {
    const scenario = createEmptyScenario('scenario:1', 'test');
    scenario.battle.prepFrames = 30;
    scenario.battle.simulationRange = { startFrame: -15 };
    const entries: CombatReceiptEntry[] = [
      {
        frame: -20,
        time: -2 / 3,
        sequence: 1,
        event: 'DamageApplied',
        sourceId: 'unknown',
        targetId: 'enemy',
        data: { value: 50, damageType: 'physical' },
      },
      {
        frame: -10,
        time: -1 / 3,
        sequence: 2,
        event: 'DamageApplied',
        sourceId: 'unknown',
        targetId: 'enemy',
        data: { value: 80, damageType: 'physical' },
      },
    ];
    const result = projectTimelineDamageAnalysis(entries, scenario, String, String);
    expect(result.totalDamage).toBe(80);
    expect(result.rotationSeconds).toBeCloseTo(5 / 30);
  });
});
