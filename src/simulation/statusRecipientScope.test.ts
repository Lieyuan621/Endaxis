import { describe, expect, it } from 'vitest';
import { compileScenario } from './compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from './compiler/types';
import { simulate } from './simulator';
import { TriggerRegistry } from './engine/TriggerRegistry';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import type { BaseStatValues } from '@/data/stats/types';
import type { Effect, TriggerEffect } from '@/data/types';

/**
 * Recipient-scoped effect targeting: a duration-0 heal used to discard its resolved targets,
 * and onStatusApplied only ever carried the applier. These pin the recipient plumbing.
 */

type TriggerEntries = Array<{
  sourceTrackId: string;
  sourceSkillType?: string;
  triggerEffect: TriggerEffect;
}>;

const BASE_STATS: BaseStatValues = {
  level: 60,
  baseAtk: 1000,
  baseHp: 1000,
  weaponAtk: 0,
  baseAttrs: { strength: 100, agility: 100, intellect: 100, will: 100 },
  mainAttributeName: 'agility',
  secondaryAttributeName: 'intellect',
};

const BUFF_ID = 'bedazzling-night-debut-treatment-atk';

function createAction(id: string, type: Action['type'], patch: Partial<Action> = {}): Action {
  const startTime = Number(patch.startTime) || 0;
  return {
    id,
    instanceId: patch.instanceId || `${id}_inst`,
    type,
    skillId: patch.skillId || id,
    name: patch.name || id,
    startTime,
    logicalStartTime: patch.logicalStartTime ?? startTime,
    cooldown: 0,
    spCost: 0,
    spGain: 0,
    spGainKind: 'recover',
    element: 'physical',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    isDisabled: false,
    hits: [],
    ...patch,
  };
}

function createTrack(id: string, actions: Action[]): ScenarioTrack {
  const stats = createDefaultStats() as ScenarioTrack['stats'];
  return {
    id,
    actions,
    stats,
    baseStats: BASE_STATS,
    gaugeEfficiency: Number(stats.ult_charge_eff) || 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 0,
    maxGaugeOverride: null,
    acceptTeamGauge: true,
  };
}

function runScenario(
  tracks: ScenarioTrack[],
  entries: TriggerEntries,
  options: { controlledOperatorSegments?: Array<{ startTime: number; operatorId: string }> } = {},
) {
  const scenario: ScenarioData = { tracks, connections: [] };
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(scenario);
  const baseStatsByTrack = new Map<string, BaseStatValues>(
    actors.map(actor => [actor.id, BASE_STATS]),
  );
  return simulate(
    timeline,
    teamConfig,
    enemyConfig,
    actors,
    new TriggerRegistry(entries),
    undefined,
    {
      baseStatsByTrack,
      enemyDef: 100,
      controlledOperatorSegments: options.controlledOperatorSegments as any,
    },
  );
}

/** Duration-0, id-less heal — the shape every Liino heal has. */
function healEffect(target: string): Effect {
  return { kind: 'status', stat: { modifier: 'heal' }, target } as Effect;
}

/** The weapon's buff, parameterised by target scope. */
function atkBuff(target: string, patch: Partial<Effect> = {}): Effect {
  return {
    id: BUFF_ID,
    kind: 'status',
    stat: { modifier: 'atkPercent' },
    target,
    value: 9.8,
    maxStacks: 4,
    stackStrategy: 'INDEPENDENT',
    duration: 20,
    icd: 0.1,
    ...patch,
  } as Effect;
}

function healTrigger(sourceTrackId: string, effects: Effect[]): TriggerEntries[number] {
  return {
    sourceTrackId,
    triggerEffect: {
      trigger: { kind: 'onStatusApplied', status: { modifier: 'heal' }, target: 'self' },
      effects,
    } as TriggerEffect,
  };
}

/** `alpha` heals at each time via hit-attached effects (HitHandler path). */
function healerTrack(times: number[], healTarget = 'team'): ScenarioTrack {
  return createTrack(
    'alpha',
    times.map((t, i) =>
      createAction(`heal${i}`, 'battleSkill', {
        startTime: t,
        hits: [
          {
            offset: 0,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [healEffect(healTarget)],
          } as any,
        ],
      }),
    ),
  );
}

/** Excludes t >= 20: an expiring INDEPENDENT slot re-logs an APPLY to restate stacks. */
function buffApplies(result: { operatorLog: any[] }) {
  return result.operatorLog.filter(
    e => e.type === 'OPERATOR_EFFECT_APPLY' && e.id === BUFF_ID && e.time < 20,
  );
}

function recipientsOf(result: { operatorLog: any[] }) {
  return [...new Set(buffApplies(result).map(e => e.targetTrackId))].sort();
}

describe('statusRecipients authoring guard', () => {
  const RECIPIENT_SCOPES = ['statusRecipients', 'statusRecipientsExcludeSelf'];
  const sheets = import.meta.glob(
    ['/src/data/operators/*.ts', '/src/data/weapons/**/*.ts', '/src/data/gearsets/*.ts'],
    { eager: true, import: 'default' },
  ) as Record<string, any>;

  const scopeOf = (effect: any) =>
    typeof effect?.target === 'string' ? effect.target : effect?.target?.scope;

  /** Every effect reachable from a value, with a flag for "inside a trigger's effects". */
  function* walk(node: any, inTrigger: boolean): Generator<{ effect: any; inTrigger: boolean }> {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) yield* walk(item, inTrigger);
      return;
    }
    if (node.kind && node.target !== undefined) yield { effect: node, inTrigger };
    for (const [key, value] of Object.entries(node)) {
      if (key === 'effects' && node.trigger) yield* walk(value, true);
      else yield* walk(value, inTrigger);
    }
  }

  it('only uses recipient scopes inside onStatusApplied triggers', () => {
    const offenders: string[] = [];
    for (const [path, sheet] of Object.entries(sheets)) {
      for (const { effect, inTrigger } of walk(sheet, false)) {
        if (!RECIPIENT_SCOPES.includes(scopeOf(effect))) continue;
        if (!inTrigger) offenders.push(`${path}: recipient scope on a passive effect`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('has at least one sheet exercising a recipient scope', () => {
    const users = Object.entries(sheets).filter(([, sheet]) =>
      [...walk(sheet, false)].some(({ effect }) => RECIPIENT_SCOPES.includes(scopeOf(effect))),
    );
    expect(users.length).toBeGreaterThan(0);
  });
});

describe('statusRecipients target scopes', () => {
  it('lands the buff only on the operators that were healed, never the healer', () => {
    const result = runScenario(
      [healerTrack([1]), createTrack('beta', []), createTrack('gamma', [])],
      [healTrigger('alpha', [atkBuff('statusRecipientsExcludeSelf')])],
    );

    // Previously: targets discarded on the duration-0 path, so no applies at all.
    expect(recipientsOf(result)).toEqual(['beta', 'gamma']);
    expect(buffApplies(result)).toHaveLength(2);
    expect(buffApplies(result)[0]).toMatchObject({
      stacks: 1,
      maxStacks: 4,
      stackStrategy: 'INDEPENDENT',
    });
  });

  it('statusRecipients includes the healer when they healed themselves too', () => {
    const result = runScenario(
      [healerTrack([1]), createTrack('beta', []), createTrack('gamma', [])],
      [healTrigger('alpha', [atkBuff('statusRecipients')])],
    );
    expect(recipientsOf(result)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('follows the actual recipient set, not the team — a single-target heal buffs one operator', () => {
    // The case teamExcludeSelf gets wrong: it would buff beta AND gamma.
    const result = runScenario(
      [healerTrack([1], 'controlled'), createTrack('beta', []), createTrack('gamma', [])],
      [healTrigger('alpha', [atkBuff('statusRecipientsExcludeSelf')])],
      { controlledOperatorSegments: [{ startTime: 0, operatorId: 'beta' }] },
    );
    expect(recipientsOf(result)).toEqual(['beta']);
  });

  it('threads recipients through the trigger wire path as well as the hit wire path', () => {
    // Heal emitted by a trigger (TriggerRegistry's onInstantHeal) rather than a hit.
    const tracks = [
      createTrack('alpha', [
        createAction('seed', 'battleSkill', {
          startTime: 1,
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                { id: 'tick', kind: 'status', target: 'self', duration: 1, hide: true } as Effect,
              ],
            } as any,
          ],
        }),
      ]),
      createTrack('beta', []),
      createTrack('gamma', []),
    ];
    const result = runScenario(tracks, [
      {
        sourceTrackId: 'alpha',
        triggerEffect: {
          trigger: { kind: 'onStatusExpire', status: 'tick', target: 'self' },
          effects: [healEffect('team')],
        } as TriggerEffect,
      },
      healTrigger('alpha', [atkBuff('statusRecipientsExcludeSelf')]),
    ]);
    expect(recipientsOf(result)).toEqual(['beta', 'gamma']);
  });

  it('stacks independently per recipient and caps at maxStacks', () => {
    const result = runScenario(
      [healerTrack([1, 2, 3, 4, 5, 6]), createTrack('beta', []), createTrack('gamma', [])],
      [healTrigger('alpha', [atkBuff('statusRecipientsExcludeSelf')])],
    );
    const perTrack = (id: string) => buffApplies(result).filter(e => e.targetTrackId === id);
    // Six heals >= icd apart; INDEPENDENT slots, each on its own 20s clock.
    expect(perTrack('beta')).toHaveLength(6);
    expect(perTrack('gamma')).toHaveLength(6);
    expect(perTrack('beta').every(e => e.stacks === 1 && e.maxStacks === 4)).toBe(true);
    expect(perTrack('beta').map(e => e.expiresAt)).toEqual([21, 22, 23, 24, 25, 26]);
  });

  it('respects the ICD across the whole fan-out', () => {
    const tooFast = runScenario(
      [healerTrack([1, 1.05]), createTrack('beta', []), createTrack('gamma', [])],
      [healTrigger('alpha', [atkBuff('statusRecipientsExcludeSelf')])],
    );
    expect(buffApplies(tooFast).filter(e => e.targetTrackId === 'beta')).toHaveLength(1);

    const farEnough = runScenario(
      [healerTrack([1, 1.15]), createTrack('beta', []), createTrack('gamma', [])],
      [healTrigger('alpha', [atkBuff('statusRecipientsExcludeSelf')])],
    );
    expect(buffApplies(farEnough).filter(e => e.targetTrackId === 'beta')).toHaveLength(2);
  });

  it('is inert — not self-targeting — when the trigger has no recipients', () => {
    // onHit never populates recipients; must resolve to [], not fall back to source.
    const result = runScenario(
      [
        createTrack('alpha', [
          createAction('hit', 'battleSkill', {
            startTime: 1,
            hits: [{ offset: 0, multiplier: 100, spRecovery: 0, spReturn: 0, stagger: 0 } as any],
          }),
        ]),
        createTrack('beta', []),
      ],
      [
        {
          sourceTrackId: 'alpha',
          triggerEffect: {
            trigger: { kind: 'onHit' },
            effects: [atkBuff('statusRecipients')],
          } as TriggerEffect,
        },
      ],
    );
    expect(buffApplies(result)).toHaveLength(0);
  });

  it('fires once per heal, not once per recipient (Camille-shaped stack guard)', () => {
    // Camille t2 shape: firing per-recipient would add 2 stacks each and hit the cap.
    const result = runScenario(
      [healerTrack([1]), createTrack('beta', []), createTrack('gamma', [])],
      [
        healTrigger('alpha', [
          atkBuff('self', {
            id: 'camille-shaped',
            stacks: 2,
            maxStacks: 5,
            stackStrategy: undefined,
            icd: undefined,
          }),
        ]),
      ],
    );
    const applies = result.operatorLog.filter(
      e => e.type === 'OPERATOR_EFFECT_APPLY' && e.id === 'camille-shaped',
    );
    expect(applies).toHaveLength(1);
    expect(applies[0]).toMatchObject({ targetTrackId: 'alpha', stacks: 2 });
  });
});
