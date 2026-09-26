import { describe, expect, it } from 'vitest';

import type {
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import type { WeaponDefinition } from '../../../core/game-data/equipmentDefinition';
import type {
  InflictionElement,
  OperatorDefinition,
  ScheduledSequenceDefinition,
  SkillDefinition,
} from '../../../core/game-data/operatorDefinition';

function chainNodes(
  nodes: Record<string, ActionGraphNode>,
  prefix: string,
  steps: readonly ActionGraphStep[],
): ActionGraphReference {
  steps.forEach((action, index) => {
    nodes[`${prefix}-${index}`] = {
      action,
      next: index + 1 < steps.length ? `${prefix}-${index + 1}` : null,
    };
  });
  return { $sequence: steps.length === 0 ? null : `${prefix}-0` };
}
import { createEmptyScenario } from '../../../core/project/createProject';
import type { TrackDocument, TrackIndex } from '../../../core/project/schema';
import { skillSettings } from '../../../data/combat/skillSettings';
import { generatedWeaponDefinitions } from '../../../data/equipment/generated-weapons/index.generated';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { placeSkillGroup } from '../../../ui/timeline/interaction/placeSkillGroup';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { staticEquipmentContribution } from '../testSupport/staticEquipmentContribution';

// 边界测试使用受控技能排程，不冒充真实干员动作时序。武器、公共反应定义、装备安装、
// 附着消费、接收方 Buff 事件和最终 hit 全部走生产管线，不直接发布事件或手加武器 Buff。
// 遵循原生 Buff 与定时标记的生命周期规则。
describe('生成反应武器的连续触发生命周期', () => {
  it.each(
    [
      { slug: 'wpn_pistol_0005', accepted: ['freeze', 'corrosion'] },
      { slug: 'wpn_sword_0010', accepted: ['burn', 'corrosion'] },
    ].flatMap(weapon =>
      [
        { branch: 'freeze', elements: ['electric', 'cryo'], outcome: 'compoundStatus' },
        { branch: 'corrosion', elements: ['electric', 'nature'], outcome: 'compoundStatus' },
        { branch: 'burn', elements: ['electric', 'heat'], outcome: 'compoundStatus' },
        { branch: 'electrification', elements: ['nature', 'electric'], outcome: 'compoundStatus' },
        { branch: 'attachment', elements: ['cryo'], outcome: 'attachmentOnly' },
        { branch: 'burst', elements: ['electric', 'electric'], outcome: 'burst' },
      ].map(branch => ({ ...weapon, ...branch, enabled: weapon.accepted.includes(branch.branch) })),
    ),
  )(
    '$slug / $branch：实际反应标签选择正确，持有者和队友都经正常附着链触发',
    async ({ slug, elements, outcome, enabled }) => {
      for (const source of [0, 1]) {
        const plans: ActorPlan[] = [
          { holder: true, reactions: [], hits: [31] },
          { reactions: [], hits: [31] },
        ];
        plans[source]!.reactions.push(1);
        plans[source]!.elements = elements as InflictionElement[];
        const { active, baseline } = await simulatePair(slug, 9, plans);
        const pistol = slug === 'wpn_pistol_0005';
        expect(
          active.filter(entry => entry.event === 'ElementalInflictionApplied').at(-1)?.data
            ?.outcomeKind,
        ).toBe(outcome);
        const buffs = applications(
          active,
          pistol ? 'buff_wpn_pistol_0005_valid' : 'buff_wpn_sword_0010_valid',
        );
        expect(buffs).toHaveLength(enabled ? 1 : 0);
        if (enabled)
          expect(buffs[0]).toMatchObject({
            sourceId: 'track:reaction:0',
            targetId: 'track:reaction:0',
          });
        const scale = source === 0 ? 2 : 1;
        assertHitDeltas(
          active,
          baseline,
          0,
          [enabled ? (pistol ? scale * 0.098 : 0.224) : 0],
          [enabled && pistol ? scale * 0.056 : 0],
        );
        assertHitDeltas(active, baseline, 1, [0]);
      }
    },
  );

  it.each([
    { order: 'strong-weak', sources: [0, 1], expected: [2, 2, 1, 0] },
    { order: 'weak-strong', sources: [1, 0], expected: [1, 2, 2, 0] },
    { order: 'strong-strong', sources: [0, 0], expected: [2, 2, 2, 0] },
    { order: 'weak-weak', sources: [1, 1], expected: [1, 1, 1, 0] },
  ] as const)(
    '领航者 $order：优先项与候补各自计时，不累加或刷新旧实例',
    async ({ sources, expected }) => {
      for (const tier of [1, 9]) {
        const frames = [31, 331, 481, 781];
        const plans: ActorPlan[] = [
          { holder: true, reactions: [], hits: frames },
          { reactions: [], hits: frames },
        ];
        sources.forEach((source, index) => plans[source]!.reactions.push(1 + index * 300));
        const { active, baseline } = await simulatePair('wpn_pistol_0005', tier, plans);
        const buffs = applications(active, 'buff_wpn_pistol_0005_valid');
        expect(buffs).toHaveLength(2);
        // 宿主第 1 帧施放，局部第 1/301 帧在后续更新到达。
        expect(buffs.map(buff => buff.frame)).toEqual([2, 302]);
        for (const buff of buffs) {
          expect(buff).toMatchObject({
            sourceId: 'track:reaction:0',
            targetId: 'track:reaction:0',
          });
        }
        const ends = finishes(active, 'buff_wpn_pistol_0005_valid');
        expect(ends).toHaveLength(2);
        ends.forEach((end, index) => {
          expect(end.data?.reason).toBe('lifetime');
          expect(end.time - buffs[index]!.time).toBeCloseTo(15, 1);
        });
        assertHitDeltas(
          active,
          baseline,
          0,
          expected.map(scale => scale * (tier === 1 ? 0.035 : 0.098)),
          expected.map(scale => scale * (tier === 1 ? 0.02 : 0.056)),
        );
        assertHitDeltas(
          active,
          baseline,
          1,
          frames.map(() => 0),
        );
      }
    },
  );

  it.each([1, 9])(
    '黯色火炬等级 %i：同帧/间隔内/恰好 0.1 秒不重触发，满两层替换最早到期项',
    async tier => {
      const { active, baseline } = await simulatePair('wpn_sword_0010', tier, [
        { holder: true, reactions: [1, 1, 2, 4, 5, 301], hits: [3, 6, 302, 603, 606, 902] },
      ]);
      const buffs = applications(active, 'buff_wpn_sword_0010_valid');
      expect(buffs.map(buff => buff.frame)).toEqual([2, 6, 302]);
      // 六次真实复合状态申请只有三次通过 marker；不是后续反应未执行造成的假阴性。
      expect(
        active.filter(
          entry =>
            entry.event === 'ElementalInflictionApplied' &&
            entry.data?.outcomeKind === 'compoundStatus',
        ),
      ).toHaveLength(6);
      const ends = finishes(active, 'buff_wpn_sword_0010_valid');
      expect(ends).toHaveLength(3);
      expect(ends[0]).toMatchObject({ frame: 302, data: { reason: 'other' } });
      for (const index of [1, 2]) {
        expect(ends[index]!.data?.reason).toBe('lifetime');
        expect(ends[index]!.time - buffs[index]!.time).toBeCloseTo(20, 1);
      }
      assertHitDeltas(
        active,
        baseline,
        0,
        [1, 2, 2, 2, 1, 0].map(layers => layers * (tier === 1 ? 0.08 : 0.224)),
      );
    },
  );

  it.each(['wpn_pistol_0005', 'wpn_sword_0010'])(
    '%s：两名持有者的增益与 marker 独立，第三人不能获得增益',
    async slug => {
      const { active, baseline } = await simulatePair(slug, 9, [
        { holder: true, reactions: [1], hits: [31, 331, 481, 631, 781, 931] },
        { holder: true, reactions: [301], hits: [31, 331, 481, 631, 781, 931] },
        { reactions: [], hits: [31, 331, 481, 631, 781, 931] },
      ]);
      const pistol = slug === 'wpn_pistol_0005';
      const buffs = applications(
        active,
        pistol ? 'buff_wpn_pistol_0005_valid' : 'buff_wpn_sword_0010_valid',
      );
      expect(buffs).toHaveLength(4);
      for (const index of [0, 1]) {
        expect(buffs.filter(buff => buff.targetId === `track:reaction:${index}`)).toHaveLength(2);
        expect(
          buffs
            .filter(buff => buff.targetId === `track:reaction:${index}`)
            .every(buff => buff.sourceId === buff.targetId),
        ).toBe(true);
      }
      assertHitDeltas(
        active,
        baseline,
        0,
        pistol ? [0.196, 0.196, 0.098, 0.098, 0, 0] : [0.224, 0.448, 0.448, 0.224, 0.224, 0],
        pistol ? [0.112, 0.112, 0.056, 0.056, 0, 0] : undefined,
      );
      assertHitDeltas(
        active,
        baseline,
        1,
        pistol ? [0.098, 0.196, 0.196, 0.196, 0, 0] : [0.224, 0.448, 0.448, 0.224, 0.224, 0],
        pistol ? [0.056, 0.112, 0.112, 0.112, 0, 0] : undefined,
      );
      assertHitDeltas(active, baseline, 2, [0, 0, 0, 0, 0, 0]);
    },
  );
});

interface ActorPlan {
  holder?: boolean;
  reactions: number[];
  elements?: readonly InflictionElement[];
  hits: number[];
}

const applications = (entries: readonly CombatReceiptEntry[], buffId: string) =>
  entries.filter(entry => entry.event === 'BuffApplied' && entry.data?.buffId === buffId);
const finishes = (entries: readonly CombatReceiptEntry[], buffId: string) =>
  entries.filter(entry => entry.event === 'BuffFinished' && entry.data?.buffId === buffId);

function assertHitDeltas(
  active: readonly CombatReceiptEntry[],
  baseline: readonly CombatReceiptEntry[],
  actor: number,
  damage: readonly number[],
  critical: readonly number[] = damage.map(() => 0),
) {
  const hits = active.filter(
    entry =>
      entry.event === 'DamageApplied' &&
      entry.sourceId === `track:reaction:${actor}` &&
      // 原生完整爆发继承技能身份；本断言只比较夹具主动命中，不混入 Buff 的 DamageAction。
      entry.data?.spellBurstType === undefined &&
      !String(entry.data?.stepKey).includes('lifecycleSequences.') &&
      entry.data?.skillType === 'basicAttack',
  );
  expect(hits).toHaveLength(damage.length);
  hits.forEach((hit, index) => {
    expect(hit.data?.hitId).toBeTypeOf('string');
    const reference = baseline.find(
      entry => entry.event === 'DamageApplied' && entry.data?.hitId === hit.data?.hitId,
    )!;
    expect(reference).toBeDefined();
    expect(
      Number(hit.data?.damageScaleMultiplier) - Number(reference.data?.damageScaleMultiplier),
      `actor ${actor}, frame ${hit.frame}`,
    ).toBeCloseTo(damage[index]!, 6);
    expect(Number(hit.data?.criticalRate) - Number(reference.data?.criticalRate)).toBeCloseTo(
      critical[index]!,
      6,
    );
    if (damage[index]! > 0)
      expect(Number(hit.data?.nonCriticalDamage)).toBeGreaterThan(
        Number(reference.data?.nonCriticalDamage),
      );
    else expect(hit.data?.nonCriticalDamage).toBe(reference.data?.nonCriticalDamage);
  });
}

async function simulatePair(slug: string, tier: number, plans: readonly ActorPlan[]) {
  const weapon: WeaponDefinition = generatedWeaponDefinitions.find(weapon => weapon.slug === slug)!;
  const baselineWeapon: WeaponDefinition = {
    ...weapon,
    traits: weapon.traits.map(staticEquipmentContribution),
  };
  const run = async (definition: WeaponDefinition) => {
    let scenario = createEmptyScenario('reaction-lifecycle', '受控反应时序边界');
    scenario.battle.durationFrames = 1100;
    scenario.enemy.editable.hp = 1_000_000_000;
    const operators = plans.map((plan, index) => fixtureOperator(definition, plan, index));
    let nextId = 0;
    for (const [index, operator] of operators.entries()) {
      const trackIndex = index as TrackIndex;
      const track: TrackDocument = {
        id: `track:reaction:${index}`,
        operator: {
          operatorSlug: operator.slug,
          level: 90,
          promoted: true,
          potential: 0,
          trustLevel: 0,
          skillLevels: { basicAttack: 1 },
          talentStates: {},
        },
        weapon: plans[index]!.holder
          ? {
              weaponSlug: slug,
              level: 90,
              tuned: true,
              potential: 5,
              traitLevels: definition.traits.map(() => tier),
            }
          : null,
        gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
        initialState: { ultimateEnergy: 0, maxUltimateEnergyOverride: 100 },
        skillCasts: [],
      };
      scenario.tracks[trackIndex] = track;
      scenario = placeSkillGroup({
        scenario,
        trackIndex,
        operator,
        skillGroupKey: 'basicAttack',
        startFrame: 1,
        ids: { allocate: kind => `${kind}:reaction:${nextId++}` },
      }).scenario;
    }
    const result = await new ScenarioSimulationService({
      index: {
        ...gameDataRepository,
        getOperator: slug => operators.find(operator => operator.slug === slug) ?? null,
        getWeapon: requested => (requested === slug ? definition : null),
      },
      repositoryRevision: gameDataRepository.revision,
      resources: {
        sharedSpGain: { baseGainEfficiency: 1 },
        spRecoveryPauseDuration: 1.5,
        ultimateEnergySystemUnlocked: true,
        normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      },
      spellInflictionSettings: skillSettings,
    }).simulate(scenario, 1100);
    return result.receiptEntries;
  };
  return { active: await run(weapon), baseline: await run(baselineWeapon) };
}

function fixtureOperator(
  weapon: WeaponDefinition,
  plan: ActorPlan,
  index: number,
): OperatorDefinition {
  const source = gameDataRepository.getOperator(
    weapon.weaponType === 'sword' ? 'laevatain' : 'tangtang',
  )!;
  const nodes: Record<string, ActionGraphNode> = {};
  const scheduledSequences: ScheduledSequenceDefinition[] = plan.reactions.map(
    (startFrame, reactionIndex) => ({
      startFrame,
      sequence: chainNodes(
        nodes,
        `reaction-${reactionIndex}`,
        (plan.elements ?? (['electric', 'nature'] satisfies InflictionElement[])).map(element => ({
          kind: 'applyElementalInfliction',
          parameters: { element, isExtra: false },
        })),
      ),
    }),
  );
  scheduledSequences.push(
    ...plan.hits.map(startFrame => ({
      startFrame,
      sequence: chainNodes(nodes, `hit-${startFrame}`, [
        {
          key: `probe-${startFrame}`,
          kind: 'dealDamage' as const,
          parameters: {
            damageType: 'nature' as const,
            attackScale: 1,
            tags: ['normalAttack' as const],
          },
        },
      ]),
    })),
  );
  const probeSkill: SkillDefinition = {
    key: 'probe',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    timelineBlockFrames: 1050,
    scheduledSequences: scheduledSequences.sort((a, b) => a.startFrame - b.startFrame),
    actionGraph: { main: { nodes }, macros: {} },
  };
  return {
    slug: `reaction-fixture-${index}`,
    gameId: `reaction-fixture-${index}`,
    rarity: source.rarity,
    weaponType: weapon.weaponType,
    element: 'nature',
    role: source.role,
    mainAttribute: source.mainAttribute,
    secondaryAttribute: source.secondaryAttribute,
    attributes: source.attributes,
    talents: [],
    potentials: [],
    skillSlots: [],
    playerActionRoutes: {
      basicAttack: { kind: 'basicAttack', skillKeys: ['probe'], defaultSkillKey: 'probe' },
    },
    skillGroups: [
      {
        key: 'basicAttack',
        skillType: 'basicAttack',
        levelSource: 'basicAttack',
        skills: probeSkill,
      },
    ],
  };
}
