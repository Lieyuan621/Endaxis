import { describe, expect, it } from 'vitest';

import type {
  OperatorDefinition,
  SkillDefinition,
} from '../../../core/game-data/operatorDefinition';
import { listOperatorSkillDefinitionBindings } from '../../../core/game-data/operatorSkillDefinitions';
import { createEmptyScenario } from '../../../core/project/createProject';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { skillSettings } from '../../../data/combat/skillSettings';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { perlica } from '../../../data/operators/perlica.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';

interface RegisteredSkillPlacementCase {
  readonly operator: OperatorDefinition;
  readonly groupKey: string;
  readonly variantKey?: string;
  readonly skill: SkillDefinition;
}

const cases: readonly RegisteredSkillPlacementCase[] = gameDataRepository
  .getOperators()
  .flatMap(operator =>
    listOperatorSkillDefinitionBindings(operator)
      .filter(({ group, skill }) => group.replacementSkillPlacements?.[skill.key] !== 'internal')
      .map(({ group, skill, variant }) => ({
        operator,
        groupKey: group.key,
        ...(variant === undefined ? {} : { variantKey: variant.key }),
        skill,
      })),
  );

const resources = {
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecoveryPauseDuration: 1.5,
  ultimateEnergySystemUnlocked: true,
  normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
} as const;

/**
 * 已复现并完成首轮归因、但尚未闭合的基础构筑失败边界。
 * 新失败不能自动进入此表；已修复项也必须从表中删除，否则“预期失败”会反向让门禁报错。
 */
const knownFailures: Readonly<Record<string, string>> = {};

describe('所有正式干员技能逐项放置与模拟', () => {
  it('覆盖默认仓库中的每个干员和每个基础/变体技能', () => {
    expect(cases.length).toBeGreaterThan(0);
    expect([...new Set(cases.map(entry => entry.operator.slug))].sort()).toEqual(
      gameDataRepository
        .getOperators()
        .map(operator => operator.slug)
        .sort(),
    );
    expect(Object.keys(knownFailures)).toHaveLength(0);
    expect(
      new Set(
        cases.map(
          entry =>
            `${entry.operator.slug}/${entry.groupKey}/${entry.variantKey ?? '-'}/${entry.skill.key}`,
        ),
      ).size,
    ).toBe(cases.length);
    expect(
      Object.keys(knownFailures).every(identity =>
        cases.some(entry => skillIdentity(entry) === identity),
      ),
    ).toBe(true);
  });

  it.each(cases)(
    '$operator.slug / $groupKey / $variantKey / $skill.key 可以在最小合法上下文中放上时间轴并跑完整模拟',
    async ({ operator, groupKey, variantKey, skill }) => {
      const scenario = createEmptyScenario(
        `audit:${operator.slug}:${groupKey}:${variantKey ?? 'base'}:${skill.key}`,
        '全技能运行门禁',
      );
      scenario.battle.durationFrames = 3600;
      scenario.enemy.editable.hp = 1_000_000_000;
      scenario.battle.resourceRules = {
        maxSp: 1000,
        initialSp: 1000,
        spRecoveryPerSecond: 100,
        defaultSkillSpCost: 100,
      };
      scenario.tracks[0] = {
        id: `track:${operator.slug}`,
        operator: {
          operatorSlug: operator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: Object.fromEntries(operator.talents.map((_, index) => [index, 0])),
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 1000, maxUltimateEnergyOverride: 1000 },
        skillCasts: [],
      };
      scenario.tracks[1] = {
        id: 'track:audit-teammate',
        operator: {
          operatorSlug: perlica.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 4,
          skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
          talentStates: Object.fromEntries(perlica.talents.map((_, index) => [index, 0])),
        },
        weapon: null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0 },
        skillCasts: [],
      };
      const identity = skillIdentity({ operator, groupKey, variantKey, skill });
      const placementContext = placeRequiredSkillContext(scenario, identity, operator);
      const presentationEnd =
        groupKey !== 'ultimate'
          ? undefined
          : operator.slug === 'perlica'
            ? 52
            : operator.slug === 'arclight'
              ? 55
              : undefined;
      const startFrame = placementContext.startFrame;
      const placed = placeSkillGroup({
        scenario: placementContext.scenario,
        trackIndex: 0,
        operator,
        skillGroupKey: groupKey,
        ...(variantKey === undefined ? {} : { variantKey }),
        skillKey: skill.key,
        startFrame,
        ids: {
          allocate: kind =>
            `${kind}:${operator.slug}:${groupKey}:${variantKey ?? 'base'}:${skill.key}`,
        },
      }).scenario;
      const service = new ScenarioSimulationService({
        index: gameDataRepository,
        repositoryRevision: `${gameDataRepository.revision}:all-skill-placement-audit`,
        resources,
        elementalInflictionDocument: elementalAttachments,
        spellInflictionSettings: skillSettings,
      });

      const expectedFailure = knownFailures[identity];
      if (expectedFailure !== undefined) {
        await expect(service.simulate(placed, 3600)).rejects.toThrow(expectedFailure);
      } else {
        const result = await service.simulate(placed, 3600);
        expect(result).toBeDefined();
        // 1.5.3 真实来源的独立 HideUI 结束帧；不能用 UltimateTime 的 50/56 帧代替。
        // 固定正式产物门禁，避免只有需要本机来源的可选测试覆盖此链路。
        if (presentationEnd !== undefined) {
          expect(
            result.receiptEntries
              .filter(entry => entry.event === 'UltimatePresentationChanged')
              .map(entry => [entry.frame, entry.data?.active]),
          ).toEqual([
            [startFrame, true],
            [startFrame + presentationEnd, false],
          ]);
        }
      }
    },
  );
});

function skillIdentity(entry: RegisteredSkillPlacementCase): string {
  return `${entry.operator.slug}/${entry.groupKey}/${entry.variantKey ?? 'base'}/${entry.skill.key}`;
}

/** 只登记已有来源与生产回归证明的阶段前置，不为缺键技能猜造输入。 */
function placeRequiredSkillContext(
  scenario: ReturnType<typeof createEmptyScenario>,
  identity: string,
  operator: OperatorDefinition,
): { scenario: ReturnType<typeof createEmptyScenario>; startFrame: number } {
  if (identity === 'yvonne/basicAttack/enhancedBasicAttack/ultimateAttackEnd') {
    return {
      scenario: placeSkillGroup({
        scenario,
        trackIndex: 0,
        operator,
        skillGroupKey: 'ultimate',
        skillKey: 'ultimate',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:yvonne:ultimate:enhancement-prerequisite` },
      }).scenario,
      // 终结技第 61 局部帧开启强化；完整技能块在第 65 帧结束。
      startFrame: 66,
    };
  }
  return { scenario, startFrame: 1 };
}
