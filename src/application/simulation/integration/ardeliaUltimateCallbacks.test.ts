import { expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import { createEditorSimulationService } from '../testSupport/editorSimulationService';

it.each([0, 3])(
  '艾尔黛拉潜能%i终结技独立伤害不被治疗概率阻止，双路弹体共享敌方标记',
  async potential => {
    const scenario = createEmptyScenario('ardelia-callbacks', '独立弹体回调');
    scenario.tracks[0] = {
      id: 'ardelia',
      operator: {
        operatorSlug: 'ardelia',
        level: 90,
        promoted: true,
        potential,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 90 },
      skillCasts: [
        {
          id: 'ultimate',
          source: {
            kind: 'operatorSkill',
            skillGroupKey: 'ultimate',
            skillKey: 'chr_0025_ardelia_ultimate_skill',
          },
          placement: { startFrame: 1 },
        },
      ],
    };
    // 正式编辑器随机样本为1，10%留羊分支不触发，不篡改随机结果来补命中。
    const inputBefore = JSON.stringify(scenario);
    const run = await createEditorSimulationService().simulate(scenario, 400);
    expect(JSON.stringify(scenario)).toBe(inputBefore);
    expect(run.executionDiagnostics).toEqual([]);
    expect(
      run.receiptEntries.some(
        e =>
          e.event === 'CombatConditionEvaluated' &&
          e.data?.kind === 'probability' &&
          e.data?.passed === false,
      ),
    ).toBe(true);
    const hits = run.receiptEntries.filter(
      e => e.event === 'DamageApplied' && e.data?.castId === 'ultimate',
    );
    // 旧版手写5/6击不是原生发射次数。木桩中所有范围命中，仍必须受共享标记限频。
    expect(hits.length).toBeGreaterThan(potential >= 3 ? 6 : 5);
    expect(new Set(hits.map(e => e.frame)).size).toBe(hits.length);
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i]!.frame - hits[i - 1]!.frame).toBeGreaterThanOrEqual(9);
    }
    expect(
      run.receiptEntries.some(
        // 回执记录分支根条件not，而不是其内部timedMarkerPresent。
        e =>
          e.event === 'CombatConditionEvaluated' &&
          e.data?.kind === 'not' &&
          e.data?.passed === false,
      ),
    ).toBe(true);
    expect(
      hits.every(e => e.data?.skillMultiplierPercent === 165 && Number(e.data?.expectedDamage) > 0),
    ).toBe(true);
  },
);
