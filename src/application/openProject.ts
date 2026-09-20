/**
 * 存档进入应用状态前的统一打开边界。
 * 这里负责组合格式解析与当前游戏定义引用校验。
 */
import type { GameDataRepository } from '../core/game-data/gameDataRepository';
import type { EndaxisProjectDocument } from '../core/project/schema';
import { parseProjectDocument, type ParseProjectResult } from '../core/project/serialization';
import { validateProjectWithGameData } from '../core/project/definitionValidation';
import type { ValidationIssue } from '../core/project/validation';

type ParseProjectFailure = Exclude<ParseProjectResult, { ok: true }>;

/** 项目打开入口所需的环境依赖。 */
export interface OpenProjectOptions {
  gameDataRepository: GameDataRepository;
}

/**
 * 项目打开的完整结果。
 * 只有 `opened` 可以直接进入编辑会话；其余结果都要求应用层显式处理。
 */
export type OpenProjectResult =
  | {
      ok: true;
      kind: 'opened';
      project: EndaxisProjectDocument;
    }
  | {
      ok: false;
      kind: 'parse-failed';
      cause: ParseProjectFailure;
    }
  | {
      ok: false;
      kind: 'definition-validation-failed';
      project: EndaxisProjectDocument;
      issues: readonly ValidationIssue[];
    };

/**
 * 打开不可信项目输入，并用当前游戏数据校验全部定义引用。
 */
export function openProject(
  input: string | unknown,
  options: OpenProjectOptions,
): OpenProjectResult {
  const parsed = parseProjectDocument(input);
  if (!parsed.ok) return { ok: false, kind: 'parse-failed', cause: parsed };

  const project = parsed.value;
  const definitionValidation = validateProjectWithGameData(project, options.gameDataRepository);
  if (!definitionValidation.ok) {
    return {
      ok: false,
      kind: 'definition-validation-failed',
      project,
      issues: definitionValidation.issues,
    };
  }

  return {
    ok: true,
    kind: 'opened',
    project,
  };
}
