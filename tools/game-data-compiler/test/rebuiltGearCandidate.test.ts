import { equipmentFixture } from './sourceFixtures.ts';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  generateGearDefinitions,
  planGearDefinitions,
} from '../scripts/generateGearDefinitions.ts';
import { loadSourceCatalog } from '../scripts/downloadGameDataSources.ts';
import { verifyGameDataSnapshot } from '../scripts/verifyGameDataSnapshot.ts';
import { validateGearDefinition } from '../../../src/core/game-data/equipmentDefinitionValidation';
import { compileGearContributions } from '../../../src/core/compiler/compileEquipment';
import { compileScenarioEquipment } from '../../../src/core/compiler/compileScenarioEquipment';
import { createEmptyScenario } from '../../../src/core/project/createProject';
import type { GearDefinition } from '../../../src/core/game-data/equipmentDefinition';
import { OPERATOR_ATTRIBUTES } from '../../../packages/game-data-contract/src/primitives.ts';
import { commonBuffDefinitions } from '../../../src/data/buffs/commonDefinitions';
import { perlica } from '../../../src/data/operators/perlica.generated';
import { skillSettings } from '../../../src/data/combat/skillSettings';
import { placeSkillGroup } from '../../../src/ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../../../src/application/simulation/scenarioSimulationService';

// 配装兼容性门禁：干员/公共规则仍用已验证正式基线，不冒充全资源无旧数据重建。
// 默认用构造的最小装备表行；指定完整报告时逐件验证该批候选，不复制其文件到正式目录。
const reportPath = process.env.ENDAXIS_GAME_DATA_REBUILD_REPORT;
let temporary: string | undefined;
let tablesDirectory: string;
if (reportPath) {
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const sourceStage = report.stages.find((s: { id: string }) => s.id === 'sources');
  const gearStage = report.stages.find((s: { id: string }) => s.id === 'gears');
  if (sourceStage?.status !== 'passed' || gearStage?.status !== 'passed')
    throw new Error('report has no valid source/gear candidate');
  const snapshot = await verifyGameDataSnapshot(
    report.sourceRoot,
    await loadSourceCatalog('tools/game-data-compiler/game-data-sources.json'),
  );
  if (snapshot.snapshotSha256 !== sourceStage.detail.snapshotSha256)
    throw new Error('candidate input snapshot no longer matches report');
  tablesDirectory = path.join(report.sourceRoot, 'TableCfg-current');
  await generateGearDefinitions({
    tablesDirectory,
    outputDirectory: gearStage.detail.outputDirectory,
    check: true,
  });
} else {
  const fixture = equipmentFixture();
  temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-gear-runtime-'));
  tablesDirectory = temporary;
  await fs.writeFile(
    path.join(temporary, 'EquipTable.json'),
    JSON.stringify({ [fixture.equipmentId]: fixture.equipTableEntry }),
  );
  await fs.writeFile(
    path.join(temporary, 'ItemTable.json'),
    JSON.stringify({ [fixture.equipmentId]: fixture.itemTableEntry }),
  );
}
afterAll(async () => {
  if (temporary) await fs.rm(temporary, { recursive: true, force: true });
});

const { batch } = await planGearDefinitions(tablesDirectory);
const candidates: readonly GearDefinition[] = batch.definitions;
if (!candidates.length) throw new Error('empty gear candidate cannot pass coverage');
const candidateById = new Map(candidates.map(gear => [gear.slug, gear]));
const index = {
  getOperator: (slug: string) => (slug === perlica.slug ? perlica : null),
  getWeapon: () => null,
  getGearSet: () => null,
  getCommonBuffDefinitions: () => commonBuffDefinitions,
  getGear: (slug: string) => candidateById.get(slug) ?? null,
};
const attributePairs = OPERATOR_ATTRIBUTES.flatMap(main =>
  OPERATOR_ATTRIBUTES.map(secondary => ({ main, secondary })),
);
const cases = candidates.flatMap(gear =>
  (['minimum', 'maximum'] as const).map(tier => ({ gear, tier })),
);

describe('重建单件装备候选与当前运行时兼容性（不证明新版套装闭合）', () => {
  it.each(candidates)('$slug 严格契约与所有主副属性组合均可编译', gear => {
    expect(validateGearDefinition(gear)).toEqual([]);
    for (const attributes of attributePairs) {
      for (const levels of [
        gear.traits.map(() => 0),
        gear.traits.map(trait => trait.levelCount - 1),
      ]) {
        const contributions = compileGearContributions(gear, levels, attributes);
        expect(contributions).toHaveLength(gear.traits.length);
        for (const contribution of contributions) {
          expect(contribution.source).toMatchObject({ kind: 'gearTrait', slug: gear.slug });
          expect(contribution.modifiers.every(modifier => Number.isFinite(modifier.value))).toBe(
            true,
          );
        }
      }
    }
  });

  it.each(cases)('$gear.slug / $tier 单件装配、上轴普攻和实际伤害结算', async ({ gear, tier }) => {
    const scenario = createEmptyScenario(`gear-candidate:${gear.slug}:${tier}`, '隔离装备兼容性');
    scenario.battle.durationFrames = 300;
    scenario.enemy.editable.hp = 1_000_000_000;
    const slot = gear.slotType === 'accessory' ? 'accessory1' : gear.slotType;
    scenario.tracks[0] = {
      id: 'gear-candidate-track',
      operator: {
        operatorSlug: perlica.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { 0: 0, 1: 0 },
      },
      weapon: null,
      gears: {
        armor: null,
        gloves: null,
        accessory1: null,
        accessory2: null,
        [slot]: {
          gearSlug: gear.slug,
          artificingLevels: gear.traits.map(trait =>
            tier === 'minimum' ? 0 : trait.levelCount - 1,
          ),
        },
      },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };
    const [equipment] = compileScenarioEquipment(scenario, index);
    expect(equipment?.contributions).toHaveLength(gear.traits.length);
    let nextId = 0;
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator: perlica,
      skillGroupKey: 'basicAttack',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:${++nextId}` },
    }).scenario;
    const service = new ScenarioSimulationService({
      index,
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
      spellInflictionSettings: skillSettings,
    });
    const result = await service.simulate(placed, 300);
    expect(Number.isFinite(result.finalEnemyHealth)).toBe(true);
    expect(result.finalEnemyHealth).toBeLessThan(scenario.enemy.editable.hp);
    expect(result.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
  });
});
