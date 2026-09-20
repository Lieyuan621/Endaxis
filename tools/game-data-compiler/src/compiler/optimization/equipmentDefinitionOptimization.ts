/**
 * 优化公共 Buff、武器词条和装备套装中的动作程序。
 *
 * 来源编译完成后才进入这里，输入和输出均为最终数据定义。公共序列优化器裁剪
 * 已证明无效的分支，再依据全部运行入口删除装备贡献中没有用途的黑板初值。
 * 事件注册、Buff 身份、Buff 自身黑板和已编译属性修正保持原样。
 * report 模式收集完整候选报告，但把原对象交还生成入口，不改变正式生成内容。
 */
import type { OperatorBuffDefinitions } from '../../../../../packages/game-data-contract/src/buffs.ts';
import type {
  EquipmentContributionDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import type { DefinitionOptimizationMode } from './definitionOptimization.ts';
import { createDefinitionProgramOptimizer } from './definitionProgramOptimization.ts';
import {
  pruneUnusedEquipmentContributionBlackboard,
  type EquipmentValueOptimizationReport,
} from './equipmentValueOptimization.ts';

/** 同一贡献的初始化、事件响应和私有 Buff 使用同一份报告，但不合并它们的黑板。 */
function optimizeContribution(
  value: EquipmentContributionDefinition,
  path: string,
  id: string,
  optimizer: ReturnType<typeof createDefinitionProgramOptimizer>,
  mode: DefinitionOptimizationMode,
  equipmentValues: EquipmentValueOptimizationReport[],
): EquipmentContributionDefinition {
  const candidate: EquipmentContributionDefinition = {
    ...value,
    ...(value.enableSequence === undefined
      ? {}
      : {
          enableSequence: optimizer.sequence(value.enableSequence, `${path}.enableSequence`, id),
        }),
    ...(value.initializationSequence === undefined
      ? {}
      : {
          initializationSequence: optimizer.sequence(
            value.initializationSequence,
            `${path}.initializationSequence`,
            id,
          ),
        }),
    ...(value.eventHandlers === undefined
      ? {}
      : {
          eventHandlers: value.eventHandlers.map((handler, index) => ({
            ...handler,
            sequence: optimizer.sequence(
              handler.sequence,
              `${path}.eventHandlers[${index}].sequence`,
              id,
            ),
          })),
        }),
    ...(value.buffDefinitions === undefined
      ? {}
      : {
          buffDefinitions: Object.fromEntries(
            Object.entries(value.buffDefinitions).map(([buffId, definition]) => [
              buffId,
              optimizer.buff(definition, `${path}.buffDefinitions.${buffId}`, buffId),
            ]),
          ),
        }),
  };
  // 分支裁剪后再查用途，否则已被删除的分支仍会把原本无用的初值保留下来。
  const pruned = pruneUnusedEquipmentContributionBlackboard(candidate, {
    mode,
    definitionId: id,
    path,
  });
  equipmentValues.push(pruned.report);
  return pruned.contribution;
}

/** 公共 Buff 保留完整目录；这里不根据单名干员的使用情况删除公共身份或黑板值。 */
export function optimizeCommonBuffDefinitions(
  definitions: OperatorBuffDefinitions,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const optimizer = createDefinitionProgramOptimizer(mode);
  const candidate: OperatorBuffDefinitions = Object.fromEntries(
    Object.entries(definitions).map(([id, definition]) => [
      id,
      optimizer.buff(definition, `buffDefinitions.${id}`, id),
    ]),
  );
  return {
    definitions: mode === 'apply' ? candidate : definitions,
    report: optimizer.report(),
  };
}

/** 逐词条访问武器行为；等级数值、安装顺序和词条身份不参与分支推断。 */
export function optimizeWeaponDefinitionPrograms(
  definition: WeaponDefinition,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const optimizer = createDefinitionProgramOptimizer(mode);
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const candidate: WeaponDefinition = {
    ...definition,
    traits: definition.traits.map((trait, index) => ({
      key: trait.key,
      levelCount: trait.levelCount,
      ...optimizeContribution(
        trait,
        `traits[${index}]`,
        `${definition.slug}:${trait.key}`,
        optimizer,
        mode,
        equipmentValues,
      ),
    })),
  };
  return {
    definition: mode === 'apply' ? candidate : definition,
    report: { ...optimizer.report(), equipmentValues },
  };
}

/** 套装贡献使用与武器词条相同的公共入口，不添加按套装身份分派的规则。 */
export function optimizeGearSetDefinitionPrograms(
  definition: GearSetDefinition,
  mode: DefinitionOptimizationMode = 'apply',
) {
  const optimizer = createDefinitionProgramOptimizer(mode);
  const equipmentValues: EquipmentValueOptimizationReport[] = [];
  const candidate: GearSetDefinition = {
    slug: definition.slug,
    ...(definition.displayName === undefined ? {} : { displayName: definition.displayName }),
    ...optimizeContribution(
      definition,
      'contribution',
      definition.slug,
      optimizer,
      mode,
      equipmentValues,
    ),
  };
  return {
    definition: mode === 'apply' ? candidate : definition,
    report: { ...optimizer.report(), equipmentValues },
  };
}
