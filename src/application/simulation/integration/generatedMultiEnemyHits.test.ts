import { firstScenarioEnemy } from '../../../core/project/level';
import { describe, it, expect } from 'vitest';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { gameDataRepository } from '../../../data/gameDataRepository';
import { createScenarioSimulationService } from '../createScenarioSimulationService';

describe('生成技能的多敌人命中', () => {
  it.each([1, 2, 3, 4])('莱万汀强化 A%i 按目标分别计数，切面恢复保持双目标命中', stage => {
    const scenario = createTimelineSampleScenario();
    scenario.tracks[1] = null;
    const track = scenario.tracks[0]!;
    if (!track.operator) throw new Error('样例轨道必须配置干员');
    track.operator.operatorSlug = 'laevatain';
    track.skillCasts = [
      {
        id: 'enhanced',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'enhancedBasicAttack',
          skillKey: `chr_0016_laevat_ult_attack${stage}`,
        },
        placement: { startFrame: 0 },
      },
    ];
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'second',
            name: '第二个敌人',
            enemy: structuredClone(firstScenarioEnemy(scenario).enemy),
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(1);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(90);
    restored.advanceToFrame(90);
    const hits = session
      .collectResult()
      .receiptEntries.filter(entry => entry.event === 'DamageApplied');
    const primary = hits.filter(entry => entry.targetId === 'enemy');
    const secondary = hits.filter(entry => entry.targetId === 'enemy:second');
    expect(primary.length).toBeGreaterThan(0);
    expect(secondary.map(entry => entry.frame)).toEqual(primary.map(entry => entry.frame));
    if (stage === 1) expect(primary).toHaveLength(1);
    expect(restored.collectResult().receiptEntries).toEqual(session.collectResult().receiptEntries);
  });
});

it.each(
  (['battleSkill', 'ultimate'] as const).flatMap(skillGroupKey =>
    [false, true].map(primaryAway => ({ skillGroupKey, primaryAway })),
  ),
)(
  '佩丽卡 $skillGroupKey 按命中时在场敌人查询（首敌切出：$primaryAway）',
  ({ skillGroupKey, primaryAway }) => {
    const scenario = createTimelineSampleScenario();
    scenario.tracks[1] = null;
    const track = scenario.tracks[0]!;
    if (!track.operator) throw new Error('样例轨道必须配置干员');
    track.operator.operatorSlug = 'perlica';
    track.skillCasts = [
      {
        id: 'battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey,
          skillKey:
            skillGroupKey === 'battleSkill'
              ? 'chr_0004_pelica_normal_skill'
              : 'chr_0004_pelica_ultimate_skill',
        },
        placement: { startFrame: 0 },
      },
    ];
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'second',
            name: '第二个敌人',
            enemy: structuredClone(firstScenarioEnemy(scenario).enemy),
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    if (primaryAway)
      firstScenarioEnemy(scenario).enemy.lifecycle = {
        spawnFrame: 0,
        presenceChanges: [{ id: 'out', frame: 10, present: false }],
      };
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(180);
    const hits = session
      .collectResult()
      .receiptEntries.filter(entry => entry.event === 'DamageApplied');
    expect(hits.map(entry => entry.targetId).sort()).toEqual(
      primaryAway ? ['enemy:second'] : ['enemy', 'enemy:second'],
    );
  },
);

it.each([false, true])(
  '伊冯击杀监听只在真实死亡后返还能量，切面恢复保持订阅（自动死亡=%s）',
  automaticDeath => {
    const scenario = createTimelineSampleScenario();
    scenario.tracks[1] = null;
    const track = scenario.tracks[0]!;
    if (!track.operator) throw new Error('missing operator');
    track.operator.operatorSlug = 'yvonne';
    track.initialState.ultimateEnergy = 220;
    firstScenarioEnemy(scenario).enemy.editable.hp = 1;
    scenario.battle.enemyAutomaticDeath = automaticDeath;
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'second',
            name: '第二个敌人',
            enemy: {
              ...structuredClone(firstScenarioEnemy(scenario).enemy),
              editable: { ...firstScenarioEnemy(scenario).enemy.editable, hp: 100000 },
            },
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    track.skillCasts = [
      {
        id: 'ultimate',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0017_yvonne_ultimate_skill',
        },
        // 当前潜能表不启用这条历史原生分支；显式启用以验证 Buff 内击杀监听及注销。
        simulationInputs: { initialBlackboard: { has_potential4: 1 } },
        placement: { startFrame: 0 },
      },
      {
        id: 'enhanced',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'enhancedBasicAttack',
          skillKey: 'chr_0017_yvonne_ult_attack1_1',
        },
        placement: { startFrame: 90 },
      },
    ];
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(80);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(600);
    restored.advanceToFrame(600);
    expect(restored.collectResult()).toEqual(session.collectResult());
    const receipts = session.collectResult().receiptEntries;
    expect(
      receipts.some(
        entry =>
          entry.event === 'EnemyLifecycleChanged' &&
          entry.targetId === 'enemy' &&
          entry.data?.current === 'dead',
      ),
    ).toBe(automaticDeath);
    expect(
      receipts.some(
        entry => entry.event === 'UltimateEnergyChanged' && entry.data?.requestedValue === 66,
      ),
    ).toBe(automaticDeath);
    expect(
      receipts.some(
        entry =>
          entry.event === 'BuffCreated' &&
          entry.data?.buffId === 'buff_chr_0017_yvonne_ultimate_skill_potential4_valid',
      ),
    ).toBe(true);
  },
);

it.each([0, 1, 2])(
  '佩丽卡连携向另一名敌人弹射一次，限数与实体黑板在切面恢复后保持（额外敌人=%i）',
  count => {
    const scenario = createTimelineSampleScenario();
    const track = scenario.tracks[0]!;
    if (!track.operator) throw new Error('missing operator');
    const preparation = structuredClone(track);
    preparation.id = 'prepare-no-guard';
    if (!preparation.operator) throw new Error('missing operator');
    preparation.operator.operatorSlug = 'rossi';
    preparation.skillCasts = [
      {
        id: 'prepare',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0028_wulfa_normal_skill',
        },
        placement: { startFrame: 0 },
      },
    ];
    scenario.tracks[1] = preparation;
    track.operator.operatorSlug = 'perlica';
    track.operator.talentStates = { '0': 2, '1': 1 };
    track.skillCasts = [
      {
        id: 'combo',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0004_pelica_combo_skill',
        },
        placement: { startFrame: 60 },
      },
    ];
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...Array.from({ length: count }, (_, index) => ({
          id: `extra-${index}`,
          name: `extra-${index}`,
          enemy: structuredClone(firstScenarioEnemy(scenario).enemy),
        })).map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(88);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(180);
    restored.advanceToFrame(180);
    const result = session.collectResult();
    const hits = result.receiptEntries.filter(
      entry => entry.event === 'DamageApplied' && entry.sourceId === track.id,
    );
    expect(hits.map(entry => [entry.frame, entry.targetId])).toEqual(
      count === 0
        ? [[87, 'enemy']]
        : [
            [87, 'enemy'],
            [89, 'enemy:extra-0'],
          ],
    );
    expect(restored.collectResult().receiptEntries).toEqual(result.receiptEntries);
  },
);

it.each([false, true])(
  '主目标按轨道顺序、切换标记和死亡切出选择，切面恢复一致（删除初始敌人=%s）',
  withoutInitialEnemy => {
    const scenario = createTimelineSampleScenario();
    scenario.tracks[1] = null;
    const track = scenario.tracks[0]!;
    track.operator!.operatorSlug = 'perlica';
    track.skillCasts = [0, 90, 180].map((frame, index) => ({
      id: `target-hit-${index}`,
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0004_pelica_attack1',
      },
      placement: { startFrame: frame },
    }));
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'second',
            name: 'second',
            enemy: {
              ...structuredClone(firstScenarioEnemy(scenario).enemy),
              lifecycle: {
                spawnFrame: 0,
                presenceChanges: [{ id: 'leave', frame: 50, present: false }],
              },
            },
          },
          {
            id: 'third',
            name: 'third',
            enemy: {
              ...structuredClone(firstScenarioEnemy(scenario).enemy),
              lifecycle: { spawnFrame: 0, presenceChanges: [], deathFrame: 140 },
            },
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    scenario.level.enemies = [
      scenario.level.enemies[1]!,
      scenario.level.enemies[2]!,
      scenario.level.enemies[0]!,
    ];
    scenario.battle.enemyTargetSwitches = [{ id: 'switch', frame: 60, targetId: 'enemy:third' }];
    if (withoutInitialEnemy)
      scenario.level.enemies = scenario.level.enemies.filter(enemy => enemy.id !== 'enemy');
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(55);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(240);
    restored.advanceToFrame(240);
    const hits = session
      .collectResult()
      .receiptEntries.filter(entry => entry.event === 'DamageApplied');
    expect(hits.map(hit => hit.targetId)).toEqual(
      withoutInitialEnemy
        ? ['enemy:second', 'enemy:third']
        : ['enemy:second', 'enemy:third', 'enemy'],
    );
    expect(restored.collectResult()).toEqual(session.collectResult());
  },
);

it.each([
  { primarySpawn: 0, secondarySpawn: 0 },
  { primarySpawn: 108, secondarySpawn: 0 },
  { primarySpawn: 108, secondarySpawn: 120 },
])(
  '祀战技能力实体使用有效主目标（出生帧 $primarySpawn / $secondarySpawn）',
  ({ primarySpawn, secondarySpawn }) => {
    const scenario = createTimelineSampleScenario();
    scenario.tracks[1] = null;
    const track = scenario.tracks[0]!;
    track.operator!.operatorSlug = 'si';
    track.skillCasts = [
      {
        id: 'si-battle',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0036_jsspsi_normal_skill',
        },
        placement: { startFrame: 29 },
      },
    ];
    firstScenarioEnemy(scenario).enemy.lifecycle = {
      spawnFrame: primarySpawn,
      presenceChanges: [],
    };
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        firstScenarioEnemy(scenario),
        ...[
          {
            id: 'second',
            name: 'second',
            enemy: {
              ...structuredClone(firstScenarioEnemy(scenario).enemy),
              lifecycle: { spawnFrame: secondarySpawn, presenceChanges: [] },
            },
          },
        ].map(item => ({ ...item, id: 'enemy:' + item.id })),
      ],
    };
    scenario.battle.enemyTargetSwitches = [{ id: 'switch', frame: 22, targetId: 'enemy:second' }];
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(40);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(100);
    restored.advanceToFrame(100);
    const result = session.collectResult();
    const hits = result.receiptEntries.filter(e => e.event === 'DamageApplied');
    const attachments = result.receiptEntries.filter(e => e.event === 'ElementalInflictionApplied');
    if (secondarySpawn === 0) {
      expect(hits.length).toBeGreaterThan(0);
      expect(attachments.length).toBeGreaterThan(0);
      expect(new Set([...hits, ...attachments].map(e => e.targetId))).toEqual(
        new Set(['enemy:second']),
      );
    } else {
      expect(hits).toEqual([]);
      expect(attachments).toEqual([]);
    }
    expect(restored.collectResult()).toEqual(result);
  },
);

it.each([0, 120])('祀 A1 持续命中盒查询真实在场集合（首敌出生 %s）', primarySpawn => {
  const scenario = createTimelineSampleScenario();
  scenario.tracks[1] = null;
  const track = scenario.tracks[0]!;
  track.operator!.operatorSlug = 'si';
  track.skillCasts = [
    {
      id: 'si-attack',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'basicAttack',
        skillKey: 'chr_0036_jsspsi_attack1',
      },
      placement: { startFrame: 0 },
    },
  ];
  firstScenarioEnemy(scenario).enemy.lifecycle = { spawnFrame: primarySpawn, presenceChanges: [] };
  scenario.level = {
    kind: 'multiEnemies',
    enemies: [
      firstScenarioEnemy(scenario),
      ...[
        {
          id: 'second',
          name: 'second',
          enemy: {
            ...structuredClone(firstScenarioEnemy(scenario).enemy),
            lifecycle: { spawnFrame: 0, presenceChanges: [] },
          },
        },
      ].map(item => ({ ...item, id: 'enemy:' + item.id })),
    ],
  };
  const session = createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
  session.advanceToFrame(3);
  const restored = session.fork(session.runtime.save());
  session.advanceToFrame(60);
  restored.advanceToFrame(60);
  const hits = session
    .collectResult()
    .receiptEntries.filter(entry => entry.event === 'DamageApplied');
  const secondary = hits.filter(hit => hit.targetId === 'enemy:second');
  expect(secondary.length).toBeGreaterThan(0);
  expect(hits.filter(hit => hit.targetId === 'enemy').map(hit => hit.frame)).toEqual(
    primarySpawn === 0 ? secondary.map(hit => hit.frame) : [],
  );
  expect(restored.collectResult()).toEqual(session.collectResult());
});
