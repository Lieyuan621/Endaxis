import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileOperatorPassiveUiPrefabComponent } from '../src/domains/operator/passiveUiPrefab.ts';
import { projectOperatorPassiveUiPrefabSnapshots } from '../src/source/operatorPassiveUiPrefabSnapshots.ts';
import { compileOperatorProductPassiveUi } from '../src/domains/operator/passiveUi.ts';

it('compiles configured entity presence without a dedicated appearance or Buff counter', () => {
  const config = {
    kind: 'abilityEntityCount',
    abilityEntityId: 'crystal',
    icon: '/crystal.webp',
    nameKey: 'entities.crystal',
  };
  expect(
    compileOperatorProductPassiveUi(config, { crystal: { lifetime: { kind: 'infinite' } } }),
  ).toEqual(config);
  expect(() => compileOperatorProductPassiveUi(config, {})).toThrow('unknown ability entity');
  expect(() => compileOperatorProductPassiveUi({ ...config, maximumUses: 2 }, {})).toThrow(
    'unknown component field',
  );
});

describe('operator passive UI prefab component projection', () => {
  it('derives numeric bounds from the dedicated component fields', () => {
    expect(
      compileOperatorPassiveUiPrefabComponent(
        {
          componentType: 'UICharPassiveMultiStates',
          fullCount: 2,
          stateCounts: [0, 1, 2],
        },
        'fixture.tangtang',
      ),
    ).toEqual({ kind: 'numeric', appearance: 'tangtangDroplets', maximum: 2 });

    expect(
      compileOperatorPassiveUiPrefabComponent(
        { componentType: 'UICharPassiveCounter', layerCount: 4, activeCount: 4 },
        'fixture.laevat',
      ),
    ).toEqual({
      kind: 'numeric',
      appearance: 'laevatainCounter',
      maximum: 4,
      activeAt: 4,
    });
  });

  it('keeps Liino bound to the two native Buff identities', () => {
    expect(
      compileOperatorPassiveUiPrefabComponent(
        {
          componentType: 'UICharPassiveLiino',
          normalBuffId: 'buff_normal_music',
          ultimateBuffId: 'buff_ultimate_music',
        },
        'fixture.liino',
      ),
    ).toEqual({
      kind: 'buffProgress',
      appearance: 'liinoMusic',
      normalBuffId: 'buff_normal_music',
      ultimateBuffId: 'buff_ultimate_music',
    });
  });

  it('keeps Typhoea bound to the three native Buff counters and prefab slot counts', () => {
    expect(
      compileOperatorPassiveUiPrefabComponent(
        {
          componentType: 'UICharPassiveTyphoea',
          arrowBuffId: 'buff_typhoea_reserve_arrow',
          battleArrowBuffId: 'buff_typhoea_battle_arrow',
          pointBuffId: 'buff_typhoea_arrow_point',
          arrowCount: 4,
          pointCount: 8,
        },
        'fixture.typhoea',
      ),
    ).toEqual({
      kind: 'buffCounters',
      appearance: 'typhoeaArrows',
      reserveArrowBuffId: 'buff_typhoea_reserve_arrow',
      battleArrowBuffId: 'buff_typhoea_battle_arrow',
      pointBuffId: 'buff_typhoea_arrow_point',
      maximumArrows: 4,
      maximumPoints: 8,
    });
  });

  it('rejects malformed state bounds rather than guessing a visual state', () => {
    expect(() =>
      compileOperatorPassiveUiPrefabComponent(
        {
          componentType: 'UICharPassiveLizhiyan',
          fullCount: 3,
          stateCounts: [0, 2, 1, 3],
        },
        'fixture.lizhiyan',
      ),
    ).toThrow('strictly increasing from 0 to 3');
  });

  it('recognizes the narrow native component directly from VFS object snapshots', () => {
    const root = mkdtempSync(join(tmpdir(), 'endaxis-passive-ui-'));
    try {
      const gameObjects = join(root, 'GameObject', 'CAB-fixture');
      const behaviours = join(root, 'MonoBehaviour', 'CAB-fixture');
      mkdirSync(gameObjects, { recursive: true });
      mkdirSync(behaviours, { recursive: true });
      writeFileSync(
        join(gameObjects, 'root.json'),
        JSON.stringify({
          m_Name: 'OverlayInfoNodeTangTang',
          m_Transform: { m_Father: { m_PathID: 0 } },
        }),
      );
      writeFileSync(
        join(behaviours, 'component.json'),
        JSON.stringify({
          $animestudio: { name: 'UICharPassiveMultiStates' },
          fullCount: 2,
          states: [{ count: 0 }, { count: 1 }, { count: 2 }],
        }),
      );

      expect(projectOperatorPassiveUiPrefabSnapshots(root)).toEqual([
        'OverlayInfoNodeTangTang',
        {
          componentType: 'UICharPassiveMultiStates',
          fullCount: 2,
          stateCounts: [0, 1, 2],
        },
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
