import {
  SKILL_LEVEL_SOURCES,
  type SkillLevelSource,
  type SkillType,
} from '../../../../../packages/game-data-contract/src/primitives.ts';
import type { SkillGroupDefinition } from '../../../../../packages/game-data-contract/src/skills.ts';
export type { SkillType as OperatorActiveSkillTypeSource } from '../../../../../packages/game-data-contract/src/primitives.ts';

import {
  compileActiveSkillRequestBatch,
  type CompiledActiveSkillDefinitionSource,
} from '../../compiler/skills/activeSkillBatch.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
  type SourceRecord,
} from '../../source/primitives.ts';

const ENTRY_REQUIRED_FIELDS = new Set(['skillType', 'levelSource', 'source']);
const ENTRY_OPTIONAL_FIELDS = ['compile', 'enhancementStateBuffId'] as const;

/** 主动技能支持列表和遍历顺序；类型身份归契约，不能把排序差异误当成新枚举。 */
export const OPERATOR_ACTIVE_SKILL_TYPES = [
  'basicAttack',
  'finisher',
  'plungingAttack',
  'battleSkill',
  'comboSkill',
  'ultimate',
] as const satisfies readonly SkillType[];

/** 技能身份从原生 SkillData 文件名取得；compile 只描述额外的执行路由。 */
export type OperatorActiveSkillEntrySource = Readonly<
  Pick<SkillGroupDefinition, 'key' | 'skillType' | 'levelSource'>
> & {
  readonly sourcePath: string;
  readonly sourceFile: string;
  readonly projectionConfig: SourceRecord | null;
  readonly enhancementStateBuffId?: string;
};

export interface CompiledOperatorActiveSkillEntrySource extends OperatorActiveSkillEntrySource {
  readonly definition: CompiledActiveSkillDefinitionSource;
}

export interface OperatorActiveSkillCompilationSource {
  readonly entries: readonly CompiledOperatorActiveSkillEntrySource[];
  readonly definitions: readonly CompiledActiveSkillDefinitionSource[];
}

export function parseOperatorActiveSkillEntries(
  value: unknown,
  sourcePath: string,
): OperatorActiveSkillEntrySource[] {
  const entries = requireArray(value, sourcePath).map((raw, index) => {
    const path = `${sourcePath}[${index}]`;
    const row = requireRecord(raw, path);
    requireExactFields(
      row,
      new Set([
        ...ENTRY_REQUIRED_FIELDS,
        ...ENTRY_OPTIONAL_FIELDS.filter(field => row[field] !== undefined),
      ]),
      path,
    );
    const sourceFile = requireNonEmptyString(row.source, `${path}.source`);
    if (!/^[A-Za-z0-9._-]+\.json$/.test(sourceFile)) {
      throw new Error(`${path}.source: expected a safe JSON file name`);
    }
    const skillTypeName = requireNonEmptyString(row.skillType, `${path}.skillType`);
    const skillType = OPERATOR_ACTIVE_SKILL_TYPES.find(type => type === skillTypeName);
    if (skillType === undefined) {
      throw new Error(
        `${path}.skillType: unsupported operator skill type ${JSON.stringify(skillTypeName)}`,
      );
    }
    const levelSourceName = requireNonEmptyString(row.levelSource, `${path}.levelSource`);
    const levelSource = SKILL_LEVEL_SOURCES.find(source => source === levelSourceName);
    if (levelSource === undefined) {
      throw new Error(
        `${path}.levelSource: unsupported level source ${JSON.stringify(levelSourceName)}`,
      );
    }
    return {
      sourcePath: path,
      key: sourceFile.slice(0, -'.json'.length),
      skillType,
      levelSource: levelSource satisfies SkillLevelSource,
      sourceFile,
      projectionConfig:
        row.compile === undefined ? null : requireRecord(row.compile, `${path}.compile`),
      ...(row.enhancementStateBuffId === undefined
        ? {}
        : {
            enhancementStateBuffId: requireNonEmptyString(
              row.enhancementStateBuffId,
              `${path}.enhancementStateBuffId`,
            ),
          }),
    };
  });
  requireUnique(entries, entry => entry.key, `${sourcePath}.key`);
  requireUnique(entries, entry => entry.sourceFile, `${sourcePath}.source`);
  return entries;
}

/**
 * 校验 SkillData 文件名与文件内 skillId 相同，再进入公共主动技能批量编译入口。
 */
export function compileOperatorActiveSkills(
  manifestValue: unknown,
  skillDataBySourceFileValue: unknown,
  skillPatchTableValue: unknown,
  sourcePath: string,
): OperatorActiveSkillCompilationSource {
  const entries = parseOperatorActiveSkillEntries(manifestValue, sourcePath);
  const files = requireRecord(skillDataBySourceFileValue, 'SkillDataFiles');
  const skillDataById: Record<string, unknown> = {};
  const requests = entries.map(entry => {
    if (!(entry.sourceFile in files)) {
      throw new Error(`${entry.sourcePath}.source: missing SkillData file ${entry.sourceFile}`);
    }
    const raw = files[entry.sourceFile];
    const root = requireRecord(raw, entry.sourceFile);
    const skillId = requireNonEmptyString(root.skillId, `${entry.sourceFile}.skillId`);
    if (skillId !== entry.key) {
      throw new Error(`${entry.sourcePath}.source: file name does not match SkillData.skillId`);
    }
    if (skillId in skillDataById) {
      throw new Error(
        `${entry.sourcePath}.source: duplicate native skillId ${JSON.stringify(skillId)}`,
      );
    }
    skillDataById[skillId] = raw;
    return { sourcePath: `${entry.sourcePath}.source`, skillId };
  });
  const batch = compileActiveSkillRequestBatch(requests, skillDataById, skillPatchTableValue);
  const definitionById = new Map(batch.definitions.map(item => [item.skillId, item]));
  return {
    entries: entries.map((entry, index) => {
      const skillId = requests[index]!.skillId;
      return { ...entry, definition: definitionById.get(skillId)! };
    }),
    definitions: batch.definitions,
  };
}

function requireUnique<T>(values: readonly T[], keyOf: (value: T) => string, path: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    const key = keyOf(value);
    if (seen.has(key)) throw new Error(`${path}: duplicate value ${JSON.stringify(key)}`);
    seen.add(key);
  }
}
