/**
 * 把构筑中启用的天赋、潜能统一解析为编译期养成计划，并将已支持的修正应用到技能程序。
 * 各编译阶段应复用这里的选择结果；运行时只消费修正后的程序，不再解释养成 DSL。
 */
import type {
  CompiledOperatorInitializationProgram,
  CompiledOperatorPassiveProgram,
  CompiledOperatorUpgradeEventProgram,
  CompiledSkillProgram,
  ResolvedCombatStepForKind,
} from './combatProgram';
import type {
  LevelValues,
  OperatorAttribute,
  OperatorDefinition,
  OperatorPassiveSkillDefinition,
  OperatorUpgradeDefinition,
  UpgradeModifierDefinition,
} from '../game-data/operatorDefinition';
import type { OperatorInstanceDocument } from '../project/schema';
import { compileActionSequence } from './compileSkill';
import { compareCombatNumbers } from '../../../packages/game-data-contract/src/primitives';
import { isOperatorPassiveAbilityEvent } from '../../../packages/game-data-contract/src/operators';
import type { BuildCondition } from '../../../packages/game-data-contract/src/conditions';

export interface ActiveOperatorUpgrade {
  readonly source: 'talent' | 'potential';
  /** Zero-based fixed slot within the source collection. */
  readonly index: number;
  readonly level: number;
  readonly definition: OperatorUpgradeDefinition;
}

/** 由构筑静态解析、在该干员创建复合元素状态时使用的语义修正。 */
export interface CompiledOperatorReactionModifier {
  readonly reaction: import('../game-data/operatorDefinition').ElementalReaction;
  readonly durationSecondsAddition: number;
  readonly effectivenessAddition: number;
}

export function compileOperatorReactionModifiers(
  upgrades: readonly ActiveOperatorUpgrade[],
): readonly CompiledOperatorReactionModifier[] {
  const totals = new Map<
    import('../game-data/operatorDefinition').ElementalReaction,
    { durationSecondsAddition: number; effectivenessAddition: number }
  >();
  for (const upgrade of upgrades) {
    (upgrade.definition.modifiers ?? []).forEach((modifier, modifierIndex) => {
      if (modifier.kind !== 'addReactionDuration' && modifier.kind !== 'addReactionEffectiveness') {
        return;
      }
      const path = `${upgrade.source} '${upgrade.index}'.modifiers[${modifierIndex}]`;
      const current = totals.get(modifier.reaction) ?? {
        durationSecondsAddition: 0,
        effectivenessAddition: 0,
      };
      if (modifier.kind === 'addReactionDuration') {
        current.durationSecondsAddition += resolveUpgradeLevelValue(
          modifier.seconds,
          upgrade.level,
          `${path}.seconds`,
        );
      } else {
        current.effectivenessAddition += resolveUpgradeLevelValue(
          modifier.value,
          upgrade.level,
          `${path}.value`,
        );
      }
      totals.set(modifier.reaction, current);
    });
  }
  return [...totals.entries()].map(([reaction, values]) => ({ reaction, ...values }));
}

/** 解析构筑当前实际启用的养成项；返回顺序固定为天赋声明顺序、潜能解锁顺序。 */
export function resolveActiveOperatorUpgrades(
  build: OperatorInstanceDocument,
  operator: OperatorDefinition,
): readonly ActiveOperatorUpgrade[] {
  const active: ActiveOperatorUpgrade[] = [];
  const knownTalentIndexes = new Set(operator.talents.map((_, index) => String(index)));

  for (const [key, level] of Object.entries(build.talentStates)) {
    if (!knownTalentIndexes.has(key) && level !== 0) {
      throw new RangeError(`operator talent state '${key}' does not exist`);
    }
  }
  operator.talents.forEach((definition, index) => {
    const level = build.talentStates[String(index)] ?? 0;
    if (!Number.isInteger(level) || level < 0 || level > definition.levels) {
      throw new RangeError(
        `operator talent slot ${index + 1} must be an integer between 0 and ${definition.levels}`,
      );
    }
    if (level > 0) active.push({ source: 'talent', index, level, definition });
  });

  const totalPotential = operator.potentials.reduce(
    (sum, definition) => sum + definition.levels,
    0,
  );
  if (
    !Number.isInteger(build.potential) ||
    build.potential < 0 ||
    build.potential > totalPotential
  ) {
    throw new RangeError(`operator potential must be an integer between 0 and ${totalPotential}`);
  }
  let remainingPotential = build.potential;
  for (const [index, definition] of operator.potentials.entries()) {
    if (remainingPotential <= 0) break;
    const level = Math.min(remainingPotential, definition.levels);
    active.push({ source: 'potential', index, level, definition });
    remainingPotential -= level;
  }
  return active;
}

const PANEL_MODIFIER_KINDS = new Set<UpgradeModifierDefinition['kind']>([
  'addBuildAttribute',
  'modifyBasePanelStat',
  'addStaticDamageIncrease',
  'addStaticHealingIncrease',
]);

function requireMultiplier(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${path} must be a non-negative finite number`);
  }
}

function resolveUpgradeLevelValue(value: LevelValues, upgradeLevel: number, path: string): number {
  const resolved = typeof value === 'number' ? value : value[upgradeLevel - 1];
  if (resolved === undefined) {
    throw new RangeError(`${path} has no value for upgrade level ${upgradeLevel}`);
  }
  if (!Number.isFinite(resolved)) throw new TypeError(`${path} must resolve to a finite number`);
  return resolved;
}

function matchesBuildCondition(
  condition: BuildCondition | undefined,
  attributes: Readonly<Record<OperatorAttribute, number>> | undefined,
  path: string,
): boolean {
  if (condition === undefined) return true;
  if (attributes === undefined) {
    throw new Error(`${path}.condition requires resolved final build attributes`);
  }
  return compareCombatNumbers(
    attributes[condition.left],
    attributes[condition.right],
    condition.operator,
  );
}

/**
 * 将已启用养成项中的原生常驻被动编译为单等级程序。
 * 声明顺序决定启用顺序；重复 key 会让 Buff 和事件归因不稳定，因此直接拒绝。
 */
function compilePassiveAbilityResponses(
  passive: OperatorPassiveSkillDefinition,
  level: number,
  path: string,
): Pick<CompiledOperatorPassiveProgram, 'abilityEventResponses'> {
  if (passive.abilityEventResponses === undefined) return {};
  return {
    abilityEventResponses: passive.abilityEventResponses.map((response, index) => {
      if (!isOperatorPassiveAbilityEvent(response.event) || !Number.isInteger(response.priority))
        throw new Error(`${path}.abilityEventResponses[${index}]: invalid event or priority`);
      return {
        ...response,
        sequence: compileActionSequence(
          response.sequence,
          level,
          `${path}.abilityEventResponses[${index}].sequence`,
        ),
      };
    }),
  };
}

export function compileOperatorPassivePrograms(
  upgrades: readonly ActiveOperatorUpgrade[],
  basePassives: readonly OperatorPassiveSkillDefinition[] = [],
  skillLevels?: OperatorInstanceDocument['skillLevels'],
): readonly CompiledOperatorPassiveProgram[] {
  const programs: CompiledOperatorPassiveProgram[] = [];
  const keys = new Set<string>();
  for (const [index, passive] of basePassives.entries()) {
    const path = `operator.passiveSkills[${index}]`;
    if (passive.key.length === 0) throw new Error(`${path}.key must not be empty`);
    if (passive.levelSource !== undefined && skillLevels === undefined) {
      throw new Error(`${path}.levelSource requires operator skill levels`);
    }
    const passiveLevel = passive.levelSource === undefined ? 1 : skillLevels?.[passive.levelSource];
    if (passiveLevel === undefined) {
      throw new Error(`${path}.levelSource requires operator skill levels`);
    }
    if (keys.has(passive.key)) throw new Error(`${path} duplicates passive '${passive.key}'`);
    keys.add(passive.key);
    programs.push({
      key: passive.key,
      initialBlackboard: Object.fromEntries(
        Object.entries(passive.blackboard ?? {}).map(([key, value]) => [
          key,
          resolveUpgradeLevelValue(value, passiveLevel, `${path}.blackboard.${key}`),
        ]),
      ),
      enableSequence: compileActionSequence(
        passive.enableSequence,
        passiveLevel,
        `${path}.enableSequence`,
      ),
      ...compilePassiveAbilityResponses(passive, passiveLevel, path),
    });
  }
  for (const upgrade of upgrades) {
    for (const [index, passive] of (upgrade.definition.passiveSkills ?? []).entries()) {
      const path = `${upgrade.source} '${upgrade.index}'.passiveSkills[${index}]`;
      if (passive.key.length === 0) throw new Error(`${path}.key must not be empty`);
      if (keys.has(passive.key)) throw new Error(`${path} duplicates passive '${passive.key}'`);
      keys.add(passive.key);
      programs.push({
        key: passive.key,
        initialBlackboard: Object.fromEntries(
          Object.entries(passive.blackboard ?? {}).map(([key, value]) => [
            key,
            resolveUpgradeLevelValue(value, upgrade.level, `${path}.blackboard.${key}`),
          ]),
        ),
        enableSequence: compileActionSequence(
          passive.enableSequence,
          upgrade.level,
          `${path}.enableSequence`,
        ),
        ...compilePassiveAbilityResponses(passive, upgrade.level, path),
      });
    }
  }
  let patched = programs;
  for (const upgrade of upgrades) {
    for (const [modifierIndex, modifier] of (upgrade.definition.modifiers ?? []).entries()) {
      if (modifier.kind !== 'patchPassiveBlackboard') continue;
      const path = `${upgrade.source} '${upgrade.index}'.modifiers[${modifierIndex}]`;
      const targets = patched.filter(program => program.key === modifier.passiveSkillKey);
      // 项目允许关闭天赋；此时潜能仍存在，但没有被动实例可供修改。
      if (targets.length === 0) continue;
      if (targets.length !== 1) {
        throw new Error(`${path} expected one passive '${modifier.passiveSkillKey}'`);
      }
      const value = resolveUpgradeLevelValue(modifier.value, upgrade.level, `${path}.value`);
      patched = patched.map(program => {
        if (program.key !== modifier.passiveSkillKey) return program;
        const previousValue = program.initialBlackboard[modifier.blackboardKey];
        if (previousValue === undefined) {
          throw new Error(
            `${path} references missing passive blackboard '${modifier.blackboardKey}'`,
          );
        }
        const nextValue =
          modifier.operation === 'add'
            ? previousValue + value
            : modifier.operation === 'multiply'
              ? previousValue * value
              : value;
        return {
          ...program,
          initialBlackboard: {
            ...program.initialBlackboard,
            [modifier.blackboardKey]: Math.fround(nextValue),
          },
        };
      });
    }
  }
  return patched;
}

/** 将直接附着 Buff 等养成初始化行为编译为独立的一次性程序。 */
export function compileOperatorInitializationPrograms(
  upgrades: readonly ActiveOperatorUpgrade[],
): readonly CompiledOperatorInitializationProgram[] {
  return upgrades.flatMap(upgrade => {
    const sequence = upgrade.definition.initializationSequence;
    if (sequence === undefined) return [];
    return [
      {
        key: `${upgrade.source}:${upgrade.index}`,
        sequence: compileActionSequence(
          sequence,
          upgrade.level,
          `${upgrade.source} '${upgrade.index}'.initializationSequence`,
        ),
      },
    ];
  });
}

function patchSkillBlackboard(
  programs: readonly CompiledSkillProgram[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'patchSkillBlackboard' }>,
  upgradeLevel: number,
  path: string,
  buildAttributes?: Readonly<Record<OperatorAttribute, number>>,
): readonly CompiledSkillProgram[] {
  const value = resolveUpgradeLevelValue(modifier.value, upgradeLevel, `${path}.value`);
  const isTarget = (program: CompiledSkillProgram): boolean =>
    (program.executionSkillGroupKey ?? program.skillGroupKey) === modifier.skillGroupKey &&
    (modifier.skillKey === undefined ||
      (program.executionSkillId ?? program.skillId) === modifier.skillKey);
  const targets = programs.filter(isTarget);
  if (targets.length === 0) {
    throw new Error(`${path} references missing skill group '${modifier.skillGroupKey}'`);
  }
  if (!matchesBuildCondition(modifier.condition, buildAttributes, path)) return programs;
  return programs.map(program => {
    if (!isTarget(program)) return program;
    const previousValue = program.initialBlackboard[modifier.blackboardKey] ?? 0;
    const nextValue =
      modifier.operation === 'add'
        ? previousValue + value
        : modifier.operation === 'multiply'
          ? previousValue * value
          : value;
    return {
      ...program,
      initialBlackboard: {
        ...program.initialBlackboard,
        [modifier.blackboardKey]: Math.fround(nextValue),
      },
    };
  });
}

export function multiplySkillCost<
  T extends Pick<CompiledSkillProgram, 'skillId' | 'executionSkillId' | 'skillGroupKey' | 'costs'>,
>(
  programs: readonly T[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'multiplySkillCost' }>,
  path: string,
): readonly T[] {
  requireMultiplier(modifier.multiplier, `${path}.multiplier`);
  const targets = programs.filter(
    program =>
      program.skillGroupKey === modifier.skillGroupKey &&
      (modifier.skillKey === undefined ||
        (program.executionSkillId ?? program.skillId) === modifier.skillKey),
  );
  if (targets.length === 0) {
    throw new Error(`${path} references missing skill group '${modifier.skillGroupKey}'`);
  }
  for (const target of targets) {
    if (!target.costs.some(cost => cost.resource === modifier.resource)) {
      throw new Error(`${path} target '${target.skillId}' has no '${modifier.resource}' cost`);
    }
  }
  return programs.map(program => {
    if (
      program.skillGroupKey !== modifier.skillGroupKey ||
      (modifier.skillKey !== undefined &&
        (program.executionSkillId ?? program.skillId) !== modifier.skillKey)
    )
      return program;
    return {
      ...program,
      costs: program.costs.map(cost =>
        cost.resource === modifier.resource
          ? { ...cost, value: cost.value * modifier.multiplier }
          : cost,
      ),
    };
  });
}

function addSkillCooldownFrames(
  programs: readonly CompiledSkillProgram[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'addSkillCooldownFrames' }>,
  path: string,
  buildAttributes?: Readonly<Record<OperatorAttribute, number>>,
): readonly CompiledSkillProgram[] {
  if (!Number.isInteger(modifier.frames)) {
    throw new RangeError(`${path}.frames must be an integer frame delta`);
  }
  if (!matchesBuildCondition(modifier.condition, buildAttributes, path)) return programs;
  const isTarget = (program: CompiledSkillProgram): boolean =>
    program.skillGroupKey === modifier.skillGroupKey &&
    (modifier.skillKey === undefined || program.skillId === modifier.skillKey);
  const targets = programs.filter(isTarget);
  if (targets.length === 0) {
    throw new Error(`${path} references missing skill group '${modifier.skillGroupKey}'`);
  }
  for (const target of targets) {
    if (target.cooldownFrames === undefined) {
      throw new Error(`${path} target '${target.skillId}' has no cooldown`);
    }
    if (target.cooldownFrames + modifier.frames <= 0) {
      throw new RangeError(`${path} makes target '${target.skillId}' cooldown non-positive`);
    }
  }
  return programs.map(program =>
    isTarget(program)
      ? { ...program, cooldownFrames: program.cooldownFrames! + modifier.frames }
      : program,
  );
}

type CompiledReactionStep = ResolvedCombatStepForKind<'applyElementalReaction'>;

function patchKeyedReactionStep(
  programs: readonly CompiledSkillProgram[],
  skillGroupKey: string,
  stepKey: string,
  path: string,
  patch: (step: CompiledReactionStep) => CompiledReactionStep,
): readonly CompiledSkillProgram[] {
  const isTarget = (program: CompiledSkillProgram): boolean =>
    (program.executionSkillGroupKey ?? program.skillGroupKey) === skillGroupKey;
  const targets = programs.filter(isTarget);
  if (targets.length === 0) {
    throw new Error(`${path} references missing skill group '${skillGroupKey}'`);
  }
  let matchCount = 0;
  const result = programs.map(program => {
    if (!isTarget(program)) return program;
    let programMatchCount = 0;
    const patchedProgram = {
      ...program,
      timelineActions: program.timelineActions.map(action => ({
        ...action,
        sequence: {
          steps: action.sequence.steps.map(step => {
            if (step.key !== stepKey) return step;
            if (step.kind !== 'applyElementalReaction') {
              throw new Error(
                `${path} step '${stepKey}' is '${step.kind}', expected 'applyElementalReaction'`,
              );
            }
            matchCount += 1;
            programMatchCount += 1;
            return patch(step);
          }),
        },
      })),
    };
    if (programMatchCount > 1) {
      throw new Error(
        `${path} expected at most one root reaction step '${stepKey}' per execution body`,
      );
    }
    return patchedProgram;
  });
  if (matchCount === 0) {
    throw new Error(`${path} expected exactly one root reaction step '${stepKey}', found 0`);
  }
  return result;
}

function multiplyEffectDuration(
  programs: readonly CompiledSkillProgram[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'multiplyEffectDuration' }>,
  path: string,
): readonly CompiledSkillProgram[] {
  requireMultiplier(modifier.multiplier, `${path}.multiplier`);
  return patchKeyedReactionStep(programs, modifier.skillGroupKey, modifier.stepKey, path, step => ({
    ...step,
    parameters: {
      ...step.parameters,
      durationMultiplier: (step.parameters.durationMultiplier ?? 1) * modifier.multiplier,
    },
  }));
}

function setEffectiveness(
  programs: readonly CompiledSkillProgram[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'setEffectiveness' }>,
  path: string,
): readonly CompiledSkillProgram[] {
  requireMultiplier(modifier.value, `${path}.value`);
  return patchKeyedReactionStep(programs, modifier.skillGroupKey, modifier.stepKey, path, step => ({
    ...step,
    parameters: { ...step.parameters, effectiveness: modifier.value },
  }));
}

function addSkillStat(
  programs: readonly CompiledSkillProgram[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'addSkillStat' }>,
  path: string,
): readonly CompiledSkillProgram[] {
  if (!Number.isFinite(modifier.value)) {
    throw new TypeError(`${path}.value must be finite`);
  }
  const isTarget = (program: CompiledSkillProgram): boolean =>
    (program.executionSkillGroupKey ?? program.skillGroupKey) === modifier.skillGroupKey;
  const targets = programs.filter(isTarget);
  if (targets.length === 0) {
    throw new Error(`${path} references missing skill group '${modifier.skillGroupKey}'`);
  }
  return programs.map(program => {
    if (!isTarget(program)) return program;
    return {
      ...program,
      statModifiers: {
        ...program.statModifiers,
        criticalRate: (program.statModifiers?.criticalRate ?? 0) + modifier.value,
      },
    };
  });
}

function addConditionalDamage(
  programs: readonly CompiledSkillProgram[],
  modifier: Extract<UpgradeModifierDefinition, { kind: 'addConditionalDamage' }>,
  upgradeLevel: number,
  path: string,
): readonly CompiledSkillProgram[] {
  const condition = modifier.condition;
  if (condition.kind !== 'targetStaggered' || condition.target !== 'enemy') {
    throw new Error(
      `${path}.condition only supports targetStaggered for the enemy damage snapshot`,
    );
  }
  const value = resolveUpgradeLevelValue(modifier.values, upgradeLevel, `${path}.values`);
  if (programs.length === 0) throw new Error(`${path} requires at least one compiled skill`);
  return programs.map(program => ({
    ...program,
    statModifiers: {
      ...program.statModifiers,
      damageToStaggeredEnemyIncrease:
        (program.statModifiers?.damageToStaggeredEnemyIncrease ?? 0) + value,
    },
  }));
}

/**
 * 按养成声明顺序修正技能程序。面板类 modifier 由面板编译器消费；其余还没做通的类型必须失败。
 */
export function applyOperatorUpgradeSkillPatches(
  programs: readonly CompiledSkillProgram[],
  upgrades: readonly ActiveOperatorUpgrade[],
  options: {
    readonly skipUncompiledSkillGroups?: boolean;
    readonly buildAttributes?: Readonly<Record<OperatorAttribute, number>>;
  } = {},
): readonly CompiledSkillProgram[] {
  if (options.skipUncompiledSkillGroups === true && programs.length === 0) return programs;
  let patched = programs;
  for (const upgrade of upgrades) {
    for (const [modifierIndex, modifier] of (upgrade.definition.modifiers ?? []).entries()) {
      const path = `${upgrade.source} '${upgrade.index}'.modifiers[${modifierIndex}]`;
      if (PANEL_MODIFIER_KINDS.has(modifier.kind)) continue;
      if (
        options.skipUncompiledSkillGroups === true &&
        'skillGroupKey' in modifier &&
        !patched.some(program => {
          const usesExecutionIdentity =
            modifier.kind === 'patchSkillBlackboard' ||
            modifier.kind === 'multiplyEffectDuration' ||
            modifier.kind === 'setEffectiveness' ||
            modifier.kind === 'addSkillStat';
          const groupKey = usesExecutionIdentity
            ? (program.executionSkillGroupKey ?? program.skillGroupKey)
            : program.skillGroupKey;
          const skillKey = usesExecutionIdentity
            ? (program.executionSkillId ?? program.skillId)
            : program.skillId;
          return (
            groupKey === modifier.skillGroupKey &&
            (!('skillKey' in modifier) ||
              modifier.skillKey === undefined ||
              skillKey === modifier.skillKey)
          );
        })
      ) {
        // 场景只编译实际放置的技能；未放置组的构筑补丁留给完整定义门禁校验。
        continue;
      }
      if (modifier.kind === 'multiplySkillCost') {
        patched = multiplySkillCost(patched, modifier, path);
        continue;
      }
      if (modifier.kind === 'patchSkillBlackboard') {
        if (
          (modifier.minimumUpgradeLevel !== undefined &&
            upgrade.level < modifier.minimumUpgradeLevel) ||
          (modifier.maximumUpgradeLevel !== undefined &&
            upgrade.level > modifier.maximumUpgradeLevel)
        ) {
          continue;
        }
        patched = patchSkillBlackboard(
          patched,
          modifier,
          upgrade.level,
          path,
          options.buildAttributes,
        );
        continue;
      }
      if (modifier.kind === 'addSkillCooldownFrames') {
        patched = addSkillCooldownFrames(patched, modifier, path, options.buildAttributes);
        continue;
      }
      if (modifier.kind === 'patchPassiveBlackboard') continue;
      if (modifier.kind === 'multiplyEffectDuration') {
        patched = multiplyEffectDuration(patched, modifier, path);
        continue;
      }
      if (modifier.kind === 'setEffectiveness') {
        patched = setEffectiveness(patched, modifier, path);
        continue;
      }
      if (modifier.kind === 'addSkillStat') {
        patched = addSkillStat(patched, modifier, path);
        continue;
      }
      if (modifier.kind === 'addConditionalDamage') {
        patched = addConditionalDamage(patched, modifier, upgrade.level, path);
        continue;
      }
      if (modifier.kind === 'addReactionDuration' || modifier.kind === 'addReactionEffectiveness') {
        // 反应由复合状态工厂创建，不属于某个技能步骤；场景编译器会把静态汇总交给战斗环境。
        continue;
      }
      throw new Error(`${path} kind '${modifier.kind}' is not connected to skill compilation`);
    }
  }
  return patched;
}

/**
 * 将启用养成项的同步事件动作编译为独立程序；事件监听不伪装成可释放技能。
 */
export function compileOperatorUpgradeEventPrograms(
  upgrades: readonly ActiveOperatorUpgrade[],
): readonly CompiledOperatorUpgradeEventProgram[] {
  const programs: CompiledOperatorUpgradeEventProgram[] = [];
  const keys = new Set<string>();
  for (const upgrade of upgrades) {
    for (const [index, handler] of (upgrade.definition.eventHandlers ?? []).entries()) {
      const key = `${upgrade.source}:${upgrade.index}:${index}`;
      if (keys.has(key)) throw new Error(`duplicate operator upgrade event program '${key}'`);
      keys.add(key);
      programs.push({
        key,
        event: handler.event,
        initialBlackboard: Object.fromEntries(
          Object.entries(handler.blackboard ?? {}).map(([blackboardKey, value]) => [
            blackboardKey,
            resolveUpgradeLevelValue(
              value,
              upgrade.level,
              `${upgrade.source} '${upgrade.index}'.eventHandlers[${index}].blackboard.${blackboardKey}`,
            ),
          ]),
        ),
        sequence: compileActionSequence(
          handler.sequence,
          upgrade.level,
          `${upgrade.source} '${upgrade.index}'.eventHandlers[${index}].sequence`,
        ),
      });
    }
  }
  return programs;
}
