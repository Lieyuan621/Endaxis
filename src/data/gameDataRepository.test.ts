import { describe, expect, it } from 'vitest';
import {
  alesh,
  antal,
  akekuri,
  ardelia,
  avywenna,
  catcher,
  arcane,
  arclight,
  camille,
  chenQianyu,
  daPan,
  ember,
  endministrator,
  estella,
  fluorite,
  gilberta,
  lastRite,
  laevatain,
  lifeng,
  liino,
  mifu,
  perlica,
  pogranichnik,
  purrchena,
  rossi,
  snowshine,
  tangtang,
  typhoeus,
  wulfgard,
  xaihi,
  yvonne,
  zhuangFangyi,
} from './operators';
import { gearDefinitions, gearSetDefinitions } from './equipment';
import { createGameDataRepository, gameDataRepository } from './gameDataRepository';
import { generatedSkillSettings } from './combat/skillSettings.generated';
import { weaponDefinitions } from './equipment/weaponDefinitions';

describe('gameDataRepository', () => {
  it('uses the generated native data version internally', () => {
    expect(gameDataRepository.revision).toBe(generatedSkillSettings.revision);
  });

  it('indexes every explicitly registered Next operator', () => {
    expect(gameDataRepository.getOperators()).toEqual([
      perlica,
      arcane,
      zhuangFangyi,
      arclight,
      gilberta,
      lifeng,
      estella,
      daPan,
      ember,
      akekuri,
      fluorite,
      endministrator,
      lastRite,
      chenQianyu,
      rossi,
      camille,
      pogranichnik,
      purrchena,
      tangtang,
      typhoeus,
      laevatain,
      liino,
      mifu,
      yvonne,
      snowshine,
      wulfgard,
      antal,
      alesh,
      xaihi,
      avywenna,
      catcher,
      ardelia,
    ]);
    expect(gameDataRepository.getOperator(perlica.slug)).toBe(perlica);
    expect(gameDataRepository.getOperator(purrchena.slug)).toBe(purrchena);
    expect(gameDataRepository.getOperator(alesh.slug)).toBe(alesh);
    expect(gameDataRepository.getOperator(arcane.slug)).toBe(arcane);
    expect(gameDataRepository.getOperator(zhuangFangyi.slug)).toBe(zhuangFangyi);
    expect(gameDataRepository.getOperator(arclight.slug)).toBe(arclight);
    expect(gameDataRepository.getOperator(gilberta.slug)).toBe(gilberta);
    expect(gameDataRepository.getOperator(lifeng.slug)).toBe(lifeng);
    expect(gameDataRepository.getOperator(estella.slug)).toBe(estella);
    expect(gameDataRepository.getOperator(daPan.slug)).toBe(daPan);
    expect(gameDataRepository.getOperator(ember.slug)).toBe(ember);
    expect(gameDataRepository.getOperator(akekuri.slug)).toBe(akekuri);
    expect(gameDataRepository.getOperator(fluorite.slug)).toBe(fluorite);
    expect(gameDataRepository.getOperator(endministrator.slug)).toBe(endministrator);
    expect(gameDataRepository.getOperator(lastRite.slug)).toBe(lastRite);
    expect(gameDataRepository.getOperator(chenQianyu.slug)).toBe(chenQianyu);
    expect(gameDataRepository.getOperator(rossi.slug)).toBe(rossi);
    expect(gameDataRepository.getOperator(camille.slug)).toBe(camille);
    expect(gameDataRepository.getOperator(tangtang.slug)).toBe(tangtang);
    expect(gameDataRepository.getOperator(typhoeus.slug)).toBe(typhoeus);
    expect(gameDataRepository.getOperator(laevatain.slug)).toBe(laevatain);
    expect(gameDataRepository.getOperator(liino.slug)).toBe(liino);
    expect(gameDataRepository.getOperator(mifu.slug)).toBe(mifu);
    expect(gameDataRepository.getOperator(yvonne.slug)).toBe(yvonne);
    expect(gameDataRepository.getOperator(pogranichnik.slug)).toBe(pogranichnik);
    expect(gameDataRepository.getOperator(snowshine.slug)).toBe(snowshine);
    expect(gameDataRepository.getOperator(wulfgard.slug)).toBe(wulfgard);
    expect(gameDataRepository.getOperator(antal.slug)).toBe(antal);
    expect(gameDataRepository.getOperator(xaihi.slug)).toBe(xaihi);
    expect(gameDataRepository.getOperator(avywenna.slug)).toBe(avywenna);
    expect(gameDataRepository.getOperator(catcher.slug)).toBe(catcher);
    expect(gameDataRepository.getOperator(ardelia.slug)).toBe(ardelia);
    expect(gameDataRepository.getOperator('missing')).toBeNull();
  });

  it('registers complete and explicitly marked partial equipment definitions', () => {
    expect(gameDataRepository.getWeapons()).toEqual(weaponDefinitions);
    expect(gameDataRepository.getGears()).toEqual(gearDefinitions);
    expect(gameDataRepository.getGearSets()).toEqual(gearSetDefinitions);
    expect(gameDataRepository.getWeapon('wpn_sword_0003')?.slug).toBe('wpn_sword_0003');
    expect(gameDataRepository.getGear('item_equip_t4_suit_atk02_hand_02')?.slug).toBe(
      'item_equip_t4_suit_atk02_hand_02',
    );
    expect(gameDataRepository.getGear('xiranflow-light-armor')).toBeNull();
    expect(gameDataRepository.getGearSet('aic-fieldwork')).toBeNull();
    expect(gameDataRepository.getGearSet('suit_generaltype')).not.toBeNull();
    expect(gameDataRepository.getWeapon('missing')).toBeNull();
    expect(gameDataRepository.getGear('missing')).toBeNull();
    expect(gameDataRepository.getGearSet('missing')).toBeNull();
    expect(gameDataRepository.getMechanic('missing')).toBeNull();
  });

  it('keeps operator project identities as English slugs', () => {
    for (const operator of gameDataRepository.getOperators()) {
      expect(operator.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('indexes adapted enemy definitions without using the legacy store', () => {
    const enemy = gameDataRepository.getEnemy('eny-0125-fdcentur');

    expect(gameDataRepository.getEnemies()).toContain(enemy);
    expect(enemy).toMatchObject({
      id: 'eny-0125-fdcentur',
      rank: 'boss',
      defense: 100,
      superArmor: 30,
      finisherMultiplier: 1.75,
    });
    expect(enemy?.levelHp[5]).toBe(2476341);
    expect(gameDataRepository.getEnemy('missing')).toBeNull();
  });

  it('keeps native rank independent from the legacy display tier', () => {
    expect(gameDataRepository.getEnemy('eny-0007-mimicw')).toMatchObject({
      id: 'eny-0007-mimicw',
      tier: 'advanced',
      rank: 'elite',
    });
  });

  it('rejects duplicate stable identities while building a index', () => {
    expect(() =>
      createGameDataRepository({ revision: 'fixture', operators: [perlica, perlica] }),
    ).toThrow("duplicate operator definition 'perlica'");
  });

  it('resolves legacy gear identities through identity-preserving alias views', () => {
    const gear = gearDefinitions[0]!;
    const gearSet = gearSetDefinitions[0]!;
    const repository = createGameDataRepository({
      revision: 'fixture',
      gears: [gear],
      gearAliases: { 'legacy-gear': gear.slug },
      gearSets: [gearSet],
      gearSetAliases: { 'legacy-set': gearSet.slug },
    });

    expect(repository.getGears()).toEqual([gear]);
    expect(repository.getGearSets()).toEqual([gearSet]);
    expect(repository.getGear('legacy-gear')).toEqual({ ...gear, slug: 'legacy-gear' });
    expect(repository.getGearSet('legacy-set')).toEqual({ ...gearSet, slug: 'legacy-set' });
    expect(repository.getGear('legacy-gear')?.slug).toBe('legacy-gear');
    expect(repository.getGearSet('legacy-set')?.slug).toBe('legacy-set');
    expect(Object.isFrozen(repository.getGear('legacy-gear'))).toBe(true);
  });

  it('uses native weapon ids without registering presentation aliases', () => {
    const native = weaponDefinitions[0]!;
    expect(gameDataRepository.getWeapon(native.slug)).toBe(native);
    expect(gameDataRepository.getWeapon('tarr-11')).toBeNull();
    expect(gameDataRepository.getWeapons()).toEqual(weaponDefinitions);
  });

  it('rejects aliases that are redundant, shadow definitions or target missing definitions', () => {
    const gear = gearDefinitions[0]!;

    expect(() =>
      createGameDataRepository({
        revision: 'fixture',
        gears: [gear],
        gearAliases: { [gear.slug]: gear.slug },
      }),
    ).toThrow(`redundant gear alias '${gear.slug}'`);
    expect(() =>
      createGameDataRepository({
        revision: 'fixture',
        gears: [gear],
        gearAliases: { [gear.slug]: 'other' },
      }),
    ).toThrow(`gear alias '${gear.slug}' shadows a definition`);
    expect(() =>
      createGameDataRepository({
        revision: 'fixture',
        gears: [gear],
        gearAliases: { legacy: 'missing' },
      }),
    ).toThrow("gear alias 'legacy' targets unknown definition 'missing'");
  });

  it('captures definitions instead of retaining the mutable input array', () => {
    const operators = [perlica];
    const repository = createGameDataRepository({ revision: 'fixture', operators });
    operators.push(arcane);

    expect(repository.getOperators()).toEqual([perlica]);
    expect(repository.getOperator(perlica.slug)).toBe(perlica);
    expect(repository.getOperator(arcane.slug)).toBeNull();
    expect(Object.isFrozen(repository)).toBe(true);
  });

  it('rejects an empty revision and duplicate enemy identities', () => {
    const enemy = gameDataRepository.getEnemy('eny-0125-fdcentur')!;

    expect(() => createGameDataRepository({ revision: '' })).toThrow(
      'game data revision must not be empty',
    );
    expect(() =>
      createGameDataRepository({ revision: 'fixture', enemies: [enemy, enemy] }),
    ).toThrow("duplicate enemy definition 'eny-0125-fdcentur'");
  });
});
