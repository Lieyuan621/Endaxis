import { describe, expect, it } from 'vitest';
import { arcane, perlica } from './operators';
import { gearDefinitions, gearSetDefinitions } from './equipment';
import { createGameDataRepository } from './gameDataRepository';

describe('gameDataRepository', () => {
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
});
