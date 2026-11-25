import { getEnemyRuntimeDefinitionId } from '../../../core/game-data/enemyDefinition';
import { projectPoiseCurveFromReceipt } from '../../../core/projection/poiseCurves';
import { compileScenarioEnemy } from '../../../core/compiler/compileScenarioEnemy';
import {
  resolveEnemyBirthValues,
  resolveEnemySpawn,
} from '../../../core/project/enemyBirthEffects';
import { generatedEnemyStages } from '../../../data/enemies/generated/stages.generated';
import { enemyBirthOptions } from '../../../core/project/enemyBirthEffects';
import { expect, it } from 'vitest';
import { createDefinitionEnemyDocument } from '../../editor/enemyEditorCommands';
import { firstScenarioEnemy } from '../../../core/project/level';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { createScenarioSimulationService } from '../createScenarioSimulationService';
import { gameDataRepository } from '../../../data/gameDataRepository';
import type { EnemyDefinition } from '../../../core/game-data/enemyDefinition';
import { skillFixture } from '../../../test/skillFixture';

function setup(root: string, supplied?: EnemyDefinition) {
  const spawn = supplied
    ? undefined
    : generatedEnemyStages
        .flatMap(stage => stage.enemies)
        .find(entry => entry.birthBuffs?.some(buff => buff.runtimeBuffId === root));
  const definition =
    supplied ??
    (spawn ? gameDataRepository.getEnemy(spawn.definitionId) : null) ??
    gameDataRepository.getEnemies().find(d => d.birthBuffs?.some(b => b.runtimeBuffId === root));
  if (!definition) throw new Error(`missing birth entry ${root}`);
  const scenario = createTimelineSampleScenario();
  const key = enemyBirthOptions(definition, spawn).find(b => b.runtimeBuffId === root)!.key;
  firstScenarioEnemy(scenario).enemy = createDefinitionEnemyDocument(
    definition,
    90,
    30,
    spawn?.source,
    [key],
    spawn,
  );
  const track = scenario.tracks[0]!;
  track.operator!.operatorSlug = 'perlica';
  track.weapon = null;
  track.gears = { armor: null, gloves: null, accessory1: null, accessory2: null };
  track.skillCasts = [
    {
      id: 'probe',
      source: {
        kind: 'operatorSkill',
        skillGroupKey: 'battleSkill',
        skillKey: 'chr_0004_pelica_normal_skill',
        action: 'battleSkill',
      },
      placement: { startFrame: 0 },
    },
  ];
  scenario.tracks[1] = scenario.tracks[2] = scenario.tracks[3] = null;
  const repository = supplied
    ? {
        ...gameDataRepository,
        getEnemy: (id: string) => (id === supplied.id ? supplied : gameDataRepository.getEnemy(id)),
      }
    : gameDataRepository;
  const service = createScenarioSimulationService(repository);
  return { scenario, track, service };
}

it('出生抗性覆盖参与真实伤害结算，切面恢复保持句柄', () => {
  const { scenario, service } = setup('buff_common_BalanceResistance');
  const session = service.createCombatSession(scenario);
  session.advanceToFrame(5);
  const restored = session.fork(session.runtime.save());
  session.advanceToFrame(30);
  restored.advanceToFrame(30);
  expect(restored.collectResult().receiptEntries).toEqual(session.collectResult().receiptEntries);
  const hit = session.collectResult().receiptEntries.find(e => e.event === 'DamageApplied')!;
  expect(hit.data?.enemyResistancePercent).toBe(11);
  expect(hit.data?.resistanceMultiplier).toBeCloseTo(0.89);
});

it('失衡免疫阻止失衡累计但不阻止伤害', () => {
  // 原生入口尚无已发布敌人条目引用；用定义层选择项验证公共 Buff，不修改其图。
  const base = gameDataRepository.getEnemies().find(d => d.birthBuffs)!;
  const definition: EnemyDefinition = {
    ...base,
    birthBuffs: [
      {
        key: 'immunity',
        buffId: 'buff_common_immunepoise',
        runtimeBuffId: 'buff_common_immunepoise',
        origin: 'enemy',
        supported: true,
        modifiers: [],
      },
    ],
  };
  const { scenario, service, track } = setup('buff_common_immunepoise', definition);
  track.skillCasts[0]!.customDefinition = skillFixture({
    key: 'chr_0004_pelica_normal_skill',
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'hit' } }],
    actionGraph: {
      main: {
        nodes: {
          hit: {
            action: {
              kind: 'dealDamage',
              parameters: {
                damageType: 'physical',
                attackScale: 1,
                stagger: 10,
                tags: ['normalSkill'],
                target: { kind: 'fixed', target: 'enemy' },
              },
            },
            next: null,
          },
        },
      },
      macros: {},
    },
  });
  const session = service.createCombatSession(scenario);
  session.advanceToFrame(30);
  const entries = session.collectResult().receiptEntries;
  expect(entries.some(e => e.event === 'DamageApplied' && Number(e.data?.value) > 0)).toBe(true);
  expect(entries.some(e => e.event === 'PoiseApplied' && Number(e.data?.actualDelta) < 0)).toBe(
    false,
  );
  firstScenarioEnemy(scenario).enemy.birthEffects!.enabledBuffs = [];
  const baseline = service.createCombatSession(scenario);
  baseline.advanceToFrame(30);
  expect(
    baseline
      .collectResult()
      .receiptEntries.some(e => e.event === 'PoiseApplied' && e.data?.actualDelta === -10),
  ).toBe(true);
});

it.each(['buff_dung_physicalstatus_enemy', 'buff_dung_spellstatus_enemy'])(
  '%s 在对应状态施加后解除减伤',
  root => {
    const { scenario, track, service } = setup(root);
    const physical = root.includes('physical');
    track.skillCasts[0]!.customDefinition = skillFixture({
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 45,
      scheduledSequences: [
        { startFrame: 0, sequence: { $sequence: 'hit' } },
        { startFrame: 10, sequence: { $sequence: 'status' } },
        { startFrame: 20, sequence: { $sequence: 'hit' } },
      ],
      actionGraph: {
        main: {
          nodes: {
            hit: {
              action: {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: 1,
                  tags: ['normalSkill'],
                  target: { kind: 'fixed', target: 'enemy' },
                },
              },
              next: null,
            },
            status: {
              action: physical
                ? {
                    kind: 'applyPhysicalInfliction',
                    parameters: {
                      type: 'fracture',
                      source: { kind: 'owner' },
                      target: { kind: 'fixed', target: 'enemy' },
                      isExtra: false,
                    },
                  }
                : {
                    kind: 'applyElementalInfliction',
                    parameters: {
                      element: 'electric',
                      isExtra: false,
                      target: { kind: 'fixed', target: 'enemy' },
                    },
                  },
              next: null,
            },
          },
        },
        macros: {},
      },
    });
    const session = service.createCombatSession(scenario);
    session.advanceToFrame(30);
    const hits = session
      .collectResult()
      .receiptEntries.filter(
        e => e.event === 'DamageApplied' && e.data?.skillType === 'battleSkill',
      );
    expect(hits.map(e => e.data?.['damageScale:product:defender'])).toEqual([
      physical ? 0.7 : 0.8,
      1,
    ]);
    expect(
      session
        .collectResult()
        .receiptEntries.some(
          e =>
            e.event === 'BuffFinished' &&
            e.data?.buffId === 'buff_dung_damagereduction' &&
            e.frame === 10,
        ),
    ).toBe(true);
  },
);

it.each([false, true])('死亡回技力在手动或自动死亡中只触发一次（自动=%s）', automatic => {
  const { scenario, service } = setup('buff_race_enemy_add_atb_on_death');
  const enemy = firstScenarioEnemy(scenario).enemy;
  scenario.battle.enemyAutomaticDeath = automatic;
  enemy.lifecycle = { spawnFrame: 0, presenceChanges: [], deathFrame: 90 };
  if (automatic) enemy.editable.hp = 1;
  const session = service.createCombatSession(scenario);
  session.advanceToFrame(5);
  const branch = session.fork(session.runtime.save());
  session.advanceToFrame(100);
  branch.advanceToFrame(100);
  expect(branch.collectResult().receiptEntries).toEqual(session.collectResult().receiptEntries);
  const rewards = session
    .collectResult()
    .receiptEntries.filter(
      e =>
        e.event === 'SpChanged' &&
        e.sourceId === firstScenarioEnemy(scenario).id &&
        e.data?.actualValue === 15,
    );
  expect(rewards).toHaveLength(1);
  expect(rewards[0]!.frame).toBe(automatic ? 13 : 90);
});

it('出生周期回血按敌人生命账本结算，切面恢复保持一致', () => {
  const { scenario, service } = setup('buff_dung_healhp_loop');
  const session = service.createCombatSession(scenario);
  session.advanceToFrame(30);
  const restored = session.fork(session.runtime.save());
  session.advanceToFrame(600);
  restored.advanceToFrame(600);
  const entries = session.collectResult().receiptEntries;
  expect(restored.collectResult().receiptEntries).toEqual(entries);
  expect(
    entries.some(
      e =>
        e.event === 'HealingApplied' &&
        e.targetId === firstScenarioEnemy(scenario).id &&
        Number(e.data?.actualHealing) > 0,
    ),
  ).toBe(true);
});

it.each(['buff_common_maxpoiseadd', 'buff_dung_maxpoisemulti'])(
  '%s 出生上限修正不重复，恢复动作可执行且切面一致',
  root => {
    const { scenario, service, track } = setup(root);
    track.skillCasts[0]!.customDefinition = skillFixture({
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 30,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'hit' } }],
      actionGraph: {
        main: {
          nodes: {
            hit: {
              action: {
                kind: 'dealDamage',
                parameters: {
                  damageType: 'physical',
                  attackScale: 1,
                  stagger: 10,
                  tags: ['normalSkill'],
                  target: { kind: 'fixed', target: 'enemy' },
                },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    });
    const session = service.createCombatSession(scenario);
    session.advanceToFrame(1);
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(40);
    restored.advanceToFrame(40);
    const entries = session.collectResult().receiptEntries;
    expect(restored.collectResult().receiptEntries).toEqual(entries);
    const enemy = firstScenarioEnemy(scenario).enemy;
    const definition = gameDataRepository.getEnemy(getEnemyRuntimeDefinitionId(enemy)!)!;
    const spawn = resolveEnemySpawn(
      enemy.source,
      generatedEnemyStages.find(
        stage => enemy.source.kind === 'stage' && stage.id === enemy.source.stageId,
      ) ?? null,
    );
    const expected = resolveEnemyBirthValues(enemy, definition, 30, spawn).stagger.maximum;
    expect(entries.find(e => e.event === 'MaxPoiseChanged')?.data?.maxPoise).toBeCloseTo(expected);
    const initial = compileScenarioEnemy(enemy, gameDataRepository).stagger.maximum;
    const curve = projectPoiseCurveFromReceipt(
      { poise: initial, maxPoise: initial },
      entries,
      -scenario.battle.prepFrames,
      firstScenarioEnemy(scenario).id,
    );
    expect(curve.maxValue).toBeCloseTo(expected);
    expect(curve.points.at(-1)?.value).toBeCloseTo(
      session.collectResult().enemyVitalsById[firstScenarioEnemy(scenario).id]!.finalPoise,
    );
    if (root === 'buff_common_maxpoiseadd') {
      const recovery = entries.find(
        e => e.event === 'PoiseApplied' && e.sourceId === firstScenarioEnemy(scenario).id,
      );
      expect(recovery?.frame).toBe(3);
      expect(recovery?.data?.actualDelta).toBeGreaterThan(0);
    }
    expect(
      entries.some(
        e =>
          e.event === 'PoiseApplied' &&
          e.sourceId === firstScenarioEnemy(scenario).id &&
          Number(e.data?.actualDelta) >= 0,
      ),
    ).toBe(true);
  },
);

it('战争回响次数盾变体可挂载失衡恢复倍率并恢复切面', () => {
  const { scenario, service } = setup('buff_eny_0127_bigents_showhp_tower019');
  const session = service.createCombatSession(scenario);
  session.advanceToFrame(30);
  const restored = session.fork(session.runtime.save());
  session.advanceToFrame(120);
  restored.advanceToFrame(120);
  const entries = session.collectResult().receiptEntries;
  expect(entries.some(entry => entry.event === 'CountShieldUiChanged')).toBe(true);
  expect(restored.collectResult().receiptEntries).toEqual(entries);
});

it.each(['physical', 'heat', 'electric', 'cryo', 'nature'] as const)(
  '天鼓出生减伤对 %s 生效，取消勾选后恢复正常承伤',
  damageType => {
    const { scenario, track, service } = setup('buff_eny_0082_hsbear_hdg018_shield');
    track.skillCasts[0]!.customDefinition = skillFixture({
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 30,
      scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'hit' } }],
      actionGraph: {
        main: {
          nodes: {
            hit: {
              action: {
                kind: 'dealDamage',
                parameters: {
                  damageType,
                  attackScale: 1,
                  tags: ['normalSkill'],
                  target: { kind: 'fixed', target: 'enemy' },
                },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    });
    const simulate = () => {
      const session = service.createCombatSession(scenario);
      session.advanceToFrame(30);
      return session.collectResult().receiptEntries.find(e => e.event === 'DamageApplied')!;
    };
    const protectedHit = simulate();
    firstScenarioEnemy(scenario).enemy.birthEffects!.enabledBuffs = [];
    const baselineHit = simulate();
    expect(Number(protectedHit.data?.value)).toBeGreaterThan(0);
    expect(Number(protectedHit.data?.value)).toBeCloseTo(Number(baselineHit.data?.value) * 0.5, 2);
  },
);
