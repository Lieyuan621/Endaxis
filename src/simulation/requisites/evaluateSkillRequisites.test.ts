import { describe, expect, it } from 'vitest';
import { createDefaultStats } from '@/simulation/defaultActorStats';
import { compileScenario } from '@/simulation/compiler/compileScenario';
import type { Action, ScenarioData, ScenarioTrack } from '@/simulation/compiler/types';
import { simulate } from '@/simulation/simulator';
import type { InitialEffect } from '@/simulation/simulator';
import { TriggerRegistry } from '@/simulation/engine/TriggerRegistry';
import type { ComboCooldownEvent } from '@/stores/timeline/types';

function createAction(id: string, type: Action['type'], patch: Partial<Action> = {}): Action {
  const startTime = Number(patch.startTime) || 0;
  return {
    id,
    instanceId: `${id}_inst`,
    type,
    skillId: patch.skillId || id,
    name: id,
    startTime,
    logicalStartTime: startTime,
    cooldown: 0,
    spCost: 0,
    element: 'heat',
    gaugeCost: 0,
    gaugeGain: 0,
    teamGaugeGain: 0,
    enhancementTime: 0,
    duration: 1,
    triggerWindow: 0,
    animationTime: 0,
    hits: [],
    ...patch,
  };
}

function createTrack(actions: Action[], id = 'laevatain'): ScenarioTrack {
  return {
    id,
    actions,
    stats: createDefaultStats(),
    gaugeEfficiency: 100,
    originiumArtsPower: 0,
    linkCdReduction: 0,
    initialGauge: 300,
  };
}

function run(
  actions: Action[],
  trackId = 'laevatain',
  initialEffects: InitialEffect[] = [],
  comboCooldownEvents: ComboCooldownEvent[] = [],
  comboCooldownByActorId: Record<string, number> = {},
) {
  const scenario: ScenarioData = {
    tracks: [createTrack(actions, trackId)],
    connections: [],
  };
  const { timeline, teamConfig, enemyConfig, actors } = compileScenario(scenario);
  return simulate(timeline, teamConfig, enemyConfig, actors, new TriggerRegistry([]), undefined, {
    initialEffects,
    comboCooldownEvents,
    comboCooldownByActorId,
  });
}

const ARCANE_ULTIMATE_ARCANA_REQUISITE = {
  id: 'arcane-ultimate-arcana-ready',
  condition: {
    kind: 'or' as const,
    conditions: [
      { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
      { kind: 'operatorStatus' as const, status: 'arcane-gloompurge-arcana-ready' },
    ],
  },
  messageKey: 'actionItem.requisiteTitle.arcaneUltimateArcanaRequired',
};

const ARCANE_ULTIMATE_COOLDOWN_REQUISITE = {
  id: 'ultimate-cooldown-ready',
  condition: {
    kind: 'or' as const,
    conditions: [
      { kind: 'ultimateCooldownReady' as const },
      { kind: 'operatorStatus' as const, status: 'arcane-gloompurge-arcana-ready' },
    ],
  },
  messageKey: 'actionItem.requisiteTitle.ultimateSkillOnCooldown',
};

const LAEVATAIN_OUTSIDE_ULTIMATE_BASIC_REQUISITE = {
  id: 'laevatain-basic-outside-ultimate-enhancement',
  condition: { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
  messageKey: 'actionItem.requisiteTitle.enhancedBasicDuringUltimate',
};

const LAEVATAIN_OUTSIDE_ULTIMATE_BATTLE_REQUISITE = {
  id: 'laevatain-battle-outside-ultimate-enhancement',
  condition: { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
  messageKey: 'actionItem.requisiteTitle.enhancedBattleDuringUltimate',
};

const ZHUANG_FANGYI_DURING_ULTIMATE_REQUISITE = {
  id: 'zhuang-fangyi-ultimate-enhancement',
  condition: { kind: 'ultimateEnhancement' as const },
  messageKey: 'actionItem.requisiteTitle.ultimateEnhancementOnly',
};

const ZHUANG_FANGYI_OUTSIDE_ULTIMATE_BASIC_REQUISITE = {
  id: 'zhuang-fangyi-basic-outside-ultimate-enhancement',
  condition: { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
  messageKey: 'actionItem.requisiteTitle.enhancedBasicDuringUltimate',
};

const ZHUANG_FANGYI_OUTSIDE_ULTIMATE_BATTLE_REQUISITE = {
  id: 'zhuang-fangyi-battle-outside-ultimate-enhancement',
  condition: { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
  messageKey: 'actionItem.requisiteTitle.enhancedBattleDuringUltimate',
};

const ZHUANG_FANGYI_OUTSIDE_ULTIMATE_COMBO_REQUISITE = {
  id: 'zhuang-fangyi-combo-outside-ultimate-enhancement',
  condition: { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
  messageKey: 'actionItem.requisiteTitle.enhancedComboDuringUltimate',
};

const YVONNE_DURING_ULTIMATE_REQUISITE = {
  id: 'yvonne-ultimate-enhancement',
  condition: { kind: 'ultimateEnhancement' as const },
  messageKey: 'actionItem.requisiteTitle.ultimateEnhancementOnly',
};

const YVONNE_OUTSIDE_ULTIMATE_BASIC_REQUISITE = {
  id: 'yvonne-basic-outside-ultimate-enhancement',
  condition: { kind: 'not' as const, condition: { kind: 'ultimateEnhancement' as const } },
  messageKey: 'actionItem.requisiteTitle.enhancedBasicDuringUltimate',
};

const ULTIMATE_COOLDOWN_REQUISITE = {
  id: 'ultimate-cooldown-ready',
  condition: { kind: 'ultimateCooldownReady' as const },
  messageKey: 'actionItem.requisiteTitle.ultimateSkillOnCooldown',
};

const COMBO_COOLDOWN_REQUISITE = {
  id: 'combo-cooldown-ready',
  condition: { kind: 'comboNotOnCooldown' as const },
};

describe('evaluateSkillRequisites', () => {
  it('lets a forced-ready event end the current combo cooldown', () => {
    const result = run(
      [
        createAction('combo', 'comboSkill', { startTime: 1, cooldown: 10 }),
        createAction('check', 'basicAttack', {
          startTime: 6,
          requisites: [COMBO_COOLDOWN_REQUISITE],
        }),
      ],
      'laevatain',
      [],
      [{ id: 'ready', time: 5, mode: 'ready' }],
    );

    expect(
      result.simLog.some(
        entry =>
          entry.type === 'ACTION_REQUISITE_FAILED' && entry.payload.actionId === 'check_inst',
      ),
    ).toBe(false);
    expect(result.comboCooldownIntervals).toContainEqual(
      expect.objectContaining({
        actorId: 'laevatain',
        start: 1,
        end: 5,
        forced: false,
      }),
    );
  });

  it('starts the configured combo cooldown for every actor', () => {
    const result = run(
      [
        createAction('blocked', 'basicAttack', {
          startTime: 5,
          requisites: [COMBO_COOLDOWN_REQUISITE],
        }),
        createAction('ready', 'basicAttack', {
          startTime: 12,
          requisites: [COMBO_COOLDOWN_REQUISITE],
        }),
      ],
      'laevatain',
      [],
      [{ id: 'cooldown', time: 1, mode: 'cooldown' }],
      { laevatain: 10 },
    );

    const failures = result.simLog.filter(entry => entry.type === 'ACTION_REQUISITE_FAILED');
    expect(failures.map(entry => entry.payload.actionId)).toContain('blocked_inst');
    expect(failures.map(entry => entry.payload.actionId)).not.toContain('ready_inst');
  });

  it('applies a same-frame control event before the combo action', () => {
    const result = run(
      [
        createAction('combo', 'comboSkill', { startTime: 1, cooldown: 10 }),
        createAction('check', 'basicAttack', {
          startTime: 2,
          requisites: [COMBO_COOLDOWN_REQUISITE],
        }),
      ],
      'laevatain',
      [],
      [{ id: 'ready', time: 1, mode: 'ready' }],
    );

    expect(result.simLog).toContainEqual(
      expect.objectContaining({
        type: 'ACTION_REQUISITE_FAILED',
        payload: expect.objectContaining({ actionId: 'check_inst' }),
      }),
    );
  });

  it('draws and truncates a forced combo cooldown interval', () => {
    const result = run(
      [],
      'laevatain',
      [],
      [
        { id: 'cooldown', time: 1, mode: 'cooldown' },
        { id: 'ready', time: 5, mode: 'ready' },
      ],
      { laevatain: 10 },
    );

    expect(result.comboCooldownIntervals).toEqual([
      expect.objectContaining({
        actorId: 'laevatain',
        start: 1,
        end: 5,
        forced: true,
      }),
    ]);
  });

  it('keeps a second-stage combo cooldown after its opening hit clears the first stage', () => {
    const result = run([
      createAction('combo-stage-1', 'comboSkill', { startTime: 1, cooldown: 10 }),
      createAction('combo-stage-2', 'comboSkill', {
        startTime: 2,
        cooldown: 10,
        hits: [
          {
            id: 'combo-stage-2-hit',
            offset: 0,
            multiplier: 0,
            spRecovery: 0,
            spReturn: 0,
            stagger: 0,
            effects: [
              {
                kind: 'cooldownReductionPercent',
                skillTypes: 'comboSkill',
                target: 'self',
                value: 100,
              },
            ],
          },
        ],
      }),
    ]);

    expect(result.comboCooldownIntervals).toEqual([
      expect.objectContaining({
        actorId: 'laevatain',
        sourceActionId: 'combo-stage-2_inst',
        start: 2,
        end: 12,
        forced: false,
      }),
    ]);
  });

  it('logs unmet ultimate-enhancement release prerequisites', () => {
    const result = run([
      createAction('enhanced', 'battleSkill', {
        startTime: 1,
        requisites: [
          {
            id: 'laevatain-ultimate-enhancement',
            condition: { kind: 'ultimateEnhancement' },
          },
        ],
      }),
    ]);

    expect(result.simLog).toContainEqual(
      expect.objectContaining({
        type: 'ACTION_REQUISITE_FAILED',
        payload: expect.objectContaining({
          actionId: 'enhanced_inst',
          requisiteId: 'laevatain-ultimate-enhancement',
        }),
      }),
    );
  });

  it('passes ultimate-enhancement release prerequisites during the enhancement window', () => {
    const result = run([
      createAction('ultimate', 'ultimate', {
        startTime: 0,
        gaugeCost: 300,
        enhancementTime: 5,
        animationTime: 0,
      }),
      createAction('enhanced', 'battleSkill', {
        startTime: 2,
        requisites: [
          {
            id: 'laevatain-ultimate-enhancement',
            condition: { kind: 'ultimateEnhancement' },
          },
        ],
      }),
    ]);

    expect(
      result.simLog.some(
        entry =>
          entry.type === 'ACTION_REQUISITE_FAILED' &&
          entry.payload.actionId === 'enhanced_inst',
      ),
    ).toBe(false);
  });

  it('blocks Laevatain normal basic attack and battle skill during ultimate enhancement', () => {
    const result = run([
      createAction('ultimate', 'ultimate', {
        startTime: 0,
        gaugeCost: 300,
        enhancementTime: 5,
        animationTime: 0,
      }),
      createAction('normal-basic', 'basicAttack', {
        startTime: 2,
        requisites: [LAEVATAIN_OUTSIDE_ULTIMATE_BASIC_REQUISITE],
      }),
      createAction('normal-battle', 'battleSkill', {
        startTime: 3,
        requisites: [LAEVATAIN_OUTSIDE_ULTIMATE_BATTLE_REQUISITE],
      }),
    ]);

    const failures = result.simLog.filter(entry => entry.type === 'ACTION_REQUISITE_FAILED');

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            actionId: 'normal-basic_inst',
            requisiteId: 'laevatain-basic-outside-ultimate-enhancement',
            messageKey: 'actionItem.requisiteTitle.enhancedBasicDuringUltimate',
          }),
        }),
        expect.objectContaining({
          payload: expect.objectContaining({
            actionId: 'normal-battle_inst',
            requisiteId: 'laevatain-battle-outside-ultimate-enhancement',
            messageKey: 'actionItem.requisiteTitle.enhancedBattleDuringUltimate',
          }),
        }),
      ]),
    );
  });

  it('blocks Zhuang Fangyi normal variants during ultimate enhancement', () => {
    const result = run(
      [
        createAction('ultimate', 'ultimate', {
          startTime: 0,
          gaugeCost: 300,
          enhancementTime: 5,
          animationTime: 0,
        }),
        createAction('normal-basic', 'basicAttack', {
          startTime: 2,
          requisites: [ZHUANG_FANGYI_OUTSIDE_ULTIMATE_BASIC_REQUISITE],
        }),
        createAction('normal-battle', 'battleSkill', {
          startTime: 3,
          requisites: [ZHUANG_FANGYI_OUTSIDE_ULTIMATE_BATTLE_REQUISITE],
        }),
        createAction('normal-combo', 'comboSkill', {
          startTime: 4,
          requisites: [ZHUANG_FANGYI_OUTSIDE_ULTIMATE_COMBO_REQUISITE],
        }),
      ],
      'zhuang-fangyi',
    );

    const failedActionIds = result.simLog
      .filter(entry => entry.type === 'ACTION_REQUISITE_FAILED')
      .map(entry => entry.payload.actionId);

    expect(failedActionIds).toEqual(
      expect.arrayContaining(['normal-basic_inst', 'normal-battle_inst', 'normal-combo_inst']),
    );
  });

  it('blocks Zhuang Fangyi enhanced variants outside ultimate enhancement', () => {
    const result = run(
      [
        createAction('enhanced-basic', 'basicAttack', {
          startTime: 1,
          requisites: [ZHUANG_FANGYI_DURING_ULTIMATE_REQUISITE],
        }),
        createAction('enhanced-battle', 'battleSkill', {
          startTime: 2,
          requisites: [ZHUANG_FANGYI_DURING_ULTIMATE_REQUISITE],
        }),
        createAction('enhanced-combo', 'comboSkill', {
          startTime: 3,
          requisites: [ZHUANG_FANGYI_DURING_ULTIMATE_REQUISITE],
        }),
      ],
      'zhuang-fangyi',
    );

    const failedActionIds = result.simLog
      .filter(entry => entry.type === 'ACTION_REQUISITE_FAILED')
      .map(entry => entry.payload.actionId);

    expect(failedActionIds).toEqual(
      expect.arrayContaining(['enhanced-basic_inst', 'enhanced-battle_inst', 'enhanced-combo_inst']),
    );
  });

  it('blocks Yvonne normal basic attack during ultimate enhancement', () => {
    const result = run(
      [
        createAction('ultimate', 'ultimate', {
          startTime: 0,
          gaugeCost: 300,
          enhancementTime: 5,
          animationTime: 0,
        }),
        createAction('normal-basic', 'basicAttack', {
          startTime: 2,
          requisites: [YVONNE_OUTSIDE_ULTIMATE_BASIC_REQUISITE],
        }),
      ],
      'yvonne',
    );

    expect(result.simLog).toContainEqual(
      expect.objectContaining({
        type: 'ACTION_REQUISITE_FAILED',
        payload: expect.objectContaining({
          actionId: 'normal-basic_inst',
          requisiteId: 'yvonne-basic-outside-ultimate-enhancement',
          messageKey: 'actionItem.requisiteTitle.enhancedBasicDuringUltimate',
        }),
      }),
    );
  });

  it('blocks Yvonne enhanced basic attack outside ultimate enhancement', () => {
    const result = run(
      [
        createAction('enhanced-basic', 'basicAttack', {
          startTime: 1,
          requisites: [YVONNE_DURING_ULTIMATE_REQUISITE],
        }),
      ],
      'yvonne',
    );

    expect(result.simLog).toContainEqual(
      expect.objectContaining({
        type: 'ACTION_REQUISITE_FAILED',
        payload: expect.objectContaining({
          actionId: 'enhanced-basic_inst',
          requisiteId: 'yvonne-ultimate-enhancement',
          messageKey: 'actionItem.requisiteTitle.ultimateEnhancementOnly',
        }),
      }),
    );
  });

  it('blocks Arcane ultimate during enhancement until arcana is ready', () => {
    const result = run(
      [
        createAction('first-ultimate', 'ultimate', {
          startTime: 0,
          gaugeCost: 100,
          enhancementTime: 'arcane-gloompurger-array',
          animationTime: 0,
          requisites: [
            ARCANE_ULTIMATE_ARCANA_REQUISITE,
            ARCANE_ULTIMATE_COOLDOWN_REQUISITE,
          ],
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                {
                  id: 'arcane-gloompurger-array',
                  kind: 'status',
                  target: 'self',
                  duration: 5,
                },
              ],
            },
          ],
        }),
        createAction('second-ultimate', 'ultimate', {
          startTime: 1,
          gaugeCost: 100,
          enhancementTime: 'arcane-gloompurger-array',
          animationTime: 0,
          requisites: [
            ARCANE_ULTIMATE_ARCANA_REQUISITE,
            ARCANE_ULTIMATE_COOLDOWN_REQUISITE,
          ],
        }),
      ],
      'arcane',
    );

    expect(result.simLog).toContainEqual(
      expect.objectContaining({
        type: 'ACTION_REQUISITE_FAILED',
        payload: expect.objectContaining({
          actionId: 'second-ultimate_inst',
          requisiteId: 'arcane-ultimate-arcana-ready',
          messageKey: 'actionItem.requisiteTitle.arcaneUltimateArcanaRequired',
        }),
      }),
    );
  });

  it('allows Arcane ultimate during enhancement after arcana is ready', () => {
    const result = run(
      [
        createAction('first-ultimate', 'ultimate', {
          startTime: 0,
          gaugeCost: 100,
          enhancementTime: 'arcane-gloompurger-array',
          animationTime: 0,
          cooldown: 20,
          requisites: [
            ARCANE_ULTIMATE_ARCANA_REQUISITE,
            ARCANE_ULTIMATE_COOLDOWN_REQUISITE,
          ],
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                {
                  id: 'arcane-gloompurger-array',
                  kind: 'status',
                  target: 'self',
                  duration: 5,
                },
              ],
            },
          ],
        }),
        createAction('second-ultimate', 'ultimate', {
          startTime: 1,
          gaugeCost: 100,
          enhancementTime: 'arcane-gloompurger-array',
          animationTime: 0,
          cooldown: 20,
          requisites: [
            ARCANE_ULTIMATE_ARCANA_REQUISITE,
            ARCANE_ULTIMATE_COOLDOWN_REQUISITE,
          ],
        }),
      ],
      'arcane',
      [
        {
          kind: 'status',
          targetTrackId: 'arcane',
          id: 'arcane-gloompurge-arcana-ready',
          value: 0,
          sourceId: 'test',
          remainingDuration: 5,
        },
      ],
    );

    expect(
      result.simLog.some(
        entry =>
          entry.type === 'ACTION_REQUISITE_FAILED' &&
          entry.payload.actionId === 'second-ultimate_inst',
      ),
    ).toBe(false);
  });

  it('warns while the previous ultimate is cooling down and passes at the boundary', () => {
    const failuresAt = (retryTime: number) => {
      const result = run([
        createAction('first-ultimate', 'ultimate', {
          startTime: 0,
          cooldown: 10,
          animationTime: 1,
        }),
        createAction('retry-ultimate', 'ultimate', {
          startTime: retryTime,
          cooldown: 10,
          requisites: [ULTIMATE_COOLDOWN_REQUISITE],
        }),
      ]);
      return result.simLog.filter(
        entry =>
          entry.type === 'ACTION_REQUISITE_FAILED' &&
          entry.payload.actionId === 'retry-ultimate_inst' &&
          entry.payload.requisiteId === 'ultimate-cooldown-ready',
      );
    };

    expect(failuresAt(10.9)).toHaveLength(1);
    expect(failuresAt(11)).toHaveLength(0);
  });

  it('starts a status-bound ultimate cooldown when its enhancement is terminated', () => {
    const failuresAt = (retryTime: number) => {
      const result = run([
        createAction('first-ultimate', 'ultimate', {
          startTime: 0,
          cooldown: 10,
          enhancementTime: 'test-ultimate-stance',
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [
                {
                  id: 'test-ultimate-stance',
                  kind: 'status',
                  target: 'self',
                  duration: 20,
                },
              ],
            },
          ],
        }),
        createAction('end-stance', 'battleSkill', {
          startTime: 5,
          hits: [
            {
              offset: 0,
              spRecovery: 0,
              spReturn: 0,
              stagger: 0,
              effects: [{ kind: 'consume', operatorStatus: 'test-ultimate-stance' }],
            },
          ],
        }),
        createAction('retry-ultimate', 'ultimate', {
          startTime: retryTime,
          cooldown: 10,
          requisites: [ULTIMATE_COOLDOWN_REQUISITE],
        }),
      ]);
      return result.simLog.filter(
        entry =>
          entry.type === 'ACTION_REQUISITE_FAILED' &&
          entry.payload.actionId === 'retry-ultimate_inst' &&
          entry.payload.requisiteId === 'ultimate-cooldown-ready',
      );
    };

    expect(failuresAt(14.9)).toHaveLength(1);
    expect(failuresAt(15)).toHaveLength(0);
  });
});
