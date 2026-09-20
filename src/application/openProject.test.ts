import { describe, expect, it, vi } from 'vitest';
import type { GameDataRepository } from '../core/game-data/gameDataRepository';
import { createEmptyProject } from '../core/project/createProject';
import { serializeProjectDocument } from '../core/project/serialization';
import { openProject } from './openProject';

function createRepository(revision = 'definitions:current'): GameDataRepository {
  return {
    revision,
    getOperator: () => null,
    getWeapon: () => null,
    getGear: () => null,
    getGearSet: () => null,
    getEnemy: () => null,
    getMechanic: () => null,
    getConsumable: () => null,
    getConsumables: () => [],
  };
}

function createProject() {
  return createEmptyProject({ createdWith: 'test', createdAt: '2026-01-01T00:00:00.000Z' });
}

describe('openProject', () => {
  it('returns parse failure before accessing the game data repository', () => {
    const getOperator = vi.fn(() => {
      throw new Error('repository must not be accessed');
    });
    const result = openProject('{', {
      gameDataRepository: { ...createRepository(), getOperator },
    });

    expect(result).toEqual({
      ok: false,
      kind: 'parse-failed',
      cause: expect.objectContaining({ ok: false, kind: 'invalid-json' }),
    });
    expect(getOperator).not.toHaveBeenCalled();
  });

  it('opens a structurally and definition-valid project without changing its creation time', () => {
    const project = createProject();

    expect(
      openProject(serializeProjectDocument(project), {
        gameDataRepository: createRepository(),
      }),
    ).toEqual({
      ok: true,
      kind: 'opened',
      project,
    });
  });

  it('reports definition reference issues', () => {
    const project = createProject();
    project.scenarios[0]!.tracks[0] = {
      id: 'track:0',
      operator: null,
      weapon: {
        weaponSlug: 'missing-weapon',
        level: 90,
        tuned: true,
        potential: 0,
        traitLevels: [1, 1, 1],
      },
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [],
    };

    expect(openProject(project, { gameDataRepository: createRepository() })).toEqual({
      ok: false,
      kind: 'definition-validation-failed',
      project,
      issues: [
        {
          path: '$.scenarios[0].tracks[0].weapon.weaponSlug',
          message: 'unknown weapon',
        },
      ],
    });
  });

  it('reports references missing from the current library', () => {
    const project = createProject();
    project.scenarios[0]!.enemy.source = {
      kind: 'prefab',
      enemyId: 'enemy:removed',
      level: 90,
    };

    const result = openProject(project, { gameDataRepository: createRepository() });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        kind: 'definition-validation-failed',
        issues: [
          {
            path: '$.scenarios[0].enemy.source.enemyId',
            message: 'unknown enemy',
          },
        ],
      }),
    );
  });
});
