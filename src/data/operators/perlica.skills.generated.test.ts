import { describe, expect, it } from 'vitest';

import { perlica } from './perlica.generated';
import { collectSteps, getGroupSkills, getSkill } from './testUtils';

const perlicaBasicAttack1 = getSkill(perlica, 'chr_0004_pelica_attack1');
const perlicaBasicAttack2 = getSkill(perlica, 'chr_0004_pelica_attack2');
const perlicaBasicAttack3 = getSkill(perlica, 'chr_0004_pelica_attack3');
const perlicaBasicAttack4 = getSkill(perlica, 'chr_0004_pelica_attack4');
const perlicaFinisher = getSkill(perlica, 'chr_0004_pelica_power_attack');
const perlicaPlungingAttack = getSkill(perlica, 'chr_0004_pelica_plunging_attack_end');
const perlicaBattleSkill = getSkill(perlica, 'chr_0004_pelica_normal_skill');
const perlicaComboSkill = getSkill(perlica, 'chr_0004_pelica_combo_skill');
const perlicaUltimate = getSkill(perlica, 'chr_0004_pelica_ultimate_skill');

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
            collectSteps(sequence.sequence).some(step => step.kind === 'dealDamage'),
          )
          .map(sequence => sequence.startFrame),
      ),
    ).toEqual([[8], [9, 12], [16, 19, 22], [27]]);

    const finalSteps = collectSteps(perlicaBasicAttack4.scheduledSequences[0]!.sequence);
    expect(finalSteps.map(step => step.kind)).toEqual([
      'withActionBlackboardScope',
      'withActionBlackboardScope',
      'dealDamage',
      'conditional',
      'changeResourceByActionValue',
    ]);
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
          .flatMap(item => collectSteps(item.sequence))
          .filter(step => step.kind === 'dealDamage')
          .map(step => step.parameters.tags),
      ),
    ).toEqual(
      basicAttacks.map(skill =>
        skill.scheduledSequences
          .flatMap(item => collectSteps(item.sequence))
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
          .filter(item => collectSteps(item.sequence).some(step => step.kind === 'dealDamage'))
          .map(item => item.startFrame);
      expect(damageFrames(complete!)).toEqual(damageFrames(baseline));
    }
  });
});
