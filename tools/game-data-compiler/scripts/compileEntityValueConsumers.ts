/**
 * 从本次重建使用的来源编译装备和机制消费者，供实体黑板用途分析。
 * 每个领域编译后立即汇总用途，调用方可用同一结果渲染文件；返回前不保留完整领域定义。
 * 不读正式生成库，不写候选文件；缺来源或未支持行为继续报错。
 */
import path from 'node:path';
import { compileWeaponDefinitionsFromFiles } from './generateWeaponDefinitions.ts';
import { compileGearSetDefinitionsFromFiles } from './generateGearSetDefinitions.ts';
import { compileGearDefinitionsFromFiles } from './generateGearDefinitions.ts';
import { compileContingencyContractDefinitionsFromFiles } from './generateContingencyContractDefinitions.ts';
import type { CompiledContingencyContractDefinitions } from './generateContingencyContractDefinitions.ts';
import type { CompiledWeaponRuntimeDefinitionBatchSource } from '../src/domains/weapon/runtimeDefinition.ts';
import type { CompiledEquipmentDefinitionBatchSource } from '../src/domains/equipment/formalDefinition.ts';
import type { CompiledEquipmentSuitRuntimeBatchSource } from '../src/domains/equipment/suitRuntimeDefinition.ts';
import {
  createSharedEntityValueUsageCollector,
  type SharedEntityValueUsageCollector,
} from '../src/compiler/optimization/definitionEntityUsageContext.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';

export interface EntityValueConsumerSourceArguments {
  readonly sourceRoot: string;
  readonly tableRoot: string;
  readonly buffDataRoot: string;
  readonly gameplayTagCatalog: string;
  readonly globalBuffCatalog: string;
  readonly skillSettingCatalog: string;
  readonly mechanicScope?: string;
}

/** 完整重建在用途收集后渲染同一对象；回调不得把整批编译对象长期保存在外部。 */
export interface EntityValueConsumerRendering {
  readonly weapons: (batch: CompiledWeaponRuntimeDefinitionBatchSource) => void | Promise<void>;
  readonly gears: (batch: CompiledEquipmentDefinitionBatchSource) => void | Promise<void>;
  readonly gearSets: (batch: CompiledEquipmentSuitRuntimeBatchSource) => void | Promise<void>;
  readonly mechanics: (batch: CompiledContingencyContractDefinitions) => void | Promise<void>;
}

/** 每次调用重新编译四个领域；无渲染回调时只收集用途，供正式单人生成使用。 */
export async function compileEntityValueConsumers(
  args: EntityValueConsumerSourceArguments,
  rendering?: EntityValueConsumerRendering,
) {
  // 默认仓库没有共享实体定义；游戏实体随所属干员收集。
  const usage = createSharedEntityValueUsageCollector({});
  await weapons(args, usage, rendering);
  await gears(args, usage, rendering);
  await gearSets(args, usage, rendering);
  await mechanics(args, usage, rendering);
  return usage.finish();
}

async function weapons(
  args: EntityValueConsumerSourceArguments,
  usage: SharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const weapons = compileWeaponDefinitionsFromFiles({
    tables: args.tableRoot,
    skillData: path.join(args.sourceRoot, 'SkillData'),
    buffData: args.buffDataRoot,
    gameplayTagCatalog: args.gameplayTagCatalog,
  });
  weapons.definitions.forEach(weapon => usage.addWeapon(weapon));
  await rendering?.weapons(weapons);
}

async function gears(
  args: EntityValueConsumerSourceArguments,
  usage: SharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const gears = await compileGearDefinitionsFromFiles(args.tableRoot);
  gears.definitions.forEach(gear => usage.addGear(gear));
  await rendering?.gears(gears);
}

async function gearSets(
  args: EntityValueConsumerSourceArguments,
  usage: SharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const gearSets = await compileGearSetDefinitionsFromFiles({
    tablesDirectory: args.tableRoot,
    skillDataDirectory: path.join(args.sourceRoot, 'SkillData'),
    buffDataDirectory: args.buffDataRoot,
    gameplayTagCatalog: args.gameplayTagCatalog,
  });
  gearSets.definitions.forEach(gearSet => usage.addGearSet(gearSet));
  await rendering?.gearSets(gearSets);
}

async function mechanics(
  args: EntityValueConsumerSourceArguments,
  usage: SharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const mechanics = compileContingencyContractDefinitionsFromFiles({
    tableRoot: args.tableRoot,
    buffDataRoot: args.buffDataRoot,
    globalBuffCatalog: args.globalBuffCatalog,
    skillSettingCatalog: args.skillSettingCatalog,
    gameplayTagPaths: readGameplayTagPaths(args.gameplayTagCatalog),
    scope:
      args.mechanicScope ??
      path.resolve(import.meta.dirname, '../config/contingencyContractSimulationScope.json'),
  });
  usage.addBuffDefinitions(mechanics.buffDefinitions);
  mechanics.initializationPlans.forEach(plan => usage.addSequence(plan.sequence));
  await rendering?.mechanics(mechanics);
}
