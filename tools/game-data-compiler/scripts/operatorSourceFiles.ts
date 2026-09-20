import fs from 'node:fs';
import path from 'node:path';
import { parseGameplayTagConfigDumpSource } from '../src/source/gameplayTagConfigDump.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';

export interface OperatorSourceFileArguments {
  readonly manifest: string;
  readonly skillData: string;
  readonly buffData: string;
  readonly tables: string;
  readonly projectileData?: string;
  readonly abilityEntityData?: string;
  readonly gameplayTagDump?: string;
  readonly gameplayTagCatalog?: string;
}

/** 两个 Operator 审计命令共用同一套文件身份与目录读取规则。 */
export function parseOperatorSourceFileArguments(
  values: readonly string[],
  includeUnityTemplates: boolean,
): OperatorSourceFileArguments {
  const result = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const name = values[index];
    const value = values[index + 1];
    if (!name?.startsWith('--') || value === undefined) {
      throw new Error('expected paired --name <path> arguments');
    }
    result.set(name, value);
  }
  const base = {
    manifest: requiredArgument(result, '--manifest'),
    skillData: requiredArgument(result, '--skill-data'),
    buffData: requiredArgument(result, '--buff-data'),
    tables: requiredArgument(result, '--tables'),
  };
  if (result.has('--gameplay-tag-catalog') && result.has('--gameplay-tag-dump')) {
    throw new Error('choose --gameplay-tag-catalog or --gameplay-tag-dump, not both');
  }
  return includeUnityTemplates
    ? {
        ...base,
        projectileData: requiredArgument(result, '--projectile-data'),
        abilityEntityData: requiredArgument(result, '--ability-entity-data'),
        ...(result.has('--gameplay-tag-catalog')
          ? { gameplayTagCatalog: requiredArgument(result, '--gameplay-tag-catalog') }
          : { gameplayTagDump: requiredArgument(result, '--gameplay-tag-dump') }),
      }
    : base;
}

export function readOperatorSourceFiles(args: OperatorSourceFileArguments) {
  if (args.gameplayTagCatalog && args.gameplayTagDump)
    throw new Error('multiple GameplayTag sources');
  const skills = readSkillDataDirectory(args.skillData);
  return {
    manifest: readJson(args.manifest),
    skillDataBySourceFile: skills.bySourceFile,
    skillDataById: skills.bySkillId,
    buffDataById: readDefinitionDirectory(args.buffData, 'id', 'BuffData'),
    ...(args.projectileData
      ? { projectileDataById: readDefinitionDirectory(args.projectileData, 'id', 'ProjectileData') }
      : {}),
    ...(args.abilityEntityData
      ? {
          abilityEntityDataById: readDefinitionDirectory(
            args.abilityEntityData,
            'gameId',
            'AbilityEntityData',
          ),
        }
      : {}),
    ...(args.gameplayTagCatalog
      ? { gameplayTagPaths: readGameplayTagPaths(args.gameplayTagCatalog) }
      : args.gameplayTagDump
        ? {
            gameplayTagPaths: parseGameplayTagConfigDumpSource(
              new Uint8Array(fs.readFileSync(args.gameplayTagDump)),
              args.gameplayTagDump,
            ).paths,
          }
        : {}),
    skillPatchTable: readTable(args.tables, 'SkillPatchTable'),
    characterTable: readTable(args.tables, 'CharacterTable'),
    charGrowthTable: readTable(args.tables, 'CharGrowthTable'),
    characterPotentialTable: readTable(args.tables, 'CharacterPotentialTable'),
    potentialTalentEffectTable: readTable(args.tables, 'PotentialTalentEffectTable'),
    skillConditionTable: readTable(args.tables, 'SkillConditionTable'),
  };
}

function readSkillDataDirectory(directory: string) {
  const bySourceFile: Record<string, unknown> = {};
  const bySkillId: Record<string, unknown> = {};
  for (const sourceFile of safeJsonFiles(directory, 'SkillData')) {
    const value = readJson(path.join(directory, sourceFile));
    const row = requireObject(value, sourceFile);
    const skillId = requireString(row.skillId, `${sourceFile}.skillId`);
    if (skillId in bySkillId) {
      throw new Error(
        `${sourceFile}.skillId: duplicate SkillData identity ${JSON.stringify(skillId)}`,
      );
    }
    bySourceFile[sourceFile] = value;
    bySkillId[skillId] = value;
  }
  return { bySourceFile, bySkillId };
}

function readDefinitionDirectory(directory: string, identityField: string, sourceName: string) {
  const byId: Record<string, unknown> = {};
  for (const sourceFile of safeJsonFiles(directory, sourceName)) {
    const value = readJson(path.join(directory, sourceFile));
    const row = requireObject(value, sourceFile);
    const id = requireString(row[identityField], `${sourceFile}.${identityField}`);
    if (id in byId) {
      throw new Error(
        `${sourceFile}.${identityField}: duplicate ${sourceName} identity ${JSON.stringify(id)}`,
      );
    }
    byId[id] = value;
  }
  return byId;
}

function safeJsonFiles(directory: string, sourceName: string): string[] {
  return fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .sort()
    .map(name => {
      if (!/^[A-Za-z0-9._-]+\.json$/.test(name)) {
        throw new Error(`${directory}: unsafe ${sourceName} filename ${JSON.stringify(name)}`);
      }
      return name;
    });
}

function readTable(directory: string, name: string): unknown {
  return readJson(path.join(directory, `${name}.json`));
}

function requiredArgument(values: ReadonlyMap<string, string>, name: string): string {
  const value = values.get(name);
  if (!value) throw new Error(`missing ${name}`);
  return path.resolve(value);
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireObject(value: unknown, sourcePath: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${sourcePath}: expected object`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, sourcePath: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${sourcePath}: expected non-empty string`);
  }
  return value;
}
