import {
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import {
  parseIntegerScalarSource,
  parseScalarSource,
  type IntegerScalarSource,
  type ScalarSource,
} from './scalar.ts';
export type { IntegerScalarSource } from './scalar.ts';
import { gameplayTagId } from './nativeGameplayTags.ts';
import { parseBlackboardDataPairs, type DeclaredBlackboardValueSource } from './blackboard.ts';

const ABILITY_ENTITY_TEMPLATE_FIELDS = new Set([
  'gameId',
  'factionNativeValue',
  'bornTagIds',
  'lifeTypeNativeValue',
  'durationSeconds',
  'durationBlackboard',
  'maxDurationForServerSeconds',
  'maxStackingCount',
  'maxStackingCountBlackboard',
  'delayToRecycleSeconds',
  'delayRecyclePerformSeconds',
  'sendDieEvent',
  'enableBornFadeIn',
  'fadeInSeconds',
  'componentCount',
  'managedReferenceCount',
  'rootRid',
]);

const ABILITY_ENTITY_TEMPLATE_OPTIONAL_FIELDS = new Set(['skillDataBundle', 'entityBlackboard']);

export interface AbilityEntitySkillDataBundleSource {
  readonly allActiveSkillIds: readonly string[];
  readonly allPassiveSkillIds: readonly string[];
  readonly enabledPassiveSkillIds: readonly string[];
}

/**
 * VFS 从 AbilityEntityTemplateData 解出的严格逻辑前缀。
 * 组件数量和 RID 只证明当前资产身份及解码边界，不代表组件行为已经完成转换。
 */
export interface NativeAbilityEntityTemplateSource {
  readonly gameId: string;
  readonly factionNativeValue: number;
  readonly bornTagIds: readonly number[];
  readonly lifeTypeNativeValue: number;
  readonly durationSeconds: number;
  readonly durationBlackboard: ScalarSource;
  readonly maxDurationForServerSeconds: number;
  readonly maxStackingCount: number;
  readonly maxStackingCountBlackboard: IntegerScalarSource;
  readonly delayToRecycleSeconds: number;
  readonly delayRecyclePerformSeconds: number;
  readonly sendDieEvent: boolean;
  readonly enableBornFadeIn: boolean;
  readonly fadeInSeconds: number;
  readonly componentCount: number;
  readonly managedReferenceCount: number;
  readonly rootRid: number;
  readonly skillDataBundle?: AbilityEntitySkillDataBundleSource;
  readonly entityBlackboard?: readonly DeclaredBlackboardValueSource[];
}
export function parseNativeAbilityEntityTemplateSource(
  value: unknown,
  sourcePath: string,
): NativeAbilityEntityTemplateSource {
  const root = requireRecord(value, sourcePath);
  requireExactFields(
    root,
    new Set([
      ...ABILITY_ENTITY_TEMPLATE_FIELDS,
      ...[...ABILITY_ENTITY_TEMPLATE_OPTIONAL_FIELDS].filter(field => field in root),
      ...('name' in root ? ['name'] : []),
    ]),
    sourcePath,
  );
  // BaseTemplateData.name 是可重复的模板标签，GameDataWithId.id 才是稳定资产身份。
  // 不以 name 覆盖 gameId，也不把此标签当作应用层显示名称。
  if ('name' in root) requireString(root.name, `${sourcePath}.name`);
  return {
    gameId: requireNonEmptyString(root.gameId, `${sourcePath}.gameId`),
    factionNativeValue: requireInteger(root.factionNativeValue, `${sourcePath}.factionNativeValue`),
    bornTagIds: requireArray(root.bornTagIds, `${sourcePath}.bornTagIds`).map((tag, index) => {
      const tagPath = `${sourcePath}.bornTagIds[${index}]`;
      const rawTagId = requireInteger(tag, tagPath);
      try {
        return gameplayTagId(rawTagId);
      } catch {
        throw new Error(`${tagPath}: expected signed 32-bit GameplayTag ID`);
      }
    }),
    lifeTypeNativeValue: requireInteger(
      root.lifeTypeNativeValue,
      `${sourcePath}.lifeTypeNativeValue`,
    ),
    durationSeconds: requireNonNegativeNumber(
      root.durationSeconds,
      `${sourcePath}.durationSeconds`,
    ),
    durationBlackboard: parseScalarSource(
      root.durationBlackboard,
      `${sourcePath}.durationBlackboard`,
      {},
    ),
    maxDurationForServerSeconds: requireNonNegativeNumber(
      root.maxDurationForServerSeconds,
      `${sourcePath}.maxDurationForServerSeconds`,
    ),
    maxStackingCount: requireInteger(root.maxStackingCount, `${sourcePath}.maxStackingCount`),
    maxStackingCountBlackboard: parseIntegerScalarSource(
      root.maxStackingCountBlackboard,
      `${sourcePath}.maxStackingCountBlackboard`,
    ),
    delayToRecycleSeconds: requireNonNegativeNumber(
      root.delayToRecycleSeconds,
      `${sourcePath}.delayToRecycleSeconds`,
    ),
    delayRecyclePerformSeconds: requireNonNegativeNumber(
      root.delayRecyclePerformSeconds,
      `${sourcePath}.delayRecyclePerformSeconds`,
    ),
    sendDieEvent: requireBoolean(root.sendDieEvent, `${sourcePath}.sendDieEvent`),
    enableBornFadeIn: requireBoolean(root.enableBornFadeIn, `${sourcePath}.enableBornFadeIn`),
    fadeInSeconds: requireNonNegativeNumber(root.fadeInSeconds, `${sourcePath}.fadeInSeconds`),
    componentCount: requireNonNegativeInteger(root.componentCount, `${sourcePath}.componentCount`),
    managedReferenceCount: requireNonNegativeInteger(
      root.managedReferenceCount,
      `${sourcePath}.managedReferenceCount`,
    ),
    // Unity RID 超过 JS 安全整数范围；这里只保留 JSON 解码器给出的不透明数值，不参与身份计算。
    rootRid: requireNumber(root.rootRid, `${sourcePath}.rootRid`),
    ...('skillDataBundle' in root
      ? {
          skillDataBundle: parseSkillDataBundle(
            root.skillDataBundle,
            `${sourcePath}.skillDataBundle`,
          ),
        }
      : {}),
    ...('entityBlackboard' in root
      ? {
          entityBlackboard: parseBlackboardDataPairs(
            root.entityBlackboard,
            `${sourcePath}.entityBlackboard`,
          ),
        }
      : {}),
  };
}

function parseSkillDataBundle(
  value: unknown,
  sourcePath: string,
): AbilityEntitySkillDataBundleSource {
  const bundle = requireRecord(value, sourcePath);
  requireExactFields(
    bundle,
    new Set(['allActiveSkillIds', 'allPassiveSkillIds', 'enabledPassiveSkillIds']),
    sourcePath,
  );
  const readIds = (field: string) =>
    requireArray(bundle[field], `${sourcePath}.${field}`).map((id, index) =>
      requireNonEmptyString(id, `${sourcePath}.${field}[${index}]`),
    );
  const allActiveSkillIds = readIds('allActiveSkillIds');
  const allPassiveSkillIds = readIds('allPassiveSkillIds');
  const enabledPassiveSkillIds = readIds('enabledPassiveSkillIds');
  for (const id of enabledPassiveSkillIds) {
    if (!allPassiveSkillIds.includes(id)) {
      throw new Error(
        `${sourcePath}.enabledPassiveSkillIds: ${JSON.stringify(id)} is not declared`,
      );
    }
  }
  return { allActiveSkillIds, allPassiveSkillIds, enabledPassiveSkillIds };
}

function requireNonNegativeNumber(value: unknown, sourcePath: string): number {
  const result = requireNumber(value, sourcePath);
  if (!Number.isFinite(result) || result < 0) {
    throw new Error(`${sourcePath}: expected finite non-negative number`);
  }
  return result;
}
