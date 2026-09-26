import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import type {
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { CombatStepForKind } from '../../../../packages/game-data-contract/src/actions';
import { describe, expect, it } from 'vitest';
import type { OperatorDefinition, SkillType } from '../../../core/game-data/operatorDefinition';
import type { WeaponDefinition } from '../../../core/game-data/equipmentDefinition';
import { createEmptyScenario } from '../../../core/project/createProject';
import { generatedWeaponDefinitions } from '../../../data/equipment/generated-weapons/index.generated';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { skillSettings } from '../../../data/combat/skillSettings';
import { daPan } from '../../../data/operators/da-pan.generated';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';

function findSkill(operator: OperatorDefinition, key: string): SkillDefinition {
  for (const group of operator.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing skill: ${key}`);
}
const daPanComboSkill = findSkill(daPan, 'chr_0018_dapan_combo_skill');

/** 一条按帧排程的探针步骤链；节点归属在 simulate 中显式铺入技能图。 */
interface ProbeSequence {
  readonly startFrame: number;
  readonly steps: readonly ActionGraphStep[];
}

/** 把一条纯线性 ActionGraphStep 链铺成同图节点并返回入口身份。 */
function linearChain(
  prefix: string,
  steps: readonly ActionGraphStep[],
): { readonly nodes: Record<string, ActionGraphNode>; readonly entry: string | null } {
  const nodes: Record<string, ActionGraphNode> = {};
  steps.forEach((action, index) => {
    nodes[`${prefix}-${index}`] = {
      action,
      next: index + 1 < steps.length ? `${prefix}-${index + 1}` : null,
    };
  });
  return { nodes, entry: steps.length === 0 ? null : `${prefix}-0` };
}

// 受控排程只隔离输入；真实公共破防/猛击定义、武器安装、事件、消费和伤害均经生产管线。
describe('生成武器的目标状态与层数伤害分支', () => {
  it.each([0, 1, 3, 4])('猛击前读取敌人 %i 层破防，而不是 Buff 实例数', async layers => {
    const crush = createCrushProbe();
    for (const tier of [1, 9]) {
      const sequences: ProbeSequence[] = [
        {
          startFrame: 1,
          steps: Array.from({ length: layers }, () => ({
            kind: 'applyBuff' as const,
            parameters: {
              buffId: crush.parameters.noGuardBuffId,
              target: 'enemy' as const,
            },
          })),
        },
        { startFrame: 60, steps: [crush] },
        ...[31, 61, 1001].map(frame => hit(frame, 'physical')),
      ];
      const { active, baseline } = await simulate('wpn_claym_0017', tier, sequences);
      const gains = active.filter(
        entry =>
          entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_claym_0017_dmgup2',
      );
      expect(gains).toHaveLength(layers > 0 ? 1 : 0);
      if (layers > 0)
        expect(gains[0]).toMatchObject({
          frame: 61,
          sourceId: 'track:state-owner',
          targetId: 'track:state-owner',
        });
      const expected =
        layers === 0 ? 0 : tier === 1 ? 0.09 + 0.03 * layers : 0.252 + 0.084 * layers;
      assertProbeDeltas(active, baseline, [0, expected, 0]);
    }
  });

  it('持有者自己有破防，敌人没有：不能通过敌方层数条件', async () => {
    const crush = createCrushProbe();
    const { active, baseline } = await simulate('wpn_claym_0017', 9, [
      {
        startFrame: 1,
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: crush.parameters.noGuardBuffId,
              target: 'caster',
            },
          },
        ],
      },
      { startFrame: 60, steps: [crush] },
      hit(61, 'physical'),
    ]);
    expect(
      active.some(
        entry =>
          entry.event === 'BuffApplied' && entry.data?.buffId === 'buff_wpn_claym_0017_dmgup2',
      ),
    ).toBe(false);
    assertProbeDeltas(active, baseline, [0]);
  });

  it.each([true, false])(
    '寒冷附着 %s：输出前增益影响后续 hit，不追溯已计算伤害，冻结不冒充寒冷附着',
    async attachment => {
      for (const tier of [1, 9]) {
        const { active, baseline } = await simulate('wpn_claym_0013', tier, [
          {
            startFrame: 1,
            steps: (attachment ? (['cryo'] as const) : (['electric', 'cryo'] as const)).map(
              element => ({
                kind: 'applyElementalInfliction' as const,
                parameters: { element, isExtra: false },
              }),
            ),
          },
          hit(31, 'cryo', 'comboSkill'),
          hit(32, 'cryo'),
          hit(501, 'cryo'),
        ]);
        expect(
          active.filter(
            entry =>
              entry.event === 'BuffApplied' &&
              entry.data?.buffId === 'buff_wpn_claym_0013_combo_skill',
          ),
        ).toHaveLength(attachment ? 1 : 0);
        assertProbeDeltas(active, baseline, [0, attachment ? (tier === 1 ? 0.2 : 0.56) : 0, 0]);
      }
    },
  );
});

function createCrushProbe(): CombatStepForKind<'applyPhysicalInfliction'> {
  const nodes = daPanComboSkill.actionGraph.main.nodes;
  for (const node of Object.values(nodes)) {
    if (node.action.kind === 'applyPhysicalInfliction' && node.action.parameters.type === 'crush') {
      const { noGuardBuffId, crushedBuffId, damageMultiplier, ignoreHitEffect } =
        node.action.parameters;
      // 层数由夹具手动施加；内联 Buff 定义不带程序字段，避免复制大潘自己的图节点引用。
      return {
        kind: 'applyPhysicalInfliction',
        parameters: {
          target: 'enemy',
          isExtra: false,
          noGuardBuffId,
          noGuardDefinition: {
            stackingType: 'enhanceAndRefresh',
            priority: 100,
            maxStackCount: 4,
            durationSeconds: 2,
          },
          type: 'crush',
          crushedBuffId,
          crushedDefinition: { stackingType: 'refresh', durationSeconds: 2 },
          damageMultiplier,
          ignoreHitEffect,
        },
      };
    }
  }
  throw new Error('fixture requires a production Crush step');
}

function hit(
  frame: number,
  damageType: 'physical' | 'cryo',
  tag: 'normalAttack' | 'comboSkill' = 'normalAttack',
): ProbeSequence {
  return {
    startFrame: frame,
    steps: [
      {
        key: `probe-${frame}`,
        kind: 'dealDamage',
        parameters: { damageType, attackScale: 1, tags: [tag] },
      },
    ],
  };
}

function assertProbeDeltas(
  active: Awaited<ReturnType<typeof simulate>>['active'],
  baseline: typeof active,
  deltas: readonly number[],
) {
  const hits = active.filter(
    entry =>
      entry.event === 'DamageApplied' &&
      typeof entry.data?.stepKey === 'string' &&
      entry.data.stepKey.startsWith('probe-'),
  );
  expect(hits).toHaveLength(deltas.length);
  hits.forEach((entry, index) => {
    expect(entry.data?.hitId).toBeTypeOf('string');
    const before = baseline.find(
      other => other.event === 'DamageApplied' && other.data?.hitId === entry.data?.hitId,
    )!;
    expect(before).toBeDefined();
    expect(
      Number(entry.data?.damageScaleMultiplier) - Number(before.data?.damageScaleMultiplier),
      `frame ${entry.frame}`,
    ).toBeCloseTo(deltas[index]!, 6);
    if (deltas[index]! > 0)
      expect(Number(entry.data?.nonCriticalDamage)).toBeGreaterThan(
        Number(before.data?.nonCriticalDamage),
      );
    else expect(entry.data?.nonCriticalDamage).toBe(before.data?.nonCriticalDamage);
  });
}

async function simulate(slug: string, tier: number, sequences: readonly ProbeSequence[]) {
  const weapon: WeaponDefinition = generatedWeaponDefinitions.find(item => item.slug === slug)!;
  const base = gameDataRepository.getOperator('da-pan')!;
  const operator: OperatorDefinition = {
    slug: 'weapon-state-fixture',
    gameId: 'weapon-state-fixture',
    rarity: 6,
    weaponType: 'greatsword',
    element: 'physical',
    role: base.role,
    attributes: base.attributes,
    mainAttribute: base.mainAttribute,
    secondaryAttribute: base.secondaryAttribute,
    talents: [],
    potentials: [],
    skillSlots: [],
    playerActionRoutes: {
      basicAttack: { kind: 'basicAttack', skillKeys: ['probe'], defaultSkillKey: 'probe' },
    },
    skillGroups: [
      {
        key: 'basicAttack',
        skillType: 'basicAttack' as SkillType,
        levelSource: 'basicAttack',
        skills: (() => {
          const nodes: Record<string, ActionGraphNode> = {};
          const scheduledSequences = [...sequences]
            .sort((a, b) => a.startFrame - b.startFrame)
            .map((probe, index) => {
              const chain = linearChain(`seq${index}`, probe.steps);
              Object.assign(nodes, chain.nodes);
              return { startFrame: probe.startFrame, sequence: { $sequence: chain.entry } };
            });
          const probe: SkillDefinition = {
            skillType: 'basicAttack' as const,
            levelSource: 'basicAttack' as const,
            key: 'state-probe',
            // 保留大潘原始猛击参数，不为 fixture 猜 crush_multi。
            blackboard: daPanComboSkill.blackboard,
            timelineBlockFrames: 1050,
            scheduledSequences,
            actionGraph: {
              main: {
                nodes,
                ...(daPanComboSkill.actionGraph.main.dataNodes === undefined
                  ? {}
                  : { dataNodes: daPanComboSkill.actionGraph.main.dataNodes }),
              },
              macros: {},
            },
          };
          return probe;
        })(),
      },
    ],
  };
  let scenario = createEmptyScenario('weapon-state', '武器目标状态生产回归');
  scenario.battle.durationFrames = 1100;
  scenario.enemy.editable.hp = 1_000_000_000;
  scenario.tracks[0] = {
    id: 'track:state-owner',
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 0,
      skillLevels: { basicAttack: 1 },
      talentStates: {},
    },
    weapon: {
      weaponSlug: slug,
      level: 90,
      tuned: true,
      potential: 5,
      traitLevels: weapon.traits.map(() => tier),
    },
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0, maxUltimateEnergyOverride: 100 },
    skillCasts: [],
  };
  let id = 0;
  scenario = placeSkillGroup({
    scenario,
    trackIndex: 0,
    operator,
    skillGroupKey: 'basicAttack',
    startFrame: 1,
    ids: { allocate: kind => `${kind}:state:${id++}` },
  }).scenario;
  const run = async (definition: WeaponDefinition) =>
    (
      await new ScenarioSimulationService({
        index: {
          ...gameDataRepository,
          getOperator: key => (key === operator.slug ? operator : null),
          getWeapon: key => (key === slug ? definition : null),
        },
        repositoryRevision: gameDataRepository.revision,
        resources: {
          sharedSpGain: { baseGainEfficiency: 1 },
          spRecoveryPauseDuration: 1.5,
          ultimateEnergySystemUnlocked: true,
          normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
        },
        spellInflictionSettings: skillSettings,
      }).simulate(scenario, 1100)
    ).receiptEntries;
  return {
    active: await run(weapon),
    baseline: await run({
      ...weapon,
      traits: weapon.traits.map(({ eventHandlers: _events, ...trait }) => trait),
    }),
  };
}
