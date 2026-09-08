import { describe, expect, it } from 'vitest';
import { compileScenario } from './compileScenario';
import { compileTimeline } from './compileTimeline';
import { simulate } from '@/simulation/simulator';
import type { Action, ActionNode, Hit, ScenarioData } from './types';

const ready = 'pursuit-ready';
const condition = { kind: 'operatorStatus' as const, status: ready };
const hit = (overrides: Partial<Hit>): Hit => ({
  offset: 0,
  spRecovery: 0,
  spReturn: 0,
  stagger: 0,
  ...overrides,
});
function action(
  id: string,
  start: number,
  overrides: Partial<Action> = {},
  trackId = 'camille',
): ActionNode {
  return {
    id,
    type: 'action',
    trackId,
    trackIndex: 0,
    node: {
      id,
      instanceId: id,
      skillId: id,
      name: id,
      type: 'battleSkill',
      startTime: start,
      logicalStartTime: start,
      duration: 2,
      hits: [],
      element: 'heat',
      cooldown: 0,
      spCost: 0,
      gaugeCost: 0,
      gaugeGain: 0,
      teamGaugeGain: 0,
      ...overrides,
    },
  };
}
function grant(overrides: Partial<Action> = {}) {
  return action('grant', 0, {
    type: 'ultimate',
    animationTime: 1,
    duration: 2,
    hits: [
      hit({ offset: 2, effects: [{ kind: 'status', id: ready, target: 'self', duration: 5 }] }),
    ],
    ...overrides,
  });
}
function pursuit(id: string, start: number, overrides: Partial<Action> = {}, trackId = 'camille') {
  return action(
    id,
    start,
    {
      conditionalFreeze: { operatorStatus: ready, duration: 0.5, compression: 'comboSkill' },
      hits: [
        hit({
          offset: 1,
          _condition: condition,
          treatAsSkillType: 'comboSkill',
          effects: [{ kind: 'consume', operatorStatus: ready }],
        }),
      ],
      ...overrides,
    },
    trackId,
  );
}
const freeze = (actions: ActionNode[], id = 'pursuit') =>
  compileTimeline(actions).actionMap.get(id)?.freezeDuration;

describe('status-gated action freezes', () => {
  it('freezes only while the self status is active, without changing hit offsets or action type', () => {
    const source = pursuit('pursuit', 3);
    const timeline = compileTimeline([grant(), source, pursuit('later', 6)]);
    expect(timeline.actionMap.get('pursuit')).toMatchObject({
      freezeDuration: 0.5,
      realStartTime: 3,
      realDuration: 2,
      node: { type: 'battleSkill' },
      resolvedHits: [{ realTime: 4 }],
    });
    expect(timeline.actionMap.get('later')?.freezeDuration).toBeUndefined();
    expect(source.node).not.toHaveProperty('freezeDuration');
  });

  it.each([
    { label: 'absent', actions: [pursuit('pursuit', 3)] },
    {
      label: 'not granted yet',
      actions: [
        grant({
          duration: 5,
          hits: [
            hit({
              offset: 4,
              effects: [{ kind: 'status', id: ready, target: 'self', duration: 5 }],
            }),
          ],
        }),
        pursuit('pursuit', 3),
      ],
    },
    { label: 'expired at boundary', actions: [grant(), pursuit('pursuit', 7)] },
    { label: 'disabled grant', actions: [grant({ isDisabled: true }), pursuit('pursuit', 3)] },
    {
      label: 'interrupted grant',
      actions: [grant(), action('interrupt', 1.5, { duration: 0.1 }), pursuit('pursuit', 3)],
    },
    { label: 'another operator', actions: [grant(), pursuit('pursuit', 3, {}, 'other')] },
    {
      label: 'disabled candidate',
      actions: [grant(), pursuit('pursuit', 3, { isDisabled: true })],
    },
    { label: 'ghost candidate', actions: [grant(), pursuit('pursuit', 3, { triggerWindow: -1 })] },
    { label: 'same-time hit grant', actions: [grant(), pursuit('pursuit', 2)] },
  ])('does not freeze when $label', ({ actions }) => {
    expect(freeze(actions)).toBeUndefined();
  });

  it('keeps the status when an earlier pursuit is interrupted before its consume hit', () => {
    const timeline = compileTimeline([
      grant(),
      pursuit('first', 3),
      action('interrupt', 3.6, { duration: 0.1 }),
      pursuit('pursuit', 5),
    ]);
    expect(timeline.actionMap.get('first')?.resolvedHits).toEqual([]);
    expect(timeline.actionMap.get('pursuit')?.freezeDuration).toBe(0.5);
  });

  it('extends the ready status across another operators freeze before testing expiry', () => {
    expect(
      freeze([
        grant(),
        action('combo', 6, { type: 'comboSkill' }, 'other'),
        pursuit('pursuit', 7.2),
      ]),
    ).toBe(0.5);
  });

  it('compresses adjacent active conditional freezes like combo skills', () => {
    const timeline = compileTimeline([grant(), pursuit('first', 3), pursuit('pursuit', 3.1)]);
    expect(timeline.timeExtensions.map(e => [e.sourceId, e.time, e.amount])).toEqual([
      ['grant', 0, 1],
      ['first', 3, 0.1],
      ['pursuit', 3.1, 0.5],
    ]);
  });

  it('lets a later combo shorten an active conditional freeze', () => {
    const timeline = compileTimeline([
      grant(),
      pursuit('pursuit', 3),
      action('combo', 3.2, { type: 'comboSkill' }, 'other'),
    ]);
    expect(timeline.actionMap.get('pursuit')?.freezeDuration).toBe(0.2);
    expect(timeline.actionMap.get('combo')?.realStartTime).toBe(3.2);
    expect(timeline.actionMap.get('pursuit')?.node.type).toBe('battleSkill');
  });

  it('lets an active conditional freeze shorten the preceding combo', () => {
    const timeline = compileTimeline([
      grant(),
      action('combo', 3, { type: 'comboSkill' }, 'other'),
      pursuit('pursuit', 3.2),
    ]);
    expect(timeline.actionMap.get('combo')?.freezeDuration).toBe(0.2);
    expect(timeline.actionMap.get('pursuit')?.realStartTime).toBe(3.2);
  });

  it('does not let an inactive conditional freeze shorten a combo', () => {
    const timeline = compileTimeline([
      action('combo', 3, { type: 'comboSkill' }, 'other'),
      pursuit('pursuit', 3.2),
    ]);
    expect(timeline.actionMap.get('combo')?.freezeDuration).toBe(0.5);
    expect(timeline.actionMap.get('pursuit')?.freezeDuration).toBeUndefined();
  });

  it('uses the compressed cast time when an uncompressed delay would cross status expiry', () => {
    const timeline = compileTimeline(
      [action('combo', 3, { type: 'comboSkill' }, 'other'), pursuit('pursuit', 3.2)],
      {
        initialEffects: [
          {
            id: ready,
            targetTrackId: 'camille',
            sourceId: 'camille',
            value: 1,
            remainingDuration: 3.3,
          },
        ],
      },
    );
    expect(timeline.actionMap.get('combo')?.freezeDuration).toBe(0.2);
    expect(timeline.actionMap.get('pursuit')).toMatchObject({
      realStartTime: 3.2,
      freezeDuration: 0.5,
    });
  });

  it('retains isolated fixed freezes when compression was not configured', () => {
    const fixed = pursuit('fixed', 3.2, {
      conditionalFreeze: { operatorStatus: ready, duration: 0.5 },
    });
    const timeline = compileTimeline([
      grant(),
      action('before', 3, { type: 'comboSkill' }, 'other'),
      fixed,
      action('after', 3.6, { type: 'comboSkill' }, 'other-2'),
    ]);
    expect(timeline.actionMap.get('before')?.freezeDuration).toBe(0.5);
    expect(timeline.actionMap.get('fixed')?.freezeDuration).toBe(0.5);
  });

  it('keeps the ordinary combo lower bound and does not compress ultimate animations', () => {
    const timeline = compileTimeline([
      grant(),
      pursuit('pursuit', 3),
      action('ultimate', 3.02, { type: 'ultimate', animationTime: 2 }, 'other'),
      pursuit('next', 3.2),
    ]);
    expect(timeline.actionMap.get('pursuit')?.freezeDuration).toBe(0.1);
    expect(timeline.actionMap.get('ultimate')?.freezeDuration).toBe(2);
  });

  it('honors initial carryover application and expiration times', () => {
    const initialEffects = [
      { id: ready, targetTrackId: 'camille', sourceId: 'camille', value: 1, remainingDuration: 2 },
    ];
    const timeline = compileTimeline(
      [
        pursuit('before', 1, { hits: [] }),
        pursuit('during', 2, { hits: [] }),
        pursuit('expired', 4, { hits: [] }),
      ],
      { initialEffects, prepDuration: 2 },
    );
    expect(timeline.actionMap.get('before')?.freezeDuration).toBeUndefined();
    expect(timeline.actionMap.get('during')?.freezeDuration).toBe(0.5);
    expect(timeline.actionMap.get('expired')?.freezeDuration).toBeUndefined();
  });

  it('checks same-time candidates after existing freeze sources, independent of array order', () => {
    const timeline = compileTimeline(
      [pursuit('pursuit', 3), action('combo', 3, { type: 'comboSkill' }, 'other')],
      {
        initialEffects: [
          {
            id: ready,
            targetTrackId: 'camille',
            sourceId: 'camille',
            value: 1,
            remainingDuration: 2,
          },
        ],
        prepDuration: 3.2,
      },
    );
    expect(timeline.actionMap.get('pursuit')).toMatchObject({
      realStartTime: 3.5,
      freezeDuration: 0.5,
    });
    expect(timeline.actionMap.get('combo')?.realStartTime).toBe(3);
  });

  it('guards a cyclic status boundary without disabling unrelated conditional compression', () => {
    const timeline = compileTimeline(
      [
        pursuit('cyclic', 3),
        action('before', 3, { type: 'comboSkill' }, 'other'),
        action('unrelated-before', 10, { type: 'comboSkill' }, 'other'),
        pursuit('unrelated', 10.2, {}, 'second'),
      ],
      {
        initialEffects: [
          {
            id: ready,
            targetTrackId: 'camille',
            sourceId: 'camille',
            value: 1,
            remainingDuration: 2,
          },
          {
            id: ready,
            targetTrackId: 'second',
            sourceId: 'second',
            value: 1,
            remainingDuration: 20,
          },
        ],
        prepDuration: 3.2,
      },
    );
    expect(timeline.actionMap.get('cyclic')).toMatchObject({
      realStartTime: 3.5,
      freezeDuration: 0.5,
    });
    expect(timeline.actionMap.get('unrelated-before')?.freezeDuration).toBe(0.2);
    expect(timeline.actionMap.get('unrelated')).toMatchObject({
      realStartTime: 10.2,
      freezeDuration: 0.5,
    });
  });

  it('isolates compression affecting a fixed-source cycle, not later unrelated sources', () => {
    const timeline = compileTimeline(
      [
        action('before', 3, { type: 'comboSkill', duration: 1 }, 'before'),
        pursuit('fixed', 3, {
          duration: 1,
          hits: [],
          conditionalFreeze: { operatorStatus: ready, duration: 0.5 },
        }),
        pursuit('local', 3, { duration: 1, hits: [] }, 'local'),
        action('unrelated-before', 10, { type: 'comboSkill', duration: 1 }, 'other'),
        pursuit('unrelated', 10.2, { duration: 1, hits: [] }, 'second'),
      ],
      {
        initialEffects: [
          {
            id: ready,
            targetTrackId: 'camille',
            sourceId: 'camille',
            value: 1,
            remainingDuration: 20,
          },
          { id: ready, targetTrackId: 'local', sourceId: 'local', value: 1 },
          { id: ready, targetTrackId: 'second', sourceId: 'second', value: 1 },
        ],
        prepDuration: 3.2,
      },
    );
    expect(timeline.actionMap.get('fixed')).toMatchObject({
      realStartTime: 3.5,
      freezeDuration: 0.5,
    });
    expect(timeline.actionMap.get('unrelated-before')?.freezeDuration).toBe(0.2);
    expect(timeline.actionMap.get('unrelated')?.realStartTime).toBe(10.2);
  });

  it('keeps expiry-sensitive compression when an unrelated fixed-only boundary is cyclic', () => {
    const timeline = compileTimeline(
      [
        pursuit('fixed', 3, {
          duration: 1,
          hits: [],
          conditionalFreeze: { operatorStatus: ready, duration: 0.5 },
        }),
        pursuit(
          'local',
          3,
          {
            duration: 1,
            hits: [],
            conditionalFreeze: { operatorStatus: ready, duration: 0.5 },
          },
          'local',
        ),
        action('unrelated-before', 10, { type: 'comboSkill', duration: 1 }, 'other'),
        pursuit('unrelated', 10.2, { duration: 1, hits: [] }, 'second'),
      ],
      {
        initialEffects: [
          {
            id: ready,
            targetTrackId: 'camille',
            sourceId: 'camille',
            value: 1,
            remainingDuration: 20,
          },
          { id: ready, targetTrackId: 'local', sourceId: 'local', value: 1 },
          {
            id: ready,
            targetTrackId: 'second',
            sourceId: 'second',
            value: 1,
            remainingDuration: 7.1,
          },
        ],
        prepDuration: 3.2,
      },
    );
    expect(timeline.actionMap.get('unrelated-before')?.freezeDuration).toBe(0.2);
    expect(timeline.actionMap.get('unrelated')).toMatchObject({
      realStartTime: 10.2,
      freezeDuration: 0.5,
    });
  });

  it('agrees with simulated status consumption and does not start a combo cooldown', () => {
    const actions = [grant(), pursuit('pursuit', 3), pursuit('ordinary', 6)];
    const compiled = compileScenario({
      tracks: [{ id: 'camille', actions: actions.map(a => a.node) }],
    } as ScenarioData);
    const result = simulate(
      compiled.timeline,
      compiled.teamConfig,
      compiled.enemyConfig,
      compiled.actors,
    );
    expect(compiled.timeline.actionMap.get('pursuit')?.freezeDuration).toBe(0.5);
    expect(compiled.timeline.actionMap.get('ordinary')?.freezeDuration).toBeUndefined();
    expect(
      result.operatorLog.some(
        e => e.type === 'OPERATOR_EFFECT_EXPIRE' && e.id === ready && e.time === 4,
      ),
    ).toBe(true);
    expect(result.comboCooldownIntervals).toEqual([]);
  });
});
