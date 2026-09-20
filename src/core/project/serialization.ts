/**
 * 存档与文本/对象输入之间的稳定 I/O 边界。
 * 解析时只识别当前项目格式与旧版异构格式；序列化只接受合法的当前项目。
 */
import type { EndaxisProjectDocument, JsonObject } from './schema';
import { PROJECT_SCHEMA_VERSION } from './schema';
import { validateProjectDocument, type ValidationIssue, type ValidationResult } from './validation';
import type { GameDataRepository } from '../game-data/gameDataRepository';
import { validateProjectWithGameData } from './definitionValidation';

/** 只做结构识别的输入类别，不代表文档已经通过完整校验。 */
export type ProjectInputKind = 'current' | 'legacy' | 'unsupported';

/** 项目输入的轻量检查结果，供加载流程选择校验或迁移路径。 */
export interface ProjectInspection {
  kind: ProjectInputKind;
  schemaVersion?: number;
}

/** 项目解析结果的完整分类；调用方必须处理每一种失败类型。 */
export type ParseProjectResult =
  | { ok: true; value: EndaxisProjectDocument }
  | { ok: false; kind: 'invalid-json'; message: string }
  | { ok: false; kind: 'legacy'; message: string }
  | { ok: false; kind: 'unsupported-version'; schemaVersion: number }
  | { ok: false; kind: 'invalid-document'; issues: ValidationIssue[] };

export interface ParseProjectOptions {
  /** 提供后，加载流程还会校验 build 与机制的版本化定义引用。 */
  gameDataRepository?: GameDataRepository;
}

function validateLoadedProject(value: unknown, options: ParseProjectOptions): ValidationResult {
  return options.gameDataRepository === undefined
    ? validateProjectDocument(value)
    : validateProjectWithGameData(value, options.gameDataRepository);
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function inspectProjectInput(value: unknown): ProjectInspection {
  if (!isObject(value)) return { kind: 'unsupported' };
  if (typeof value.schemaVersion === 'number') {
    return {
      kind: value.schemaVersion === PROJECT_SCHEMA_VERSION ? 'current' : 'unsupported',
      schemaVersion: value.schemaVersion,
    };
  }
  if (Array.isArray(value.scenarioList) || value.version === '1.0.0') return { kind: 'legacy' };
  return { kind: 'unsupported' };
}

export function parseProjectDocument(
  input: string | unknown,
  options: ParseProjectOptions = {},
): ParseProjectResult {
  let value: unknown = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch (error) {
      return {
        ok: false,
        kind: 'invalid-json',
        message: error instanceof Error ? error.message : 'invalid JSON',
      };
    }
  }

  const inspection = inspectProjectInput(value);
  if (inspection.kind === 'legacy') {
    return {
      ok: false,
      kind: 'legacy',
      message: '检测到旧版存档，请使用旧轴转换入口',
    };
  }
  if (inspection.kind === 'unsupported' && inspection.schemaVersion !== undefined) {
    return {
      ok: false,
      kind: 'unsupported-version',
      schemaVersion: inspection.schemaVersion,
    };
  }

  const validation = validateLoadedProject(value, options);
  if (!validation.ok) return { ok: false, kind: 'invalid-document', issues: validation.issues };
  return validation;
}

export function serializeProjectDocument(project: EndaxisProjectDocument, pretty = false): string {
  const validation = validateProjectDocument(project);
  if (!validation.ok) {
    const summary = validation.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n');
    throw new Error(`cannot serialize invalid project document:\n${summary}`);
  }
  return JSON.stringify(project, null, pretty ? 2 : undefined);
}
