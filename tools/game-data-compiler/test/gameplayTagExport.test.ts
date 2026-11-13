import { expect, it } from 'vitest';
import { inspectTagObject } from '../scripts/exportGameplayTagConfigSet.ts';
const row = {
  asset: {
    Container: 'assets/beyond/dynamicassets/gamedata/gameplayconfig/gameplaytagconfigset.asset',
  },
  text: 'fixture',
  sourceFile: 'CAB-fixture',
  pathId: '9007199254740993',
  consumedByteCount: 16,
  serializedByteCount: 16,
  dependencies: ['CAB-dependent'],
};
it('retains Int64 object identity and rejects incomplete objects or unrelated containers', () => {
  expect(inspectTagObject(row).pathId).toBe('9007199254740993');
  expect(() => inspectTagObject({ ...row, consumedByteCount: 8 })).toThrow('incomplete');
  expect(() => inspectTagObject({ ...row, pathId: '9223372036854775808' })).toThrow('Int64');
  expect(() => inspectTagObject({ ...row, asset: { Container: 'unrelated.asset' } })).toThrow(
    'path',
  );
});
