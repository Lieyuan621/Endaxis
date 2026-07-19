import { describe, expect, it } from 'vitest';
import { patchCombatSkills } from './collect';
import { getOperator, getOperatorList } from './index';
import { getCharacterRoster } from './timeline';

function collectHitEffects(skill: any): any[] {
  return (skill?.segments || [])
    .flatMap((segment: any) => segment.damageGroups || [])
    .flatMap((group: any) => group.hits || [])
    .flatMap((hit: any) => hit.effects || []);
}

describe('timeline data roster', () => {
  it('does not synthesize default battle-skill ultimate energy from SP cost', () => {
    const zhuangFangyi = getCharacterRoster().find(entry => entry.id === 'zhuang-fangyi');

    expect(zhuangFangyi?.battleSkill_ultimateEnergyGain).toBe(0);
    expect(zhuangFangyi?.battleSkill_teamUltimateEnergyGain).toBe(0);
    expect(zhuangFangyi?.battleSkill_segments?.[0]?.ultimateEnergyGain).toBe(0);
    expect(zhuangFangyi?.battleSkill_segments?.[0]?.teamUltimateEnergyGain).toBe(0);
  });

  it('keeps Avywenna combo ultimate energy at zero', () => {
    const avywenna = getCharacterRoster().find(entry => entry.id === 'avywenna');

    expect(avywenna?.comboSkill_ultimateEnergyGain).toBe(0);
  });

  it('keeps Last Rite combo action energy at zero because its hit grants the base 40', () => {
    const lastRite = getCharacterRoster().find(entry => entry.id === 'last-rite');

    expect(lastRite?.comboSkill_ultimateEnergyGain).toBe(0);
    expect(lastRite?.accept_self_sp_cost_ult_energy).toBe(false);
    expect(
      lastRite?.comboSkill_damage_hits?.some((hit: any) =>
        hit.effects?.some((effect: any) => effect.kind === 'ultEnergyGain' && effect.value === 40),
      ),
    ).toBe(true);
  });

  it('stores combo-skill ultimate energy on the last hit (action-level cleared)', () => {
    const perlica = getCharacterRoster().find(entry => entry.id === 'perlica');
    const alesh = getCharacterRoster().find(entry => entry.id === 'alesh');
    const arclight = getCharacterRoster().find(entry => entry.id === 'arclight');
    const camille = getCharacterRoster().find(entry => entry.id === 'camille');

    expect(perlica?.comboSkill_ultimateEnergyGain).toBe(0);
    expect(alesh?.comboSkill_ultimateEnergyGain).toBe(0);
    expect(arclight?.comboSkill_ultimateEnergyGain).toBe(0);

    const lastHitHasUe = (hits: any[], value: number) => {
      const last = hits?.[hits.length - 1];
      return last?.effects?.some(
        (effect: any) => effect.kind === 'ultEnergyGain' && effect.value === value,
      );
    };

    expect(lastHitHasUe(perlica?.comboSkill_damage_hits, 10)).toBe(true);
    expect(lastHitHasUe(alesh?.comboSkill_damage_hits, 10)).toBe(true);
    expect(lastHitHasUe(arclight?.comboSkill_damage_hits, 5)).toBe(true);
    expect(lastHitHasUe(camille?.comboSkill_damage_hits, 10)).toBe(true);
  });

  it('keeps combo action-level ultimate energy when the combo has no hits', () => {
    const snowshine = getCharacterRoster().find(entry => entry.id === 'snowshine');

    expect(snowshine?.comboSkill_ultimateEnergyGain).toBe(10);
    expect(snowshine?.comboSkill_damage_hits ?? []).toEqual([]);
  });

  it('exposes Zhuang Fangyi battle-skill thunder-strike hits in the hit editor list', () => {
    const zhuangFangyi = getCharacterRoster().find(entry => entry.id === 'zhuang-fangyi');
    const hits = zhuangFangyi?.battleSkill_damage_hits || [];

    expect(hits.length).toBeGreaterThan(20);
    expect(hits.some((hit: any) => (Number(hit.multiplier) || 0) > 0)).toBe(true);
  });

  it('keeps Rossi Razor Clawmark DoT on a stable display id', () => {
    const rossi = getOperator('rossi');
    expect(rossi).toBeTruthy();

    const patched = patchCombatSkills(rossi!, {
      talentStates: { '0': 2 },
      potential: 0,
    });
    const effects = collectHitEffects(patched.battleSkill);
    const clawmarkDot = effects.find(
      (effect: any) => effect.kind === 'damageOverTime' && effect.name === 'razorClawmark',
    );

    expect(clawmarkDot?.id).toBe('razorClawmark');
  });

  it('keeps named operator DoTs on stable runtime ids after skill patching', () => {
    const missingIds: string[] = [];

    for (const { slug } of getOperatorList()) {
      const operator = getOperator(slug);
      if (!operator) continue;
      const patched = patchCombatSkills(operator, {
        talentStates: Object.fromEntries(
          (operator.talents ?? []).map((group, index) => [
            String(index),
            Math.max(1, group.levels ?? 1),
          ]),
        ),
        potential: operator.potentials?.length ?? 0,
      });
      for (const [skillKey, skill] of Object.entries(patched)) {
        collectHitEffects(skill).forEach((effect: any, effectIndex: number) => {
          if (effect.kind === 'damageOverTime' && effect.name && !effect.id) {
            missingIds.push(`${slug}.${skillKey}.effect${effectIndex}:${effect.name}`);
          }
        });
      }
    }

    expect(missingIds).toEqual([]);
  });
});
