import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { parseEnemyTemplateRank } from '../scripts/extractEnemyRankEvidence.ts';
import { auditCandidateEnemyDefinitions } from '../scripts/auditCandidateEnemyDefinitions.ts';
import {
  generateEnemyDefinitions,
  planEnemyDefinitions,
} from '../scripts/generateEnemyDefinitions.ts';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(root => rm(root, { recursive: true, force: true })),
  );
});

describe('enemy data generation', () => {
  it('strictly decodes the proven EnemyTemplateData prefix', () => {
    expect(parseEnemyTemplateRank(enemyRaw('eny_9999_fixture', 2), 'eny_9999_fixture')).toEqual({
      nativeValue: 2,
      rank: 'elite',
      modelKey: 'eny_9999_fixture_postmodel',
      componentCount: 2,
    });
    expect(() =>
      parseEnemyTemplateRank(enemyRaw('eny_9999_fixture', 3), 'eny_9999_fixture'),
    ).toThrow('unknown EnemyRank');
  });

  it('joins native enemy tables, excludes training targets, and labels the compatibility constant', async () => {
    const root = await mkdtemp(join(tmpdir(), 'endaxis-enemy-generation-test-'));
    temporaryRoots.push(root);
    const tables = join(root, 'tables');
    await mkdir(tables);
    await writeJson(join(tables, 'EnemyTemplateDisplayInfoTable.json'), {
      eny_9999_fixture: { templateId: 'eny_9999_fixture', displayType: 2 },
      tatget_001_normal: { templateId: 'tatget_001_normal', displayType: 0 },
    });
    await writeJson(join(tables, 'EnemyTemplateTable.json'), {
      eny_9999_fixture: { templateId: 'eny_9999_fixture' },
    });
    await writeJson(join(tables, 'EnemyTable.json'), {
      eny_9999_fixture: {
        templateId: 'eny_9999_fixture',
        attrTemplateId: 'eny_9999_fixture_attr',
      },
    });
    await writeJson(join(tables, 'EnemyAttributeTemplateTable.json'), {
      eny_9999_fixture_attr: {
        levelDependentAttributes: [
          {
            attrs: [
              { attrType: 0, attrValue: 1 },
              { attrType: 1, attrValue: 1000 },
              { attrType: 3, attrValue: 120 },
            ],
          },
        ],
        levelIndependentAttributes: {
          attrs: [
            { attrType: 20, attrValue: 160 },
            { attrType: 21, attrValue: 7 },
            { attrType: 27, attrValue: 1.25 },
          ],
        },
        poiseKnotPctList: [0.5],
        poiseKnotBuffList: ['buff_common_mini_poise_break'],
        physicalResistance: 1,
        fireResistance: 2,
        crystResistance: 3,
        pulseResistance: 4,
        naturalResistance: 5,
        initialSuperArmor: 20,
        breakingAttackedAtbObtain: 35,
      },
    });
    const ranks = join(root, 'ranks.json');
    await writeJson(ranks, {
      enemies: { eny_9999_fixture: { rank: 'elite', iconAssetPath: 'MonsterIcon/eny_9999_fixture.png' } },
    });
    const defaults = join(root, 'defaults.json');
    await writeJson(defaults, {
      knotBreakDurationSeconds: 2,
      evidence: 'test compatibility evidence',
    });
    const selectionCategories = join(root, 'selection-categories.json');
    await writeJson(selectionCategories, {
      categories: [{ id: 'wildlife', enemyIds: ['eny_9999_fixture'] }],
      uncategorizedEnemyIds: [],
      hiddenEnemyIds: [],
    });

    const plan = await planEnemyDefinitions(tables, ranks, defaults, selectionCategories);
    expect(plan.excludedDisplayIds).toEqual(['tatget_001_normal']);
    expect(plan.compatibilityDefaults.evidence).toBe('test compatibility evidence');
    expect(plan.selection.categoryByEnemyId).toEqual({ 'eny-9999-fixture': 'wildlife' });
    await expect(
      generateEnemyDefinitions({
        tablesDirectory: tables,
        rankEvidence: ranks,
        runtimeDefaults: defaults,
        selectionCategories,
        outputDirectory: join(root, 'generated'),
        check: false,
      }),
    ).rejects.toThrow('missing HP at level 20');
    expect(plan.definitions).toEqual([
      expect.objectContaining({
        id: 'eny-9999-fixture',
        gameId: 'eny_9999_fixture',
        tier: 'leader',
        rank: 'elite',
        levelHp: [{ level: 1, hp: 1000 }],
        defense: 120,
        resistances: { physical: 1, heat: 2, cryo: 3, electric: 4, nature: 5 },
        stagger: {
          maximum: 160,
          knotThresholds: [0.5],
          knotBreakDurationSeconds: 2,
          brokenDurationSeconds: 7,
          finisherSpRecovery: 35,
        },
      }),
    ]);
    await expect(
      auditCandidateEnemyDefinitions({
        tablesDirectory: tables,
        rankEvidence: ranks,
        runtimeDefaults: defaults,
        selectionCategories,
      }),
    ).resolves.toMatchObject({
      candidateCount: 1,
      definitionIds: ['eny-9999-fixture'],
      fullLevelNodeCount: 1,
      evidence: 'current source tables plus same-run EnemyTemplateData rank extraction',
    });

    await writeJson(selectionCategories, {
      categories: [{ id: 'wildlife', enemyIds: [] }],
      uncategorizedEnemyIds: [],
      hiddenEnemyIds: [],
    });
    await expect(
      planEnemyDefinitions(tables, ranks, defaults, selectionCategories),
    ).rejects.toThrow('unclassified enemies eny_9999_fixture');
  });
});

function enemyRaw(gameId: string, rank: number): Uint8Array {
  const chunks: Buffer[] = [Buffer.alloc(12), Buffer.from([1]), Buffer.alloc(3), Buffer.alloc(12)];
  chunks.push(unityString(`data_${gameId}`));
  const rootRid = (5n << 32n) | 1n;
  chunks.push(i64(rootRid), i32(2), i32(3), i64(rootRid));
  chunks.push(unityString('EnemyTemplateData'));
  chunks.push(unityString('Beyond.Gameplay'));
  chunks.push(unityString('Gameplay.Beyond'));
  chunks.push(i32(2), i64((5n << 32n) | 2n), i64((5n << 32n) | 3n));
  chunks.push(unityString(`${gameId}_postmodel`), i32(rank));
  return Buffer.concat(chunks);
}

function unityString(value: string): Buffer {
  const encoded = Buffer.from(value, 'utf8');
  const padding = (4 - (encoded.length % 4)) % 4;
  return Buffer.concat([i32(encoded.length), encoded, Buffer.alloc(padding)]);
}

function i32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(value);
  return buffer;
}

function i64(value: bigint): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64LE(value);
  return buffer;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8');
}
