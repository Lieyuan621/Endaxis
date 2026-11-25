import { projectCountShieldTimeline } from '../../../core/projection/countShieldTimeline';
import { skillFixture } from '../../../test/skillFixture';
import { describe, expect, it } from 'vitest';
import { createDefinitionEnemyDocument } from '../../editor/enemyEditorCommands';
import { generatedEnemyDefinitions } from '../../../data/enemies/generated/index.generated';
import { firstScenarioEnemy } from '../../../core/project/level';
import { createTimelineSampleScenario } from '../../../ui/timeline/timelineSampleScenario';
import { createScenarioSimulationService } from '../createScenarioSimulationService';
import { gameDataRepository } from '../../../data/gameDataRepository';

function shieldScenario() {
  const scenario = createTimelineSampleScenario();
  firstScenarioEnemy(scenario).enemy = createDefinitionEnemyDocument(
    generatedEnemyDefinitions.find(d => d.id === 'eny-0128-babyents')!,
    90,
    30,
  );
  const track = scenario.tracks[0]!;
  track.operator!.operatorSlug = 'perlica';
  track.weapon = null;
  track.gears = { armor: null, gloves: null, accessory1: null, accessory2: null };
  track.skillCasts = [0, 120, 240].map((frame, index) => ({
    id: `shield-hit-${index}`,
    source: {
      kind: 'operatorSkill',
      skillGroupKey: 'battleSkill',
      skillKey: 'chr_0004_pelica_normal_skill',
      action: 'battleSkill',
    },
    placement: { startFrame: frame },
  }));
  scenario.tracks[1] = scenario.tracks[2] = scenario.tracks[3] = null;
  return scenario;
}

describe('敌人出生次数盾', () => {
  it('原生出生图挂盾、受击扣次数，切面恢复保持一致', () => {
    const scenario = shieldScenario();
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(80);
    const before = session.collectResult().receiptEntries;

    expect(before.some(e => e.event === 'CountShieldUiChanged' && e.data?.current === 2)).toBe(
      true,
    );
    expect(before.some(e => e.event === 'CountShieldUiChanged' && e.data?.current === 1)).toBe(
      true,
    );
    const restored = session.fork(session.runtime.save());
    session.advanceToFrame(330);
    restored.advanceToFrame(330);
    expect(restored.collectResult().receiptEntries).toEqual(session.collectResult().receiptEntries);
    const hits = session.collectResult().receiptEntries.filter(e => e.event === 'DamageApplied');
    expect(hits.filter(e => e.frame < 120).every(e => e.data?.actualDamage === 0)).toBe(true);
    expect(hits.some(e => e.frame >= 240 && Number(e.data?.actualDamage) > 0)).toBe(true);
    expect(
      projectCountShieldTimeline(session.collectResult().receiptEntries, 330).map(s => s.layers),
    ).toEqual([2, 1]);
    expect(
      session
        .collectResult()
        .receiptEntries.some(e => e.event === 'CountShieldUiChanged' && e.data?.current === 0),
    ).toBe(true);
  });
  it('同次战技多段命中只扣一次；晚出生和死亡的敌人有独立显示区间', () => {
    const scenario = shieldScenario();
    const first = firstScenarioEnemy(scenario);
    scenario.level = {
      kind: 'multiEnemies',
      enemies: [
        first,
        {
          id: 'enemy:late',
          name: '晚出生',
          enemy: {
            ...structuredClone(first.enemy),
            lifecycle: { spawnFrame: 20, presenceChanges: [], deathFrame: 70 },
          },
        },
      ],
    };
    const cast = scenario.tracks[0]!.skillCasts[0]!;
    scenario.tracks[0]!.skillCasts = [cast];
    cast.customDefinition = skillFixture({
      key: 'chr_0004_pelica_normal_skill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      timelineBlockFrames: 55,
      scheduledSequences: [0, 10, 30, 40].map(startFrame => ({
        startFrame,
        sequence: { $sequence: 'hit' },
      })),
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
                  target: {
                    kind: 'factionHitBox',
                    owner: { kind: 'owner' },
                    factionTarget: 'anti',
                    checkAlive: true,
                    containsUnmarkable: true,
                    replacePartsWithMainBodies: false,
                  },
                },
              },
              next: null,
            },
          },
          dataNodes: {},
        },
        macros: {},
      },
    });
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(15);
    const branch = session.fork(session.runtime.save());
    session.advanceToFrame(90);
    branch.advanceToFrame(90);
    expect(branch.collectResult().receiptEntries).toEqual(session.collectResult().receiptEntries);
    const entries = session.collectResult().receiptEntries;
    expect(
      entries
        .filter(e => e.event === 'CountShieldUiChanged' && e.targetId === first.id)
        .map(e => e.data?.current),
    ).toEqual([2, 1]);
    expect(
      entries
        .filter(e => e.event === 'CountShieldUiChanged' && e.targetId === 'enemy:late')
        .map(e => e.data?.current),
    ).toEqual([2, 1]);
    const late = projectCountShieldTimeline(entries, 90).filter(s => s.targetId === 'enemy:late');
    expect(late[0]?.startFrame).toBe(20);
    expect(late.at(-1)?.endFrame).toBe(70);
  });
  it('关闭出生次数盾后不施加免伤，不产生次数条', () => {
    const scenario = shieldScenario();
    const config = firstScenarioEnemy(scenario).enemy.birthEffects!;
    config.enabledBuffs = [];
    const session =
      createScenarioSimulationService(gameDataRepository).createCombatSession(scenario);
    session.advanceToFrame(90);
    const entries = session.collectResult().receiptEntries;
    expect(projectCountShieldTimeline(entries, 90)).toEqual([]);
    expect(entries.some(e => e.event === 'DamageApplied' && Number(e.data?.actualDamage) > 0)).toBe(
      true,
    );
  });
});
