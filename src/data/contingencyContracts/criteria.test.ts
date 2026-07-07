import { describe, it, expect } from 'vitest';
import { CRITERION_MECHANISMS } from '@/data/contingencyContracts/criteriaEffects';
import { getDefaultContingencyContractSeason } from '@/data/contingencyContracts';
import { computeStats } from '@/data/stats/computeStats';
import {
  filterDamageModifiers,
  computeExpectedDamageWithBreakdown,
} from '@/data/stats/computeDamage';
import { computeEnemyStats } from '@/data/stats/computeEnemyStats';
import { resolveStatAttributes } from '@/data/collect';
import type {
  BaseStatValues,
  ResolvedStatModifier,
  SheetStatEffect,
  ScopedDamageModifier,
} from '@/data/stats/types';
import { EnemyState } from '@/simulation/state/EnemyState';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

function makeBase(): BaseStatValues {
  return {
    level: 80,
    baseAtk: 1000,
    baseHp: 5000,
    weaponAtk: 0,
    baseAttrs: { strength: 1000, agility: 0, intellect: 0, will: 0 },
    mainAttributeName: 'strength',
    secondaryAttributeName: 'intellect',
  };
}

function makeEnemy(): EnemyState {
  // hasInflictionBarrier / applyStatus don't touch the engine.
  return new EnemyState(
    { maxStagger: 100, staggerNodeCount: 0, staggerNodeDuration: 2, staggerBreakDuration: 10 } as any,
    {} as any,
  );
}

/** Base HitDamageParams (neutral factors) for the damage-formula tests. */
function dmgBase() {
  return {
    attack: 1000,
    multiplier: 200, // chosen so results are integers (no rounding noise)
    critRate: 0,
    critDmg: 0,
    dmgBonus: 0,
    dmgBonusExternalMult: 1,
    ampBonus: 0,
    directMultiplier: 1,
    enemyDef: 100,
    resistanceIgnore: 0,
    resistanceShred: 0,
    susceptibility: 0,
    increasedDmgTaken: 0,
    dmgTakenExternalMult: 1,
    linkStacks: 0,
    staggerMult: 1,
    finisherMult: 1,
  };
}

// ─── external mechanism (attributePercent) — Weaken/Strangle/Bent Edges ──────

describe('contingency contract source data coverage', () => {
  it('includes the latest new tags and groups from AKEDatabase', () => {
    const season = getDefaultContingencyContractSeason();
    expect(season).toBeTruthy();
    const groups = new Map(season!.groups.map(group => [group.id, group]));
    const tags = new Map(season!.groups.flatMap(group => group.tags.map(tag => [tag.id, tag])));

    expect(groups.get('3')?.tags.map(tag => tag.id)).toEqual([102101, 102102, 102103]);
    expect(groups.get('11')?.tags.map(tag => tag.id)).toEqual([103401, 103302, 101402]);
    expect(groups.get('18')?.tags.map(tag => tag.id)).toEqual([101701, 101603]);
    expect(groups.get('23')?.tags.map(tag => tag.id)).toEqual([102201, 102202]);

    expect(tags.get(101603)).toMatchObject({
      groupId: 1016,
      name: '改写：热量汲取',
      iconPath: '/contingency_contract/1/icon_activity_contract_tag_135.webp',
      lockIds: ['key2'],
    });
    expect(tags.get(102103)).toMatchObject({ groupId: 1021, score: 3, roman: 'Ⅲ' });
    expect(tags.get(103401)).toMatchObject({ groupId: 1034, name: '队列：重负' });
    expect(tags.get(102201)).toMatchObject({ groupId: 1022, name: '环境：再构成' });
    expect(tags.get(102202)).toMatchObject({ groupId: 1022, name: '环境：再构成' });
  });

  it('has mechanism entries for all newly introduced criterion groups', () => {
    expect(CRITERION_MECHANISMS[1021]?.levelCount).toBe(3);
    expect(CRITERION_MECHANISMS[1016]?.levelCount).toBe(1);
    expect(CRITERION_MECHANISMS[1022]?.levelCount).toBe(2);
    expect(CRITERION_MECHANISMS[1034]?.levelCount).toBe(1);
  });
});

describe('external attributePercent (final multiplier)', () => {
  it('applies external as an independent final multiplier on the sheet path', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: 20 },
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: -40, external: true },
    ];
    const status = computeStats(makeBase(), sheet, []);
    // base 1000 × (1 + 0.20) × (1 - 0.40) = 720, NOT the additive (1 + 0.20 - 0.40) = 800
    expect(status.attributes.strength).toBe(720);
  });

  it('applies external as an independent final multiplier on the dynamic (sim) path', () => {
    const dynamic: ResolvedStatModifier[] = [
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: 20 },
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: -40, external: true },
    ];
    const status = computeStats(makeBase(), [], dynamic);
    expect(status.attributes.strength).toBe(720);
  });

  it('without external, the same values pool additively', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: 20 },
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: -40 },
    ];
    const status = computeStats(makeBase(), sheet, []);
    expect(status.attributes.strength).toBe(800);
  });

  it('stacks multiple external multipliers multiplicatively', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: -10, external: true },
      { stat: { modifier: 'attributePercent', attribute: 'strength' }, value: -40, external: true },
    ];
    const status = computeStats(makeBase(), sheet, []);
    expect(status.attributes.strength).toBe(540); // 1000 × 0.90 × 0.60
  });
});

describe('resolveStatAttributes (per-target main/sub resolution)', () => {
  it("resolves 'main'/'sub' to the target operator's attributes", () => {
    expect(
      resolveStatAttributes({ modifier: 'attributePercent', attribute: 'main' }, 'strength', 'intellect'),
    ).toEqual({ modifier: 'attributePercent', attribute: 'strength' });
    expect(
      resolveStatAttributes({ modifier: 'attributePercent', attribute: 'sub' }, 'strength', 'intellect'),
    ).toEqual({ modifier: 'attributePercent', attribute: 'intellect' });
  });

  it('resolves the same team effect differently per operator (mixed-main team)', () => {
    const teamEffect = { modifier: 'attributePercent', attribute: 'main' } as const;
    expect((resolveStatAttributes(teamEffect, 'strength', 'will') as any).attribute).toBe('strength');
    expect((resolveStatAttributes(teamEffect, 'intellect', 'agility') as any).attribute).toBe('intellect');
  });

  it('leaves concrete attributes and non-attribute stats untouched (same reference)', () => {
    const concrete = { modifier: 'attributePercent', attribute: 'agility' } as const;
    expect(resolveStatAttributes(concrete, 'strength', 'intellect')).toBe(concrete);
    const noAttr = { modifier: 'atkPercent' } as const;
    expect(resolveStatAttributes(noAttr, 'strength', 'intellect')).toBe(noAttr);
    expect(resolveStatAttributes(undefined, 'strength', 'intellect')).toBeUndefined();
  });

  it('resolves placeholders inside an attribute array', () => {
    expect(
      resolveStatAttributes(
        { modifier: 'attributePercent', attribute: ['main', 'will'] },
        'strength',
        'intellect',
      ),
    ).toEqual({ modifier: 'attributePercent', attribute: ['strength', 'will'] });
  });
});

describe('external dmgBonus (standalone multiplicative damage factor)', () => {
  it('filterDamageModifiers splits external dmgBonus into its own multiplicative factor', () => {
    const mods: ScopedDamageModifier[] = [
      { modifier: 'dmgBonus', value: 1.5 },
      { modifier: 'dmgBonus', value: -0.45, external: true },
      { modifier: 'dmgBonus', value: -0.1, external: true },
    ];
    const f = filterDamageModifiers(mods, undefined, undefined, undefined);
    expect(f.dmgBonus).toBeCloseTo(1.5, 10);
    expect(f.dmgBonusExternalMult).toBeCloseTo(0.55 * 0.9, 10);
  });

  it('clamps a stacked external dmgBonus debuff at 0 (no negative factor)', () => {
    const f = filterDamageModifiers(
      [{ modifier: 'dmgBonus', value: -1.5, external: true }],
      undefined,
      undefined,
      undefined,
    );
    expect(f.dmgBonusExternalMult).toBe(0);
    const dmg = computeExpectedDamageWithBreakdown({ ...dmgBase(), dmgBonusExternalMult: f.dmgBonusExternalMult });
    expect(dmg.expectedDamage).toBe(0);
  });

  it('applies dmgBonusExternalMult as a standalone factor in the damage formula', () => {
    const base = { ...dmgBase(), dmgBonus: 1.5 };
    const withExternal = computeExpectedDamageWithBreakdown({ ...base, dmgBonusExternalMult: 0.55 });
    const noExternal = computeExpectedDamageWithBreakdown({ ...base, dmgBonusExternalMult: 1 });
    expect(withExternal.expectedDamage).toBeCloseTo(noExternal.expectedDamage * 0.55, 6);
    const additiveWrong = computeExpectedDamageWithBreakdown({ ...base, dmgBonus: 1.05, dmgBonusExternalMult: 1 });
    expect(withExternal.expectedDamage).not.toBeCloseTo(additiveWrong.expectedDamage, 6);
  });
});

// ─── 队列：扼制 (Strangle) — group 1009 ────────────────────────────────────────

describe('Strangle (group 1009) mechanism data', () => {
  const strangle = CRITERION_MECHANISMS[1009]!;

  it('exists with 5 triggers covering vulnerability + the 4 inflictions', () => {
    expect(strangle).toBeDefined();
    expect(strangle.triggers).toHaveLength(5);
    const statuses = strangle.triggers!.map(t => (t.trigger as any).status);
    expect(new Set(statuses)).toEqual(
      new Set(['vulnerability', 'heatInfliction', 'cryoInfliction', 'electricInfliction', 'natureInfliction']),
    );
  });

  it('maps each status to a self external dmgBonus debuff on the matching damage type', () => {
    const expected: Record<string, string> = {
      vulnerability: 'physical',
      heatInfliction: 'heat',
      cryoInfliction: 'cryo',
      electricInfliction: 'electric',
      natureInfliction: 'nature',
    };
    for (const te of strangle.triggers!) {
      const trig = te.trigger as any;
      expect(trig.kind).toBe('onStatusApplied');
      expect(trig.target).toBe('enemy');
      expect(trig.triggerScope).toBe('global');
      expect(te.effects).toHaveLength(1);
      const eff = te.effects[0] as any;
      expect(eff.kind).toBe('status');
      expect(eff.target).toBe('self');
      expect(eff.value).toEqual([-45, -90]);
      expect(eff.duration).toBe(10);
      expect(eff.external).toBe(true);
      expect(eff.stat.modifier).toBe('dmgBonus');
      expect(eff.stat.elements).toEqual([expected[trig.status]]);
    }
  });
});

// ─── 队列：折刃 (Bent Edges) — group 1005 ──────────────────────────────────────

describe('Bent Edges (group 1005) mechanism data', () => {
  const bentEdges = CRITERION_MECHANISMS[1005]!;

  it('has one onActionStart(ultimate) global trigger with debuff + counter effects', () => {
    expect(bentEdges.triggers).toHaveLength(1);
    const trig = bentEdges.triggers![0]!.trigger as any;
    expect(trig.kind).toBe('onActionStart');
    expect(trig.skillTypes).toBe('ultimate');
    expect(trig.triggerScope).toBe('global');
    expect(bentEdges.triggers![0]!.effects).toHaveLength(2);
  });

  it('debuff: self external dmgBonus on ultimate, scaled by the prior-cast counter', () => {
    const debuff = bentEdges.triggers![0]!.effects[0] as any;
    expect(debuff.target).toBe('self');
    expect(debuff.external).toBe(true);
    expect(debuff.value).toBe(0);
    expect(debuff.stackStrategy).toBe('REPLACE');
    expect(debuff.duration).toBe(Infinity);
    expect(debuff.stat).toEqual({ modifier: 'dmgBonus', skillTypes: 'ultimate' });
    expect(debuff.scaling.additive).toEqual([
      { key: 'bent-edges-count', target: 'self', coefficient: [-50, -100] },
    ]);
  });

  it('counter: pure-state self counter accumulating one stack per cast', () => {
    const counter = bentEdges.triggers![0]!.effects[1] as any;
    expect(counter.id).toBe('bent-edges-count');
    expect(counter.target).toBe('self');
    expect(counter.stacks).toBe(1);
    expect(counter.stackStrategy).toBe('REFRESH_DURATION');
    expect(counter.duration).toBe(Infinity);
    expect(counter.stat).toBeUndefined();
  });
});

// ─── 改写：屏障 (Effect Barrier) — group 1010 ──────────────────────────────────

describe('EnemyState.hasInflictionBarrier', () => {
  it('matches the barred element while active, ignores others and expiry', () => {
    const enemy = makeEnemy();
    enemy.applyStatus({
      id: 'inflictionBarrier-heat',
      stat: { modifier: 'inflictionBarrier', elements: 'heat' },
      value: 0,
      stacks: 1,
      maxStacks: 1,
      expiresAt: 5,
      sourceId: 't0',
    } as any);
    expect(enemy.hasInflictionBarrier('heat', 1)).toBe(true);
    expect(enemy.hasInflictionBarrier('cryo', 1)).toBe(false);
    expect(enemy.hasInflictionBarrier('heat', 6)).toBe(false);
  });

  it('returns false with no barrier present', () => {
    expect(makeEnemy().hasInflictionBarrier('heat', 0)).toBe(false);
  });
});

describe('Effect Barrier (group 1010) mechanism data', () => {
  const barrier = CRITERION_MECHANISMS[1010]!;

  it('has 5 onStatusApplied/enemy/global triggers applying per-type inflictionBarrier markers', () => {
    expect(barrier.triggers).toHaveLength(5);
    const expected: Record<string, string> = {
      vulnerability: 'physical',
      heatInfliction: 'heat',
      cryoInfliction: 'cryo',
      electricInfliction: 'electric',
      natureInfliction: 'nature',
    };
    for (const te of barrier.triggers!) {
      const trig = te.trigger as any;
      expect(trig.kind).toBe('onStatusApplied');
      expect(trig.target).toBe('enemy');
      expect(trig.triggerScope).toBe('global');
      const eff = te.effects[0] as any;
      expect(eff.target).toBe('enemy');
      expect(eff.duration).toBe(5);
      expect(eff.silent).toBe(true);
      expect(eff.stat.modifier).toBe('inflictionBarrier');
      expect(eff.stat.elements).toBe(expected[trig.status]);
    }
  });
});

// ─── 队列：脱力 (Poor Basics) — group 1008 ─────────────────────────────────────

describe('Poor Basics (group 1008) mechanism data', () => {
  it('applies a team-wide -70% basic-attack dmgBonus debuff as a standalone external factor', () => {
    const eff = CRITERION_MECHANISMS[1008]!.effects![0] as any;
    expect(eff.target).toBe('team');
    expect(eff.value).toBe(-70);
    expect(eff.external).toBe(true);
    expect(eff.stat.modifier).toBe('dmgBonus');
    expect(eff.stat.skillTypes).toBe('basicAttack');
  });
});

// ─── 环境：过速 (Overclock) — group 1000 ───────────────────────────────────────

describe('external cooldownReductionPercent (standalone multiplicative)', () => {
  it('routes an external comboSkill CD reduction into the multiplicative bucket, not the additive one', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'cooldownReductionPercent', skillTypes: 'comboSkill' }, value: 60, external: true },
    ];
    const combo = computeStats(makeBase(), sheet, [], 'comboSkill');
    expect(combo.comboCdExternalMult).toBeCloseTo(0.4, 10);
    expect(combo.comboCdReductionPercent).toBe(0);
    const ult = computeStats(makeBase(), sheet, [], 'ultimate');
    expect(ult.ultCdExternalMult).toBe(1);
    expect(ult.ultCdReductionPercent).toBe(0);
  });

  it('stacks multiple external CD reductions multiplicatively', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'cooldownReductionPercent', skillTypes: 'comboSkill' }, value: 60, external: true },
      { stat: { modifier: 'cooldownReductionPercent', skillTypes: 'comboSkill' }, value: 50, external: true },
    ];
    const combo = computeStats(makeBase(), sheet, [], 'comboSkill');
    expect(combo.comboCdExternalMult).toBeCloseTo(0.2, 10);
    expect(combo.comboCdReductionPercent).toBe(0);
  });

  it('without external, the same value pools additively (regression)', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'cooldownReductionPercent', skillTypes: 'comboSkill' }, value: 60 },
    ];
    const combo = computeStats(makeBase(), sheet, [], 'comboSkill');
    expect(combo.comboCdReductionPercent).toBe(60);
    expect(combo.comboCdExternalMult).toBe(1);
  });
});

describe('Overclock (group 1000) mechanism data', () => {
  const overclock = CRITERION_MECHANISMS[1000]!;

  it('has an external combo-skill CD reduction and an additive battle-skill dmgBonus debuff', () => {
    expect(overclock.effects).toHaveLength(2);
    const cd = overclock.effects!.find((e: any) => e.stat.modifier === 'cooldownReductionPercent') as any;
    expect(cd.target).toBe('team');
    expect(cd.value).toBe(60);
    expect(cd.external).toBe(true);
    expect(cd.stat.skillTypes).toBe('comboSkill');
    const dmg = overclock.effects!.find((e: any) => e.stat.modifier === 'dmgBonus') as any;
    expect(dmg.target).toBe('team');
    expect(dmg.value).toBe(-60);
    expect(dmg.external).toBeUndefined();
    expect(dmg.stat.skillTypes).toBe('battleSkill');
  });
});

// ─── 环境：震荡 (Tremor) — group 1032 ──────────────────────────────────────────

describe("dmgBonus skillTypes:'nonSkill' scope", () => {
  const nonSkillExt: ScopedDamageModifier = {
    modifier: 'dmgBonus',
    value: 1,
    skillTypes: 'nonSkill',
    external: true,
  };

  it('applies to damage with no skill-type (reaction/burn/triggered), as ×2 external', () => {
    expect(filterDamageModifiers([nonSkillExt], 'heat', undefined, undefined).dmgBonusExternalMult).toBe(2);
  });

  it('does NOT apply to a standard skill-typed hit', () => {
    expect(filterDamageModifiers([nonSkillExt], 'heat', 'battleSkill', undefined).dmgBonusExternalMult).toBe(1);
  });

  it('survives reaction-path accumulation (no targetSkillType) but is dropped for a typed target', () => {
    const sheet: SheetStatEffect[] = [
      { stat: { modifier: 'dmgBonus', skillTypes: 'nonSkill' }, value: 100, external: true },
    ];
    const reaction = computeStats(makeBase(), sheet, []);
    const mod = reaction.damageModifiers.find(m => m.skillTypes === 'nonSkill');
    expect(mod).toBeDefined();
    expect(mod!.external).toBe(true);
    expect(mod!.value).toBe(1);
    const battle = computeStats(makeBase(), sheet, [], 'battleSkill');
    expect(battle.damageModifiers.some(m => m.skillTypes === 'nonSkill')).toBe(false);
  });

  it('a normal global dmgBonus (no skillTypes) still matches both typed and untyped hits', () => {
    const global: ScopedDamageModifier = { modifier: 'dmgBonus', value: 0.5 };
    expect(filterDamageModifiers([global], 'heat', undefined, undefined).dmgBonus).toBe(0.5);
    expect(filterDamageModifiers([global], 'heat', 'battleSkill', undefined).dmgBonus).toBe(0.5);
  });

  it('a battleSkill-scoped dmgBonus matches a battleSkill hit but not an untyped hit', () => {
    const battle: ScopedDamageModifier = { modifier: 'dmgBonus', value: -0.6, skillTypes: 'battleSkill' };
    expect(filterDamageModifiers([battle], 'heat', 'battleSkill', undefined).dmgBonus).toBe(-0.6);
    expect(filterDamageModifiers([battle], 'heat', undefined, undefined).dmgBonus).toBe(0);
  });
});

describe('Tremor (group 1032) mechanism data', () => {
  const tremor = CRITERION_MECHANISMS[1032]!;

  it('has an additive battle-skill debuff and an external non-skill +100% bonus', () => {
    expect(tremor.effects).toHaveLength(2);
    const battle = tremor.effects!.find((e: any) => e.stat.skillTypes === 'battleSkill') as any;
    expect(battle.stat.modifier).toBe('dmgBonus');
    expect(battle.target).toBe('team');
    expect(battle.value).toBe(-60);
    expect(battle.external).toBeUndefined();
    const nonSkill = tremor.effects!.find((e: any) => e.stat.skillTypes === 'nonSkill') as any;
    expect(nonSkill.stat.modifier).toBe('dmgBonus');
    expect(nonSkill.target).toBe('team');
    expect(nonSkill.value).toBe(100);
    expect(nonSkill.external).toBe(true);
  });
});

// ─── 改写：裹附 (Wrap) — group 1031 ────────────────────────────────────────────

describe('external increasedDmgTaken (standalone damage-taken factor)', () => {
  it('routes an external element-scoped increasedDmgTaken into the multiplicative factor', () => {
    const s = computeEnemyStats([], [
      { stat: { modifier: 'increasedDmgTaken', elements: 'heat' }, value: -30, external: true },
    ]);
    expect(s.elementalIncreasedDmgTakenExternalMult.heat).toBeCloseTo(0.7, 10);
    expect(s.elementalIncreasedDmgTaken.heat ?? 0).toBe(0);
  });

  it('without external, the same value pools additively (regression)', () => {
    const s = computeEnemyStats([], [
      { stat: { modifier: 'increasedDmgTaken', elements: 'heat' }, value: -30 },
    ]);
    expect(s.elementalIncreasedDmgTaken.heat).toBeCloseTo(-0.3, 10);
    expect(s.elementalIncreasedDmgTakenExternalMult.heat ?? 1).toBe(1);
  });

  it('stacks multiple external factors multiplicatively (standalone)', () => {
    const s = computeEnemyStats([], [
      { stat: { modifier: 'increasedDmgTaken', elements: 'heat' }, value: -20, external: true },
      { stat: { modifier: 'increasedDmgTaken', elements: 'heat' }, value: -10, external: true },
    ]);
    expect(s.elementalIncreasedDmgTakenExternalMult.heat).toBeCloseTo(0.72, 10);
  });

  it('supports physical (vulnerability) scoping', () => {
    const s = computeEnemyStats([], [
      { stat: { modifier: 'increasedDmgTaken', elements: 'physical' }, value: -20, external: true },
    ]);
    expect(s.elementalIncreasedDmgTakenExternalMult.physical).toBeCloseTo(0.8, 10);
  });
});

describe('dmgTakenExternalMult in the damage formula', () => {
  it('applies dmgTakenExternalMult as a standalone multiplicative factor', () => {
    const full = computeExpectedDamageWithBreakdown(dmgBase());
    const reduced = computeExpectedDamageWithBreakdown({ ...dmgBase(), dmgTakenExternalMult: 0.6 });
    expect(reduced.expectedDamage).toBeCloseTo(full.expectedDamage * 0.6, 6);
  });

  it('is independent of the additive increasedDmgTaken factor', () => {
    const d = computeExpectedDamageWithBreakdown({ ...dmgBase(), increasedDmgTaken: 0.5, dmgTakenExternalMult: 0.6 });
    const ref = computeExpectedDamageWithBreakdown(dmgBase());
    expect(d.expectedDamage).toBeCloseTo(ref.expectedDamage * 1.5 * 0.6, 6);
  });
});

describe('Wrap (group 1031) mechanism data', () => {
  const wrap = CRITERION_MECHANISMS[1031]!;
  const MAP: Record<string, string> = {
    vulnerability: 'physical',
    heatInfliction: 'heat',
    cryoInfliction: 'cryo',
    electricInfliction: 'electric',
    natureInfliction: 'nature',
  };

  it('has 15 triggers: apply (scaled) + expire + consumed per element', () => {
    expect(wrap.triggers).toHaveLength(15);
    for (const [statusKey, element] of Object.entries(MAP)) {
      const forKey = wrap.triggers!.filter(te => (te.trigger as any).status === statusKey);
      expect(forKey).toHaveLength(3);
      const kinds = forKey.map(te => (te.trigger as any).kind).sort();
      expect(kinds).toEqual(['onStatusApplied', 'onStatusConsumed', 'onStatusExpire']);
      for (const te of forKey) {
        const trig = te.trigger as any;
        expect(trig.target).toBe('enemy');
        expect(trig.triggerScope).toBe('global');
        const eff = te.effects[0] as any;
        expect(eff.target).toBe('enemy');
        expect(eff.external).toBe(true);
        expect(eff.maxStacks).toBe(1);
        expect(eff.stat.modifier).toBe('increasedDmgTaken');
        expect(eff.stat.elements).toBe(element);
        if (trig.kind === 'onStatusApplied') {
          expect(eff.scaling.additive[0]).toEqual({ key: statusKey, target: 'enemy', coefficient: -10 });
        } else {
          expect(eff.value).toBe(0);
          expect(eff.scaling).toBeUndefined();
        }
      }
    }
  });
});

describe('CC trigger clone fidelity (Infinity durations)', () => {
  const infiniteDurationGroups = [1005, 1031];

  for (const group of infiniteDurationGroups) {
    it(`criterion ${group} has at least one Infinity-duration status effect`, () => {
      const mech = CRITERION_MECHANISMS[group]!;
      const durations = (mech.triggers ?? []).flatMap(te =>
        te.effects.map(e => (e as any).duration),
      );
      expect(durations).toContain(Infinity);
    });

    it(`structuredClone preserves Infinity for criterion ${group} (JSON clone does not)`, () => {
      const triggers = CRITERION_MECHANISMS[group]!.triggers!;
      const structurallyCloned = structuredClone(triggers);
      const sDurations = structurallyCloned.flatMap(te => te.effects.map(e => (e as any).duration));
      expect(sDurations.filter(d => d === Infinity).length).toBeGreaterThan(0);

      // Demonstrate the original failure mode: JSON cloning collapses Infinity → null.
      const jsonCloned = JSON.parse(JSON.stringify(triggers));
      const jDurations = jsonCloned.flatMap((te: any) => te.effects.map((e: any) => e.duration));
      expect(jDurations).toContain(null);
      expect(jDurations).not.toContain(Infinity);
    });
  }
});

// ─── Heat Loss (队列：失温 / 热流失) — groups 1003 / 1004 ──────────────────────
describe('Heat Loss (groups 1003 / 1004) mechanism data', () => {
  const sharedCryoId = 'cc:heat-loss:cryo';
  const cases = [
    { group: 1003, skill: 'battleSkill' },
    { group: 1004, skill: 'comboSkill' },
  ] as const;

  for (const { group, skill } of cases) {
    const mech = CRITERION_MECHANISMS[group]!;

    it(`group ${group} has 2 levels and level-specific cast triggers`, () => {
      expect(mech.levelCount).toBe(2);
      expect(mech.triggersByLevel).toHaveLength(2);
    });

    it(`group ${group} cast triggers fire on global ${skill} casts`, () => {
      for (const lvl of mech.triggersByLevel!) {
        const cast = lvl[0]!.trigger as any;
        expect(cast.kind).toBe('onActionStart');
        expect(cast.skillTypes).toBe(skill);
        expect(cast.triggerScope).toBe('global');
      }
    });

    it(`group ${group} applies a display-only Cryo status to the controlled operator`, () => {
      // Level 2 (idx 1) adds a stack every cast.
      const effects = mech.triggersByLevel![1]![0]!.effects as any[];
      const cryo = effects.find(e => e.id === sharedCryoId)!;
      expect(cryo.target).toBe('controlled');
      expect(cryo.maxStacks).toBe(4);
      expect(cryo.icd).toBe(1);
      expect(cryo.icdGroup).toBe(sharedCryoId);
      expect(cryo.displayType).toBe('cryo_infliction');
      expect(cryo.stat).toBeUndefined(); // no damage modifier — display only
    });

    it(`group ${group} level 1 gates every 2 casts via an enemy toggle`, () => {
      const effects = mech.triggersByLevel![0]![0]!.effects as any[];
      const bank = effects.find(e => e.id === `cc:${group}:toggle`)!;
      expect(bank.target).toBe('enemy');
      expect(bank.duration).toBe(Infinity);
      expect(bank.icd).toBe(1);
      expect(bank.condition).toEqual({
        kind: 'not',
        condition: { kind: 'enemyStatus', status: `cc:${group}:toggle` },
      });
      const cryo = effects.find(e => e.id === sharedCryoId)!;
      // Compound AND: consume the toggle; only when the controlled operator is not Frozen and not immune.
      expect(cryo.condition).toEqual([
        { kind: 'enemyStatus', status: `cc:${group}:toggle`, consume: true },
        {
          kind: 'not',
          condition: { kind: 'operatorStatus', status: 'cc:frozen', target: 'controlled' },
        },
        {
          kind: 'not',
          condition: {
            kind: 'operatorStatus',
            status: 'cryo-infliction-immune',
            target: 'controlled',
          },
        },
      ]);
    });

    it(`group ${group} converts to Frozen on the 4th Cryo stack (consume all)`, () => {
      const freeze = mech.triggers![0]!;
      expect((freeze.trigger as any).kind).toBe('onStatusApplied');
      expect((freeze.trigger as any).status).toBe(sharedCryoId);
      const frozen = freeze.effects[0] as any;
      expect(frozen.id).toBe('cc:frozen');
      expect(frozen.target).toBe('controlled');
      expect(frozen.displayType).toBe('solidification');
      expect(frozen.stat).toBeUndefined();
      expect(frozen.condition).toEqual({
        kind: 'operatorStatus',
        status: sharedCryoId,
        target: 'controlled',
        stacks: { compare: 'atLeast', count: 4 },
        consume: true,
      });
    });
  }

  it('uses one shared Cryo status id for both Heat Loss criteria', () => {
    const battleCryo = CRITERION_MECHANISMS[1003]!.triggersByLevel![1]![0]!.effects
      .find((effect: any) => effect.displayType === 'cryo_infliction') as any;
    const comboCryo = CRITERION_MECHANISMS[1004]!.triggersByLevel![1]![0]!.effects
      .find((effect: any) => effect.displayType === 'cryo_infliction') as any;

    expect(battleCryo.id).toBe(sharedCryoId);
    expect(comboCryo.id).toBe(sharedCryoId);
  });
});

// ─── Lysis family (融化/升华/电解/切削) — groups 1017 / 1018 / 1019 / 1024 ──────
describe('Lysis family (groups 1017 / 1018 / 1019 / 1024) mechanism data', () => {
  const cases = [
    { group: 1017, element: 'heat' },
    { group: 1018, element: 'nature' },
    { group: 1019, element: 'electric' },
    { group: 1024, element: 'physical' },
  ] as const;

  for (const { group, element } of cases) {
    const mech = CRITERION_MECHANISMS[group]!;

    it(`group ${group} extends the shared Freeze to 15s (silent re-apply)`, () => {
      const extend = mech.triggers!.find(
        te => (te.trigger as any).kind === 'onStatusApplied' && (te.trigger as any).status === 'cc:frozen',
      )!;
      const eff = extend.effects[0] as any;
      expect(eff.id).toBe('cc:frozen');
      expect(eff.target).toBe('controlled');
      expect(eff.duration).toBe(15);
      expect(eff.displayType).toBe('solidification');
      expect(eff.stackStrategy).toBe('REPLACE');
      expect(eff.silent).toBe(true); // avoids re-firing onStatusApplied (no extend loop)
    });

    it(`group ${group} Battle/Combo thaw leaves one Cryo stack`, () => {
      const thaw = mech.triggers!.find(te => {
        const trigger = te.trigger as any;
        return trigger.kind === 'onActionStart' && Array.isArray(trigger.skillTypes);
      })!;
      expect((thaw.trigger as any).element).toBe(element);
      expect((thaw.trigger as any).skillTypes).toEqual(['battleSkill', 'comboSkill']);
      expect((thaw.trigger as any).triggerScope).toBe('global');
      expect(thaw.effects[0]).toMatchObject({
        kind: 'status',
        id: 'cc:heat-loss:cryo',
        target: 'controlled',
        stacks: 1,
        maxStacks: 4,
      });
      expect((thaw.effects[1] as any).condition).toEqual({
        kind: 'operatorStatus',
        status: 'cc:frozen',
        target: 'controlled',
        consume: true,
      });
    });

    it(`group ${group} Ultimate thaw does not leave Cryo`, () => {
      const thaw = mech.triggers!.find(te => (te.trigger as any).skillTypes === 'ultimate')!;
      expect((thaw.trigger as any).element).toBe(element);
      expect(thaw.effects).toHaveLength(1);
      expect((thaw.effects[0] as any).id).toBe(`cc:dispel:${element}`);
    });
  }
});
