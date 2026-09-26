import { expect, it } from 'vitest';
import type {
  InflictionElement,
  OperatorDefinition,
} from '../../../core/game-data/operatorDefinition';
import type {
  ActionGraphNode,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { compoundStatusFactories } from '../../../data/buffs/compoundStatusFactories';
import { skillSettings } from '../../../data/combat/skillSettings';
import { ScenarioSimulationService } from '../scenarioSimulationService';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { projectEnemyEffectViz } from '../../../core/projection/enemyEffectViz';
import {
  projectAttachmentContinuations,
  projectAttachmentConversionLinks,
} from '../../../core/projection/attachmentContinuations';
import { resolveBuffDisplayName } from '../../../ui/timeline/results/buffDisplayName';
import {
  resolveDurationBarColor,
  normalizeDurationBarColorPrefs,
} from '../../../ui/timeline/results/durationBarColor';

const elements: InflictionElement[] = ['heat', 'electric', 'cryo', 'nature'];
const attachmentIds = new Set(
  elementalAttachments.buffs.filter(b => b.role?.kind === 'elementalAttachment').map(b => b.id),
);
it.each(elements)('does not connect %s after expiry to a new instance', async element => {
  const { segments, viz } = await run([element, element], 900);
  const attachments = segments.filter(s => attachmentIds.has(s.buffId));
  expect(attachments.map(s => s.layers)).toEqual([1, 1]);
  expect(attachments[0]!.endFrame).toBeLessThan(attachments[1]!.startFrame);
  expect(attachments[0]!.instanceId).not.toBe(attachments[1]!.instanceId);
  expect(projectAttachmentContinuations(attachments, attachmentIds).size).toBe(0);
  expect(viz.markers).toEqual([]);
});

it.each([
  ['electric', 'electrification'],
  ['nature', 'corrosion'],
] as const)(
  'ends %s compound bars on native tag removal without a second lifecycle end',
  async (element, reaction) => {
    const { segments, viz, receipts } = await run(['heat', element], 60, reaction);
    const links = projectAttachmentConversionLinks(segments, viz.attachmentConversions!);
    expect(links.size).toBe(1);
    const output = [...links.values()][0]!;
    const ends = receipts.filter(
      entry =>
        entry.event === 'BuffFinished' &&
        entry.data?.buffId === output.buffId &&
        entry.data?.instanceId === output.instanceId,
    );
    expect(ends).toHaveLength(1);
    expect(output.endFrame).toBe(ends[0]!.frame);
    expect(output.endFrame - output.startFrame).toBe(59);
  },
);
// 控制输入时刻的测试干员；Buff、反应配方、SkillSetting、运行时与投影全部使用正式实现。
async function run(
  elements: readonly InflictionElement[],
  spacing = 60,
  consume?: 'electrification' | 'corrosion',
) {
  const base = gameDataRepository.getOperator('perlica')!;
  const operator: OperatorDefinition = {
    slug: 'elemental-presentation-probe',
    gameId: 'elemental-presentation-probe',
    rarity: base.rarity,
    weaponType: base.weaponType,
    element: base.element,
    role: base.role,
    mainAttribute: base.mainAttribute,
    secondaryAttribute: base.secondaryAttribute,
    attributes: base.attributes,
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
        skills: (() => {
          const actionSpecs: { startFrame: number; action: ActionGraphStep }[] = [
            ...elements.map((element, index) => ({
              startFrame: 1 + spacing * index,
              action: {
                kind: 'applyElementalInfliction' as const,
                parameters: { element, isExtra: false },
              },
            })),
            ...(consume === undefined
              ? []
              : [120, 180].map(startFrame => ({
                  startFrame,
                  action: {
                    kind: 'finishBuffsByTag' as const,
                    parameters: {
                      target: 'enemy' as const,
                      tagQueryType: 'hasAny' as const,
                      buffTags: [
                        consume === 'electrification'
                          ? 'Skill/Character/Common/SpellStatus/Conduct'
                          : 'Skill/Character/Common/SpellStatus/Corrupt',
                      ],
                      reason: 'early' as const,
                    },
                  },
                }))),
          ];
          const nodes: Record<string, ActionGraphNode> = {};
          const scheduledSequences = actionSpecs.map((spec, index) => {
            const nodeId = `probe-${index}`;
            nodes[nodeId] = { action: spec.action, next: null };
            return { startFrame: spec.startFrame, sequence: { $sequence: nodeId } };
          });
          return {
            key: 'probe',
            skillType: 'basicAttack' as const,
            levelSource: 'basicAttack' as const,
            timelineBlockFrames: 1500,
            scheduledSequences,
            actionGraph: { main: { nodes }, macros: {} },
          };
        })(),
      },
    ],
  };
  const scenario = createEmptyScenario('matrix', 'matrix');
  scenario.battle.durationFrames = 1800;
  scenario.tracks[0] = {
    id: 'track:probe',
    operator: {
      operatorSlug: operator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 0,
      skillLevels: { basicAttack: 1 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0, maxUltimateEnergyOverride: 100 },
    skillCasts: [
      {
        id: 'cast:probe',
        source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'probe' },
        placement: { startFrame: 1 },
      },
    ],
  };
  const result = await new ScenarioSimulationService({
    index: {
      ...gameDataRepository,
      getOperator: slug => (slug === operator.slug ? operator : null),
    },
    spellInflictionSettings: skillSettings,
    resources: {
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecoveryPauseDuration: 1.5,
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
    },
  }).simulate(scenario, 1800);
  return {
    receipts: result.receiptEntries,
    segments: projectBuffTimelineViz(result.receiptEntries, 1800),
    viz: projectEnemyEffectViz(result.receiptEntries, 1800),
  };
}

it('retains burning damage identity through the complete simulation pipeline', async () => {
  const { receipts, segments, viz } = await run(['electric', 'heat']);
  const damage = receipts.filter(entry => entry.event === 'DamageApplied');
  expect(damage.length).toBeGreaterThan(0);
  expect(viz.damageHits?.length).toBe(damage.length);
  for (const hit of damage) {
    expect(
      segments.some(
        segment =>
          segment.buffId === hit.data?.buffId &&
          segment.instanceId === hit.data?.buffInstanceId &&
          segment.targetId === hit.data?.buffOwnerId,
      ),
    ).toBe(true);
  }
});

it.each(compoundStatusFactories.factories)(
  'projects conversion $consumedElement → $incomingElement',
  async factory => {
    const { segments, viz } = await run([factory.consumedElement, factory.incomingElement]);
    expect(viz.attachmentConversions).toHaveLength(1);
    const links = projectAttachmentConversionLinks(segments, viz.attachmentConversions!);
    expect(links.size).toBe(1);
    const [head, tail] = [...links][0]!;
    expect(tail.buffId).toBe(factory.createdBuff.buffId);
    expect(head.endFrame).toBe(tail.startFrame);
    expect(tail.endFrame).toBeLessThan(1800);
    expect(viz.markers.filter(m => m.kind === 'attachmentTrigger')).toEqual([
      { frame: head.endFrame, kind: 'attachmentTrigger', element: factory.incomingElement },
    ]);
    expect(segments.filter(s => attachmentIds.has(s.buffId))).toHaveLength(1);
    expect(Boolean(tail.iconPath || tail.iconId)).toBe(true);
    expect(resolveBuffDisplayName(tail.buffId, { te: () => true, t: key => key })).toMatch(
      /^effects.name\./,
    );
    expect(
      resolveDurationBarColor(normalizeDurationBarColorPrefs(undefined), 'enemy', tail),
    ).not.toBe('#8c8c8c');
  },
);

it.each(elements)('preserves %s stacking, capped refresh and natural expiry', async element => {
  const { segments, viz } = await run(Array.from({ length: 5 }, () => element));
  const attachments = segments.filter(s => attachmentIds.has(s.buffId));
  expect(attachments.map(s => s.layers)).toEqual([1, 2, 3, 4, 4]);
  expect(new Set(attachments.map(s => s.instanceId)).size).toBe(1);
  expect(projectAttachmentContinuations(attachments, attachmentIds).size).toBe(4);
  expect(attachments.at(-1)!.endFrame).toBeLessThan(1800);
  expect(viz.markers.filter(m => m.kind === 'attachmentTrigger')).toEqual([]);
});
