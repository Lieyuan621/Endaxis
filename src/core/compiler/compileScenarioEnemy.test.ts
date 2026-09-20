import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../project/createProject';
import { compileScenarioEnemy } from './compileScenarioEnemy';

describe('compileScenarioEnemy', () => {
  it('只从项目实例编译敌人运行时输入', () => {
    const scenario = createEmptyScenario('scenario:enemy', '敌人编译样本');
    scenario.enemy.source = { kind: 'prefab', enemyId: 'enemy:sample', level: 80 };
    scenario.enemy.rank = 'elite';
    scenario.enemy.editable = {
      hp: 123456,
      defense: 245,
      superArmor: 3,
      finisherMultiplier: 1.75,
      resistances: { physical: 10, heat: -5 },
      stagger: {
        maximum: 420,
        knotThresholds: [0.33, 0.66],
        knotBreakDurationFrames: 45,
        brokenDurationFrames: 270,
        finisherSpRecovery: 88,
      },
    };

    const result = compileScenarioEnemy(scenario.enemy);

    expect(result).toMatchObject({
      source: { kind: 'prefab', enemyId: 'enemy:sample', level: 80 },
      rank: 'elite',
      health: 123456,
      superArmor: 3,
      defenderAttributes: {
        defense: 245,
        shelterDamageMultiplier: 0,
        breakingAttackDamageTakenMultiplier: 1.75,
        resistances: {
          physical: { percent: 10, damageTakenMultiplier: 1 },
          heat: { percent: -5, damageTakenMultiplier: 1 },
          ether: { percent: 0, damageTakenMultiplier: 1 },
        },
      },
      stagger: {
        maximum: 420,
        knotThresholds: [0.33, 0.66],
        knotBreakDurationFrames: 45,
        brokenDurationFrames: 270,
        finisherSpRecovery: 88,
      },
    });
  });

  it('拒绝运行时无法解释的抗性身份', () => {
    const scenario = createEmptyScenario('scenario:enemy', '敌人编译样本');
    scenario.enemy.editable.resistances.unknown = 10;

    expect(() => compileScenarioEnemy(scenario.enemy)).toThrow(
      "enemy resistance 'unknown' is not supported",
    );
  });

  it('拒绝无序或越界的失衡节点阈值', () => {
    const scenario = createEmptyScenario('scenario:enemy', '敌人编译样本');
    scenario.enemy.editable.stagger.knotThresholds = [0.5, 0.5];

    expect(() => compileScenarioEnemy(scenario.enemy)).toThrow(
      'enemy stagger knot thresholds must increase and stay between 0 and 1',
    );
  });
});
