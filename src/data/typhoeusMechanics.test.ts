import { describe, expect, it } from 'vitest';
import { patchCombatSkills, resolveEffect } from '@/data/collect';
import type { Effect, HitGroup } from '@/data/types';
import sheet from './operators/typhoeus';

function effectsFor(skill: ReturnType<typeof patchedSkills>[string]): Effect[] {
  return (skill.segments ?? []).flatMap(segment =>
    (segment.damageGroups as HitGroup[]).flatMap(group =>
      group.hits.flatMap(hit => hit.effects ?? []),
    ),
  );
}

function patchedSkills(potential: number, battleSkill = 12, comboSkill = 12) {
  return patchCombatSkills(sheet, {
    talentStates: { '0': 3, '1': 2 },
    potential,
    skillLevels: { basicAttack: 12, battleSkill, comboSkill, ultimate: 12 },
  });
}

describe('Typhoeus sheet mechanics', () => {
  it('starts battle with four Hunting Arrows', () => {
    expect(sheet.combatSkills.battleSkill.triggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          trigger: { kind: 'onBattleStart' },
          effects: [
            expect.objectContaining({
              id: 'typhoeus-hunting-arrow',
              stacks: 4,
              maxStacks: 4,
            }),
          ],
        }),
      ]),
    );
  });

  it('treats only the fifth aerial basic attack as a Final Strike', () => {
    const groups = patchedSkills(0)
      .battleSkill!.segments!.slice(1)
      .map(segment =>
        (segment.damageGroups as HitGroup[]).find(
          group => group.id === 'typhoeus-aerial-basic-attack',
        ),
      );

    expect(groups.map(group => group?.treatAsSkillType)).toEqual([
      'basicAttack',
      'basicAttack',
      'basicAttack',
      'basicAttack',
      'finalStrike',
    ]);
  });

  it('queues Potential 3 as additive scaling on Barrage Array Burst damage taken', () => {
    const effect = effectsFor(patchedSkills(3, 1, 12).comboSkill!).find(
      candidate => candidate.id === 'typhoeus-barrage-array-burst-dmg-taken',
    );
    expect(effect).toBeDefined();
    const resolved = resolveEffect(effect!, 11);

    expect(resolved).toMatchObject({
      kind: 'status',
      stat: { modifier: 'increasedDmgTaken', damageTypes: 'natureBurst' },
      value: 10,
      scaling: { additive: [6] },
      duration: 6,
    });
  });

  it('queues the Potential 5 multiplier after the enhanced Power Shot scaling', () => {
    const effects = effectsFor(patchedSkills(5).battleSkill!);
    const bursts = effects.filter(effect => effect.id === 'typhoeus-power-shot-burst');
    const multiplierQueues = bursts.map(effect => {
      const resolved = resolveEffect(effect, 11);
      return resolved.kind === 'burst' ? resolved.scaling?.multiplier : undefined;
    });

    expect(bursts).toHaveLength(10);
    expect(multiplierQueues.filter(queue => queue?.length === 1 && queue[0] === 1.1)).toHaveLength(
      5,
    );
    expect(multiplierQueues.filter(queue => queue?.[0] === 1.3 && queue[1] === 1.1)).toHaveLength(
      5,
    );
  });
});
