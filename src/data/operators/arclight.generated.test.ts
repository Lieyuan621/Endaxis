import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { describe, expect, it } from 'vitest';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { arclight as arclightGeneratedOperator } from './arclight.generated';

function findSkill(key: string): SkillDefinition {
  for (const group of arclightGeneratedOperator.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing generated skill '${key}'`);
}

/** 沿图入口收集可达动作（含条件/循环子入口与宏体），等价于旧表示的 steps 平铺。 */
function collectGraphSteps(
  resource: ActionGraphResourceDefinition,
  entry: ActionGraphReference | null | undefined,
): ActionGraphStep[] {
  const steps: ActionGraphStep[] = [];
  const visited = new Set<string>();
  const visit = (
    graph: ActionGraphResourceDefinition['main'],
    ref: ActionGraphReference | null | undefined,
  ) => {
    let nodeId = ref?.$sequence ?? null;
    while (nodeId !== null) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = graph.nodes[nodeId];
      if (!node) return;
      const action = node.action;
      steps.push(action);
      switch (action.kind) {
        case 'conditional':
          visit(graph, action.whenTrue);
          if (action.whenFalse !== undefined) visit(graph, action.whenFalse);
          break;
        case 'switch':
          for (const option of action.options) visit(graph, option.sequence);
          break;
        case 'callMacro': {
          const macro = resource.macros[action.macroId];
          if (macro) visit(macro.graph, macro.entry);
          break;
        }
        case 'once':
        case 'withActionBlackboardScope':
        case 'repeatEachTick':
        case 'repeatByActionValue':
        case 'forEachContextTarget':
          visit(graph, action.body);
          break;
      }
      nodeId = node.next;
    }
  };
  visit(resource.main, entry);
  return steps;
}

describe('arclight generated operator', () => {
  it('is complete under the wooden-dummy boundary', () => {
    expect(arclightGeneratedOperator.slug).toBe('arclight');
    expect(arclightGeneratedOperator.weaponType).toBe('sword');
    expect(arclightGeneratedOperator.role).toBe('vanguard');
    expect(arclightGeneratedOperator.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(arclightGeneratedOperator.talents[1]).toMatchObject({
      levels: 2,
    });
  });

  it('compiles battle skill SP cost into squad ultimate energy instead of an inline buff', () => {
    const battleSkill = findSkill('chr_0007_ikut_normal_skill');
    const steps = battleSkill.scheduledSequences.flatMap(sequence =>
      collectGraphSteps(battleSkill.actionGraph, sequence.sequence),
    );
    expect(steps.map(step => step.kind)).toContain('gainSquadUltimateEnergyFromSkillCost');
  });

  it('keeps the stack-triggered party electric damage buff as converted runtime behavior', () => {
    const battleSkill = findSkill('chr_0007_ikut_normal_skill');
    const source = JSON.stringify([
      battleSkill,
      arclightGeneratedOperator.buffDefinitions?.buff_chr_0007_ikut_normal_skill_extra_count,
      arclightGeneratedOperator.buffDefinitions?.buff_chr_0007_ikut_atk_buff_talent,
    ]);

    expect(source).toContain('enhanceChanged');
    expect(source).toContain('electricDamageIncrease');
    expect(source).toContain('baseAddition');
    expect(source).not.toContain('buff_common_vfx_char_atk_up');
  });

  it('owns ultimate AbilityEntity damage on the child local timeline only', () => {
    const ultimate = findSkill('chr_0007_ikut_ultimate_skill');
    const spawn = ultimate.scheduledSequences
      .flatMap(sequence => collectGraphSteps(ultimate.actionGraph, sequence.sequence))
      .find(step => step.kind === 'spawnAbilityEntity');
    expect(spawn?.kind).toBe('spawnAbilityEntity');
    if (spawn?.kind !== 'spawnAbilityEntity') throw new Error('missing AbilityEntity spawn');

    expect(spawn.parameters.inheritActionBlackboard).toBe(true);
    const definition =
      arclightGeneratedOperator.abilityEntityDefinitions?.[spawn.parameters.abilityEntityId];
    expect(
      new Set(definition?.childSkill?.scheduledSequences.map(sequence => sequence.startFrame)),
    ).toEqual(new Set([7, 63]));
    expect(ultimate.scheduledSequences.map(sequence => sequence.startFrame)).not.toEqual(
      expect.arrayContaining([61, 117]),
    );
  });
});
