import { describe, expect, it } from 'vitest';
import { perlica } from './perlica.generated';
import { collectSteps, getGroupSkills, getSkill as findSkill } from './testUtils';

const getSkill = (key: string) => findSkill(perlica, key);

describe('next Perlica definition', () => {
  it('keeps infliction, damage, and energy gain in source order', () => {
    const steps = getSkill('chr_0004_pelica_normal_skill')
      .scheduledSequences.flatMap(item => collectSteps(item.sequence))
      .filter(step =>
        ['applyElementalInfliction', 'dealDamage', 'gainSquadUltimateEnergyFromSkillCost'].includes(
          step.kind,
        ),
      );

    expect(steps.map(step => step.kind)).toEqual([
      'applyElementalInfliction',
      'dealDamage',
      'gainSquadUltimateEnergyFromSkillCost',
    ]);
  });

  it('models combo impact as supported semantic operations', () => {
    const skill = getSkill('chr_0004_pelica_combo_skill');
    const steps = collectSteps(
      skill.scheduledSequences.find(item => item.startFrame === 24)!.sequence,
    ).filter(step =>
      ['applyBuff', 'dealDamage', 'changeResourceByActionValue'].includes(step.kind),
    );

    expect(
      skill.scheduledSequences.some(item =>
        collectSteps(item.sequence).some(step => step.kind === 'startTimeDilation'),
      ),
    ).toBe(true);

    expect(steps.map(step => step.kind)).toEqual([
      'applyBuff',
      'dealDamage',
      'changeResourceByActionValue',
    ]);
    expect(steps[0]).toMatchObject({
      kind: 'applyBuff',
      parameters: {
        buffId: 'buff_common_pulse_pulse_conduct_triggered',
        target: 'enemy',
      },
    });
    expect(steps[2]).toMatchObject({
      kind: 'changeResourceByActionValue',
      parameters: {
        resource: 'ultimateEnergy',
        amount: { kind: 'blackboard', key: 'usp' },
        recipient: 'caster',
      },
    });
  });

  it('uses the earliest operable boundary as each basic attack timeline width', () => {
    const basicAttackGroup = perlica.skillGroups.find(group => group.key === 'basicAttack');

    expect(Array.isArray(basicAttackGroup?.skills)).toBe(true);
    if (!basicAttackGroup || !Array.isArray(basicAttackGroup.skills)) {
      throw new Error('expected basic attack sequence');
    }
    expect(basicAttackGroup.skills.map(skill => skill.timelineBlockFrames)).toEqual([
      16, 18, 26, 44,
    ]);
  });

  it('marks only the final normal-attack hit as the last combo hit', () => {
    const normalAttackHits = [
      'chr_0004_pelica_attack1',
      'chr_0004_pelica_attack2',
      'chr_0004_pelica_attack3',
      'chr_0004_pelica_attack4',
    ]
      .map(key => getSkill(key))
      .flatMap(skill => skill.scheduledSequences)
      .flatMap(scheduledSequence => collectSteps(scheduledSequence.sequence))
      .filter(step => step.kind === 'dealDamage');

    expect(normalAttackHits.map(hit => hit.parameters.tags)).toEqual([
      ['normalAttack'],
      ['normalAttack'],
      ['normalAttack'],
      ['normalAttack'],
      ['normalAttack'],
      ['normalAttack'],
      ['normalAttack', 'normalAttackLastCombo'],
    ]);
  });

  it('uses the third normal attack per-hit scales instead of its rounded display totals', () => {
    const damageHits = getSkill('chr_0004_pelica_attack3')
      .scheduledSequences.flatMap(scheduledSequence => collectSteps(scheduledSequence.sequence))
      .filter(step => step.kind === 'dealDamage');

    expect(damageHits).toHaveLength(3);
    expect(getSkill('chr_0004_pelica_attack3').blackboard?.atk_scale).toEqual([
      0.12, 0.14, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.22, 0.24, 0.26, 0.28,
    ]);
    expect(damageHits.map(hit => hit.parameters.attackScale)).toEqual([
      { kind: 'blackboard', key: 'atk_scale' },
      { kind: 'blackboard', key: 'atk_scale' },
      { kind: 'blackboard', key: 'atk_scale' },
    ]);
  });

  it('keeps the native before-take-damage combo condition instead of a handwritten tag rule', () => {
    expect('comboSkillRegistrations' in perlica).toBe(false);
    expect(perlica.comboSkillConditions).toHaveLength(1);
    expect(perlica.comboSkillConditions?.[0]).toMatchObject({
      skillKey: 'chr_0004_pelica_combo_skill',
      event: 'beforeTakeDamage',
      immediately: false,
    });
    const source = JSON.stringify(perlica.comboSkillConditions);
    expect(source).toContain('normalAttackLastCombo');
    expect(source).toContain('eventSourceControlled');
    expect(source).toContain('contextTargetObjectTypeMatch');
  });

  it('defines finisher and plunging attack as independent basic-attack-level groups', () => {
    expect(perlica.skillGroups.find(group => group.key === 'finisher')).toMatchObject({
      skillType: 'finisher',
      levelSource: 'basicAttack',
    });
    expect(perlica.skillGroups.find(group => group.key === 'plungingAttack')).toMatchObject({
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
    });
  });

  it('uses breaking-attack calculation only for the finisher', () => {
    const finisherSteps = getSkill('chr_0004_pelica_power_attack').scheduledSequences.flatMap(
      item => collectSteps(item.sequence),
    );
    const finisherDamage = finisherSteps[0];
    const plungingDamage = getSkill(
      'chr_0004_pelica_plunging_attack_end',
    ).scheduledSequences.flatMap(item => collectSteps(item.sequence))[0];

    expect(finisherDamage).toMatchObject({
      kind: 'dealDamage',
      parameters: {
        calculation: 'breakingAttack',
        tags: ['normalAttack', 'powerAttack'],
      },
    });
    expect(plungingDamage).toMatchObject({
      kind: 'dealDamage',
      parameters: { tags: ['normalAttack', 'plungingAttack'] },
    });
    expect(finisherSteps).toContainEqual({
      kind: 'gainFinisherSp',
      parameters: { factor: 1, recipient: 'team' },
    });
  });

  it('preserves both talents and connects the ricochet switch through native blackboard data', () => {
    expect(perlica.talents).toHaveLength(2);
    expect(perlica.talents[1]?.modifiers).toEqual([
      {
        kind: 'patchSkillBlackboard',
        skillGroupKey: 'comboSkill',
        blackboardKey: 'talent2',
        operation: 'assign',
        value: 1,
      },
    ]);
  });

  it('models the third potential through its native event-listening Buff', () => {
    const potential = perlica.potentials[2];

    expect(potential).toMatchObject({
      levels: 1,
      initializationSequence: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: { buffId: 'buff_chr_0004_pelica_potential_3', target: 'caster' },
          },
        ],
      },
    });
    expect(perlica.buffDefinitions?.buff_chr_0004_pelica_potential_3_atkup).toMatchObject({
      stackingType: 'enhanceAndRefresh',
      maxStackCount: 2,
      durationSeconds: { blackboardKey: 'atk_duration' },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
      ],
    });
    expect(perlica.buffDefinitions?.buff_chr_0004_pelica_potential_3).toMatchObject({
      abilityEventResponses: [{ event: 'outputBuff' }],
    });
    expect(potential?.modifiers).toBeUndefined();
  });

  it('uses ordered steps instead of damage timing flags', () => {
    const serialized = JSON.stringify(perlica);

    expect(serialized).not.toContain('beforeDamage');
    expect(serialized).not.toContain('afterDamage');
    expect(serialized).not.toContain('evidence');
    expect(serialized).not.toContain('sourceOrder');
    expect(serialized).not.toContain('projectileId');
    expect(serialized).not.toContain('impactSkillId');
    expect(serialized).not.toContain('onReactionApplied');
  });

  it('keys every damage step with a non-empty unique identity', () => {
    const entries: Array<{ skillKey: string; stepKey: string }> = [];
    for (const skill of perlica.skillGroups.flatMap(getGroupSkills)) {
      for (const scheduledSequence of skill.scheduledSequences) {
        for (const step of collectSteps(scheduledSequence.sequence)) {
          if (step.kind === 'dealDamage' || step.kind === 'dealFixedDamage') {
            entries.push({ skillKey: skill.key, stepKey: step.key ?? '' });
          }
        }
      }
    }

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.stepKey.length).toBeGreaterThan(0);
    }
    const allKeys = entries.map(entry => entry.stepKey);
    expect(allKeys.length).toBe(new Set(allKeys).size);
  });
});
