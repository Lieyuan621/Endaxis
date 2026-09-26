import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { describe, expect, it } from 'vitest';

import { perlica } from './perlica.generated';
import type {
  ActionGraphDefinition,
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { createGraphDataResolver } from '../../core/action-graph/actionGraphData';
import type { SkillGroupDefinition } from '../../core/game-data/operatorDefinition';

function getGroupSkills(group: SkillGroupDefinition): readonly SkillDefinition[] {
  const skills: SkillDefinition | readonly SkillDefinition[] = group.skills;
  return Array.isArray(skills) ? skills : [skills].flat();
}

function getSkill(key: string): SkillDefinition {
  const skill = perlica.skillGroups
    .flatMap(getGroupSkills)
    .find(candidate => candidate.key === key);
  if (!skill) throw new Error(`missing skill: ${key}`);
  return skill;
}

function collectGraphSteps(
  resource: ActionGraphResourceDefinition,
  entry: ActionGraphReference | null | undefined,
): ActionGraphStep[] {
  const steps: ActionGraphStep[] = [];
  const visited = new Set<string>();
  const visitGraph = (
    graph: ActionGraphDefinition,
    ref: ActionGraphReference | null | undefined,
    scope: string,
  ) => {
    let nodeId = ref?.$sequence ?? null;
    const resolve = createGraphDataResolver(graph).bind;
    while (nodeId !== null) {
      const identity = `${scope}/${nodeId}`;
      if (visited.has(identity)) return;
      visited.add(identity);
      const node = graph.nodes[nodeId];
      if (!node) return;
      const action = resolve(node.action) as ActionGraphStep;
      steps.push(action);
      switch (action.kind) {
        case 'conditional':
          visitGraph(graph, action.whenTrue, scope);
          if (action.whenFalse !== undefined) visitGraph(graph, action.whenFalse, scope);
          break;
        case 'switch':
          for (const option of action.options) visitGraph(graph, option.sequence, scope);
          break;
        case 'once':
        case 'withActionBlackboardScope':
        case 'repeatEachTick':
        case 'repeatByActionValue':
        case 'forEachContextTarget':
          visitGraph(graph, action.body, scope);
          break;
        case 'callMacro': {
          // 宏提取只把节点移入同资源的宏图；查询必须跟随局部宏，不能只扫主图。
          const macro = resource.macros[action.macroId];
          if (macro) visitGraph(macro.graph, macro.entry, `${scope}/macro:${action.macroId}`);
          break;
        }
        case 'callResource':
          visitGraph(
            action.resource.actionGraph.main,
            action.resource.entry,
            `${scope}/resource:${action.resource.id}`,
          );
          break;
        case 'launchProjectile':
          // 回调技能是独立资源；遍历跟随发射进入每个回调自己的图。
          for (const callback of action.callbacks) {
            for (const scheduled of callback.skill.scheduledSequences) {
              visitGraph(
                callback.skill.actionGraph.main,
                scheduled.sequence,
                `${scope}/callback:${callback.skill.skillId}:${scheduled.startFrame}`,
              );
            }
          }
          break;
      }
      nodeId = node.next;
    }
  };
  visitGraph(resource.main, entry, 'main');
  return steps;
}

const perlicaBasicAttack1 = getSkill('chr_0004_pelica_attack1');
const perlicaBasicAttack2 = getSkill('chr_0004_pelica_attack2');
const perlicaBasicAttack3 = getSkill('chr_0004_pelica_attack3');
const perlicaBasicAttack4 = getSkill('chr_0004_pelica_attack4');
const perlicaFinisher = getSkill('chr_0004_pelica_power_attack');
const perlicaPlungingAttack = getSkill('chr_0004_pelica_plunging_attack_end');
const perlicaBattleSkill = getSkill('chr_0004_pelica_normal_skill');
const perlicaComboSkill = getSkill('chr_0004_pelica_combo_skill');
const perlicaUltimate = getSkill('chr_0004_pelica_ultimate_skill');

const basicAttacks = [
  perlicaBasicAttack1,
  perlicaBasicAttack2,
  perlicaBasicAttack3,
  perlicaBasicAttack4,
];

describe('佩丽卡生成 DSL', () => {
  it('保留四段普攻的命中帧和末段语义', () => {
    expect(basicAttacks.map(skill => skill.key)).toEqual([
      'chr_0004_pelica_attack1',
      'chr_0004_pelica_attack2',
      'chr_0004_pelica_attack3',
      'chr_0004_pelica_attack4',
    ]);
    expect(
      basicAttacks.map(skill =>
        skill.scheduledSequences
          .filter(sequence =>
            collectGraphSteps(skill.actionGraph, sequence.sequence).some(
              step => step.kind === 'dealDamage',
            ),
          )
          .map(sequence => sequence.startFrame),
      ),
    ).toEqual([[8], [9, 12], [16, 19, 22], [27]]);

    const finalSteps = collectGraphSteps(
      perlicaBasicAttack4.actionGraph,
      perlicaBasicAttack4.scheduledSequences[0]!.sequence,
    );
    // 末段伤害位于统一投射物的命中回调资源；遍历跟随发射后仍定位同一伤害。
    expect(
      finalSteps
        .filter(step => ['dealDamage', 'changeResourceByActionValue'].includes(step.kind))
        .map(step => step.kind),
    ).toEqual(['dealDamage', 'changeResourceByActionValue']);
    expect(finalSteps.find(step => step.kind === 'dealDamage')).toMatchObject({
      kind: 'dealDamage',
      parameters: {
        damageType: 'electric',
        stagger: { kind: 'blackboard', key: 'poise' },
        tags: ['normalAttack', 'normalAttackLastCombo'],
      },
    });
    expect(finalSteps.find(step => step.kind === 'changeResourceByActionValue')).toMatchObject({
      kind: 'changeResourceByActionValue',
      parameters: {
        resource: 'sp',
        amount: { kind: 'blackboard', key: 'atb' },
        recipient: 'team',
        spGainSource: 'normalAttack',
      },
    });
  });

  it('完整转换保留旧基线的普攻命中帧和伤害标签', () => {
    const basicAttackGroup = perlica.skillGroups.find(group => group.key === 'basicAttack');
    if (basicAttackGroup === undefined) throw new Error('missing complete basic attacks');
    const complete = getGroupSkills(basicAttackGroup);

    expect(complete.map(skill => skill.scheduledSequences.map(item => item.startFrame))).toEqual(
      basicAttacks.map(skill => skill.scheduledSequences.map(item => item.startFrame)),
    );
    expect(
      complete.map(skill =>
        skill.scheduledSequences
          .flatMap(item => collectGraphSteps(skill.actionGraph, item.sequence))
          .filter(step => step.kind === 'dealDamage')
          .map(step => step.parameters.tags),
      ),
    ).toEqual(
      basicAttacks.map(skill =>
        skill.scheduledSequences
          .flatMap(item => collectGraphSteps(skill.actionGraph, item.sequence))
          .filter(step => step.kind === 'dealDamage')
          .map(step => step.parameters.tags),
      ),
    );
  });

  it('完整转换保留旧基线各主动技能的原生身份与主要命中帧', () => {
    const legacy = [
      perlicaFinisher,
      perlicaPlungingAttack,
      perlicaBattleSkill,
      perlicaComboSkill,
      perlicaUltimate,
    ];
    const completeByKey = new Map(
      perlica.skillGroups
        .flatMap(getGroupSkills)
        .filter(skill => legacy.some(candidate => candidate.key === skill.key))
        .map(skill => [skill.key, skill]),
    );

    for (const baseline of legacy) {
      const complete = completeByKey.get(baseline.key);
      expect(complete?.key).toBe(baseline.key);
      const damageFrames = (skill: typeof baseline) =>
        skill.scheduledSequences
          .filter(item =>
            collectGraphSteps(skill.actionGraph, item.sequence).some(
              step => step.kind === 'dealDamage',
            ),
          )
          .map(item => item.startFrame);
      expect(damageFrames(complete!)).toEqual(damageFrames(baseline));
    }
  });
});
