/**
 * 生成优化等价门禁：同一来源分别按 optimization: 'off' 与 'apply' 规划整名候选，
 * 双路真实模拟，命中、状态、资源、诊断和可见曲线必须一致。
 * 优化发生在独立资源图的规划阶段（planOperatorDefinition 内部）；
 * 因此对照必须在计划阶段取两套候选，不能用同一份已发布产物自比较（那只能证明模拟器确定性）。
 * 优化器语义本身由 definitionEntityUsageContext/skillValueOptimization 等夹具测试覆盖；
 * 本文件补的是真实来源上的端到端等价，需要本机来源快照，无来源时整组跳过。
 */
import path from 'node:path';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { planOperatorDefinition } from '../../scripts/planOperatorDefinition.ts';
import { verifyGameDataSnapshot } from '../../scripts/verifyGameDataSnapshot.ts';
import { loadSourceCatalog } from '../../scripts/downloadGameDataSources.ts';
import { ActionGraphDefinitionRepository } from '../../../../src/core/compiler/actionGraphDefinitionRepository.ts';
import { generatedSkillSettings } from '../../../../src/data/combat/skillSettings.generated.ts';
import type { GameDataRepository } from '../../../../src/core/game-data/gameDataRepository.ts';
import type { OperatorDefinition } from '../../../../packages/game-data-contract/src/operators.ts';

import { listOperatorSkillDefinitionBindings } from '../../../../src/core/game-data/operatorSkillDefinitions.ts';
import {
  createOptimizationRandomSamples,
  optimizationSimulationFacts as facts,
  optimizationSimulationScenario,
  optimizationSimulationService,
} from '../support/definitionOptimizationSimulation.ts';

const sourceRoot = process.env.ENDAXIS_HIDE_UI_SOURCE_ROOT;
const globalBuffCatalog = process.env.ENDAXIS_HIDE_UI_GLOBAL_BUFF_CATALOG;
const slugs: string[] =
  process.env.ENDAXIS_HIDE_UI_ALL_OPERATORS === '1'
    ? JSON.parse(
        fs.readFileSync('tools/game-data-compiler/config/operators.json', 'utf8'),
      ).operators.map((operator: { slug: string }) => operator.slug)
    : ['perlica', 'arclight'];

describe.skipIf(!sourceRoot || !globalBuffCatalog)('生成优化的双路模拟等价', () => {
  // 全批次累计的优化裁剪量；若优化器对真实来源完全不再生效，等价对比就退化成空转，必须显式失败。
  let totalReduction = 0;

  it.each(slugs)(
    '%s 的 off/apply 候选保持命中、状态、资源、诊断和可见曲线',
    async slug => {
      const root = sourceRoot!;
      await verifyGameDataSnapshot(
        root,
        await loadSourceCatalog('tools/game-data-compiler/game-data-sources.json'),
      );
      const skillSettingCatalog = path.join(
        'tmp/optimization-differential',
        'skill-setting.catalog.json',
      );
      fs.mkdirSync(path.dirname(skillSettingCatalog), { recursive: true });
      fs.writeFileSync(skillSettingCatalog, JSON.stringify(generatedSkillSettings));
      const planInput = {
        manifest: 'tools/game-data-compiler/config/operators.json',
        sourceRoot: root,
        tableRoot: path.join(root, 'TableCfg-current'),
        skillPatchTable: path.join(root, 'TableCfg-current/SkillPatchTable.json'),
        buffDataRoot: path.join(root, 'BuffData'),
        gameplayTagCatalog: 'src/data/combat/gameplayTagCatalog.generated.ts',
        timeDilationCatalog: 'src/data/combat/timeDilationCatalog.generated.ts',
        globalBuffCatalog: globalBuffCatalog!,
        skillSettingCatalog,
        slug,
        output: path.join('tmp/optimization-differential', slug),
        auditOutput: path.join('tmp/optimization-differential/audit', slug),
      };
      const off = planOperatorDefinition({ ...planInput, optimization: 'off' });
      const applied = planOperatorDefinition({ ...planInput, optimization: 'apply' });
      const report = applied.audit.optimization;
      expect(report.after.steps).toBeLessThanOrEqual(report.before.steps);
      expect(report.after.conditions).toBeLessThanOrEqual(report.before.conditions);
      totalReduction += report.before.steps - report.after.steps;

      const originalOperator = off.operator;
      const appliedOperator = applied.operator;
      const bindingKeys = (operator: OperatorDefinition) =>
        listOperatorSkillDefinitionBindings(operator).map(
          binding => `${binding.group.key}/${binding.skill.key}/${binding.variant?.key ?? ''}`,
        );
      expect(bindingKeys(appliedOperator)).toEqual(bindingKeys(originalOperator));
      const originalBuffs = off.commonBuffDefinitions;
      const appliedBuffs = applied.commonBuffDefinitions;
      const indexOf = (operator: OperatorDefinition, buffs: typeof originalBuffs) =>
        ({
          actionPrograms: new ActionGraphDefinitionRepository(),
          getCommonDefinitionSources: () => [{ id: 'shared', buffDefinitions: buffs }],
          getOperator: (key: string) => (key === slug ? operator : null),
          getCommonBuffDefinitions: () => buffs,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        }) as unknown as GameDataRepository;

      for (const [level, potential] of [
        [1, 0],
        [12, 5],
      ] as const) {
        const scenario = optimizationSimulationScenario(appliedOperator, level, potential);
        const originalInput = structuredClone(scenario);
        const originalRandom = createOptimizationRandomSamples();
        const appliedRandom = createOptimizationRandomSamples();
        const original = await optimizationSimulationService(
          indexOf(originalOperator, originalBuffs),
          originalRandom,
        ).simulate(scenario, scenario.battle.durationFrames);
        const appliedRun = await optimizationSimulationService(
          indexOf(appliedOperator, appliedBuffs),
          appliedRandom,
        ).simulate(structuredClone(scenario), scenario.battle.durationFrames);
        expect(scenario).toEqual(originalInput);
        expect(
          original.receiptEntries.filter(entry => entry.event === 'DamageApplied').length,
        ).toBeGreaterThan(0);
        expect(facts(appliedRun)).toEqual(facts(original));
        expect(appliedRandom.counts()).toEqual(originalRandom.counts());
      }
    },
    120_000,
  );

  it('优化器对本批真实候选确有裁剪，等价对比不是空转', () => {
    expect(totalReduction).toBeGreaterThan(0);
  });
});
