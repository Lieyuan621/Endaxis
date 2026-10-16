/**
 * 从本次重建使用的来源编译装备和机制消费者，供实体黑板用途分析。
 * 每个领域编译后立即汇总用途，调用方可保留投影结果，待消费者收齐后渲染。
 * 不读正式生成库，不写候选文件；缺来源或未支持行为继续报错。
 */
import path from 'node:path';
import { compileConsumableDefinitionsFromFiles } from './generateConsumableDefinitions.ts';
import { compileWeaponDefinitionsFromFiles } from './generateWeaponDefinitions.ts';
import { compileGearSetDefinitionsFromFiles } from './generateGearSetDefinitions.ts';
import { compileGearDefinitionsFromFiles } from './generateGearDefinitions.ts';
import { compileContingencyContractDefinitionsFromFiles } from './generateContingencyContractDefinitions.ts';
import type { CompiledContingencyContractDefinitions } from './generateContingencyContractDefinitions.ts';
import type { CompiledWeaponRuntimeDefinitionBatchSource } from '../src/domains/weapon/runtimeDefinition.ts';
import type { CompiledEquipmentDefinitionBatchSource } from '../src/domains/equipment/formalDefinition.ts';
import type { CompiledEquipmentSuitRuntimeBatchSource } from '../src/domains/equipment/suitRuntimeDefinition.ts';
import {
  createGraphSharedEntityValueUsageCollector,
  type GraphSharedEntityValueUsageCollector,
} from '../src/compiler/optimization/graphValueOptimization.ts';
import { readGameplayTagPaths } from './readGameplayTagPaths.ts';
import type { NativeJsonEncodingSchema } from '../src/source/nativeJsonEncoding.ts';

export interface EntityValueConsumerSourceArguments {
  readonly sourceRoot: string;
  readonly tableRoot: string;
  readonly buffDataRoot: string;
  readonly gameplayTagCatalog: string;
  readonly globalBuffCatalog: string;
  readonly skillSettingCatalog: string;
  readonly mechanicScope?: string;
  /** 保留现有合约产物，不重新读取合约来源；不为未参与编译的资源伪造变量访问。 */
  readonly skipContingencyContract?: boolean;
  readonly nativeJsonEncoding?: NativeJsonEncodingSchema;
}

/** 完整重建复用同一次编译的投影结果；单人入口只保留用途摘要。 */
export interface EntityValueConsumerRendering {
  readonly consumables: (
    batch: ReturnType<typeof compileConsumableDefinitionsFromFiles>,
  ) => void | Promise<void>;
  readonly weapons: (batch: CompiledWeaponRuntimeDefinitionBatchSource) => void | Promise<void>;
  readonly gears: (batch: CompiledEquipmentDefinitionBatchSource) => void | Promise<void>;
  readonly gearSets: (batch: CompiledEquipmentSuitRuntimeBatchSource) => void | Promise<void>;
  readonly mechanics: (batch: CompiledContingencyContractDefinitions) => void | Promise<void>;
}

/** 每次调用重新编译外部领域；无渲染回调时只收集用途，供正式单人生成使用。 */
export async function compileEntityValueConsumers(
  args: EntityValueConsumerSourceArguments,
  rendering?: EntityValueConsumerRendering,
) {
  // 默认仓库没有共享实体定义；游戏实体随所属干员收集。
  const usage = createGraphSharedEntityValueUsageCollector({});
  await weapons(args, usage, rendering);
  await gears(args, usage, rendering);
  await gearSets(args, usage, rendering);
  if (!args.skipContingencyContract) await mechanics(args, usage, rendering);
  const consumables = compileConsumableDefinitionsFromFiles(args);
  usage.addBuffDefinitions(consumables.buffDefinitions);
  await rendering?.consumables(consumables);
  return usage.finish();
}

async function weapons(
  args: EntityValueConsumerSourceArguments,
  usage: GraphSharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const weapons = compileWeaponDefinitionsFromFiles({
    tables: args.tableRoot,
    skillData: path.join(args.sourceRoot, 'SkillData'),
    buffData: args.buffDataRoot,
    gameplayTagCatalog: args.gameplayTagCatalog,
    nativeJsonEncoding: args.nativeJsonEncoding,
  });
  weapons.definitions.forEach(weapon => usage.addWeapon(weapon));
  await rendering?.weapons(weapons);
}

async function gears(
  args: EntityValueConsumerSourceArguments,
  usage: GraphSharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const gears = await compileGearDefinitionsFromFiles(args.tableRoot);
  gears.definitions.forEach(gear => usage.addGear(gear));
  await rendering?.gears(gears);
}

async function gearSets(
  args: EntityValueConsumerSourceArguments,
  usage: GraphSharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const gearSets = await compileGearSetDefinitionsFromFiles({
    tablesDirectory: args.tableRoot,
    skillDataDirectory: path.join(args.sourceRoot, 'SkillData'),
    buffDataDirectory: args.buffDataRoot,
    gameplayTagCatalog: args.gameplayTagCatalog,
    nativeJsonEncoding: args.nativeJsonEncoding,
  });
  gearSets.definitions.forEach(gearSet => usage.addGearSet(gearSet));
  await rendering?.gearSets(gearSets);
}

async function mechanics(
  args: EntityValueConsumerSourceArguments,
  usage: GraphSharedEntityValueUsageCollector,
  rendering: EntityValueConsumerRendering | undefined,
) {
  const mechanics = compileContingencyContractDefinitionsFromFiles({
    nativeJsonEncoding: args.nativeJsonEncoding,
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
  mechanics.initializationPlans.forEach(plan =>
    usage.addSequence({ graph: plan.actionGraph.main, entry: plan.sequence }),
  );
  await rendering?.mechanics(mechanics);
}
