import { describe, expect, it, vi } from 'vitest';
import { perlica } from '../../data/operators/perlica.generated';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import { createEmptyScenario } from '../project/createProject';
import { resolveScenarioBuilds } from './resolveScenarioBuilds';

const weapon: WeaponDefinition = {
  slug: 'resolver-weapon',
  rarity: 6,
  weaponType: perlica.weaponType,
  baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
  traits: [],
};

function gear(slug: string, slotType: GearDefinition['slotType']): GearDefinition {
  return {
    slug,
    slotType,
    levelRequirement: 1,
    baseDefense: 0,
    traits: [],
    gearSetSlug: 'resolver-set',
  };
}

const armor = gear('resolver-armor', 'armor');
const gloves = gear('resolver-gloves', 'gloves');
const accessory = gear('resolver-accessory', 'accessory');
const gearSet: GearSetDefinition = { slug: 'resolver-set' };

function scenario() {
  const value = createEmptyScenario('scenario:resolver', '构筑解析样本');
  value.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
      talentStates: {},
    },
    weapon: {
      weaponSlug: weapon.slug,
      level: 90,
      tuned: true,
      potential: 0,
      traitLevels: [],
    },
    gears: {
      armor: { gearSlug: armor.slug, artificingLevels: [] },
      gloves: { gearSlug: gloves.slug, artificingLevels: [] },
      accessory1: { gearSlug: accessory.slug, artificingLevels: [] },
      accessory2: null,
    },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return value;
}

function index() {
  const gears = new Map([armor, gloves, accessory].map(value => [value.slug, value]));
  return {
    getOperator: vi.fn((slug: string) => (slug === perlica.slug ? perlica : null)),
    getWeapon: vi.fn((slug: string) => (slug === weapon.slug ? weapon : null)),
    getGear: vi.fn((slug: string) => gears.get(slug) ?? null),
    getGearSet: vi.fn((slug: string) => (slug === gearSet.slug ? gearSet : null)),
  };
}

describe('resolveScenarioBuilds', () => {
  it('resolves each referenced index object once and exposes the active three-piece set', () => {
    const source = index();
    const [resolved] = resolveScenarioBuilds(scenario(), source);

    expect(resolved).toMatchObject({
      trackIndex: 0,
      operatorInstance: { operatorSlug: perlica.slug },
      operator: { slug: perlica.slug },
      weapon: { instance: { weaponSlug: weapon.slug }, definition: { slug: weapon.slug } },
    });
    expect(resolved!.gears.map(value => value.slot)).toEqual(['armor', 'gloves', 'accessory1']);
    expect(resolved!.activeGearSets).toEqual([gearSet]);
    expect(source.getOperator).toHaveBeenCalledOnce();
    expect(source.getWeapon).toHaveBeenCalledOnce();
    expect(source.getGear).toHaveBeenCalledTimes(3);
    expect(source.getGearSet).toHaveBeenCalledOnce();
  });

  it('rejects an incompatible weapon before downstream compilation', () => {
    const source = index();
    source.getWeapon.mockReturnValue({ ...weapon, weaponType: 'greatsword' });

    expect(() => resolveScenarioBuilds(scenario(), source)).toThrow(
      "weapon type 'greatsword' is incompatible with operator weapon type 'arts-unit'",
    );
  });

  it('rejects duplicate operator build assignment', () => {
    const value = scenario();
    value.tracks[1] = {
      ...value.tracks[0]!,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    };

    expect(() => resolveScenarioBuilds(value, index())).toThrow(
      "duplicate track identity 'track:0'",
    );
  });
});
