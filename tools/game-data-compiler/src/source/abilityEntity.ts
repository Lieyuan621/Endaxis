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
import { parseActiveSkillTypesSource } from './activeSkillTypes.ts';
import type { NativeSkillType } from '../../../../packages/game-data-contract/src/index.ts';
import {
  parseAbilitySystemReferences,
  parseSkillBundleReferences,
} from './abilitySystemReferences.ts';
import type { DefinitionReferenceSource } from './referenceGraph.ts';

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

const ABILITY_ENTITY_TEMPLATE_OPTIONAL_FIELDS = new Set([
  'skillDataBundle',
  'entityBlackboard',
  'nativeData',
  'skillRegistration',
]);

export interface AbilityEntitySkillDataBundleSource {
  readonly allActiveSkillIds: readonly string[];
  readonly allPassiveSkillIds: readonly string[];
  readonly enabledPassiveSkillIds: readonly string[];
}

/** 已解出的技能仍需检查；逻辑前缀不包含完整组件，不能作为完整黑板接收者。 */
export function parseAbilityEntityBlackboardReceiverSource(value: unknown, sourcePath: string) {
  const template = parseNativeAbilityEntityTemplateSource(value, sourcePath);
  const result: { value: unknown; complete: boolean; references: DefinitionReferenceSource[] } = {
    value,
    complete: false,
    references: (
      ['allActiveSkillIds', 'allPassiveSkillIds', 'enabledPassiveSkillIds'] as const
    ).flatMap(field =>
      (template.skillDataBundle?.[field] ?? []).map((id, index) => ({
        kind: 'skill' as const,
        id,
        usage: 'blackboardReceiver',
        state: 'active' as const,
        blackboardKey: null,
        sourcePath: `${sourcePath}.skillDataBundle.${field}[${index}]`,
      })),
    ),
  };
  const root = requireRecord(value, sourcePath);
  if (root.nativeData === undefined) return result;
  const nativePath = `${sourcePath}.nativeData`;
  const native = requireRecord(root.nativeData, nativePath);
  if (native.decodeStatus === 'partial') return result;
  if (native.decodeStatus !== 'complete') throw new Error(`${nativePath}: invalid decodeStatus`);
  if (native.id !== template.gameId) throw new Error(`${nativePath}: template ID mismatch`);
  const data = requireRecord(native.template, `${nativePath}.template`);
  if (data.id !== template.gameId) throw new Error(`${nativePath}.template: template ID mismatch`);
  const bundle = parseSkillBundleReferences(
    data.skillDataBundle,
    `${nativePath}.template.skillDataBundle`,
  );
  result.references.push(...bundle.references);
  result.complete = bundle.complete;
  const components = requireRecord(native.components, `${nativePath}.components`);
  for (const rid of requireArray(data.componentList, `${nativePath}.template.componentList`)) {
    const key = requireNonEmptyString(rid, `${nativePath}.template.componentList`);
    if (!(key in components)) throw new Error(`${nativePath}: missing component ${key}`);
  }
  for (const [rid, raw] of Object.entries(components)) {
    const path = `${nativePath}.components.${rid}`;
    const component = requireRecord(raw, path);
    requireRecord(component.data, `${path}.data`);
    if (component.type === 'Beyond.Gameplay.Core.AbilitySystemData') {
      const ability = parseAbilitySystemReferences(component.data, `${path}.data`);
      result.references.push(...ability.references);
      result.complete &&= ability.complete;
    } else if (
      ![
        'Beyond.Gameplay.Core.AbilityEntityRootComponentData',
        'Beyond.Gameplay.Core.RotatorComponentData',
        'Beyond.Gameplay.Core.CharacterMovementComponentData',
        'Beyond.Gameplay.Core.AbilityEntityControllerData',
        'Beyond.Gameplay.AbilityEntityTemplateData/EaseFollowMovementData',
      ].includes(requireString(component.type, `${path}.type`))
    ) {
      result.complete = false;
    }
  }
  return result;
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
  /** 实体技能包登记的类型；不能用 SkillData 的用途标签或来源技能类型代替。 */
  readonly activeSkillTypes?: Readonly<Record<string, NativeSkillType>>;
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
  const activeSkillTypes = parseEntityActiveSkillTypes(root, sourcePath);
  return {
    ...(activeSkillTypes === undefined ? {} : { activeSkillTypes }),
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

function parseEntityActiveSkillTypes(
  root: Record<string, unknown>,
  sourcePath: string,
): Readonly<Record<string, NativeSkillType>> | undefined {
  if (root.skillRegistration !== undefined)
    return parseActiveSkillTypesSource(root.skillRegistration, `${sourcePath}.skillRegistration`)
      .initialNativeSkillTypeById;
  if (root.nativeData === undefined) return undefined;
  const nativePath = `${sourcePath}.nativeData`;
  const native = requireRecord(root.nativeData, nativePath);
  if (native.decodeStatus === 'partial') return undefined;
  if (native.decodeStatus !== 'complete') throw new Error(`${nativePath}: invalid decodeStatus`);
  const template = requireRecord(native.template, `${nativePath}.template`);
  if (native.id !== root.gameId || template.id !== root.gameId)
    throw new Error(`${nativePath}: template ID mismatch`);
  const result: Record<string, NativeSkillType> = {};
  const register = (bundle: unknown, path: string) => {
    const parsed = parseActiveSkillTypesSource(bundle, path);
    for (const [id, type] of Object.entries(parsed.initialNativeSkillTypeById)) {
      if (result[id] !== undefined && result[id] !== type)
        throw new Error(`${path}: conflicting native type for skill ${id}`);
      result[id] = type;
    }
  };
  register(template.skillDataBundle, `${nativePath}.template.skillDataBundle`);
  const components = requireRecord(native.components, `${nativePath}.components`);
  for (const rid of requireArray(template.componentList, `${nativePath}.template.componentList`)) {
    const key = requireNonEmptyString(rid, `${nativePath}.template.componentList`);
    if (!(key in components)) throw new Error(`${nativePath}: missing component ${key}`);
    const component = requireRecord(components[key], `${nativePath}.components.${key}`);
    if (component.type !== 'Beyond.Gameplay.Core.AbilitySystemData') continue;
    const data = requireRecord(component.data, `${nativePath}.components.${key}.data`);
    register(data.skillDataBundle, `${nativePath}.components.${key}.data.skillDataBundle`);
  }
  return result;
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
