import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { describe, expect, it } from 'vitest';
import { arcane } from './arcane.generated';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillGroupDefinition } from '../../core/game-data/operatorDefinition';

function getGroupSkills(group: SkillGroupDefinition): readonly SkillDefinition[] {
  const skills: SkillDefinition | readonly SkillDefinition[] = group.skills;
  return Array.isArray(skills) ? skills : [skills].flat();
}

function getSkill(key: string): SkillDefinition {
  const skill = arcane.skillGroups.flatMap(getGroupSkills).find(candidate => candidate.key === key);
  if (!skill) throw new Error(`missing skill: ${key}`);
  return skill;
}

function collectGraphSteps(
  resource: ActionGraphResourceDefinition,
  entry: ActionGraphReference | null | undefined,
): ActionGraphStep[] {
  const steps: ActionGraphStep[] = [];
  const visited = new Set<string>();
  const visit = (ref: ActionGraphReference | null | undefined) => {
    let nodeId = ref?.$sequence ?? null;
    while (nodeId !== null) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = resource.main.nodes[nodeId];
      if (!node) return;
      const action = node.action;
      steps.push(action);
      switch (action.kind) {
        case 'conditional':
          visit(action.whenTrue);
          if (action.whenFalse !== undefined) visit(action.whenFalse);
          break;
        case 'switch':
          for (const option of action.options) visit(option.sequence);
          break;
        case 'once':
        case 'withActionBlackboardScope':
        case 'repeatEachTick':
        case 'repeatByActionValue':
        case 'forEachContextTarget':
          visit(action.body);
          break;
      }
      nodeId = node.next;
    }
  };
  visit(entry);
  return steps;
}

function skillSteps(skill: SkillDefinition): ActionGraphStep[] {
  return skill.scheduledSequences.flatMap(item =>
    collectGraphSteps(skill.actionGraph, item.sequence),
  );
}

describe('next generated Arcane definition', () => {
  it('keeps the native five-hit basic chain and eleven generated skills', () => {
    const basic = arcane.skillGroups.find(group => group.key === 'basicAttack');
    if (basic === undefined) throw new Error('missing basic attack group');
    expect(getGroupSkills(basic).map(skill => skill.key)).toEqual([
      'chr_0032_lizhiyan_attack1',
      'chr_0032_lizhiyan_attack2',
      'chr_0032_lizhiyan_attack3',
      'chr_0032_lizhiyan_attack4',
      'chr_0032_lizhiyan_attack5',
    ]);
    expect(
      arcane.skillGroups.flatMap(group => [
        ...getGroupSkills(group),
        ...(group.replacementSkills ?? []),
      ]),
    ).toHaveLength(11);
  });

  it('derives the intellect form on equality without a mutable runtime form selector', () => {
    expect(arcane.entityBlackboardInitializers).toEqual([
      {
        key: 'EntityBB_wisd_greater_will',
        condition: {
          kind: 'deckAttributeCompare',
          left: 'intellect',
          operator: 'greaterOrEqual',
          right: 'will',
        },
        trueValue: 1,
        falseValue: 0,
      },
    ]);
    expect(arcane.eventHandlers).toBeUndefined();
  });

  it('keeps battle-skill pulses on its generated ability entity child', () => {
    const spawn = skillSteps(getSkill('chr_0032_lizhiyan_normal_skill')).find(
      step => step.kind === 'spawnAbilityEntity',
    );
    expect(spawn).toMatchObject({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'abilityentity_chr_0032_lizhiyan_normal_skill' },
    });
    const entity =
      arcane.abilityEntityDefinitions?.['abilityentity_chr_0032_lizhiyan_normal_skill'];
    // 1.5.3 起实体默认子技能改为按原生 ID 启动：脉冲挂在 spawn 声明的 childSkillId 上。
    const childSkillId =
      spawn?.kind === 'spawnAbilityEntity' ? spawn.parameters.childSkillId : undefined;
    const child = childSkillId === undefined ? undefined : entity?.childSkills?.[childSkillId];
    const childSteps =
      child === undefined
        ? []
        : child.scheduledSequences.flatMap(item =>
            collectGraphSteps(child.actionGraph, item.sequence),
          );
    expect(childSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'applyElementalInfliction' }),
        expect.objectContaining({ kind: 'dealDamage' }),
        expect.objectContaining({ kind: 'gainSquadUltimateEnergyFromSkillCost' }),
      ]),
    );
  });

  it('owns the arcana slot replacement in Buff lifecycle state', () => {
    const group = arcane.skillGroups.find(candidate => candidate.key === 'ultimate');
    expect(group?.replacementSkills?.map(skill => skill.key)).toEqual([
      'chr_0032_lizhiyan_ultimate_skill2',
    ]);
    const replacementDefinitions = Object.values(arcane.buffDefinitions ?? {}).filter(
      definition => definition.skillSlotReplacements !== undefined,
    );
    expect(replacementDefinitions).not.toHaveLength(0);
    expect(replacementDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skillSlotReplacements: [
            expect.objectContaining({
              skillGroupKey: 'ultimate',
              targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill2',
              revertedSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
            }),
          ],
        }),
      ]),
    );
  });

  it('keeps form conditions, corrosion upgrades, and passive patches typed', () => {
    expect(arcane.talents[0]?.modifiers).toContainEqual({
      kind: 'addSkillCooldownFrames',
      skillGroupKey: 'comboSkill',
      frames: -180,
      condition: {
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      },
    });
    expect(arcane.talents[1]?.modifiers).toEqual([
      { kind: 'addReactionDuration', reaction: 'corrosion', seconds: [5, 10] },
      { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: [0.05, 0.1] },
    ]);
    expect(arcane.potentials[0]?.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'patchSkillBlackboard',
          blackboardKey: 'atb_return_wisd',
          condition: expect.objectContaining({ operator: 'greaterOrEqual' }),
        }),
        expect.objectContaining({
          kind: 'patchSkillBlackboard',
          blackboardKey: 'rate_pre',
          condition: expect.objectContaining({ operator: 'less' }),
        }),
      ]),
    );
    expect(arcane.potentials[4]?.modifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0032_lizhiyan_talent1',
        }),
      ]),
    );
  });

  it('is registered as a complete generated operator with stable damage keys', () => {
    expect(arcane.conversionSupport).toEqual({ completeness: 'complete', missingCapabilities: [] });
    const rootDamageNodes = arcane.skillGroups
      .flatMap(group => [...getGroupSkills(group), ...(group.replacementSkills ?? [])])
      .flatMap(skill =>
        Object.entries(skill.actionGraph.main.nodes).filter(
          ([, node]) => node.action.kind === 'dealDamage',
        ),
      );
    expect(rootDamageNodes.length).toBeGreaterThan(0);
    expect(rootDamageNodes.every(([nodeId]) => nodeId.length > 0)).toBe(true);
  });
});
