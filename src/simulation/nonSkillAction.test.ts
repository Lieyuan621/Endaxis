import { describe, expect, it } from 'vitest';
import { compileScenario } from './compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { simulate } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import { collectTriggerEffects } from '@/data/collect';
import { extractRawEntries, resolveHitsFromSheet } from '@/stores/timeline/resolveHits';
import liinoSheet from '@/data/operators/liino';
import type { BaseStatValues } from '@/data/stats/types';

/**
 * A sub-skill with `group: 'nonSkill'` is a released action that is not a skill: it must not
 * consume Link or one-time charges, and must not satisfy skill-type trigger filters. Triggers
 * that match on `skillId` still fire — that is how Liino's stance termination does its work.
 */

const BASE_STATS: BaseStatValues = {
  level: 90,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: { strength: 100, agility: 100, intellect: 100, will: 100 },
  mainAttributeName: 'will',
  secondaryAttributeName: 'agility',
};

const emptyGear = { armor: null, gloves: null, kit1: null, kit2: null };
const emptySlot = { operatorId: null, weaponId: null, gear: emptyGear };

function action(
  id: string,
  type: Action['type'],
  startTime: number,
  extra: Partial<Action>,
): Action {
  return {
    id,
    instanceId: `${id}_inst`,
    type,
    skillId: type,
    name: id,
    startTime,
    logicalStartTime: startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: 'recover',
    element: 'electric',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits: [],
    ...extra,
  } as Action;
}

const LINK_EFFECT = {
  id: 'four-link-stacks',
  kind: 'status',
  stat: { modifier: 'link' },
  target: 'team',
  duration: 30,
  stacks: 4,
  maxStacks: 4,
};

const ONE_TIME_EFFECT = {
  id: 'battle-skill-charge',
  kind: 'oneTime',
  stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
  skillTypes: 'battleSkill',
  target: 'self',
  value: 50,
  duration: 30,
};

/** Grants link (and optionally a battleSkill-scoped one-time charge) from a basic attack, which is
 *  not itself link-eligible, so nothing is spent setting up. */
function grant(id: string, startTime: number, effects: unknown[]): Action {
  return action(id, 'basicAttack', startTime, {
    hits: [{ offset: 0, multiplier: 0, spRecovery: 0, spReturn: 0, stagger: 0, effects }],
  } as Partial<Action>);
}

const SETUP = grant('setup', 0, [LINK_EFFECT, ONE_TIME_EFFECT]);

/** Fires on any battleSkill start; the marker status records that it fired. */
const SKILL_TYPE_TRIGGER = {
  sourceTrackId: 'alpha',
  triggerEffect: {
    trigger: { kind: 'onActionStart', skillTypes: 'battleSkill', triggerScope: 'self' },
    effects: [{ id: 'battle-skill-trigger-fired', kind: 'status', target: 'self', duration: 5 }],
  },
};

function createTrack(id: string, actions: Action[]): ScenarioTrack {
  return {
    id,
    actions,
    stats: createDefaultStats() as ScenarioTrack['stats'],
    baseStats: BASE_STATS,
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
  };
}

function run(actions: Action[], triggerEntries: unknown[]) {
  const tracks = [createTrack('alpha', actions), createTrack('beta', [])];
  const scenario: ScenarioData = { tracks, connections: [] };
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(scenario);
  return simulate(
    timeline,
    teamConfig,
    enemyConfig,
    actors,
    new TriggerRegistry(triggerEntries as any),
    undefined,
    {
      baseStatsByTrack: new Map(actors.map(a => [a.id, BASE_STATS])),
      enemyDef: 100,
      endlineTime: 60,
    },
  );
}

const linkConsumed = (result: any) =>
  (result.simLog as any[]).filter(e => e.type === 'LINK_CONSUMED');

const consumedIds = (result: any) =>
  (result.operatorLog as any[])
    .filter(e => e.type === 'OPERATOR_EFFECT_EXPIRE' && e.consumed)
    .map(e => e.id);

const applied = (result: any, id: string) =>
  (result.operatorLog as any[]).some(e => e.type === 'OPERATOR_EFFECT_APPLY' && e.id === id);

describe('a nonSkill action is not charged as a skill', () => {
  const subject = (type: Action['type']) =>
    run([SETUP, action('subject', type, 2, {})], [SKILL_TYPE_TRIGGER]);

  it('leaves the team link pool untouched', () => {
    // The control: the identical action typed battleSkill drains all 4 stacks.
    expect(linkConsumed(subject('battleSkill'))).toHaveLength(1);
    expect(linkConsumed(subject('nonSkill'))).toEqual([]);
  });

  it('leaves one-time charges unspent', () => {
    expect(consumedIds(subject('battleSkill'))).toContain('battle-skill-charge');
    expect(consumedIds(subject('nonSkill'))).not.toContain('battle-skill-charge');
  });

  it('does not satisfy a skillTypes trigger filter', () => {
    expect(applied(subject('battleSkill'), 'battle-skill-trigger-fired')).toBe(true);
    expect(applied(subject('nonSkill'), 'battle-skill-trigger-fired')).toBe(false);
  });

  it('carries no skill-type attribution on its damage', () => {
    const result = run(
      [action('hit', 'nonSkill', 0, { hits: [{ offset: 0, multiplier: 100, stagger: 0 }] } as any)],
      [],
    );
    const damage = (result.simLog as any[]).find(e => e.type === 'DAMAGE_HIT');
    // undefined, not the literal 'nonSkill' — that is what `skillTypes: 'nonSkill'` modifiers match.
    expect(damage?.payload.hitData.skillType).toBeUndefined();
  });
});

describe("Liino's stance termination", () => {
  function liinoTriggerEntries() {
    const team: any = {
      id: 't',
      name: 't',
      slots: [
        { operatorId: 'op', weaponId: null, gear: emptyGear },
        emptySlot,
        emptySlot,
        emptySlot,
      ],
    };
    const ops: any = [
      {
        id: 'op',
        operatorSlug: 'liino',
        level: 90,
        promoted: true,
        potential: 0,
        skillLevels: { basicAttack: 12, battleSkill: 12, comboSkill: 12, ultimate: 12 },
        talentStates: { '0': 2, '1': 2 },
        trustLevel: 0,
      },
    ];
    return collectTriggerEffects(team, ops, [], [], new Map()).map((e: any) => ({
      sourceTrackId: 'alpha',
      sourceSkillType: e.sourceSkillType,
      triggerEffect: e.triggerEffect,
    }));
  }

  const battleSkill = action('bs', 'battleSkill', 1, {
    skillId: 'battleSkill',
    hits: resolveHitsFromSheet([], extractRawEntries(liinoSheet.combatSkills.battleSkill, 0), 11, {
      preserveCondition: true,
    } as any),
  } as Partial<Action>);

  // Type comes from the sheet, so re-grouping the sub-skill as a real skill fails these.
  const subSkill = (liinoSheet.combatSkills.battleSkill.subSkills ?? []).find(
    s => s.id === 'liino-stance-termination',
  )!;
  const terminate = action('term', subSkill.group as Action['type'], 5, { skillId: subSkill.id });

  // The battle skill drains the pool at t=1, so link must be re-granted before the termination —
  // otherwise "no link consumed at t=5" would hold for any action type and prove nothing.
  const scenario = [SETUP, battleSkill, grant('regrant', 3, [LINK_EFFECT]), terminate];

  it('still consumes the stance through its skillId trigger', () => {
    const result = run(scenario, liinoTriggerEntries());
    const stance = (result.operatorLog as any[]).find(
      e => e.type === 'OPERATOR_EFFECT_EXPIRE' && e.id === 'liino-vocalist-stance' && e.consumed,
    );
    expect(stance?.time).toBeCloseTo(5, 3);
  });

  it('spends link on the battle skill but not on the termination', () => {
    const result = run(scenario, liinoTriggerEntries());
    expect(linkConsumed(result).map(e => e.payload.actionId)).toEqual(['bs_inst']);
  });
});
