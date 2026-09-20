import type { OpenProjectResult } from '../../application/openProject';

/** User-facing load failures, distinct from browser-specific parser diagnostics. */
export function projectOpenFailureMessage(
  result: Exclude<OpenProjectResult, { ok: true }>,
): string {
  if (result.kind === 'parse-failed') {
    if (result.cause.kind === 'invalid-json') {
      return '项目文件不是有效的 JSON，无法加载。当前项目未改变。';
    }
    if (result.cause.kind === 'invalid-document') {
      const first = result.cause.issues[0];
      return first === undefined
        ? '项目文档校验失败'
        : `项目文档校验失败：${first.path} ${first.message}`;
    }
    if (result.cause.kind === 'unsupported-version')
      return `不支持项目版本 ${result.cause.schemaVersion}`;
    return result.cause.message;
  }
  if (result.kind === 'definition-validation-failed') {
    const first = result.issues[0];
    return first === undefined
      ? '项目定义引用校验失败'
      : `项目定义引用校验失败：${first.path} ${first.message}`;
  }
  return '无法打开项目';
}
