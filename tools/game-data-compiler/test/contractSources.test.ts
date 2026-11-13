import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { it, expect } from 'vitest';
import { prepareContractSources, verifyContractSources } from '../scripts/contractSources.ts';
it('freezes contract supplements, localizes unresolved IDs and retains incomplete mappings', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-contract-source-'));
  try {
    const tables = path.join(root, 'tables'),
      input = path.join(root, 'input'),
      output = path.join(root, 'output');
    await fs.mkdir(tables);
    await fs.mkdir(input);
    const write = async (dir: string, name: string, value: unknown) =>
      fs.writeFile(path.join(dir, name + '.json'), JSON.stringify(value));
    const tags = Object.fromEntries(
      [1, 2].map(id => [
        id,
        {
          tagId: id,
          name: { id: String(id * 10), text: '' },
          desc: { id: String(id * 10 + 1), text: '' },
          icon: 'icon',
          romanNumSuffix: '',
          score: 1,
        },
      ]),
    );
    await write(tables, 'CcTagTable', tags);
    await write(
      tables,
      'ContingencyContractTable',
      Object.fromEntries(
        [1, 2].map(id => [
          'game' + id,
          {
            activityId: 'activity',
            contractGroupMap: {
              1: {
                contractMap: {
                  1: {
                    tagId: id,
                    canPreview: false,
                    conflictId: '',
                    groupId: 1,
                    keyId: '',
                    lockIds: [],
                    unlockActivityStage: '',
                    unlockScore: 0,
                  },
                },
              },
            },
          },
        ]),
      ),
    );
    await write(tables, 'I18nTextTable_CN', {});
    await write(tables, 'I18nTextTable_EN', {});
    await write(input, 'game1', {
      schemaVersion: 1,
      gameId: 'game1',
      tags: {
        1: {
          tagTerms: [{ termType: 2, buffId: 'global_buff_test', blackboard: [] }],
          text: { name: ['甲', 'A'], desc: ['说明', 'Description'] },
        },
      },
    });
    await write(input, 'game2', {
      schemaVersion: 1,
      gameId: 'game2',
      tags: {
        2: {
          serverBlackboards: [{ value: { floatValue: 0, strValue: '', isDynamic: false } }],
          text: { name: ['乙', 'B'], desc: ['说明二', 'Description B'] },
        },
      },
    });
    const result = await prepareContractSources(tables, output, 'https://unused.invalid', input);
    expect(result?.globalBuffIds).toEqual(['global_buff_test']);
    expect(result?.periods).toHaveLength(2);
    expect(
      JSON.parse(await fs.readFile(path.join(result!.localeRoot, 'I18nTextTable_CN.json'), 'utf8'))[
        '20'
      ],
    ).toBe('乙');
    expect(
      JSON.parse(await fs.readFile(path.join(tables, 'CcTagTable.json'), 'utf8'))['1'],
    ).not.toHaveProperty('tagTerms');
    expect(
      JSON.parse(await fs.readFile(path.join(output, 'game2', 'CcTagTable.json'), 'utf8'))['2'],
    ).not.toHaveProperty('tagTerms');
    await expect(verifyContractSources(output)).resolves.toEqual({ verified: 2 });
    await fs.writeFile(path.join(output, 'game1.json'), '{}');
    await expect(verifyContractSources(output)).rejects.toThrow('changed');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
