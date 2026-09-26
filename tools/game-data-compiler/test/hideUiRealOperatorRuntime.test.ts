import path from 'node:path';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { planOperatorDefinition } from '../scripts/planOperatorDefinition.ts';
import { ScenarioSimulationService } from '../../../src/application/simulation/scenarioSimulationService';
import { ActionGraphDefinitionRepository } from '../../../src/core/compiler/actionGraphDefinitionRepository';
import { createEmptyScenario } from '../../../src/core/project/createProject';
import { placeSkillGroup } from '../../../src/ui/timeline/interaction/placeSkillGroup';
import { skillSettings } from '../../../src/data/combat/skillSettings';
import { generatedSkillSettings } from '../../../src/data/combat/skillSettings.generated';
import { verifyGameDataSnapshot } from '../scripts/verifyGameDataSnapshot.ts';
import { loadSourceCatalog } from '../scripts/downloadGameDataSources.ts';

// 显式真实来源门禁；普通单测不依赖本机 tmp，也不以正式干员产物补空。
const sourceRoot = process.env.ENDAXIS_HIDE_UI_SOURCE_ROOT;
const globalBuffCatalog = process.env.ENDAXIS_HIDE_UI_GLOBAL_BUFF_CATALOG;
const expectedEnds: Readonly<Record<string, number>> = { perlica: 52, arclight: 55 };
const slugs: string[] =
  process.env.ENDAXIS_HIDE_UI_ALL_OPERATORS === '1'
    ? JSON.parse(
        fs.readFileSync('tools/game-data-compiler/config/operators.json', 'utf8'),
      ).operators.map((operator: { slug: string }) => operator.slug)
    : ['perlica', 'arclight'];
describe.skipIf(!sourceRoot || !globalBuffCatalog)('真实整名 HideUI 转换与生产模拟', () => {
  it.each(slugs)(
    '%s 保留演出区间并进入正式回执',
    async slug => {
      const root = sourceRoot!;
      const snapshot = await verifyGameDataSnapshot(
        root,
        await loadSourceCatalog('tools/game-data-compiler/game-data-sources.json'),
      );
      // 52/55 帧仅是这批来源的断言，更新包体后必须重新核对，不能沿用旧数字。
      expect(snapshot.snapshotSha256).toBe(
        'e5944e88357583d2e4ebf6775decaf2b23afa2813b879c67688ee3c261a395df',
      );
      const skillSettingCatalog = path.join('tmp/hide-ui-probe', 'skill-setting.catalog.json');
      fs.mkdirSync(path.dirname(skillSettingCatalog), { recursive: true });
      fs.writeFileSync(skillSettingCatalog, JSON.stringify(generatedSkillSettings));
      const candidate = planOperatorDefinition({
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
        output: path.join('tmp/hide-ui-probe', slug),
        auditOutput: path.join('tmp/hide-ui-probe/audit', slug),
      });
      const operator = candidate.operator;
      const commonBuffDefinitions = candidate.commonBuffDefinitions;
      let scenario = createEmptyScenario('hide-ui-real', '真实来源演出区间');
      scenario.battle.durationFrames = 300;
      scenario.enemy.editable.hp = 1e9;
      scenario.tracks[0] = {
        id: 'track:probe',
        operator: {
          operatorSlug: slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: Object.fromEntries(
            operator.talents.map((talent, index) => [String(index), talent.levels]),
          ),
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
        skillCasts: [],
      };
      let serial = 0;
      scenario = placeSkillGroup({
        scenario,
        operator,
        trackIndex: 0,
        skillGroupKey: 'ultimate',
        startFrame: 0,
        ids: { allocate: kind => `${kind}:probe:${serial++}` },
      }).scenario;
      const result = await new ScenarioSimulationService({
        index: {
          actionPrograms: new ActionGraphDefinitionRepository(),
          getCommonDefinitionSources: () => [
            { id: 'shared', buffDefinitions: commonBuffDefinitions },
          ],
          getOperator: key => (key === slug ? operator : null),
          getCommonBuffDefinitions: () => commonBuffDefinitions,
          getWeapon: () => null,
          getGear: () => null,
          getGearSet: () => null,
        },
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
        spellInflictionSettings: skillSettings,
      }).simulate(scenario, 300);
      const intervals = result.receiptEntries
        .filter(entry => entry.event === 'UltimatePresentationChanged')
        .map(entry => [entry.frame, entry.data?.active]);
      const endFrame = expectedEnds[slug];
      if (endFrame !== undefined) {
        expect(intervals).toEqual([
          [0, true],
          [endFrame, false],
        ]);
        expect(result.receiptEntries.some(entry => entry.event === 'DamageApplied')).toBe(true);
      }
      // 整批模式是整名重建＋终结技放轴冒烟，不将未触发演出的变体算成演出覆盖。
      expect(intervals.filter(([, active]) => active === true).length).toBe(
        intervals.filter(([, active]) => active === false).length,
      );
    },
    120_000,
  );
});
