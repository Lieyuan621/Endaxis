/**
 * 汇总整批定义对能力实体黑板的外部读取，再解析一名干员的实体传值用途。
 * 技能可以把 direct 快照传给实体；Buff、其他子技能和队友查询随后都可能读取这些值。
 * 因此共享用途必须来自同批完整数据，不能把单个干员或某次模拟当成封闭世界。
 */
import type { ActionSequenceDefinition } from '../../../../../packages/game-data-contract/src/actions.ts';
import type {
  OperatorBuffDefinitions,
  SkillBuffDefinition,
} from '../../../../../packages/game-data-contract/src/buffs.ts';
import type { CombatCondition } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type {
  EquipmentContributionDefinition,
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../../../packages/game-data-contract/src/equipment.ts';
import type {
  OperatorDefinition,
  OperatorPassiveSkillDefinition,
  OperatorUpgradeDefinition,
} from '../../../../../packages/game-data-contract/src/operators.ts';
import type {
  AbilityEntityDefinition,
  OperatorAbilityEntityDefinitions,
  SkillDefinition,
} from '../../../../../packages/game-data-contract/src/skills.ts';
import { analyzeBuffDefinitionUsage } from '../buffs/buffValueUsage.ts';
import {
  actionValueUsage,
  analyzeConditionUsage,
  analyzeSequenceUsage,
  mergeDefinitionValueUsage,
  type DefinitionUsageContext,
  type DefinitionValueUsage,
} from './definitionUsageAnalysis.ts';

/** 所有实体都必须保留的外部用途。首版不缩小 Buff 目标，允许多保留键。 */
export interface SharedEntityValueUsage {
  readonly reads: ReadonlySet<string>;
  readonly unknownAccess: boolean;
  readonly commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions;
}

/**
 * 每个可能读取能力实体板的来源必须显式提供，空域也写为空集合。场景机制不走普通装备
 * 目录，但仍可能查询实体或创建带动作的 Buff。自定义定义也应并入对应域后重做分析。
 * 系统 elementalAttachments 属于敌方元素 Buff 定义；
 * CombatBuffDefinitionAction 只读取该 Buff 板或对象属性，没有能力实体黑板查询出口，
 * 所以不加载这个运行时文档。敌人定义也只有面板和失衡配置，没有动作入口。
 */
export interface SharedEntityValueUsageInput {
  readonly operators: readonly OperatorDefinition[];
  readonly commonBuffDefinitions: OperatorBuffDefinitions;
  readonly commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions;
  readonly weapons: readonly WeaponDefinition[];
  readonly gears: readonly GearDefinition[];
  readonly gearSets: readonly GearSetDefinition[];
  readonly mechanicBuffDefinitions: OperatorBuffDefinitions;
  readonly mechanicSequences: readonly ActionSequenceDefinition[];
}

/**
 * 分批编译后立即合并用途，使调用方可以释放装备、机制和干员的完整定义。
 * finish 只表示收集结束；是否已覆盖完整来源仍由调用方保证，不能拿局部摘要开启精确裁剪。
 */
export interface SharedEntityValueUsageCollector {
  addOperator(operator: OperatorDefinition): void;
  /** 公共、私有和机制 Buff 均按相同规则处理。 */
  addBuffDefinitions(definitions: OperatorBuffDefinitions): void;
  addWeapon(weapon: WeaponDefinition): void;
  addGear(gear: GearDefinition): void;
  addGearSet(gearSet: GearSetDefinition): void;
  addSequence(sequence: ActionSequenceDefinition): void;
  /** 合并其他阶段的摘要，必须引用创建本收集器时的同一个公共实体目录对象。 */
  addUsage(usage: SharedEntityValueUsage): void;
  /** 返回最终摘要，之后拒绝新增用途，避免优化上下文漏掉迟来的读取或未知访问。 */
  finish(): SharedEntityValueUsage;
}

const empty = () => mergeDefinitionValueUsage([]);

/**
 * snapshot 只复制 direct 层，不枚举后备实体板。收集后备板读取时，不把这种传出误报为
 * “读取全部宿主键”；显式赋值操作数和回调的实际读取仍由公共用途分析器汇总。
 */
const fallbackContext: DefinitionUsageContext = { inheritedAbilityEntityUsage: empty };

export function collectSharedEntityValueUsage(
  input: SharedEntityValueUsageInput,
): SharedEntityValueUsage {
  const collector = createSharedEntityValueUsageCollector(input.commonAbilityEntityDefinitions);
  input.operators.forEach(collector.addOperator);
  collector.addBuffDefinitions(input.commonBuffDefinitions);
  input.weapons.forEach(collector.addWeapon);
  input.gears.forEach(collector.addGear);
  input.gearSets.forEach(collector.addGearSet);
  collector.addBuffDefinitions(input.mechanicBuffDefinitions);
  input.mechanicSequences.forEach(collector.addSequence);
  return collector.finish();
}

/**
 * 只强引用读键和公共实体目录；用于去重的 WeakSet 不阻止调用方释放已经分析过的定义。
 * 公共实体目录继续保留，供后续解析按 ID 生成的实体及其子技能。
 */
export function createSharedEntityValueUsageCollector(
  commonAbilityEntityDefinitions: OperatorAbilityEntityDefinitions,
): SharedEntityValueUsageCollector {
  const reads = new Set<string>();
  let unknownAccess = false;
  let result: SharedEntityValueUsage | undefined;
  const requireOpen = () => {
    if (result !== undefined) throw new Error('entity value usage collection is already finished');
  };
  const observedSequences = new WeakSet<ActionSequenceDefinition>();
  const observedBuffs = new WeakSet<SkillBuffDefinition>();
  const observedEntities = new WeakSet<AbilityEntityDefinition>();
  const observe = (usage: DefinitionValueUsage, includeCurrent = false) => {
    if (includeCurrent) {
      usage.reads.forEach(key => reads.add(key));
      usage.writes.forEach(key => reads.add(key));
    }
    // Buff 查询当前返回 direct 快照。仍保守纳入这些键，避免缩小其宿主/来源关系。
    usage.externalReads.forEach(read => reads.add(read.key));
    unknownAccess ||= usage.unknownAccess;
  };
  const condition = (value: CombatCondition | undefined) => {
    if (value !== undefined) observe(analyzeConditionUsage(value));
  };
  const buff = (value: SkillBuffDefinition) => {
    if (observedBuffs.has(value)) return;
    observedBuffs.add(value);
    observe(analyzeBuffDefinitionUsage(value, fallbackContext), true);
    value.scheduledSequences?.forEach(item => sequence(item.sequence));
    Object.values(value.lifecycleSequences ?? {}).forEach(program => {
      if (program !== undefined) sequence(program);
    });
    value.abilityEventResponses?.forEach(response => sequence(response.sequence));
    value.igniteEventResponses?.forEach(response => sequence(response.sequence));
    value.damageModifiers?.forEach(modifier => {
      if (modifier.conditionProgram !== undefined) sequence(modifier.conditionProgram);
    });
  };
  const entity = (value: AbilityEntityDefinition) => {
    if (observedEntities.has(value)) return;
    observedEntities.add(value);
    value.childSkill?.scheduledSequences.forEach(item => sequence(item.sequence));
    Object.values(value.childSkills ?? {}).forEach(child =>
      child.scheduledSequences.forEach(item => sequence(item.sequence)),
    );
    value.passiveSkills?.forEach(passive);
  };
  const sequence = (value: ActionSequenceDefinition) => {
    if (observedSequences.has(value)) return;
    observedSequences.add(value);
    observe(analyzeSequenceUsage(value, fallbackContext));
    for (const step of value.steps) {
      switch (step.kind) {
        case 'spawnAbilityEntity':
          if (step.parameters.definition !== undefined) entity(step.parameters.definition);
          break;
        case 'applyBuff':
          if (step.parameters.definition !== undefined) buff(step.parameters.definition);
          break;
        case 'conditional':
          sequence(step.whenTrue);
          if (step.whenFalse !== undefined) sequence(step.whenFalse);
          break;
        case 'switch':
          step.options.forEach(option => sequence(option.sequence));
          break;
        case 'once':
        case 'repeatEachTick':
        case 'repeatByActionValue':
        case 'forEachContextTarget':
        case 'withActionBlackboardScope':
          sequence(step.body);
          break;
        case 'listenForCombatEvents':
          step.parameters.responses.forEach(response => sequence(response.sequence));
          break;
        case 'scheduleProjectileFinishCallback':
          step.callback.scheduledSequences.forEach(item => sequence(item.sequence));
          break;
      }
    }
  };
  const passive = (value: OperatorPassiveSkillDefinition) => {
    sequence(value.enableSequence);
    value.abilityEventResponses?.forEach(response => {
      sequence(response.sequence);
    });
  };
  const skill = (value: SkillDefinition) => {
    condition(value.availability);
    value.scheduledSequences.forEach(item => sequence(item.sequence));
    if (value.switchToBuffCast !== undefined) {
      condition(value.switchToBuffCast.condition);
      sequence(value.switchToBuffCast.sequence);
    }
    value.eventHandlers?.forEach(handler => {
      condition(handler.condition);
      handler.scheduledSequences.forEach(item => sequence(item.sequence));
    });
  };
  const skills = (values: SkillDefinition | readonly SkillDefinition[]) => {
    if ('key' in values) skill(values);
    else values.forEach(skill);
  };
  const upgrade = (value: OperatorUpgradeDefinition) => {
    if (value.initializationSequence !== undefined) sequence(value.initializationSequence);
    value.eventHandlers?.forEach(handler => {
      sequence(handler.sequence);
    });
    value.passiveSkills?.forEach(passive);
  };
  const contribution = (value: EquipmentContributionDefinition) => {
    if (value.enableSequence !== undefined) sequence(value.enableSequence);
    if (value.initializationSequence !== undefined) sequence(value.initializationSequence);
    value.eventHandlers?.forEach(handler => {
      condition(handler.condition);
      sequence(handler.sequence);
    });
    Object.values(value.buffDefinitions ?? {}).forEach(buff);
  };
  const operator = (value: OperatorDefinition) => {
    value.skillGroups.forEach(group => {
      skills(group.skills);
      group.variants?.forEach(variant => skills(variant.skills));
      group.replacementSkills?.forEach(skill);
      group.routedReplacementSkills?.forEach(route => skill(route.skill));
    });
    value.talents.forEach(upgrade);
    value.potentials.forEach(upgrade);
    value.passiveSkills?.forEach(passive);
    value.eventHandlers?.forEach(handler => {
      sequence(handler.sequence);
    });
    value.comboSkillConditions?.forEach(value => sequence(value.sequence));
    Object.values(value.buffDefinitions ?? {}).forEach(buff);
    Object.values(value.abilityEntityDefinitions ?? {}).forEach(entity);
  };
  Object.values(commonAbilityEntityDefinitions).forEach(entity);
  return {
    addOperator(value) {
      requireOpen();
      operator(value);
    },
    addBuffDefinitions(definitions) {
      requireOpen();
      Object.values(definitions).forEach(buff);
    },
    addWeapon(weapon) {
      requireOpen();
      weapon.traits.forEach(contribution);
    },
    addGear(gear) {
      requireOpen();
      gear.traits.forEach(contribution);
    },
    addGearSet(gearSet) {
      requireOpen();
      contribution(gearSet);
    },
    addSequence(value) {
      requireOpen();
      sequence(value);
    },
    addUsage(usage) {
      requireOpen();
      if (usage.commonAbilityEntityDefinitions !== commonAbilityEntityDefinitions)
        throw new Error('entity value usage summaries must share the same common entity catalog');
      usage.reads.forEach(key => reads.add(key));
      unknownAccess ||= usage.unknownAccess;
    },
    finish() {
      result ??= { reads, unknownAccess, commonAbilityEntityDefinitions };
      return result;
    },
  };
}

/** 未提供整批共享用途时不开启实体精确传值；循环或缺失接收方同样返回未知。 */
export function createEntityUsageContext(
  definitions: OperatorAbilityEntityDefinitions | undefined,
  shared: SharedEntityValueUsage | undefined,
): DefinitionUsageContext | undefined {
  if (shared === undefined) return undefined;
  const cache = new WeakMap<AbilityEntityDefinition, DefinitionValueUsage>();
  const visiting = new WeakSet<AbilityEntityDefinition>();
  const sharedUsage: DefinitionValueUsage = {
    ...empty(),
    reads: shared.reads,
    unknownAccess: shared.unknownAccess,
  };
  const unresolved = (): DefinitionValueUsage => ({ ...empty(), unknownAccess: true });
  const context: DefinitionUsageContext = {
    inheritedAbilityEntityUsage(step) {
      const id = step.parameters.abilityEntityId;
      const definition =
        step.parameters.definition ??
        definitions?.[id] ??
        shared.commonAbilityEntityDefinitions[id];
      if (definition === undefined || visiting.has(definition)) return unresolved();
      const previous = cache.get(definition);
      if (previous !== undefined) return previous;
      visiting.add(definition);
      const usages = [sharedUsage];
      const number = (value: AbilityEntityDefinition['maxStackingCount']) => {
        if (typeof value === 'object')
          usages.push(
            actionValueUsage({
              kind: 'blackboard',
              key: value.blackboardKey,
              fallback: value.fallback,
            }),
          );
      };
      if (definition.lifetime.kind === 'limited') number(definition.lifetime.durationSeconds);
      number(definition.maxStackingCount);
      const programs = [
        ...(definition.childSkill?.scheduledSequences ?? []),
        ...Object.values(definition.childSkills ?? {}).flatMap(child => child.scheduledSequences),
      ];
      programs.forEach(item => usages.push(analyzeSequenceUsage(item.sequence, context)));
      for (const passive of definition.passiveSkills ?? []) {
        usages.push(analyzeSequenceUsage(passive.enableSequence, context));
        for (const response of passive.abilityEventResponses ?? []) {
          usages.push(analyzeSequenceUsage(response.sequence, context));
        }
      }
      visiting.delete(definition);
      const result = mergeDefinitionValueUsage(usages);
      cache.set(definition, result);
      return result;
    },
  };
  return context;
}
