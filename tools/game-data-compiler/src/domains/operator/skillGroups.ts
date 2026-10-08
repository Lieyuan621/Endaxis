import { OPERATION_TYPES } from '../../../../../packages/game-data-contract/src/primitives.ts';
import type {
  SkillGroupDefinition,
  SkillDefinition,
  SkillGroupPlacementPolicy,
  SkillGroupVariantDefinition,
} from '../../compiler/intermediateDefinitions.ts';
import {
  requireArray,
  requireExactFields,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireRecord,
  requireString,
} from '../../source/primitives.ts';

const NATIVE_FIELDS = new Set([
  'conditionDesc1',
  'conditionDesc2',
  'conditionDescInactive1',
  'conditionDescInactive2',
  'conditionIcon1',
  'conditionIcon2',
  'conditionId1',
  'conditionId2',
  'conditionName1',
  'conditionName2',
  'conditionPostDesc1',
  'conditionPostDesc2',
  'desc',
  'icon',
  'name',
  'skillGroupId',
  'skillGroupType',
  'skillIdList',
]);
const GROUP_REQUIRED_FIELDS = new Set(['key', 'skillKeys', 'operationType']);
const VARIANT_FIELDS = new Set(['key', 'skillKeys']);
const REPLACEMENT_PLACEMENTS = ['sequence', 'internal'] as const;

export interface NativeOperatorSkillGroupSource {
  readonly sourcePath: string;
  readonly skillGroupId: string;
  /** 当前 metadata 未保存枚举成员名，因此保留原生整数身份。 */
  readonly nativeGroupType: number;
  readonly skillIds: readonly string[];
}

/** 主动技能的原生 ID 和分类。 */
export type OperatorSkillIdentitySource = Readonly<Pick<SkillDefinition, 'key' | 'skillType'>>;

/** 展示组的链接计划，仅保留操作与有序技能键，不携带原生养成分类。 */
export type OperatorSkillGroupVariantSource = Readonly<
  Pick<SkillGroupVariantDefinition, 'key' | 'nameKey' | 'placementPolicy'>
> & {
  readonly skillKeys: readonly string[];
};

export type OperatorSkillGroupSource = Readonly<
  Pick<SkillGroupDefinition, 'key' | 'operationType' | 'placementPolicy'>
> & {
  readonly skillKeys: readonly string[];
  readonly nameKey?: string;
  readonly replacementPlacements: Readonly<Record<string, (typeof REPLACEMENT_PLACEMENTS)[number]>>;
  readonly variants: readonly OperatorSkillGroupVariantSource[];
};

export interface OperatorSkillGroupValidationOptions {
  readonly routingOnlyNativeSkillIds?: readonly string[];
  readonly simulationEquivalentNativeSkillIds?: readonly string[];
  readonly basePassiveSkillIds?: readonly string[];
  readonly routedSkillKeys?: readonly string[];
  /** 需注册到技能系统、但不作为稳定时间轴入口的原生替换/内部技能。 */
  readonly runtimeReplacementSkillKeys?: readonly string[];
}

/** 生成与各类审计共用同一读取边界，避免内部技能等例外只在某个入口生效。 */
export function parseOperatorSkillGroupValidationOptions(
  value: unknown,
  sourcePath: string,
): OperatorSkillGroupValidationOptions {
  const row = requireRecord(value, sourcePath);
  const read = (key: keyof OperatorSkillGroupValidationOptions) =>
    row[key] === undefined ? undefined : distinctStrings(row[key], `${sourcePath}.${key}`);
  return {
    routingOnlyNativeSkillIds: read('routingOnlyNativeSkillIds'),
    simulationEquivalentNativeSkillIds: read('simulationEquivalentNativeSkillIds'),
    basePassiveSkillIds: read('basePassiveSkillIds'),
    routedSkillKeys: read('routedSkillKeys'),
    runtimeReplacementSkillKeys: read('runtimeReplacementSkillKeys'),
  };
}

/** 严格读取原生技能等级组的字段。 */
export function parseNativeOperatorSkillGroupSources(
  tableValue: unknown,
  characterId: string,
  sourceName = 'CharGrowthTable',
): NativeOperatorSkillGroupSource[] {
  const table = requireRecord(tableValue, sourceName);
  const rowPath = `${sourceName}.${characterId}`;
  const row = requireRecord(table[characterId], rowPath);
  const mapPath = `${rowPath}.skillGroupMap`;
  return Object.entries(requireRecord(row.skillGroupMap, mapPath)).map(([id, raw]) => {
    const path = `${mapPath}.${id}`;
    const group = requireRecord(raw, path);
    requireExactFields(group, NATIVE_FIELDS, path);
    const embeddedId = requireNonEmptyString(group.skillGroupId, `${path}.skillGroupId`);
    if (embeddedId !== id) {
      throw new Error(`${path}: skillGroupId '${embeddedId}' does not match map key '${id}'`);
    }
    for (const field of [
      'conditionDesc1',
      'conditionDesc2',
      'conditionDescInactive1',
      'conditionDescInactive2',
      'conditionName1',
      'conditionName2',
      'conditionPostDesc1',
      'conditionPostDesc2',
      'desc',
      'name',
    ] as const)
      requireRecord(group[field], `${path}.${field}`);
    for (const field of [
      'conditionIcon1',
      'conditionIcon2',
      'conditionId1',
      'conditionId2',
      'icon',
    ] as const)
      requireString(group[field], `${path}.${field}`);
    const skillIds = distinctStrings(group.skillIdList, `${path}.skillIdList`);
    if (skillIds.length === 0) throw new Error(`${path}.skillIdList: expected entries`);
    return {
      sourcePath: path,
      skillGroupId: id,
      nativeGroupType: requireNonNegativeInteger(group.skillGroupType, `${path}.skillGroupType`),
      skillIds,
    };
  });
}

/** 读取 operators.json 中显式的编辑器技能库投影。 */
export function parseOperatorSkillGroupSources(
  value: unknown,
  path: string,
): OperatorSkillGroupSource[] {
  return requireArray(value, path).map((raw, index) => {
    const groupPath = `${path}[${index}]`;
    const group = requireRecord(raw, groupPath);
    const expectedFields = new Set(GROUP_REQUIRED_FIELDS);
    if (group.placementPolicy !== undefined) expectedFields.add('placementPolicy');
    if (group.variants !== undefined) expectedFields.add('variants');
    if (group.nameKey !== undefined) expectedFields.add('nameKey');
    if (group.replacementPlacements !== undefined) expectedFields.add('replacementPlacements');
    requireExactFields(group, expectedFields, groupPath);
    const variants =
      group.variants === undefined
        ? []
        : requireArray(group.variants, `${groupPath}.variants`).map((item, variantIndex) => {
            const variantPath = `${groupPath}.variants[${variantIndex}]`;
            const variant = requireRecord(item, variantPath);
            const fields = new Set(VARIANT_FIELDS);
            if (variant.nameKey !== undefined) fields.add('nameKey');
            if (variant.placementPolicy !== undefined) fields.add('placementPolicy');
            requireExactFields(variant, fields, variantPath);
            return {
              ...readPlacementPolicy(variant, variantPath),
              key: requireNonEmptyString(variant.key, `${variantPath}.key`),
              skillKeys: distinctStrings(variant.skillKeys, `${variantPath}.skillKeys`),
              ...(variant.nameKey === undefined
                ? {}
                : {
                    nameKey: requireNonEmptyString(variant.nameKey, `${variantPath}.nameKey`),
                  }),
            };
          });
    if (group.variants !== undefined && variants.length === 0) {
      throw new Error(`${groupPath}.variants: expected entries`);
    }
    const replacementPlacements = Object.fromEntries(
      Object.entries(
        group.replacementPlacements === undefined
          ? {}
          : requireRecord(group.replacementPlacements, `${groupPath}.replacementPlacements`),
      ).map(([skillKey, placement]) => [
        requireNonEmptyString(skillKey, `${groupPath}.replacementPlacements key`),
        requireGroupIdentity(
          placement,
          REPLACEMENT_PLACEMENTS,
          `${groupPath}.replacementPlacements.${skillKey}`,
        ),
      ]),
    );
    return {
      key: requireNonEmptyString(group.key, `${groupPath}.key`),
      ...readPlacementPolicy(group, groupPath),
      operationType: requireGroupIdentity(
        group.operationType,
        OPERATION_TYPES,
        `${groupPath}.operationType`,
      ),
      skillKeys: distinctStrings(group.skillKeys, `${groupPath}.skillKeys`),
      ...(group.nameKey === undefined
        ? {}
        : {
            nameKey: requireNonEmptyString(group.nameKey, `${groupPath}.nameKey`),
          }),
      replacementPlacements,
      variants,
    };
  });
}

function readPlacementPolicy(
  row: Record<string, unknown>,
  path: string,
): { placementPolicy?: SkillGroupPlacementPolicy } {
  if (row.placementPolicy === undefined) return {};
  const policyPath = `${path}.placementPolicy`;
  const policy = requireRecord(row.placementPolicy, policyPath);
  requireExactFields(
    policy,
    new Set(['kind', 'firstSkillKey', 'terminalSkillKey', 'maxSegments', 'fallback']),
    policyPath,
  );
  const keys = distinctStrings(row.skillKeys, `${path}.skillKeys`);
  const firstSkillKey = requireNonEmptyString(policy.firstSkillKey, `${policyPath}.firstSkillKey`);
  const terminalSkillKey = requireNonEmptyString(
    policy.terminalSkillKey,
    `${policyPath}.terminalSkillKey`,
  );
  if (!keys.includes(firstSkillKey) || !keys.includes(terminalSkillKey))
    throw new Error(`${policyPath}: endpoints must belong to skillKeys`);
  const maxSegments = requireNonNegativeInteger(policy.maxSegments, `${policyPath}.maxSegments`);
  if (maxSegments < keys.length || maxSegments < 1)
    throw new Error(`${policyPath}.maxSegments: must cover the fallback sequence`);
  return {
    placementPolicy: {
      kind: requireGroupIdentity(policy.kind, ['recursiveInput'] as const, `${policyPath}.kind`),
      firstSkillKey,
      terminalSkillKey,
      maxSegments,
      fallback: requireGroupIdentity(
        policy.fallback,
        ['sequence'] as const,
        `${policyPath}.fallback`,
      ),
    },
  };
}

/**
 * 展示分组仅校验技能引用和唯一归属。原生技能覆盖按 ID 集合核对，
 * 不要求展示分组、顺序或操作类别与原生养成分类相同。
 */
export function validateOperatorSkillGroups(
  groups: readonly OperatorSkillGroupSource[],
  skills: readonly OperatorSkillIdentitySource[],
  nativeGroups: readonly NativeOperatorSkillGroupSource[],
  options: OperatorSkillGroupValidationOptions = {},
): void {
  const skillByKey = uniqueMap(skills, item => item.key, 'skills');
  uniqueMap(groups, item => item.key, 'skillGroups');
  const assigned: string[] = [];
  for (const group of groups) {
    appendSkills(group.skillKeys, group.key);
    uniqueMap(group.variants, item => item.key, `skillGroups.${group.key}.variants`);
    for (const variant of group.variants) {
      appendSkills(variant.skillKeys, `${group.key}.${variant.key}`);
    }
  }
  if (new Set(assigned).size !== assigned.length) {
    throw new Error('skillGroups: a skill is assigned more than once');
  }
  const missing = [...skillByKey.keys()].filter(key => !assigned.includes(key)).sort();
  if (missing.length) throw new Error(`skillGroups: unassigned skills ${JSON.stringify(missing)}`);

  const nativeTypes = new Set<number>();
  const nativeTypeBySkill = new Map<string, number>();
  for (const group of nativeGroups) {
    if (nativeTypes.has(group.nativeGroupType)) {
      throw new Error(`skillGroupMap: duplicate group type ${group.nativeGroupType}`);
    }
    nativeTypes.add(group.nativeGroupType);
    for (const id of group.skillIds) {
      if (nativeTypeBySkill.has(id))
        throw new Error(`skillGroupMap: duplicate native skill '${id}'`);
      nativeTypeBySkill.set(id, group.nativeGroupType);
    }
  }
  const actualIds = new Set(nativeTypeBySkill.keys());
  const routingOnly = optionIds(options.routingOnlyNativeSkillIds, 'routingOnlyNativeSkillIds');
  const equivalent = optionIds(
    options.simulationEquivalentNativeSkillIds,
    'simulationEquivalentNativeSkillIds',
  );
  const passive = optionIds(options.basePassiveSkillIds, 'basePassiveSkillIds');
  const routedKeys = optionIds(options.routedSkillKeys, 'routedSkillKeys');
  const runtimeReplacementKeys = optionIds(
    options.runtimeReplacementSkillKeys,
    'runtimeReplacementSkillKeys',
  );
  requireKnown(routingOnly, actualIds, 'routingOnlyNativeSkillIds');
  requireKnown(equivalent, actualIds, 'simulationEquivalentNativeSkillIds');
  // 基础被动来自独立 Passive SkillData；它可能同时列在 skillGroupMap，也可能完全不在
  // 可操作技能组中。其文件身份与 castType 由被动编译入口校验，本层只负责在出现时排除。
  requireKnown(routedKeys, new Set(skillByKey.keys()), 'routedSkillKeys');
  requireKnown(runtimeReplacementKeys, new Set(skillByKey.keys()), 'runtimeReplacementSkillKeys');
  const generatedIds = new Set(skills.map(skill => skill.key));
  const runtimeReplacementIds = new Set(
    runtimeReplacementKeys.map(key => skillByKey.get(key)!.key),
  );
  const missingNativeSkillIds = [...generatedIds]
    .filter(id => !actualIds.has(id) && !runtimeReplacementIds.has(id))
    .sort();
  if (missingNativeSkillIds.length > 0) {
    throw new Error(
      `skillGroupMap does not match generated skill sources: missing native skills ${JSON.stringify(missingNativeSkillIds)}`,
    );
  }
  requireDisjoint(generatedIds, equivalent, 'simulationEquivalentNativeSkillIds');
  requireDisjoint(generatedIds, passive, 'basePassiveSkillIds');
  const routedIds = new Set(routedKeys.map(key => skillByKey.get(key)!.key));
  const omitted = new Set([...routingOnly, ...equivalent, ...passive]);
  const uncovered = [...actualIds]
    .filter(id => !omitted.has(id) && (!generatedIds.has(id) || routedIds.has(id)))
    .sort();
  if (uncovered.length) {
    throw new Error(
      `skillGroupMap does not match generated skill sources: uncovered native skills ${JSON.stringify(uncovered)}`,
    );
  }

  function appendSkills(keys: readonly string[], path: string): void {
    if (!keys.length) throw new Error(`skillGroups.${path}: expected skills`);
    for (const key of keys) {
      const skill = skillByKey.get(key);
      if (!skill) throw new Error(`skillGroups.${path}: unknown skill key '${key}'`);
      assigned.push(key);
    }
  }
}

/** 配置中的正式身份在读取边界校验；不为未知字符串伪造类型，也不解释原生组整数。 */
function requireGroupIdentity<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  const name = requireNonEmptyString(value, path);
  const result = allowed.find(item => item === name);
  if (result === undefined)
    throw new Error(`${path}: unsupported identity ${JSON.stringify(name)}`);
  return result;
}

function distinctStrings(value: unknown, path: string): string[] {
  const result = requireArray(value, path).map((item, index) =>
    requireNonEmptyString(item, `${path}[${index}]`),
  );
  if (new Set(result).size !== result.length) {
    throw new Error(`${path}: expected distinct values`);
  }
  return result;
}

function uniqueMap<T>(
  values: readonly T[],
  keyOf: (value: T) => string,
  path: string,
): Map<string, T> {
  const result = new Map<string, T>();
  for (const value of values) {
    const key = keyOf(value);
    if (result.has(key)) throw new Error(`${path}: duplicate key '${key}'`);
    result.set(key, value);
  }
  return result;
}

function optionIds(values: readonly string[] | undefined, path: string): string[] {
  if (!values) return [];
  if (values.some(value => !value) || new Set(values).size !== values.length) {
    throw new Error(`${path}: expected distinct non-empty IDs`);
  }
  return [...values];
}

function requireKnown(values: readonly string[], known: ReadonlySet<string>, path: string): void {
  const unknown = values.filter(value => !known.has(value)).sort();
  if (unknown.length) throw new Error(`${path}: unknown IDs ${JSON.stringify(unknown)}`);
}

function requireDisjoint(left: ReadonlySet<string>, right: readonly string[], path: string): void {
  const overlap = right.filter(value => left.has(value)).sort();
  if (overlap.length) {
    throw new Error(`${path}: generated skills cannot be omitted ${JSON.stringify(overlap)}`);
  }
}
