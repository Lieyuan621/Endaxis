import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import type {
  AbilityEntityChildSkillDefinition,
  NativeSkillType,
} from '../intermediateDefinitions.ts';
import { projectSkillCastResourceDefinitionSource } from '../../source/skillCost.ts';
import { requireArray, requireRecord } from '../../source/primitives.ts';
import { parseSkillCastResourceMetadataSource } from '../../source/activeSkill.ts';
import { compileActiveSkillRuntimeProjectionSource } from '../skills/activeSkillRuntimeProjection.ts';
import { retainActionGraphEntries } from '../optimization/graphSequenceOptimization.ts';
import type {
  CombatActionProjectionContextSource,
  CombatActionProjectionExtensionsSource,
} from '../combatProjectionCommon.ts';

/**
 * 实体子技能与主动技能共用 SkillData 时间轴编译，只改变宿主身份及最终装配协议。
 * 子技能默认板独立于父技能等级；来源快照在实体生成时由既有运行时覆盖，不在转换时固定。
 */
export function compileAbilityEntityChildSkillSource(
  value: unknown,
  sourcePath: string,
  visualOnlyIds: ReadonlySet<string> = new Set(),
  gameplayTagRegistry?: GameplayTagRegistry,
  extensions?: CombatActionProjectionExtensionsSource,
  abilityEntityQueries?: CombatActionProjectionContextSource['abilityEntityQueries'],
  nativeMissingBlackboardZeroKeys: ReadonlySet<string> = new Set(),
  nativeSkillType: NativeSkillType = 'normalSkill',
  predefinedTagQueries?: CombatActionProjectionContextSource['predefinedTagQueries'],
): AbilityEntityChildSkillDefinition {
  const root = requireRecord(value, sourcePath);
  const cast = parseSkillCastResourceMetadataSource(value, sourcePath);
  const cost = cast.costData;
  // 冷却与确认时点由普通技能宿主执行；实体尚无资源池和多充能模型。
  if (cast.maxChargeTime !== 1 || cost.costValue !== 0 || cost.atbValueThreshold !== 0)
    throw new Error(`${sourcePath}: child skill costs or multiple charges are not projected`);
  if (
    requireArray(root.buffs, `${sourcePath}.buffs`).length ||
    requireArray(root.toggleBuffs, `${sourcePath}.toggleBuffs`).length
  )
    throw new Error(`${sourcePath}: child skill Buff installation is not projected`);
  const runtime = compileActiveSkillRuntimeProjectionSource({
    value,
    sourcePath,
    patch: null,
    context: {
      gameplayTagRegistry,
      predefinedTagQueries,
      actionOwnerTarget: 'currentAbilityEntity',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'actionInputTarget',
      // 单敌人零空间模拟中仍保留真实目标身份；坐标简化不等于把目标替换成敌人。
      actionInputIsZeroSpace: true,
      // SpawnAbilityEntity 装配器只会把
      // inheritSourceSkillCastId=true 的 Spawn 绑定为子技能。原生 OnSpawn
      // 把该 SkillCastInfo 保存到控制器，并用同一份值 TryCast 实体技能。
      actionEnvironmentSkillCastInfoIsSourceCast: true,
      ...(abilityEntityQueries === undefined ? {} : { abilityEntityQueries }),
    },
    visualOnlyIds,
    extensions,
  });
  for (const key of nativeMissingBlackboardZeroKeys) {
    if (Object.hasOwn(runtime.blackboard, key)) {
      throw new Error(`${sourcePath}: native missing-blackboard key '${key}' is already declared`);
    }
    if (!readsBlackboardKey(runtime.actionGraph, key)) {
      throw new Error(`${sourcePath}: native missing-blackboard key '${key}' is not read`);
    }
  }
  const definition = {
    // 子技能只保留定时入口；共用编译器生成的玩家输入旁路不是该宿主的执行入口。
    // 在依赖闭包之前裁剪孤立节点，避免引入无法执行的 Buff/实体依赖。
    actionGraph: {
      ...runtime.actionGraph,
      main: retainActionGraphEntries(
        runtime.actionGraph.main,
        runtime.scheduledSequences.map(item => item.sequence),
      ),
    },
    skillId: runtime.skillId,
    nativeSkillType,
    naturalDurationFrames: Math.max(1, runtime.durationFrame),
    ...(runtime.normalSkillSubType === undefined
      ? {}
      : { normalSkillSubType: runtime.normalSkillSubType }),
    castResource: projectSkillCastResourceDefinitionSource(cast, `${sourcePath}.castData`),
    blackboard: {
      ...runtime.blackboard,
      ...Object.fromEntries([...nativeMissingBlackboardZeroKeys].map(key => [key, 0] as const)),
    },
    scheduledSequences: runtime.scheduledSequences,
  };
  // 此处只输出候选。产品侧结构/运行验证在整名门禁中完成；不能把浏览器运行引擎加载进 Node 来源编译器。
  return definition;
}

function readsBlackboardKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some(item => readsBlackboardKey(item, key));
  if (value === null || typeof value !== 'object') return false;
  if (Reflect.get(value, 'kind') === 'blackboard' && Reflect.get(value, 'key') === key) return true;
  return Object.values(value).some(item => readsBlackboardKey(item, key));
}
