import { describe, expect, it } from 'vitest';
import { arcane } from '../../data/operators/arcane.generated';
import { endministrator } from '../../data/operators/endministrator.generated';
import { zhuangFangyi } from '../../data/operators/zhuang-fangyi.generated';

import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import type { OperatorInstanceDocument, TrackDocument } from '../project/schema';
import { resolveOperatorPanel } from './resolveOperatorPanel';
import type { ResolvedScenarioBuild } from './resolveScenarioBuilds';

const gearDisplay = {
  kind: 'modifier',
  modifier: { kind: 'panelStat', stat: 'attackFlat', value: 0 },
} as const;

function resolvedBuild(
  operator: OperatorDefinition,
  changes: Partial<OperatorInstanceDocument> = {},
): ResolvedScenarioBuild {
  const operatorInstance: OperatorInstanceDocument = {
    operatorSlug: operator.slug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 4,
    skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
    talentStates: {},
    ...changes,
  };
  const track: TrackDocument = {
    id: 'track:0',
    operator: operatorInstance,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [],
  };
  return {
    trackIndex: 0,
    track,
    operatorInstance,
    operator,
    weapon: null,
    gears: [],
    activeGearSets: [],
  };
}

describe('resolveOperatorPanel', () => {
  it('图武器的面板只读取静态修正，不加载被动程序', () => {
    const base = resolvedBuild(endministrator);
    const weapon: WeaponDefinition = {
      slug: 'native-weapon',
      rarity: 5,
      weaponType: endministrator.weaponType,
      baseAttackAtLevelNodes: [1, 1, 1, 1, 1, 1],
      traits: [
        {
          key: 'native-trait',
          skillId: 'native-passive-skill',
          levelCount: 1,
          modifiers: [{ kind: 'panelStat', stat: 'attackFlat', value: 20 }],
          enableSequence: { $sequence: 'missing' },
          actionGraph: { main: { nodes: {} }, macros: {} },
        },
      ],
    };
    const withWeapon: ResolvedScenarioBuild = {
      ...base,
      weapon: {
        instance: {
          weaponSlug: weapon.slug,
          level: 90,
          tuned: true,
          potential: 0,
          traitLevels: [1],
        },
        definition: weapon,
      },
    };
    const baseline = resolveOperatorPanel(base);
    const panel = resolveOperatorPanel(withWeapon);
    expect(panel.attackBase!.rawValue).toBe(baseline.attackBase!.rawValue + 1);
    expect(panel.attackBase!.baseFinalAddition).toBe(baseline.attackBase!.baseFinalAddition + 20);
  });
  it('applies Endministrator potential 4 health from the current native effect table', () => {
    const before = resolveOperatorPanel(resolvedBuild(endministrator, { potential: 3 }));
    const unlocked = resolveOperatorPanel(resolvedBuild(endministrator, { potential: 4 }));

    expect(unlocked.attributes.agility - before.attributes.agility).toBe(0);
    expect(unlocked.attack).toBe(before.attack);
    expect(unlocked.health).toBeGreaterThan(before.health);
  });

  it('calculates the verified level-90 operator baseline and default trust nodes', () => {
    const panel = resolveOperatorPanel(resolvedBuild(zhuangFangyi));

    expect(panel.attributes).toEqual({
      strength: 99,
      agility: 99,
      intellect: 123,
      will: 244,
    });
    expect(panel).toMatchObject({
      attack: 803,
      attackDetail: {
        operatorBaseAttack: expect.any(Number),
        weaponBaseAttack: 0,
        attackPercent: 0,
        flatAttack: 0,
      },
      health: 5990,
      defense: 0,
      criticalRate: 0.05,
      criticalDamage: 0.5,
      artsIntensity: 0,
      ultimateEnergyGainEfficiency: 1,
    });
    expect(panel.receipt.filter(entry => entry.source.kind === 'trust')).toHaveLength(4);
  });

  it('uses the operator-specific trust targets and values for Arcane', () => {
    const panel = resolveOperatorPanel(resolvedBuild(arcane));

    expect(panel.attributes).toEqual({
      strength: 91,
      agility: 93,
      intellect: 219,
      will: 164,
    });
    expect(panel.attack).toBe(755);
    expect(panel.health).toBe(5950);
    expect(
      panel.receipt
        .filter(entry => entry.source.kind === 'trust')
        .map(entry => [entry.stat, entry.value]),
    ).toEqual([
      ['intellect', 8],
      ['will', 8],
      ['intellect', 10],
      ['will', 10],
      ['intellect', 10],
      ['will', 10],
      ['intellect', 15],
      ['will', 15],
    ]);
  });

  it('applies panel-relevant potential modifiers without mixing combat-only modifiers', () => {
    const panel = resolveOperatorPanel(resolvedBuild(zhuangFangyi, { potential: 2 }));

    expect(panel.attributes.will).toBe(264);
    expect(panel.attack).toBe(836);
    expect(panel.receipt).toContainEqual({
      source: { kind: 'operatorUpgrade', source: 'potential', index: 1 },
      stat: 'will',
      operation: 'flat',
      value: 20,
    });
    expect(panel.combatModifiers).toContainEqual({
      kind: 'staticDamageIncrease',
      source: { kind: 'operatorUpgrade', source: 'potential', index: 1 },
      target: 'battleSkill',
      value: 0.15,
    });
  });

  it('applies potential modifiers in the recovered static attribute base layer', () => {
    const operator: OperatorDefinition = {
      ...zhuangFangyi,
      potentials: [
        {
          levels: 1,
          modifiers: [
            {
              kind: 'modifyBasePanelStat',
              stat: 'health',
              operation: 'percent',
              value: 0.1,
            },
            {
              kind: 'modifyBasePanelStat',
              stat: 'defense',
              operation: 'flat',
              value: 20,
            },
            {
              kind: 'modifyBasePanelStat',
              stat: 'criticalRate',
              operation: 'flat',
              value: 0.07,
            },
            {
              kind: 'modifyBasePanelStat',
              stat: 'artsIntensity',
              operation: 'flat',
              value: 16,
            },
            { kind: 'addStaticDamageIncrease', target: 'normalAttack', value: 0.15 },
            { kind: 'addStaticDamageIncrease', target: 'physical', value: 0.08 },
            { kind: 'addStaticHealingIncrease', target: 'output', value: 0.1 },
          ],
        },
      ],
    };

    const panel = resolveOperatorPanel(resolvedBuild(operator, { potential: 1 }));

    expect(panel).toMatchObject({
      health: 6589,
      defense: 20,
      artsIntensity: 16,
    });
    expect(panel.criticalRate).toBeCloseTo(0.12);
    expect(panel.combatModifiers).toEqual([
      {
        kind: 'staticDamageIncrease',
        target: 'normalAttack',
        value: 0.15,
        source: { kind: 'operatorUpgrade', source: 'potential', index: 0 },
      },
      {
        kind: 'staticDamageIncrease',
        target: 'physical',
        value: 0.08,
        source: { kind: 'operatorUpgrade', source: 'potential', index: 0 },
      },
      { kind: 'staticHealingIncrease', target: 'output', value: 0.1 },
    ]);
    expect(panel.receipt).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stat: 'health', operation: 'percent', value: 0.1 }),
        expect.objectContaining({ stat: 'defense', operation: 'flat', value: 20 }),
        expect.objectContaining({ stat: 'criticalRate', operation: 'flat', value: 0.07 }),
      ]),
    );
  });

  it('aggregates weapon attack, gear defense, static traits, sets, and combat-only modifiers', () => {
    const baseBuild = resolvedBuild(zhuangFangyi);
    const weapon: WeaponDefinition = {
      slug: 'panel-weapon',
      rarity: 6,
      weaponType: zhuangFangyi.weaponType,
      baseAttackAtLevelNodes: [10, 20, 40, 60, 80, 100],
      traits: [
        {
          key: 'attack',
          levelCount: 1,
          modifiers: [{ kind: 'panelStat', stat: 'attackPercent', value: 0.1 }],
        },
      ],
    };
    const gear: GearDefinition = {
      slug: 'panel-gear',
      slotType: 'armor',
      levelRequirement: 1,
      baseDefense: 50,
      gearSetSlug: 'panel-set',
      traits: [
        {
          key: 'main-and-critical',
          levelCount: 1,
          display: gearDisplay,
          modifiers: [
            { kind: 'attribute', attribute: 'main', operation: 'flat', value: 10 },
            { kind: 'panelStat', stat: 'criticalRate', value: 0.05 },
            {
              kind: 'damageBonus',
              damageTypes: 'electric',
              value: 0.2,
            },
          ],
        },
      ],
    };
    const gearSet: GearSetDefinition = {
      slug: 'panel-set',
      modifiers: [{ kind: 'panelStat', stat: 'attackFlat', value: 20 }],
    };
    const build: ResolvedScenarioBuild = {
      ...baseBuild,
      weapon: {
        instance: {
          weaponSlug: weapon.slug,
          level: 90,
          tuned: true,
          potential: 0,
          traitLevels: [1],
        },
        definition: weapon,
      },
      gears: [
        {
          slot: 'armor',
          instance: { gearSlug: gear.slug, artificingLevels: [0] },
          definition: gear,
        },
      ],
      activeGearSets: [gearSet],
    };

    const panel = resolveOperatorPanel(build);

    expect(panel.attributes.will).toBe(254);
    expect(panel.attack).toBe(1229);
    expect(panel.health).toBe(5990);
    expect(panel.defense).toBe(50);
    expect(panel.criticalRate).toBe(0.1);
    expect(panel.combatModifiers).toEqual([
      {
        kind: 'damageBonus',
        damageTypes: 'electric',
        value: 0.2,
        source: {
          kind: 'equipment',
          contribution: { kind: 'gearTrait', slug: 'panel-gear', traitKey: 'main-and-critical' },
        },
      },
    ]);
  });

  it('fails closed for unsupported level nodes and unnormalized overrides', () => {
    expect(() => resolveOperatorPanel(resolvedBuild(zhuangFangyi, { level: 89 }))).toThrow(
      'must be one of 1, 20, 40, 60, 80, 90',
    );
    expect(() =>
      resolveOperatorPanel(resolvedBuild(zhuangFangyi, { baseStatOverrides: { attack: 1 } })),
    ).toThrow('panel override semantics are not normalized');
  });
});
