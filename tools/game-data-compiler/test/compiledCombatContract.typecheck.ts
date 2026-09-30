import { expectTypeOf } from 'vitest';
import type {
  BuildModifierDefinition,
  BuildModifierDefinitionMap,
} from '../../../packages/game-data-contract/src/index.ts';
import type { CompiledBuildModifierDefinitionSource } from '../src/compiler/build/formalBuildDefinition.ts';
import type {
  ActionGraphReference,
  ActionGraphStep,
  CombatCondition,
  CombatStepDefinition,
  CombatStepParameters,
  CombatBuffDefinitionAttributeModifier,
  CombatBuffDefinitionDamageModifier,
  CombatBuffPresentation,
  HealModifierDefinition,
  PoiseModifierDefinition,
  SkillBuffDefinition,
  WeaponDefinition,
  GearDefinition,
  EquipmentAbilityEvent,
  EquipmentEventHandlerDefinition,
  GearSetDefinition,
  SkillDefinition,
  ScheduledSequenceDefinition,
} from '../../../packages/game-data-contract/src/index.ts';
import type {
  CompiledBuffAttributeModifierSource,
  CompiledBuffConditionSource,
  CompiledBuffDamageModifierSource,
  CompiledBuffDefinitionSource,
  CompiledBuffHealModifierSource,
  CompiledBuffPoiseModifierSource,
  CompiledBuffPresentationSource,
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
} from '../src/compiler/buffs/buffRuntimeProjection.ts';
import type {
  CompiledWeaponEventHandlerSource,
  CompiledWeaponRuntimeDefinitionSource,
} from '../src/domains/weapon/runtimeDefinition.ts';
import type {
  CompiledWeaponStaticDefinitionSource,
  CompiledWeaponTraitStaticDefinitionSource,
} from '../src/domains/weapon/staticDefinition.ts';
import type { CompiledGearDefinitionSource } from '../src/domains/equipment/formalDefinition.ts';
import type { CompiledTrustAttributeBonusSource } from '../src/domains/operator/talentNodes.ts';
import type { CompiledGearSetStaticDefinitionSource } from '../src/domains/equipment/suitStaticDefinition.ts';
import type { CompiledEquipmentSuitRuntimeBatchSource } from '../src/domains/equipment/suitRuntimeDefinition.ts';
import type { CompiledOperatorActiveSkillRuntimeDefinitionSource } from '../src/domains/operator/activeSkillRuntimeDefinition.ts';
import type { CompiledActiveSkillTimelineSequenceSource } from '../src/compiler/skills/activeSkillRuntimeProjection.ts';
import type {
  OperatorSkillGroupSource,
  OperatorSkillGroupVariantSource,
} from '../src/domains/operator/skillGroups.ts';
import type { CompiledOperatorProgressionEntrySource } from '../src/domains/operator/progressionEffects.ts';

/** 公共投影中实际携带 parameters 的动作种类；callMacro/callResource 是图引用节点，不属于契约动作参数域。 */
type ProjectedCombatKind = Extract<
  CompiledBuffStepSource,
  { readonly parameters: unknown }
>['kind'];

type IncompatibleParameters = {
  [K in ProjectedCombatKind]: [ProjectedParameters<K>] extends [never]
    ? K
    : ProjectedParameters<K> extends CombatStepParameters[K]
      ? never
      : K;
}[ProjectedCombatKind];

// 构筑修正独立于配装入口，编译输出保留显式公式槽
expectTypeOf<CompiledBuildModifierDefinitionSource>().toExtend<BuildModifierDefinition>();
expectTypeOf<
  BuildModifierDefinitionMap['staticHealingIncrease']
>().toExtend<CompiledBuildModifierDefinitionSource>();
expectTypeOf<
  BuildModifierDefinitionMap['skillCooldownMultiplier']
>().toExtend<CompiledBuildModifierDefinitionSource>();
expectTypeOf<{
  kind: 'damageScale';
  target: 'heat';
  value: number;
}>().not.toExtend<CompiledBuildModifierDefinitionSource>();
expectTypeOf<{
  kind: 'damageScale';
  target: 'heat';
  slot: 'addition';
  value: number;
}>().toExtend<CompiledBuildModifierDefinitionSource>();

// 技能编排不混入旧字段，养成修改保留必需运算
expectTypeOf<OperatorSkillGroupSource>().not.toHaveProperty('levelSource');
expectTypeOf<OperatorSkillGroupVariantSource>().not.toHaveProperty('levelSource');
expectTypeOf<OperatorSkillGroupSource>().not.toHaveProperty('nativeGroupType');
expectTypeOf<OperatorSkillGroupVariantSource>().not.toHaveProperty('nativeGroupType');
type BlackboardPatch = Extract<
  CompiledOperatorProgressionEntrySource,
  { kind: 'skillBlackboardModifier' }
>;
expectTypeOf<BlackboardPatch>().not.toBeNever();
expectTypeOf<Omit<BlackboardPatch, 'operation'>>().not.toExtend<BlackboardPatch>();
expectTypeOf<
  Omit<BlackboardPatch, 'operation'> & { operation: 'none' }
>().not.toExtend<BlackboardPatch>();
expectTypeOf<BlackboardPatch['operation']>().toEqualTypeOf<'add' | 'multiply' | 'overwrite'>();

// 信赖属性不接受笼统的主属性占位
expectTypeOf<{
  values: readonly [1];
  attributes: readonly ['main'];
}>().not.toExtend<CompiledTrustAttributeBonusSource>();

// 套装阶段输出符合正式契约但不自动纳入未支持事件
type Runtime = CompiledEquipmentSuitRuntimeBatchSource['definitions'][number];
expectTypeOf<CompiledGearSetStaticDefinitionSource>().toExtend<GearSetDefinition>();
expectTypeOf<Runtime>().toExtend<GearSetDefinition>();
expectTypeOf<{}>().not.toExtend<Pick<CompiledGearSetStaticDefinitionSource, 'modifiers'>>();
expectTypeOf<Extract<keyof Runtime, 'eventHandlers' | 'displayName'>>().toBeNever();

// 主动技能及实体共用调度子集，结束帧和技能来源信息保持必填
type Active = CompiledOperatorActiveSkillRuntimeDefinitionSource;
// 投影结果尚未装配战斗分类与养成来源，不能冒充完整技能。
expectTypeOf<Active>().not.toExtend<SkillDefinition>();
expectTypeOf<CompiledActiveSkillTimelineSequenceSource>().toExtend<ScheduledSequenceDefinition>();
expectTypeOf<{}>().not.toExtend<Pick<CompiledActiveSkillTimelineSequenceSource, 'endFrame'>>();
expectTypeOf<{}>().not.toExtend<Pick<Active, 'blackboard' | 'key' | 'costFrame'>>();
expectTypeOf<Extract<keyof Active, 'eventHandlers' | 'availability'>>().toBeNever();

// 由 type-check:game-data 真正检查，Vitest 执行本身不能替代类型门禁。
// 方向必须是“所有公共投影输出均能交给契约”，不只是某份 JSON 恰巧通过 validator。
// 公共 Buff、动作与武器装配输出是独立契约的子集
expectTypeOf<CompiledBuffStepSource>().not.toBeNever();
expectTypeOf<IncompatibleParameters>().toEqualTypeOf<never>();
expectTypeOf<CompiledBuffPresentationSource>().toExtend<CombatBuffPresentation>();
expectTypeOf<CompiledBuffAttributeModifierSource>().toExtend<CombatBuffDefinitionAttributeModifier>();
expectTypeOf<CompiledBuffDamageModifierSource>().toExtend<CombatBuffDefinitionDamageModifier>();
expectTypeOf<CompiledBuffHealModifierSource>().toExtend<HealModifierDefinition>();
expectTypeOf<CompiledBuffPoiseModifierSource>().toExtend<PoiseModifierDefinition>();
expectTypeOf<CompiledBuffConditionSource>().toExtend<CombatCondition>();
expectTypeOf<CompiledBuffStepSource>().toExtend<ActionGraphStep>();
expectTypeOf<
  Extract<CompiledBuffStepSource, { readonly parameters: unknown }>
>().toExtend<CombatStepDefinition>();
expectTypeOf<CompiledBuffSequenceSource>().toExtend<ActionGraphReference>();
expectTypeOf<CompiledBuffDefinitionSource>().toExtend<SkillBuffDefinition>();
expectTypeOf<CompiledWeaponRuntimeDefinitionSource>().toExtend<WeaponDefinition>();

type ProjectedParameters<K extends ProjectedCombatKind> = Extract<
  CompiledBuffStepSource,
  { kind: K }
>['parameters'];

// 投影成员检查拒绝未知kind，并保留真实输出的必填字段
expectTypeOf<ProjectedParameters<'heal'>>().not.toBeNever();
expectTypeOf<{}>().not.toExtend<ProjectedParameters<'heal'>>();
// @ts-expect-error 拼错的kind必须报错，不能筛成never后冒充验收通过。
type UnknownProjection = ProjectedParameters<'unknownProjection'>;
expectTypeOf<UnknownProjection>();

// 武器与装备阶段输出符合契约并保留必需字段
expectTypeOf<CompiledWeaponStaticDefinitionSource>().toExtend<WeaponDefinition>();
expectTypeOf<CompiledGearDefinitionSource>().toExtend<GearDefinition>();
expectTypeOf<{}>().not.toExtend<Pick<CompiledGearDefinitionSource, 'assetSlug'>>();
expectTypeOf<{}>().not.toExtend<Pick<CompiledWeaponTraitStaticDefinitionSource, 'modifiers'>>();
expectTypeOf<Extract<keyof CompiledWeaponStaticDefinitionSource, 'displayName'>>().toBeNever();

// 武器生成只走原生事件入口，监听器不重复声明能力黑板
type SemanticEvent = Extract<CompiledWeaponEventHandlerSource, { event: unknown }>['event'];
type AbilityEvent = Extract<
  CompiledWeaponEventHandlerSource,
  { abilityEvent: unknown }
>['abilityEvent'];
expectTypeOf<CompiledWeaponEventHandlerSource>().toExtend<EquipmentEventHandlerDefinition>();
expectTypeOf<AbilityEvent>().toEqualTypeOf<EquipmentAbilityEvent>();
expectTypeOf<AbilityEvent>().not.toBeNever();
expectTypeOf<SemanticEvent>().toBeNever();
expectTypeOf<Extract<keyof CompiledWeaponEventHandlerSource, 'event' | 'blackboard'>>().toBeNever();
expectTypeOf<{}>().not.toExtend<Pick<CompiledWeaponEventHandlerSource, 'priority'>>();
expectTypeOf<{}>().not.toExtend<Pick<CompiledWeaponEventHandlerSource, 'abilityEvent'>>();
// 完整公共契约仍保留兼容入口的互斥约束；生成器不再生成该入口。
expectTypeOf<{
  key: string;
  priority: number;
  blackboard: {};
  sequence: CompiledBuffSequenceSource;
  event: { kind: 'buffConsumed' };
  abilityEvent: 'enterFight';
}>().not.toExtend<EquipmentEventHandlerDefinition>();

// 契约派生仍保留条件种类、目标和递归子树的支持边界
expectTypeOf<{
  kind: 'eventSkillTypeIn';
  skillTypes: readonly ['finisher'];
}>().not.toExtend<CompiledBuffConditionSource>();
expectTypeOf<{
  kind: 'not';
  condition: { kind: 'combatActive' };
}>().not.toExtend<CompiledBuffConditionSource>();
expectTypeOf<
  Extract<CompiledBuffConditionSource, { kind: 'healthCompare' }>['target']
>().toEqualTypeOf<'caster' | 'contextTarget' | 'controlledOperator' | 'currentTarget' | 'enemy'>();
expectTypeOf<
  Extract<CompiledBuffConditionSource, { kind: 'buffStackCompare' }>['sameSourceSkillCast']
>().toEqualTypeOf<boolean | undefined>();
expectTypeOf<
  Extract<CompiledBuffConditionSource, { kind: 'buffIdStackCompare' }>['sameSourceSkillCast']
>().toEqualTypeOf<boolean | undefined>();

// 动作窄子集只纳入已证明的实体曲线，不扩张等级列或未知运算
expectTypeOf<
  Extract<ProjectedParameters<'startTimeDilation'>, { scope: 'entity' }>['curve']['kind']
>().toEqualTypeOf<'inline' | 'named'>();
expectTypeOf<ProjectedParameters<'modifyActionValue'>['operation']>().toEqualTypeOf<
  'assign' | 'add' | 'multiply' | 'divide' | 'floor' | 'ceil' | 'roundToInt'
>();
expectTypeOf<
  Extract<keyof ProjectedParameters<'applyBuff'>, 'definition' | 'durationSeconds'>
>().toBeNever();
expectTypeOf<{ target: 'caster'; tagIds: readonly [] }>().not.toExtend<
  ProjectedParameters<'heal'>
>();

// Buff 生命周期只接入已支持的阶段
expectTypeOf<keyof NonNullable<CompiledBuffDefinitionSource['lifecycleSequences']>>().toEqualTypeOf<
  'start' | 'enable' | 'trigger' | 'enhanceChanged' | 'afterEnhance' | 'finish'
>();
