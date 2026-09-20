import { describe, expect, it, vi } from 'vitest';
import { createEmptyProject } from '../project/createProject';
import { validateProjectEnemyDefinitionReferences } from './enemyDefinitionValidation';
import { getEnemyHpAtLevel, type EnemyDefinition } from './enemyDefinition';

const enemy: EnemyDefinition = {
  id: 'enemy-1',
  tier: 'normal',
  rank: 'mob',
  levelHp: [100, 200, 400, 600, 800, 1000],
  defense: 20,
  resistances: { physical: 0, heat: 0, cryo: 0, electric: 0, nature: 0 },
  superArmor: 0,
  stagger: {
    maximum: 100,
    knotThresholds: [0.5],
    knotBreakDurationSeconds: 2,
    brokenDurationSeconds: 10,
    finisherSpRecovery: 100,
  },
  finisherMultiplier: 1,
};

describe('enemyDefinition', () => {
  it('only resolves HP nodes explicitly present in the index', () => {
    expect(getEnemyHpAtLevel(enemy, 90)).toBe(1000);
    expect(getEnemyHpAtLevel(enemy, 20)).toBe(200);
    expect(getEnemyHpAtLevel(enemy, 45)).toBeNull();
  });

  it('does not query the index for a custom enemy instance', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    const getEnemy = vi.fn(() => null);

    expect(validateProjectEnemyDefinitionReferences(project, { getEnemy })).toEqual([]);
    expect(getEnemy).not.toHaveBeenCalled();
  });

  it('reports missing and mismatched index identities', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    project.scenarios[0]!.enemy.source = { kind: 'prefab', enemyId: 'enemy-1', level: 90 };

    expect(validateProjectEnemyDefinitionReferences(project, { getEnemy: () => null })).toEqual([
      { path: '$.scenarios[0].enemy.source.enemyId', message: 'unknown enemy' },
    ]);
    expect(
      validateProjectEnemyDefinitionReferences(project, {
        getEnemy: () => ({ ...enemy, id: 'enemy-2' }),
      }),
    ).toEqual([
      {
        path: '$.scenarios[0].enemy.source.enemyId',
        message: 'enemy definition identity mismatch',
      },
    ]);
  });
});
