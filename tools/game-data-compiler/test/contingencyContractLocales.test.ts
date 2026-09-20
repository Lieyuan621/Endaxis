import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { generateContingencyContractLocales } from '../scripts/generateContingencyContractLocales.ts';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true });
});

it('preserves int64 text identities, writes separate locales, and detects stale output', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'endaxis-cc-locales-'));
  roots.push(root);
  const nameId = '9007199254740993';
  const descriptionId = '-9007199254740993';
  const tag = {
    tagId: 1,
    name: { id: nameId, text: '' },
    desc: { id: descriptionId, text: '' },
    icon: 'icon_fixture',
    romanNumSuffix: 'Ⅰ',
    score: 1,
    tagTerms: [{ termType: 2, buffId: 'global_buff_fixture', blackboard: [] }],
  };
  await fs.writeFile(
    path.join(root, 'CcTagTable.json'),
    JSON.stringify({ 1: tag })
      .replaceAll('"' + nameId + '"', nameId)
      .replaceAll('"' + descriptionId + '"', descriptionId),
  );
  await fs.writeFile(
    path.join(root, 'ContingencyContractTable.json'),
    JSON.stringify({
      fixture: {
        activityId: 'activity',
        contractGroupMap: {
          1: {
            contractMap: {
              1: {
                tagId: 1,
                groupId: 1,
                keyId: '',
                lockIds: [],
                unlockScore: 0,
                unlockActivityStage: '',
                conflictId: '',
                canPreview: false,
              },
            },
          },
        },
      },
    }),
  );
  for (const locale of ['CN', 'EN'])
    await fs.writeFile(
      path.join(root, `I18nTextTable_${locale}.json`),
      JSON.stringify({ [nameId]: `${locale} name`, [descriptionId]: `${locale} description` }),
    );
  const args = { tableRoot: root, output: path.join(root, 'locales'), check: false };
  expect((await generateContingencyContractLocales(args)).globalBuffIds).toEqual([
    'global_buff_fixture',
  ]);
  const target = path.join(args.output, 'zh/contingency-contracts.json');
  expect(JSON.parse(await fs.readFile(target, 'utf8'))).toEqual({
    1: { name: 'CN name', description: 'CN description' },
  });
  await generateContingencyContractLocales({ ...args, check: true });
  await fs.writeFile(target, '{}');
  await expect(generateContingencyContractLocales({ ...args, check: true })).rejects.toThrow(
    'stale',
  );
  await fs.writeFile(path.join(root, 'I18nTextTable_CN.json'), '{}');
  await expect(generateContingencyContractLocales(args)).rejects.toThrow('missing');
});
