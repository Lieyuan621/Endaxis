import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileAllGearSetDefinitions } from '../scripts/generateGearSetDefinitions.ts';
import { planGearDefinitions } from '../scripts/generateGearDefinitions.ts';
import { loadSourceCatalog } from '../scripts/downloadGameDataSources.ts';
import { verifyGameDataSnapshot } from '../scripts/verifyGameDataSnapshot.ts';
import { readGameplayTagPaths } from '../scripts/readGameplayTagPaths.ts';
import { generateGameplayTagCatalog } from '../scripts/generateGameplayTagCatalog.ts';
import { readGameplayTagConfigSetExport } from '../scripts/readGameplayTagConfigSetExport.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';
import type {
  GearSetDefinition,
  GearDefinition,
} from '../../../packages/game-data-contract/src/equipment.ts';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators.ts';
import type { InflictionElement } from '../../../packages/game-data-contract/src/primitives.ts';
import { validateGearSetDefinition } from '../../../src/core/game-data/equipmentDefinitionValidation';
import { createSkillEditorStep } from '../../../src/ui/timeline/definitions/skills/skillDefinitionEditorViewModel';
import { createCombatCondition } from '../../../src/ui/timeline/definitions/actions/combatConditionEditorViewModel';
import { createEmptyScenario } from '../../../src/core/project/createProject';
import { compileScenarioEquipment } from '../../../src/core/compiler/compileScenarioEquipment';
import { perlica } from '../../../src/data/operators/perlica.generated';
import { getSkill } from '../../../src/data/operators/testUtils';
import { commonBuffDefinitions } from '../../../src/data/buffs/commonDefinitions';
import { skillSettings } from '../../../src/data/combat/skillSettings';
import { placeSkillGroup } from '../../../src/ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../../../src/application/simulation/scenarioSimulationService';

it('全局冷却编辑器工厂输出通过公共定义校验', () => {
  const step = createSkillEditorStep(
    getSkill(perlica, 'chr_0004_pelica_normal_skill'),
    'setGlobalCooldown',
  );
  expect(
    validateGearSetDefinition({
      slug: 'fixture',
      modifiers: [],
      initializationSequence: {
        steps: [
          {
            kind: 'conditional',
            parameters: { condition: createCombatCondition('globalCooldownPresent') },
            whenTrue: { steps: [step] },
          },
        ],
      },
    }),
  ).toEqual([]);
});

// 新重建报告必须消费本批标签并复验；历史定位报告保留显式基线路径，不能冒充同批证明。
const reportPath = process.env.ENDAXIS_GEAR_SET_REBUILD_REPORT;
if (reportPath) {
  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  const snapshot = await verifyGameDataSnapshot(
    report.sourceRoot,
    await loadSourceCatalog('tools/game-data-compiler/game-data-sources.json'),
  );
  if (
    snapshot.snapshotSha256 !==
    report.stages.find((s: { id: string }) => s.id === 'sources')?.detail.snapshotSha256
  )
    throw new Error('source snapshot changed');
  const tagStage = report.stages.find((s: { id: string }) => s.id === 'gameplay-tags');
  let tagCatalog = 'src/data/combat/gameplayTagCatalog.generated.ts';
  if (tagStage) {
    if (tagStage.status !== 'passed') throw new Error('candidate GameplayTag export did not pass');
    const sourceSet = readGameplayTagConfigSetExport(tagStage.detail.manifestPath);
    if (sourceSet.sourceSha256 !== tagStage.detail.sourceSha256)
      throw new Error('candidate GameplayTag source changed');
    tagCatalog = path.join(report.candidateRoot, 'src/data/combat/gameplayTagCatalog.generated.ts');
    await generateGameplayTagCatalog({
      dump: tagStage.detail.manifestPath,
      output: tagCatalog,
      sourceRoot: undefined,
      sourceSet: true,
      allowNewSource: true,
      check: true,
    });
  }
  const read = async (relative: string) =>
    JSON.parse(await fs.readFile(path.join(report.sourceRoot, relative), 'utf8'));
  const collection = async (name: string) =>
    Object.fromEntries(
      await Promise.all(
        (await fs.readdir(path.join(report.sourceRoot, name))).map(async file => [
          path.basename(file, '.json'),
          await read(`${name}/${file}`),
        ]),
      ),
    );
  const batch = compileAllGearSetDefinitions(
    await read('TableCfg-current/EquipSuitTable.json'),
    await collection('SkillData'),
    await read('TableCfg-current/SkillPatchTable.json'),
    await collection('BuffData'),
    new GameplayTagRegistry(readGameplayTagPaths(tagCatalog)),
  );
  if (batch.diagnostics.some(d => d.status === 'blocked'))
    throw new Error(JSON.stringify(batch.diagnostics));
  const candidates: readonly GearSetDefinition[] = batch.definitions;
  const gears: readonly GearDefinition[] = (
    await planGearDefinitions(path.join(report.sourceRoot, 'TableCfg-current'))
  ).batch.definitions;

  async function simulate(
    set: GearSetDefinition,
    element: InflictionElement = 'cryo',
    runtime = true,
  ) {
    // 专用测试操作：同帧重复附着、冷却后再次附着，验证真实套装回调；不修改或冒充正式干员技能。
    const operator: OperatorDefinition = {
      ...perlica,
      slug: 'cooldown-test',
      comboSkillConditions: undefined,
      skillSlots: [{ key: 'battleSkill', baseSkillKey: 'battleSkill', replacementSkillKeys: [] }],
      playerActionRoutes: { battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' } },
      playerActionModes: undefined,
      skillGroups: [
        {
          key: 'battleSkill',
          skillType: 'battleSkill',
          levelSource: 'battleSkill',
          skills: {
            key: 'battleSkill',
            skillType: 'battleSkill',
            levelSource: 'battleSkill',
            timelineBlockFrames: 60,
            costFrame: 0,
            costs: [],
            scheduledSequences: [0, 6, 12, 18].map(frame => ({
              startFrame: frame,
              endFrame: frame,
              sequence: {
                steps: Array.from({ length: 4 }, () => ({
                  kind: 'applyElementalInfliction' as const,
                  parameters: { element, isExtra: false },
                })),
              },
            })),
          },
        },
      ],
    };
    const pieces = gears.filter(g => g.gearSetSlug === set.slug);
    const chosen = ['armor', 'gloves', 'accessory'].map(slot =>
      pieces.find(g => g.slotType === slot),
    );
    if (chosen.some(g => g === undefined)) throw new Error(`missing source pieces: ${set.slug}`);
    const equipped = (gear: GearDefinition) => ({
      gearSlug: gear.slug,
      artificingLevels: gear.traits.map(() => 0),
    });
    const scenario = createEmptyScenario('candidate-suit', '候选套装');
    scenario.enemy.editable.hp = 1e9;
    scenario.battle.durationFrames = 720;
    scenario.tracks[0] = {
      id: 'wearer',
      operator: {
        operatorSlug: operator.slug,
        level: 90,
        promoted: true,
        potential: 0,
        trustLevel: 4,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: {},
      },
      weapon: null,
      gears: {
        armor: equipped(chosen[0]!),
        gloves: equipped(chosen[1]!),
        accessory1: equipped(chosen[2]!),
        accessory2: null,
      },
      initialState: { ultimateEnergy: 0, maxUltimateEnergyOverride: 100 },
      skillCasts: [],
    };
    const index = {
      getOperator: (slug: string) => (slug === operator.slug ? operator : null),
      getWeapon: () => null,
      getGear: (slug: string) => gears.find(g => g.slug === slug) ?? null,
      getGearSet: (slug: string) =>
        slug === set.slug
          ? runtime
            ? set
            : {
                ...set,
                enableSequence: undefined,
                initializationSequence: undefined,
                buffDefinitions: undefined,
              }
          : null,
      getCommonBuffDefinitions: () => commonBuffDefinitions,
    };
    expect(
      compileScenarioEquipment(scenario, index)[0]?.contributions.some(
        c => c.source.kind === 'gearSet',
      ),
    ).toBe(true);
    let id = 0;
    const placed = placeSkillGroup({
      scenario,
      trackIndex: 0,
      operator,
      skillGroupKey: 'battleSkill',
      startFrame: 1,
      ids: { allocate: kind => `${kind}:${++id}` },
    }).scenario;
    return new ScenarioSimulationService({
      index,
      spellInflictionSettings: skillSettings,
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
    }).simulate(placed, 720);
  }

  describe('完整来源套装候选 / 基线标签兼容性（非发布门禁）', () => {
    it.each(candidates)('$slug 契约、真实三件装备激活及爆发场景模拟', async set => {
      expect(validateGearSetDefinition(set)).toEqual([]);
      const result = await simulate(set);
      expect(Number.isFinite(result.finalEnemyHealth)).toBe(true);
      expect(result.receiptEntries.some(e => e.event === 'SpellBurstApplied')).toBe(true);
    });
    it.each(['cryo', 'nature', 'electric'] as const)(
      'suit_spellburst / %s 事件过滤、同帧冷却、叠层和伤害差分',
      async element => {
        const set = candidates.find(s => s.slug === 'suit_spellburst');
        if (!set) throw new Error('new suit missing');
        const active = await simulate(set, element),
          baseline = await simulate(set, element, false);
        const applied = active.receiptEntries.filter(
          e =>
            e.event === 'BuffApplied' &&
            e.data?.buffId === 'buff_equipsuit_spellburst_01_physpellup',
        );
        if (element === 'electric') {
          expect(applied).toHaveLength(0);
          expect(active.finalEnemyHealth).toBe(baseline.finalEnemyHealth);
        } else {
          expect(applied).toHaveLength(4);
          expect(new Set(applied.map(e => e.frame)).size).toBe(applied.length);
          expect(active.finalEnemyHealth).toBeLessThan(baseline.finalEnemyHealth);
          const ended = active.receiptEntries.filter(
            e =>
              e.event === 'BuffFinished' &&
              e.data?.buffId === 'buff_equipsuit_spellburst_01_physpellup' &&
              e.data?.reason === 'lifetime',
          );
          // 原生 Stack 是三个独立一层实例，不是一个 enhanceCount=3 的实例。
          expect(ended).toHaveLength(3);
          ended.forEach((entry, index) => {
            expect(entry.data).toMatchObject({ reason: 'lifetime', layers: 1 });
            expect(entry.time - applied[index + 1]!.time).toBeCloseTo(20, 1);
          });
          const firstActiveBurst = active.receiptEntries.find(e => e.event === 'SpellBurstApplied');
          const firstBaselineBurst = baseline.receiptEntries.find(
            e => e.event === 'SpellBurstApplied',
          );
          expect(Number(firstActiveBurst?.data?.value)).toBeGreaterThan(
            Number(firstBaselineBurst?.data?.value),
          );
        }
      },
    );
  });
}
