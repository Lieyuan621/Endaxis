import { expect, it } from 'vitest';
import { projectOpenFailureMessage } from './projectOpenFailureMessage';

it('explains invalid JSON without leaking browser-specific parse text into the UI', () => {
  expect(
    projectOpenFailureMessage({
      ok: false,
      kind: 'parse-failed',
      cause: {
        ok: false,
        kind: 'invalid-json',
        message: 'Expected property name at position 1',
      },
    }),
  ).toBe('项目文件不是有效的 JSON，无法加载。当前项目未改变。');
});
it('preserves actionable structural paths and version information', () => {
  expect(
    projectOpenFailureMessage({
      ok: false,
      kind: 'parse-failed',
      cause: {
        ok: false,
        kind: 'invalid-document',
        issues: [{ path: '$.scenarios', message: '不能为空' }],
      },
    }),
  ).toBe('项目文档校验失败：$.scenarios 不能为空');
  expect(
    projectOpenFailureMessage({
      ok: false,
      kind: 'parse-failed',
      cause: {
        ok: false,
        kind: 'unsupported-version',
        schemaVersion: 999,
      },
    }),
  ).toBe('不支持项目版本 999');
});
