import { firstScenarioEnemy, levelEnemies } from '../../../core/project/level';
import { projectBuffTimelineViz } from '../../../core/projection/buffTimelineViz';
import { perlicaChr_0004_pelica_attack1 } from '../../../data/operators/perlica.generated';
import { describe, expect, it } from 'vitest';
import { projectEnemyHealthCurveFromReceipt } from '../../../core/projection/enemyHealthCurves';
import { skillFixture } from '../../../test/skillFixture';
import { createEmptyScenario } from '../../../core/project/createProject';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

describe('正式模拟中的敌人生命周期', () => {
  it('多敌人身上的技能衍生 Buff 在切面恢复后继续执行', () => {
    const scenario = createTimelineSampleScenario();
    const track = scenario.tracks[0]!;
    track.operator!.operatorSlug = 'tangtang';
    track.skillCasts = [
      {
        id: 'battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0027_tangtang_normal_skill',
          action: 'battleSkill',
        },
        placement: { startFrame: 0 },
      },
      {
        id: 'combo',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0027_tangtang_combo_skill',
          action: 'comboSkill',
        },
        placement: { startFrame: 30 },
      },
    ];
    scenario.tracks[1] = null;
    scenario.tracks[2] = null;
    scenario.tracks[3] = null;
    const first = firstScenarioEnemy(scenario);
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        first,
        {
          id: 'enemy:second',
          name: '第二个敌人',
          enemy: structuredClone(first.enemy),
        },
      ],
    };
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(60);
    expect(
      session.runtime.readState().environment!.enemyInstances!.get('enemy:second')!.buffs.instances
        .size,
    ).toBeGreaterThan(0);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(240);
    restored.advanceToFrame(240);
    expect(restored.runtime.readState()).toEqual(session.runtime.readState());
    expect(restored.collectResult().receiptEntries).toEqual(session.collectResult().receiptEntries);
  });
  it('保存的治疗目标在切出后仍有效，死亡后失效，切面恢复保持一致', () => {
    const scenario = createTimelineSampleScenario();
    firstScenarioEnemy(scenario).enemy.lifecycle = {
      spawnFrame: 0,
      presenceChanges: [],
      deathFrame: 15,
    };
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'away',
            name: '离场敌人',
            enemy: {
              ...structuredClone(firstScenarioEnemy(scenario).enemy),
              lifecycle: {
                spawnFrame: 0,
                presenceChanges: [{ id: 'out', frame: 5, present: false }],
              },
            },
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    scenario.tracks[1] = null;
    scenario.tracks[0]!.skillCasts = [
      {
        id: 'heal-saved',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
        },
        placement: { startFrame: 0 },
        customDefinition: skillFixture({
          key: 'chr_0004_pelica_attack1',
          timelineBlockFrames: 30,
          scheduledSequences: [
            { startFrame: 0, sequence: { $sequence: 'save' } },
            { startFrame: 10, sequence: { $sequence: 'heal' } },
            { startFrame: 20, sequence: { $sequence: 'heal' } },
          ],
          actionGraph: {
            main: {
              nodes: {
                save: {
                  action: {
                    kind: 'findTargets',
                    parameters: {
                      owner: { kind: 'owner' },
                      query: { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] },
                      saveToContextKey: 'saved',
                    },
                  },
                  next: null,
                },
                heal: {
                  action: {
                    kind: 'heal',
                    parameters: {
                      target: { kind: 'context', key: 'saved' },
                      healer: { kind: 'owner' },
                      amount: 100,
                      tags: [],
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {},
            },
            macros: {},
          },
        }),
      },
    ];
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(12);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(30);
    restored.advanceToFrame(30);
    const result = session.collectResult();
    expect(
      result.receiptEntries
        .filter(entry => entry.event === 'HealingApplied')
        .map(entry => [entry.frame, entry.targetId]),
    ).toEqual([
      [10, 'enemy'],
      [10, 'enemy:away'],
      [20, 'enemy:away'],
    ]);
    expect(restored.collectResult().receiptEntries).toEqual(result.receiptEntries);
  });
  it.each(['range', 'explicitFaction', 'tags', 'single', 'implicit'])(
    '%s 查询随敌人生命周期改变，并在恢复后保持一致',
    mode => {
      const scenario = createTimelineSampleScenario();
      scenario.level = {
        kind: 'multiEnemies',
        enemies: [
          firstScenarioEnemy(scenario),
          ...[
            {
              id: 'a',
              name: 'A',
              enemy: {
                ...structuredClone(firstScenarioEnemy(scenario).enemy),
                lifecycle: {
                  spawnFrame: 0,
                  presenceChanges: [
                    { id: 'out', frame: 5, present: false },
                    { id: 'in', frame: 15, present: true },
                  ],
                  deathFrame: 25,
                },
              },
            },
            {
              id: 'b',
              name: 'B',
              enemy: {
                ...structuredClone(firstScenarioEnemy(scenario).enemy),
                lifecycle: { spawnFrame: 15, presenceChanges: [] },
              },
            },
          ].map(item => ({ ...item, id: 'enemy:' + item.id })),
        ],
      };
      levelEnemies(scenario.level).slice(1)[0]!.enemy.editable.hp = 321;
      levelEnemies(scenario.level).slice(1)[1]!.enemy.editable.hp = 654;
      if (mode === 'single' || mode === 'implicit')
        firstScenarioEnemy(scenario).enemy.lifecycle = {
          spawnFrame: 0,
          presenceChanges: [{ id: 'leave', frame: 5, present: false }],
        };
      scenario.tracks[0]!.skillCasts = [
        {
          id: 'area',
          source: {
            kind: 'operatorSkill',
            skillGroupKey: 'basicAttack',
            skillKey: 'chr_0004_pelica_attack1',
          },
          placement: { startFrame: 1 },
          customDefinition: skillFixture({
            key: 'chr_0004_pelica_attack1',
            timelineBlockFrames: 32,
            scheduledSequences: [0, 10, 20, 30].map(startFrame => ({
              startFrame,
              sequence: { $sequence: mode === 'tags' && startFrame === 0 ? 'infliction' : 'hit' },
            })),
            actionGraph: {
              main: {
                nodes: {
                  hit: {
                    action: {
                      kind: 'dealDamage',
                      parameters: {
                        damageType: 'true',
                        attackScale: 0.01,
                        tags: [],
                        target:
                          mode === 'tags'
                            ? { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] }
                            : mode === 'implicit'
                              ? undefined
                              : mode === 'single'
                                ? { kind: 'mainTarget', owner: { kind: 'owner' } }
                                : {
                                    kind: 'factionHitBox',
                                    factionTarget: mode === 'explicitFaction' ? 'ally' : 'anti',
                                    ...(mode === 'explicitFaction'
                                      ? { targetFactions: ['bad' as const] }
                                      : {}),
                                    owner: { kind: 'owner' },
                                    checkAlive: true,
                                    containsUnmarkable: true,
                                    replacePartsWithMainBodies: false,
                                  },
                      },
                    },
                    next: mode === 'single' || mode === 'implicit' ? 'infliction' : 'marker',
                  },
                  infliction: {
                    action: {
                      kind: 'applyElementalInfliction',
                      parameters: {
                        element: 'heat',
                        isExtra: false,
                        target:
                          mode === 'tags'
                            ? { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] }
                            : mode === 'implicit'
                              ? undefined
                              : { kind: 'mainTarget', owner: { kind: 'owner' } },
                      },
                    },
                    next: 'marker',
                  },
                  marker: {
                    action: {
                      kind: 'createTimedMarker',
                      parameters: {
                        targets: { kind: 'mainTarget', owner: { kind: 'owner' } },
                        markerId: 'target-marker',
                        durationSeconds: { kind: 'constant', value: 10 },
                        autoFinishByAction: false,
                        timeDomain: 'globalScaled',
                      },
                    },
                    next: null,
                  },
                },
                dataNodes: {},
              },
              macros: {},
            },
          }),
        },
      ];
      const session =
        createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
      session.advanceToFrame(12);
      const branch = session.fork(session.runtime.save());
      session.advanceToFrame(40);
      branch.advanceToFrame(40);
      expect(branch.collectResult()).toEqual(session.collectResult());
      expect(session.collectResult().enemyVitalsById['enemy:a']?.initialHealth).toBe(321);
      expect(session.collectResult().enemyVitalsById['enemy:b']?.initialHealth).toBe(654);
      expect(branch.collectResult().enemyVitalsById).toEqual(
        session.collectResult().enemyVitalsById,
      );
      expect(branch.runtime.readState().enemy.additionalTimedMarkers).toEqual(
        session.runtime.readState().enemy.additionalTimedMarkers,
      );
      if (mode === 'single' || mode === 'implicit') {
        const markers = session.runtime.readState().enemy.additionalTimedMarkers!;
        expect([...markers.keys()]).toEqual(['enemy:a', 'enemy:b']);
        expect(markers.get('enemy:a')!.entries[0]!.ownerId).toBe('enemy:a');
        expect(markers.get('enemy:b')!.entries[0]!.ownerId).toBe('enemy:b');
      }
      const health = projectEnemyHealthCurveFromReceipt(
        {
          health: session.collectResult().enemyVitalsById['enemy:a']!.initialHealth,
          maxHealth: session.collectResult().enemyVitalsById['enemy:a']!.maxHealth,
        },
        session.collectResult().receiptEntries,
        0,
        'enemy:a',
      );
      expect(health.points.at(-1)).toMatchObject({ frame: 25, value: 0 });
      if (mode === 'single' || mode === 'implicit') {
        const attachments = session
          .collectResult()
          .receiptEntries.filter(entry => entry.event === 'ElementalInflictionApplied');
        expect(
          attachments.map(entry => [
            entry.frame,
            entry.targetId,
            entry.data?.previousLayers,
            entry.data?.currentLayers,
          ]),
        ).toEqual([
          [1, 'enemy', 0, 1],
          [21, 'enemy:a', 0, 1],
          [31, 'enemy:b', 0, 1],
        ]);
      }
      if (mode === 'tags') {
        expect(
          session
            .collectResult()
            .receiptEntries.filter(entry => entry.event === 'ElementalInflictionApplied')
            .map(entry => [entry.targetId, entry.data?.previousLayers, entry.data?.currentLayers]),
        ).toEqual([
          ['enemy', 0, 1],
          ['enemy:a', 0, 1],
        ]);
      }
      const hits = session
        .collectResult()
        .receiptEntries.filter(entry => entry.event === 'DamageApplied');
      expect(
        [1, 11, 21, 31].map(frame =>
          hits.filter(hit => hit.frame === frame).map(hit => hit.targetId),
        ),
      ).toEqual(
        mode === 'single' || mode === 'implicit'
          ? [['enemy'], [], ['enemy:a'], ['enemy:b']]
          : [
              mode === 'tags' ? [] : ['enemy', 'enemy:a'],
              ['enemy'],
              ['enemy', 'enemy:a', 'enemy:b'],
              ['enemy', 'enemy:b'],
            ],
      );
    },
  );
  it('方案中的同种额外敌人编译为独立账本，并随整场切面恢复', () => {
    const scenario = createEmptyScenario('many', '多个敌人');
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          { id: 'a', name: '敌人 A', enemy: structuredClone(firstScenarioEnemy(scenario).enemy) },
          { id: 'b', name: '敌人 B', enemy: structuredClone(firstScenarioEnemy(scenario).enemy) },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    levelEnemies(scenario.level).slice(1)[1]!.enemy.editable.hp = 200000;
    levelEnemies(scenario.level).slice(1)[0]!.enemy.lifecycle = {
      spawnFrame: 5,
      presenceChanges: [{ id: 'leave', frame: 10, present: false }],
      deathFrame: 20,
    };
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(0);
    const state = session.runtime.readState().environment!.enemyInstances!;
    expect(state.get('enemy:a')!.vitals.health).toBe(100000);
    expect(state.get('enemy:b')!.vitals.health).toBe(200000);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(30);
    restored.advanceToFrame(30);
    expect(restored.runtime.readState()).toEqual(session.runtime.readState());
    const enemies = restored.runtime.readState().environment!.enemyInstances!;
    expect(enemies.get('enemy:a')!.lifecycle?.phase).toBe('dead');
    expect(enemies.get('enemy:a')!.vitals.health).toBe(0);
    expect(enemies.get('enemy:b')!.lifecycle?.phase).toBe('present');
    expect(enemies.get('enemy:b')!.vitals.health).toBe(200000);
    expect(
      restored
        .collectResult()
        .receiptEntries.filter(
          entry => entry.event === 'EnemyLifecycleChanged' && entry.targetId === 'enemy:a',
        )
        .map(entry => [entry.frame, entry.data?.transition]),
    ).toEqual([
      [5, 'spawn'],
      [10, 'leave'],
      [20, 'death'],
    ]);
  });
  it('离场保留生命，手动死亡结束生命；离场和死亡后的切面恢复均不重放事件', () => {
    const scenario = createEmptyScenario('enemy-life', '生命周期');
    firstScenarioEnemy(scenario).enemy.lifecycle = {
      spawnFrame: 0,
      presenceChanges: [
        { id: 'leave', frame: 5, present: false },
        { id: 'enter', frame: 10, present: true },
      ],
      deathFrame: 12,
    };
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(6);
    expect(
      session.runtime.readState().environment?.enemyInstances?.get(firstScenarioEnemy(scenario).id)
        ?.lifecycle?.phase,
    ).toBe('absent');
    expect(session.runtime.readState().environment?.enemyVitals.health).toBe(100000);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(15);
    restored.advanceToFrame(15);
    expect(restored.collectResult()).toEqual(session.collectResult());
    expect(
      session.runtime.readState().environment?.enemyInstances?.get(firstScenarioEnemy(scenario).id)
        ?.lifecycle?.phase,
    ).toBe('dead');
    expect(session.runtime.readState().environment?.enemyVitals.health).toBe(0);
    const deadBranch = session.fork(session.runtime.save());
    deadBranch.advanceToFrame(20);
    expect(
      deadBranch
        .collectResult()
        .receiptEntries.filter(entry => entry.event === 'EnemyLifecycleChanged')
        .map(entry => [entry.frame, entry.data?.transition]),
    ).toEqual([
      [0, 'spawn'],
      [5, 'leave'],
      [10, 'enter'],
      [12, 'death'],
    ]);
  });

  it.each([false, true])('实际战技命中扣尽生命，自动死亡=%s；恢复保持相同设置', automaticDeath => {
    const scenario = createTimelineSampleScenario();
    firstScenarioEnemy(scenario).enemy.editable.hp = 1;
    scenario.battle.enemyAutomaticDeath = automaticDeath;
    scenario.tracks[0]!.skillCasts.push({
      id: 'lethal-battle',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: 'chr_0004_pelica_normal_skill',
        action: 'battleSkill',
      },
      placement: { startFrame: 5 },
    });
    scenario.tracks[0]!.skillCasts.push({
      ...scenario.tracks[0]!.skillCasts[0]!,
      id: 'after-lethal-battle',
      placement: { startFrame: 100 },
    });
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(0);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(180);
    restored.advanceToFrame(180);
    expect(restored.collectResult()).toEqual(session.collectResult());
    const state = session.runtime.readState();
    expect(state.environment?.enemyVitals.health).toBe(0);
    expect(
      state.environment?.enemyInstances?.get(firstScenarioEnemy(scenario).id)?.lifecycle?.phase,
    ).toBe(automaticDeath ? 'dead' : 'present');
    const laterDamage = session
      .collectResult()
      .receiptEntries.filter(entry => entry.event === 'DamageApplied' && entry.frame >= 100);
    if (automaticDeath) expect(laterDamage).toHaveLength(0);
    else expect(laterDamage.length).toBeGreaterThan(0);
    expect(
      session
        .collectResult()
        .receiptEntries.filter(
          entry => entry.event === 'EnemyLifecycleChanged' && entry.data?.transition === 'death',
        ),
    ).toHaveLength(automaticDeath ? 1 : 0);
  });
});

it.each<'arrival' | 'collision'>(['arrival', 'collision'])(
  '延迟投射物 %s：到达绑定发射目标，碰撞在回调时查询在场目标',
  hitKind => {
    const scenario = createTimelineSampleScenario();
    firstScenarioEnemy(scenario).enemy.lifecycle = {
      spawnFrame: 0,
      presenceChanges: [
        { id: 'out', frame: 5, present: false },
        { id: 'in', frame: 15, present: true },
      ],
      deathFrame: 25,
    };
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'other',
            name: 'Other',
            enemy: {
              ...structuredClone(firstScenarioEnemy(scenario).enemy),
              lifecycle: { spawnFrame: 0, presenceChanges: [] },
            },
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    const graph = perlicaChr_0004_pelica_attack1.actionGraph!;
    const launch = graph.main.nodes.launchProjectile_1!;
    if (launch.action.kind !== 'launchProjectile') throw new Error('expected projectile launch');
    scenario.tracks[0]!.skillCasts = [
      {
        id: 'delayed',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0004_pelica_attack1',
        },
        placement: { startFrame: 1 },
        customDefinition: {
          ...perlicaChr_0004_pelica_attack1,
          naturalDurationFrames: 40,
          scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'launchProjectile_1' } }],
          actionGraph: {
            ...graph,
            main: {
              ...graph.main,
              nodes: {
                launchProjectile_1: {
                  ...launch,
                  action: {
                    ...launch.action,
                    parameters: {
                      ...launch.action.parameters,
                      schedule: {
                        endFrame: 31,
                        callbacks: [{ event: 'hit', hitKind, triggerFrames: [10, 20, 30] }],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(12);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(40);
    restored.advanceToFrame(40);
    expect(restored.collectResult()).toEqual(session.collectResult());
    const hits = session
      .collectResult()
      .receiptEntries.filter(entry => entry.event === 'DamageApplied');
    expect(hits.map(entry => ({ frame: entry.frame, target: entry.targetId }))).toEqual(
      hitKind === 'arrival'
        ? [{ frame: 21, target: 'enemy' }]
        : [
            { frame: 11, target: 'enemy:other' },
            { frame: 21, target: 'enemy' },
            { frame: 31, target: 'enemy:other' },
          ],
    );
  },
);

it('多敌人的同元素爆发分别读取附着层数和伤害接收者', () => {
  const scenario = createTimelineSampleScenario();
  scenario.level = {
    kind: 'multiEnemies',
    enemies: [
      firstScenarioEnemy(scenario),
      ...[
        {
          id: 'a',
          name: 'A',
          enemy: {
            ...structuredClone(firstScenarioEnemy(scenario).enemy),
            lifecycle: {
              spawnFrame: 0,
              presenceChanges: [
                { id: 'out', frame: 5, present: false },
                { id: 'in', frame: 15, present: true },
              ],
              deathFrame: 25,
            },
          },
        },
        {
          id: 'b',
          name: 'B',
          enemy: {
            ...structuredClone(firstScenarioEnemy(scenario).enemy),
            lifecycle: { spawnFrame: 15, presenceChanges: [] },
          },
        },
      ].map(item => ({ ...item, id: 'enemy:' + item.id })),
    ],
  };
  scenario.tracks[0]!.skillCasts = [
    {
      id: 'inflict',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0004_pelica_attack1',
      },
      placement: { startFrame: 1 },
      customDefinition: skillFixture({
        key: 'chr_0004_pelica_attack1',
        timelineBlockFrames: 32,
        scheduledSequences: [0, 10, 20, 30].map(startFrame => ({
          startFrame,
          sequence: { $sequence: 'inflict' },
        })),
        actionGraph: {
          main: {
            nodes: {
              inflict: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: {
                    element: 'heat',
                    isExtra: false,
                    target: { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] },
                  },
                },
                next: null,
              },
            },
            dataNodes: {},
          },
          macros: {},
        },
      }),
    },
  ];
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(12);
  const restored = session.fork(session.runtime.save());
  session.advanceToFrame(80);
  restored.advanceToFrame(80);
  expect(restored.collectResult()).toEqual(session.collectResult());
  const hits = session
    .collectResult()
    .receiptEntries.filter(entry => entry.event === 'DamageApplied');
  expect(hits.map(entry => [entry.frame, entry.targetId])).toEqual([
    [41, 'enemy'],
    [51, 'enemy'],
    [61, 'enemy'],
    [61, 'enemy:b'],
  ]);
});

it('异元素反应只读取各自目标的附着，不从主敌人复制', () => {
  const scenario = createTimelineSampleScenario();
  scenario.level = {
    kind: 'multiEnemies',
    enemies: [
      firstScenarioEnemy(scenario),
      ...[
        {
          id: 'late',
          name: '后出生的敌人',
          enemy: {
            ...structuredClone(firstScenarioEnemy(scenario).enemy),
            lifecycle: { spawnFrame: 15, presenceChanges: [] },
          },
        },
      ].map(item => ({ ...item, id: 'enemy:' + item.id })),
    ],
  };
  scenario.tracks[0]!.skillCasts = [
    {
      id: 'reaction',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0004_pelica_attack1',
      },
      placement: { startFrame: 1 },
      customDefinition: skillFixture({
        key: 'chr_0004_pelica_attack1',
        timelineBlockFrames: 40,
        scheduledSequences: [
          { startFrame: 0, sequence: { $sequence: 'electric' } },
          { startFrame: 20, sequence: { $sequence: 'nature' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              electric: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: {
                    element: 'electric',
                    isExtra: false,
                    target: { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] },
                  },
                },
                next: null,
              },
              nature: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: {
                    element: 'nature',
                    isExtra: false,
                    target: { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [] },
                  },
                },
                next: null,
              },
            },
            dataNodes: {},
          },
          macros: {},
        },
      }),
    },
  ];
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(16);
  const restored = session.fork(session.runtime.save());
  session.advanceToFrame(40);
  restored.advanceToFrame(40);
  expect(restored.collectResult()).toEqual(session.collectResult());
  const segments = projectBuffTimelineViz(session.collectResult().receiptEntries, 40);
  expect(segments).toContainEqual(
    expect.objectContaining({
      targetId: 'enemy:late',
      buffId: 'buff_common_energy_shard_attached_natural',
    }),
  );
  expect(
    segments
      .filter(segment => segment.buffId.includes('natural_pulse_triggered'))
      .map(segment => segment.targetId),
  ).toContain('enemy');
  expect(
    segments.filter(
      segment =>
        segment.buffId.includes('natural_pulse_triggered') && segment.targetId === 'enemy:late',
    ),
  ).toEqual([]);
});
