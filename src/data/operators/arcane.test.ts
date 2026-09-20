import { describe, expect, it } from 'vitest';
import { arcane } from './arcane.generated';
import { collectSteps, getGroupSkills, getSkill as findSkill } from './testUtils';

const getSkill = (key: string) => findSkill(arcane, key);

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
    const spawn = collectSteps({
      steps: getSkill('chr_0032_lizhiyan_normal_skill').scheduledSequences.flatMap(
        item => item.sequence.steps,
      ),
    }).find(step => step.kind === 'spawnAbilityEntity');
    expect(spawn).toMatchObject({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'abilityentity_chr_0032_lizhiyan_normal_skill' },
    });
    const child =
      arcane.abilityEntityDefinitions?.['abilityentity_chr_0032_lizhiyan_normal_skill']?.childSkill;
    const childSteps = child?.scheduledSequences.flatMap(item => collectSteps(item.sequence)) ?? [];
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
    const rootDamage = arcane.skillGroups
      .flatMap(group => [...getGroupSkills(group), ...(group.replacementSkills ?? [])])
      .flatMap(skill => skill.scheduledSequences)
      .flatMap(item => collectSteps(item.sequence))
      .filter(step => step.kind === 'dealDamage');
    expect(rootDamage.length).toBeGreaterThan(0);
    expect(rootDamage.every(step => step.key !== undefined)).toBe(true);
  });
});
