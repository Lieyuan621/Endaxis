import type {
  GearDefinition,
  GearSlotType,
  EquipmentTraitDisplayDefinition,
  GearTraitDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import { compileResolvedAttributeModifierSource } from '../../compiler/build/attributeModifier.ts';
import { isBuildContributionModifier } from '../../compiler/build/buildAttributeProjection.ts';
import type {
  EquipmentAttributeModifierSource,
  EquipmentDisplayAttributeModifierSource,
  EquipmentItemSource,
  EquipmentPartTypeSource,
} from '../../source/equipmentAttributeModifiers.ts';
import {
  projectEquipmentAttributeModifier,
  type EquipmentAttributeModifierProjectionSource,
} from './projection.ts';
import type {
  BuildDefinitionDiagnosticSource,
  CompiledBuildModifierDefinitionSource,
} from '../../compiler/build/formalBuildDefinition.ts';

export type EquipmentDefinitionDiagnosticSource = BuildDefinitionDiagnosticSource;
export type CompiledEquipmentModifierDefinitionSource = CompiledBuildModifierDefinitionSource;

// 兼容旧导入路径；槽位身份的唯一声明位于独立契约。
export type { GearSlotType as CompiledGearSlotTypeSource } from '../../../../../packages/game-data-contract/src/equipment.ts';

/** 正式装备词条的静态输出子集，不是来源或优化 IR。 */
export type CompiledGearTraitDefinitionSource = Readonly<
  Pick<GearTraitDefinition, 'key' | 'levelCount' | 'display'>
> & {
  readonly modifiers: readonly CompiledEquipmentModifierDefinitionSource[];
};

export type CompiledGearDefinitionSource = Readonly<
  Pick<GearDefinition, 'slug' | 'slotType' | 'levelRequirement' | 'baseDefense' | 'gearSetSlug'> &
    Required<Pick<GearDefinition, 'assetSlug' | 'iconPath'>>
> & {
  readonly traits: readonly CompiledGearTraitDefinitionSource[];
};

export interface CompiledEquipmentDefinitionSource {
  readonly definition?: CompiledGearDefinitionSource;
  readonly diagnostics: readonly EquipmentDefinitionDiagnosticSource[];
}

export interface CompiledEquipmentDefinitionBatchSource {
  readonly definitions: readonly CompiledGearDefinitionSource[];
  readonly diagnostics: readonly EquipmentDefinitionDiagnosticSource[];
}

const GEAR_SLOT_BY_PART_TYPE: Readonly<Partial<Record<EquipmentPartTypeSource, GearSlotType>>> = {
  Body: 'armor',
  Hand: 'gloves',
  EDC: 'accessory',
};

type ProjectedModifierLevels = EquipmentAttributeModifierProjectionSource<readonly number[]> & {
  readonly origin: EquipmentAttributeModifierSource;
};

/**
 * 把一条原生装备记录组装成 Next 正式定义。
 * 基础防御仍来自同一属性修正程序，但 GearDefinition 将其提升为单独字段；只有当前四档完全
 * 相等时才能无损提升。其余修正严格按 attrIndex 分组，保持装备实例精锻选择的原生边界。
 */
export function compileEquipmentDefinitionSource(
  equipment: EquipmentItemSource,
): CompiledEquipmentDefinitionSource {
  const diagnostics: EquipmentDefinitionDiagnosticSource[] = [];
  const slotType = GEAR_SLOT_BY_PART_TYPE[equipment.partType];
  if (slotType === undefined) {
    diagnostics.push({
      status: 'blocked',
      sourcePath: `${equipment.sourcePath}.partType`,
      reason: `native equipment part ${equipment.partType} is not a formal Endaxis gear slot`,
    });
  }

  const projected = equipment.attributeModifiers.map(projectModifierLevels);
  for (const entry of projected) {
    if (entry.status === 'supported') continue;
    diagnostics.push({
      status: entry.status,
      sourcePath: entry.origin.sourcePath,
      reason: entry.reason,
    });
  }

  const baseDefenseEntries = projected.filter(
    entry =>
      entry.status === 'supported' &&
      entry.modifier.kind === 'panelStat' &&
      entry.modifier.stat === 'baseDefense',
  );
  if (baseDefenseEntries.length !== 1) {
    diagnostics.push({
      status: 'blocked',
      sourcePath: `${equipment.sourcePath}.equipAttrModifiers`,
      reason: `expected exactly one base-defense modifier, got ${baseDefenseEntries.length}`,
    });
  }
  const baseDefenseEntry = baseDefenseEntries[0];
  const baseDefenseValues =
    baseDefenseEntry?.status === 'supported' ? baseDefenseEntry.modifier.value : [];
  if (
    baseDefenseValues.length === 0 ||
    baseDefenseValues.some(value => value !== baseDefenseValues[0])
  ) {
    diagnostics.push({
      status: 'blocked',
      sourcePath: baseDefenseEntries[0]?.origin.sourcePath ?? equipment.sourcePath,
      reason: 'GearDefinition.baseDefense cannot represent enhancement-dependent values',
    });
  }

  const traits = compileTraits(projected, equipment.displayAttributeModifiers, diagnostics);
  if (diagnostics.some(diagnostic => diagnostic.status === 'blocked') || slotType === undefined) {
    return { diagnostics };
  }

  return {
    definition: {
      slug: equipment.equipmentId,
      assetSlug: equipment.identity.iconId,
      iconPath: projectEquipmentIconPath(equipment.identity.iconId),
      slotType,
      levelRequirement: equipment.minimumWearLevel,
      baseDefense: baseDefenseValues[0]!,
      traits,
      ...(equipment.suitId === '' ? {} : { gearSetSlug: equipment.suitId }),
    },
    diagnostics,
  };
}

/** ItemTable 的 iconId 自带稳定系列段；沿用既有 public/equipment 目录约定。 */
export function projectEquipmentIconPath(iconId: string): string {
  const match = /^item_equip_t\d+_(?:suit|parts)_(.+)_(?:body|hand|edc)_\d+$/.exec(iconId);
  if (match?.[1] === undefined) {
    throw new Error(`equipment icon identity '${iconId}' has no stable series segment`);
  }
  return `/equipment/${match[1]}/${iconId}.webp`;
}

/** 批量入口固定按原生装备 ID 排序，并在渲染前关闭重复身份。 */
export function compileEquipmentDefinitionBatchSource(
  equipment: readonly EquipmentItemSource[],
): CompiledEquipmentDefinitionBatchSource {
  const ordered = [...equipment].sort((left, right) =>
    left.equipmentId.localeCompare(right.equipmentId),
  );
  const identities = new Set<string>();
  const definitions: CompiledGearDefinitionSource[] = [];
  const diagnostics: EquipmentDefinitionDiagnosticSource[] = [];
  for (const item of ordered) {
    if (identities.has(item.equipmentId)) {
      throw new Error(`duplicate equipment definition source ${JSON.stringify(item.equipmentId)}`);
    }
    identities.add(item.equipmentId);
    const result = compileEquipmentDefinitionSource(item);
    diagnostics.push(...result.diagnostics);
    if (result.definition !== undefined) definitions.push(result.definition);
  }
  return { definitions, diagnostics };
}

function projectModifierLevels(source: EquipmentAttributeModifierSource): ProjectedModifierLevels {
  const projection = projectEquipmentAttributeModifier(
    compileResolvedAttributeModifierSource({
      sourcePath: source.sourcePath,
      modifyAttributeType: source.modifyAttributeType,
      attributeType: source.attributeType,
      formulaItem: source.formulaItem,
      value: source.attributeValues,
    }),
  );
  return { ...projection, origin: source };
}

function compileTraits(
  projected: readonly ProjectedModifierLevels[],
  displaySources: readonly EquipmentDisplayAttributeModifierSource[],
  diagnostics: EquipmentDefinitionDiagnosticSource[],
): CompiledGearTraitDefinitionSource[] {
  const groups = new Map<number, ProjectedModifierLevels[]>();
  for (const entry of projected) {
    // 基础防御被提升为 GearDefinition.baseDefense，不属于可精锻词条。其余原生
    // attrIndex 即使在木桩模型中不参与模拟，也仍须保留词条身份与展示事实。
    if (
      entry.status === 'supported' &&
      entry.modifier.kind === 'panelStat' &&
      entry.modifier.stat === 'baseDefense'
    ) {
      continue;
    }
    const group = groups.get(entry.origin.attributeIndex) ?? [];
    group.push(entry);
    groups.set(entry.origin.attributeIndex, group);
  }

  const displayByEnhancedIndex = new Map<number, EquipmentDisplayAttributeModifierSource>();
  for (const source of [...displaySources].sort(
    (left, right) => left.displayIndex - right.displayIndex,
  )) {
    if (displayByEnhancedIndex.has(source.enhancedAttributeIndex)) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: source.sourcePath,
        reason: `duplicate display modifier for enhanced attrIndex ${source.enhancedAttributeIndex}`,
      });
      continue;
    }
    displayByEnhancedIndex.set(source.enhancedAttributeIndex, source);
  }

  const traits: CompiledGearTraitDefinitionSource[] = [];
  for (const source of [...displaySources].sort(
    (left, right) => left.displayIndex - right.displayIndex,
  )) {
    const attributeIndex = source.enhancedAttributeIndex;
    if (displayByEnhancedIndex.get(attributeIndex) !== source) continue;
    const entries = groups.get(attributeIndex);
    if (entries === undefined) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: source.sourcePath,
        reason: `display modifier references missing equipAttrModifiers attrIndex ${attributeIndex}`,
      });
      continue;
    }
    const levelCount = entries[0]!.origin.attributeValues.length;
    if (entries.some(entry => entry.origin.attributeValues.length !== levelCount)) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: entries[0]!.origin.sourcePath,
        reason: `attrIndex ${attributeIndex} contains inconsistent enhancement level counts`,
      });
      continue;
    }
    const display = compileTraitDisplay(source, diagnostics);
    if (display === undefined) continue;
    traits.push({
      key: `attribute-${attributeIndex}`,
      levelCount,
      display,
      modifiers: entries.flatMap(entry =>
        entry.status === 'supported' && isBuildContributionModifier(entry.modifier)
          ? [entry.modifier]
          : [],
      ),
    });
  }
  for (const attributeIndex of groups.keys()) {
    if (!displayByEnhancedIndex.has(attributeIndex)) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: projected.find(entry => entry.origin.attributeIndex === attributeIndex)!.origin
          .sourcePath,
        reason: `equipAttrModifiers attrIndex ${attributeIndex} has no display modifier`,
      });
    }
  }
  return traits;
}

const DISPLAY_COMPOSITE_BY_NATIVE: Readonly<
  Record<string, Extract<EquipmentTraitDisplayDefinition, { kind: 'composite' }>['composite']>
> = {
  CrystAndPulseDamageIncrease: 'cryoAndElectricDamageIncrease',
  FireAndNaturalDamageIncrease: 'heatAndNatureDamageIncrease',
  AllSkillDamageIncrease: 'allSkillDamageIncrease',
  AllDamageTakenScalar: 'allDamageReduction',
  SpellDamageIncrease: 'spellDamageIncrease',
};

function compileTraitDisplay(
  source: EquipmentDisplayAttributeModifierSource,
  diagnostics: EquipmentDefinitionDiagnosticSource[],
): EquipmentTraitDisplayDefinition | undefined {
  if (
    source.compositeAttribute !== '' &&
    source.compositeAttribute !== 'Main' &&
    source.compositeAttribute !== 'Sub'
  ) {
    const composite = DISPLAY_COMPOSITE_BY_NATIVE[source.compositeAttribute];
    if (composite === undefined) {
      diagnostics.push({
        status: 'blocked',
        sourcePath: `${source.sourcePath}.compositeAttr`,
        reason: `unsupported equipment display composite ${JSON.stringify(source.compositeAttribute)}`,
      });
      return undefined;
    }
    return { kind: 'composite', composite, value: source.attributeValues };
  }
  const projection = projectEquipmentAttributeModifier(
    compileResolvedAttributeModifierSource({
      sourcePath: source.sourcePath,
      modifyAttributeType: source.modifyAttributeType,
      attributeType: source.attributeType,
      formulaItem: source.formulaItem,
      value: source.attributeValues,
    }),
  );
  if (projection.status !== 'supported' || !isBuildContributionModifier(projection.modifier)) {
    diagnostics.push({
      status: 'blocked',
      sourcePath: source.sourcePath,
      reason:
        projection.status === 'supported'
          ? 'display modifier resolved to base defense'
          : `display modifier is not representable: ${projection.reason}`,
    });
    return undefined;
  }
  return { kind: 'modifier', modifier: projection.modifier };
}
