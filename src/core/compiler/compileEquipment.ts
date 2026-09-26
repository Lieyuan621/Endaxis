/**
 * 武器词条、装备词条与套装贡献进入面板/战斗装配层前的编译边界。
 * 这里只解析等级值并保留来源，不负责计算面板，也不把贡献装进可变战斗状态。
 */
import type {
  EquipmentContributionDefinition,
  EquipmentDamageScaleTarget,
  EquipmentEventHandlerDefinition,
  EquipmentAbilityEvent,
  EquipmentModifierDefinition,
  EquipmentPanelStat,
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import type {
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { ActionGraphDefinitionRepository } from './actionGraphDefinitionRepository';
import type {
  CombatCondition,
  CombatEventTrigger,
  DamageType,
  OperatorBuffDefinitions,
  OperatorAttribute,
  SkillType,
} from '../game-data/operatorDefinition';
import type { ResolvedActionSequence, ResolvedSkillBuffDefinition } from './combatProgram';
import { compileIndependentBuffResource } from './compileSkill';
import type { EquipmentContributionSource } from '../combat/state/foundationState';
export type { EquipmentContributionSource } from '../combat/state/foundationState';

/** 等级值已展开、可交给 Build Resolver 聚合的常驻修正。 */
export type ResolvedEquipmentModifier =
  | {
      readonly kind: 'attribute';
      readonly attribute: OperatorAttribute;
      readonly operation: 'flat' | 'percent';
      readonly value: number;
    }
  | {
      readonly kind: 'panelStat';
      readonly stat: EquipmentPanelStat;
      readonly value: number;
    }
  | {
      readonly kind: 'damageBonus';
      readonly damageTypes: DamageType | readonly DamageType[];
      readonly skillTypes?: SkillType | readonly SkillType[];
      readonly value: number;
    }
  | {
      readonly kind: 'damageScale';
      readonly target: EquipmentDamageScaleTarget;
      readonly slot: 'baseAddition' | 'addition';
      readonly value: number;
    }
  | {
      readonly kind: 'staticHealingIncrease';
      readonly target: 'output' | 'taken';
      readonly value: number;
    }
  | {
      readonly kind: 'skillCooldownMultiplier';
      readonly skillTypes: SkillType | readonly SkillType[];
      readonly value: number;
    };

/** 动作序列已解析，但尚未注册到事件总线的一项配装监听器。 */
interface CompiledEquipmentEventHandlerBase {
  readonly key: string;
  /** 编译器始终写入；可选只为兼容外部测试/装配端口的旧记录。 */
  readonly priority?: number;
  readonly condition?: CombatCondition;
  readonly sequence: ResolvedActionSequence;
}

export type CompiledEquipmentEventHandler = CompiledEquipmentEventHandlerBase &
  (
    | { readonly event: CombatEventTrigger; readonly abilityEvent?: never }
    | { readonly event?: never; readonly abilityEvent: EquipmentAbilityEvent }
  );

/** 单个定义能力的解析结果；来源身份供面板明细、诊断和卸载使用。 */
export interface CompiledEquipmentContribution {
  readonly source: EquipmentContributionSource;
  readonly selectedLevel: number;
  readonly modifiers: readonly ResolvedEquipmentModifier[];
  readonly eventHandlers: readonly CompiledEquipmentEventHandler[];
  readonly buffDefinitions?: Readonly<Record<string, ResolvedSkillBuffDefinition>>;
  readonly blackboard?: Readonly<Record<string, number>>;
  readonly enableSequence?: ResolvedActionSequence;
  readonly initializationSequence?: ResolvedActionSequence;
}

/** 面板只需静态修正；不为它编译装备内部的行为图和 Buff 程序。 */
export type CompiledEquipmentModifierContribution = Pick<
  CompiledEquipmentContribution,
  'source' | 'selectedLevel' | 'modifiers'
>;

/** 解析装备中 `main`、`secondary` 相对属性所需的干员构筑上下文。 */
export interface EquipmentAttributeContext {
  readonly main: OperatorAttribute;
  readonly secondary: OperatorAttribute;
}

function compileEquipmentBuffDefinitions(
  definitions: OperatorBuffDefinitions | undefined,
  repository: ActionGraphDefinitionRepository,
): Readonly<Record<string, ResolvedSkillBuffDefinition>> {
  return Object.fromEntries(
    Object.entries(definitions ?? {}).map(([id, definition]) => [
      id,
      compileIndependentBuffResource(definition, id, repository),
    ]),
  );
}

function graphPrograms(
  graph: ActionGraphResourceDefinition | undefined,
  repository: ActionGraphDefinitionRepository,
) {
  return {
    sequence: (entry: ActionGraphReference, level: number, path: string) => {
      if (graph === undefined)
        throw new Error(`${path}: equipment program has no owned action graph`);
      return repository.compile(graph, level).compileEntry(entry, path);
    },
  };
}

function resolveLevelValue(value: number | readonly number[], level: number, path: string): number {
  const resolved = typeof value === 'number' ? value : value[level - 1];
  if (resolved === undefined) throw new RangeError(`${path} has no value for level ${level}`);
  if (!Number.isFinite(resolved)) throw new TypeError(`${path} must resolve to a finite number`);
  return resolved;
}

function compileModifier(
  modifier: EquipmentModifierDefinition,
  level: number,
  path: string,
  attributes: EquipmentAttributeContext,
): ResolvedEquipmentModifier {
  const value = resolveLevelValue(modifier.value, level, `${path}.value`);
  switch (modifier.kind) {
    case 'attribute':
      return {
        kind: modifier.kind,
        attribute:
          modifier.attribute === 'main'
            ? attributes.main
            : modifier.attribute === 'secondary'
              ? attributes.secondary
              : modifier.attribute,
        operation: modifier.operation,
        value,
      };
    case 'panelStat':
      return { kind: modifier.kind, stat: modifier.stat, value };
    case 'damageBonus':
      return {
        kind: modifier.kind,
        damageTypes: modifier.damageTypes,
        ...(modifier.skillTypes === undefined ? {} : { skillTypes: modifier.skillTypes }),
        value,
      };
    case 'damageScale':
      return {
        kind: modifier.kind,
        target: modifier.target,
        slot: modifier.slot ?? 'baseAddition',
        value,
      };
    case 'staticHealingIncrease':
      return { kind: modifier.kind, target: modifier.target, value };
    case 'skillCooldownMultiplier':
      return { kind: modifier.kind, skillTypes: modifier.skillTypes, value };
  }
}

function compileEventHandler(
  handler: EquipmentEventHandlerDefinition,
  level: number,
  path: string,
  programs: ReturnType<typeof graphPrograms>,
): CompiledEquipmentEventHandler {
  const priority = handler.priority ?? 0;
  if (!Number.isInteger(priority)) {
    throw new TypeError(`${path}.priority must be an integer`);
  }
  return {
    key: handler.key,
    ...(handler.abilityEvent !== undefined
      ? { abilityEvent: handler.abilityEvent }
      : { event: handler.event }),
    priority,
    ...(handler.condition === undefined ? {} : { condition: handler.condition }),
    sequence: programs.sequence(handler.sequence, level, `${path}.sequence`),
  };
}

function compileContribution(
  definition: EquipmentContributionDefinition,
  selectedLevel: number,
  levelCount: number,
  source: EquipmentContributionSource,
  path: string,
  attributes: EquipmentAttributeContext,
  programs: ReturnType<typeof graphPrograms>,
  buffDefinitions: Readonly<Record<string, ResolvedSkillBuffDefinition>> = {},
): CompiledEquipmentContribution {
  if (source.kind === 'weaponTrait' && 'buffDefinitions' in definition)
    throw new Error(`${path}: skills may reference Buffs but cannot own their definitions`);
  const staticContribution = compileModifierContribution(
    definition,
    selectedLevel,
    levelCount,
    source,
    path,
    attributes,
  );
  return {
    ...staticContribution,
    eventHandlers: (definition.eventHandlers ?? []).map((handler, index) =>
      compileEventHandler(handler, selectedLevel, `${path}.eventHandlers[${index}]`, programs),
    ),
    buffDefinitions,
    ...(definition.blackboard === undefined
      ? {}
      : {
          blackboard: Object.fromEntries(
            Object.entries(definition.blackboard).map(([key, value]) => [
              key,
              resolveLevelValue(value, selectedLevel, `${path}.blackboard.${key}`),
            ]),
          ),
        }),
    ...(definition.enableSequence === undefined
      ? {}
      : {
          enableSequence: programs.sequence(
            definition.enableSequence,
            selectedLevel,
            `${path}.enableSequence`,
          ),
        }),
    ...(definition.initializationSequence === undefined
      ? {}
      : {
          initializationSequence: programs.sequence(
            definition.initializationSequence,
            selectedLevel,
            `${path}.initializationSequence`,
          ),
        }),
  };
}

export function compileModifierContribution(
  definition: Pick<EquipmentContributionDefinition, 'modifiers'>,
  selectedLevel: number,
  levelCount: number,
  source: EquipmentContributionSource,
  path: string,
  attributes: EquipmentAttributeContext,
): CompiledEquipmentModifierContribution {
  if (!Number.isInteger(selectedLevel) || selectedLevel <= 0 || selectedLevel > levelCount) {
    throw new RangeError(`${path} level must be an integer between 1 and ${levelCount}`);
  }
  return {
    source,
    selectedLevel,
    modifiers: (definition.modifiers ?? []).map((modifier, index) =>
      compileModifier(modifier, selectedLevel, `${path}.modifiers[${index}]`, attributes),
    ),
  };
}

/** 按 build 中一一对应的词条等级编译整把武器。 */
export function compileWeaponContributions(
  definition: WeaponDefinition,
  traitLevels: readonly number[],
  attributes: EquipmentAttributeContext,
  repository: ActionGraphDefinitionRepository,
): readonly CompiledEquipmentContribution[] {
  if (traitLevels.length !== definition.traits.length) {
    throw new RangeError(
      `weapon '${definition.slug}' expects ${definition.traits.length} trait levels, got ${traitLevels.length}`,
    );
  }
  return definition.traits.map((trait, index) =>
    compileContribution(
      trait,
      traitLevels[index]!,
      trait.levelCount,
      { kind: 'weaponTrait', slug: definition.slug, traitKey: trait.key },
      `weapon '${definition.slug}'.traits[${index}]`,
      attributes,
      graphPrograms(trait.actionGraph, repository),
    ),
  );
}

/** 武器级定义只编译一次，不绑定任意词条的等级、黑板或生命周期。 */
export function compileWeaponBuffDefinitions(
  definition: WeaponDefinition,
  repository: ActionGraphDefinitionRepository,
): Readonly<Record<string, ResolvedSkillBuffDefinition>> {
  return compileEquipmentBuffDefinitions(definition.buffDefinitions, repository);
}

/** 精锻等级以 0 为初始档，编译时转换为从 1 开始的等级索引。 */
function compileGear(
  definition: GearDefinition,
  artificingLevels: readonly number[],
  attributes: EquipmentAttributeContext,
): readonly CompiledEquipmentContribution[] {
  if (artificingLevels.length !== definition.traits.length) {
    throw new RangeError(
      `gear '${definition.slug}' expects ${definition.traits.length} artificing levels, got ${artificingLevels.length}`,
    );
  }
  return definition.traits.map((trait, index) => {
    const path = `gear '${definition.slug}'.traits[${index}]`;
    const selectedLevel = artificingLevels[index]! + 1;
    if (
      !Number.isInteger(selectedLevel) ||
      selectedLevel <= 0 ||
      selectedLevel > trait.levelCount
    ) {
      throw new RangeError(`${path} level must be an integer between 1 and ${trait.levelCount}`);
    }
    const contribution: CompiledEquipmentContribution = {
      source: { kind: 'gearTrait', slug: definition.slug, traitKey: trait.key },
      selectedLevel,
      modifiers: (trait.modifiers ?? []).map((modifier, modifierIndex) =>
        compileModifier(modifier, selectedLevel, `${path}.modifiers[${modifierIndex}]`, attributes),
      ),
      eventHandlers: [],
      buffDefinitions: {},
    };
    return contribution;
  });
}

export function compileGearContributions(
  definition: GearDefinition,
  artificingLevels: readonly number[],
  attributes: EquipmentAttributeContext,
): readonly CompiledEquipmentContribution[] {
  return compileGear(definition, artificingLevels, attributes);
}

/** 套装没有用户可选等级，满足三件规则后始终按唯一等级编译。 */
export function compileGearSetContribution(
  definition: GearSetDefinition,
  attributes: EquipmentAttributeContext,
  repository: ActionGraphDefinitionRepository,
): CompiledEquipmentContribution {
  return compileContribution(
    definition,
    1,
    1,
    { kind: 'gearSet', slug: definition.slug },
    `gear set '${definition.slug}'`,
    attributes,
    graphPrograms(definition.actionGraph, repository),
    compileEquipmentBuffDefinitions(definition.buffDefinitions, repository),
  );
}
