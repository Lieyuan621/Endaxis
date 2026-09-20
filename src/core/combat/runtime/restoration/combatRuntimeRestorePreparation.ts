/**
 * 在创建任何运行时对象前检查整场恢复候选的数据拓扑。
 *
 * 本文件只核对保存图与当前固定程序是否属于同一场战斗，并验证整图复制必须保留的共享引用。
 * 它不复制数据、不创建对象、不执行初始化，也不是可单独使用的整场恢复入口。完整装配会在本检查
 * 通过后，按共享层、环境、实体和跨容器关系的顺序绑定同一份候选数据。
 */
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import type { CombatOperatorState, CombatStateGraph } from '../../state/combatState';
import type { SkillRuntimeState } from '../../state/abilityState';
import type { CompiledSkillProgram } from '../../../compiler/combatProgram';
import type { CombatSkillProgramBinding } from '../../skills/combatSkillPrograms';
import { CombatSkillPrograms, combatSkillProgramKey } from '../../skills/combatSkillPrograms';
import { hasActiveCombatOperationState } from '../../actions/combatOperationHostInspection';
import {
  prepareCombatBuffRestore,
  type PreparedCombatBuffRestore,
} from './combatRuntimeBuffRestorePreflight';

export interface PreparedCombatSkillRestoreBinding {
  readonly program: CompiledSkillProgram;
  readonly fixed: CombatSkillProgramBinding;
  readonly state: SkillRuntimeState;
}

export interface CombatRuntimeRestorePreparation {
  readonly graph: CombatStateGraph;
  readonly programs: ReadonlyMap<string, CombatOperatorProgram>;
  readonly operators: ReadonlyMap<string, CombatOperatorState>;
  readonly skills: ReadonlyMap<string, readonly PreparedCombatSkillRestoreBinding[]>;
  readonly buffs: PreparedCombatBuffRestore;
}

function requireExactKeys(
  actual: ReadonlyMap<string, unknown>,
  expected: ReadonlySet<string>,
  label: string,
): void {
  for (const key of actual.keys()) {
    if (!expected.has(key)) throw new Error(`restored ${label} has unknown key '${key}'`);
  }
  for (const key of expected) {
    if (!actual.has(key)) throw new Error(`restored ${label} is missing key '${key}'`);
  }
}

function skillStateKey(skillId: string, castId?: string): string {
  return `${skillId}\u0000${castId ?? ''}`;
}

function validateOperatorState(program: CombatOperatorProgram, state: CombatOperatorState): void {
  if (state.buffs !== null && state.buffs.entityBlackboard !== state.blackboard) {
    throw new Error(`restored operator '${program.operatorId}' Buffs use another blackboard`);
  }

  const definitions = [...program.skills, ...(program.definitionSkillPrograms ?? [])];
  const availableSkills = new Set<string>();
  const requiredSkills = new Set<string>();
  for (const skill of definitions) {
    const key = skillStateKey(skill.skillId);
    availableSkills.add(key);
    requiredSkills.add(key);
  }
  for (const binding of program.skillCasts ?? []) {
    const key = skillStateKey(binding.program.skillId, binding.castId);
    availableSkills.add(key);
  }
  for (const [key, skill] of state.skills) {
    const expectedCastId = key.slice(key.indexOf('\u0000') + 1) || null;
    if (skill.castId !== expectedCastId) {
      throw new Error(
        `restored operator '${program.operatorId}' skill '${key}' has another cast identity`,
      );
    }
    if (!availableSkills.has(key)) {
      throw new Error(`restored operator '${program.operatorId}' has unknown skill '${key}'`);
    }
    const separator = key.indexOf('\u0000');
    const skillId = separator < 0 ? key : key.slice(0, separator);
    const cooldown = state.cooldowns.get(skillId);
    if (cooldown === undefined) {
      throw new Error(
        `restored skill '${program.operatorId}:${key}' has no shared cooldown ledger`,
      );
    }
    if (skill.cooldown !== cooldown) {
      throw new Error(`restored skill '${program.operatorId}:${key}' uses another cooldown ledger`);
    }
    if (skill.blackboard.entity !== state.blackboard) {
      throw new Error(
        `restored skill '${program.operatorId}:${key}' uses another entity blackboard`,
      );
    }
  }
  for (const key of requiredSkills) {
    if (!state.skills.has(key)) {
      throw new Error(`restored operator '${program.operatorId}' is missing skill '${key}'`);
    }
  }

  const expectedCooldowns = new Set([
    ...(program.skillCooldownPrograms ?? []).map(skill => skill.skillId),
    ...program.skills.map(skill => skill.skillId),
    ...(program.skillCasts ?? []).map(binding => binding.program.skillId),
  ]);
  requireExactKeys(
    state.cooldowns,
    expectedCooldowns,
    `operator '${program.operatorId}' cooldowns`,
  );
  requireExactKeys(
    state.passives,
    new Set((program.passivePrograms ?? []).map(passive => passive.key)),
    `operator '${program.operatorId}' passives`,
  );
  for (const [key, passive] of state.passives) {
    if (passive.blackboard.entity !== state.blackboard) {
      throw new Error(
        `restored passive '${program.operatorId}:${key}' uses another entity blackboard`,
      );
    }
  }
  requireExactKeys(
    state.initializations,
    new Set((program.initializationPrograms ?? []).map(initialization => initialization.key)),
    `operator '${program.operatorId}' initializations`,
  );
  requireExactKeys(
    state.comboConditions,
    new Set((program.comboConditionPrograms ?? []).map(condition => condition.key)),
    `operator '${program.operatorId}' combo conditions`,
  );
  for (const [key, condition] of state.comboConditions) {
    if (condition.blackboard.entity !== state.blackboard) {
      throw new Error(
        `restored combo condition '${program.operatorId}:${key}' uses another entity blackboard`,
      );
    }
    if (hasActiveCombatOperationState(condition.operations)) {
      throw new Error(
        `restored combo condition '${program.operatorId}:${key}' has unfinished instant operations`,
      );
    }
  }

  const hasEquipmentRuntime = (program.equipmentContributions ?? []).some(
    contribution =>
      contribution.eventHandlers.length > 0 ||
      contribution.initializationSequence !== undefined ||
      contribution.enableSequence !== undefined,
  );
  if ((state.equipment !== null) !== hasEquipmentRuntime) {
    throw new Error(`restored operator '${program.operatorId}' equipment topology does not match`);
  }
  if (state.equipment !== null) {
    const expectedContributions = new Set(
      (program.equipmentContributions ?? [])
        .map((contribution, index) => ({ contribution, index }))
        .filter(
          ({ contribution }) =>
            contribution.eventHandlers.length > 0 ||
            contribution.initializationSequence !== undefined ||
            contribution.enableSequence !== undefined,
        )
        .map(({ index }) => index),
    );
    for (const index of state.equipment.contributions.keys()) {
      if (!expectedContributions.has(index)) {
        throw new Error(
          `restored operator '${program.operatorId}' has unknown equipment contribution '${index}'`,
        );
      }
    }
    for (const index of expectedContributions) {
      if (!state.equipment.contributions.has(index)) {
        throw new Error(
          `restored operator '${program.operatorId}' is missing equipment contribution '${index}'`,
        );
      }
    }
  }
  for (const initialization of program.initializationPrograms ?? []) {
    const saved = state.initializations.get(initialization.key)!;
    if (saved.key !== initialization.key) {
      throw new Error(
        `restored initialization '${program.operatorId}:${initialization.key}' has another key`,
      );
    }
    if (saved.equipmentContributionIndex !== initialization.equipmentContributionIndex) {
      throw new Error(
        `restored initialization '${program.operatorId}:${initialization.key}' has another equipment contribution`,
      );
    }
    if (initialization.equipmentContributionIndex === undefined) {
      if (saved.blackboard.entity !== undefined) {
        throw new Error(
          `restored initialization '${program.operatorId}:${initialization.key}' unexpectedly uses an entity blackboard`,
        );
      }
    } else {
      const equipmentBlackboard = state.equipment?.contributions.get(
        initialization.equipmentContributionIndex,
      )?.blackboard;
      if (saved.blackboard !== equipmentBlackboard) {
        throw new Error(
          `restored initialization '${program.operatorId}:${initialization.key}' uses another equipment blackboard`,
        );
      }
    }
  }
  if ((state.upgradeEvents !== null) !== (program.upgradeEventPrograms?.length ?? 0) > 0) {
    throw new Error(
      `restored operator '${program.operatorId}' upgrade event topology does not match`,
    );
  }
  if (state.upgradeEvents !== null) {
    const upgradePrograms = program.upgradeEventPrograms ?? [];
    if (
      state.upgradeEvents.programs.length !== upgradePrograms.length ||
      state.upgradeEvents.programs.some((saved, index) => saved.key !== upgradePrograms[index]!.key)
    ) {
      throw new Error(
        `restored operator '${program.operatorId}' upgrade event order does not match`,
      );
    }
  }
}

function validateAbilityEntityBuffTopology(graph: CombatStateGraph): void {
  for (const [instanceId, entity] of graph.instances.abilityEntities.instances) {
    if (instanceId !== entity.instanceId) {
      throw new Error(
        `restored AbilityEntity directory key '${instanceId}' does not match instance '${entity.instanceId}'`,
      );
    }
    if (!entity.buffContainerCreated) {
      if (entity.buffs !== null) {
        throw new Error(`restored AbilityEntity '${instanceId}' has Buff data before creation`);
      }
      continue;
    }
    if (entity.buffs === null) {
      throw new Error(`restored AbilityEntity '${instanceId}' created Buff container has no data`);
    }
    if (entity.buffs.entityBlackboard !== entity.blackboard) {
      throw new Error(`restored AbilityEntity '${instanceId}' Buffs use another blackboard`);
    }
  }
}

function prepareSkillBindings(
  programs: readonly CombatOperatorProgram[],
  states: ReadonlyMap<string, CombatOperatorState>,
  fixedPrograms: CombatSkillPrograms,
): ReadonlyMap<string, readonly PreparedCombatSkillRestoreBinding[]> {
  const result = new Map<string, readonly PreparedCombatSkillRestoreBinding[]>();
  for (const operator of programs) {
    const programsByKey = new Map<string, CompiledSkillProgram>();
    for (const program of [...operator.skills, ...(operator.definitionSkillPrograms ?? [])]) {
      const key = combatSkillProgramKey(program);
      const previous = programsByKey.get(key);
      if (previous !== undefined && previous !== program) {
        throw new Error(`combat operator '${operator.operatorId}' has duplicate skill '${key}'`);
      }
      programsByKey.set(key, program);
    }
    for (const { castId, program } of operator.skillCasts ?? []) {
      const key = combatSkillProgramKey(program, castId);
      const previous = programsByKey.get(key);
      if (previous !== undefined && previous !== program) {
        throw new Error(`combat operator '${operator.operatorId}' has duplicate skill '${key}'`);
      }
      programsByKey.set(key, program);
    }
    const bindings: PreparedCombatSkillRestoreBinding[] = [];
    for (const [stateKey, state] of states.get(operator.operatorId)!.skills) {
      const fullKey = `${operator.operatorId}\u0000${stateKey}`;
      const program = programsByKey.get(fullKey);
      if (program === undefined) {
        throw new Error(`restored skill '${operator.operatorId}:${stateKey}' has no program`);
      }
      const fixed = fixedPrograms.resolve(fullKey);
      if (fixed.program !== program) {
        throw new Error(`restored skill '${operator.operatorId}:${stateKey}' uses another program`);
      }
      bindings.push({ program, fixed, state });
    }
    result.set(operator.operatorId, bindings);
  }
  return result;
}

/**
 * 对已经由切面树复制出的候选图做只读预检。返回值只整理阶段输入，所有字段仍直接引用候选图。
 */
export function prepareCombatRuntimeRestore(
  graph: CombatStateGraph,
  programs: readonly CombatOperatorProgram[],
  fixedSkillPrograms: CombatSkillPrograms,
): CombatRuntimeRestorePreparation {
  // 输入后新增的施放不必出现在原始排程，但必须绑定同一份固定定义。
  programs = programs.map(operator => {
    const configured = [...operator.skills, ...(operator.definitionSkillPrograms ?? [])];
    const byKey = new Map(configured.map(program => [combatSkillProgramKey(program), program]));
    for (const { castId, program } of operator.skillCasts ?? []) {
      byKey.set(combatSkillProgramKey(program, castId), program);
    }
    const additional: NonNullable<CombatOperatorProgram['skillCasts']>[number][] = [];
    for (const key of graph.operators.get(operator.operatorId)?.skills.keys() ?? []) {
      const fullKey = `${operator.operatorId}\u0000${key}`;
      if (byKey.has(fullKey)) continue;
      const binding = fixedSkillPrograms.resolve(fullKey);
      if (
        binding.castId === undefined ||
        binding.program.operatorId !== operator.operatorId ||
        !configured.some(program => program.skillId === binding.program.skillId)
      ) {
        throw new Error(`restored dynamic skill '${fullKey}' uses another definition`);
      }
      additional.push({ castId: binding.castId, program: binding.program });
    }
    return additional.length === 0
      ? operator
      : { ...operator, skillCasts: [...(operator.skillCasts ?? []), ...additional] };
  });
  const programIds = new Set<string>();
  const programsById = new Map<string, CombatOperatorProgram>();
  for (const program of programs) {
    if (programIds.has(program.operatorId)) {
      throw new Error(`duplicate combat operator '${program.operatorId}'`);
    }
    programIds.add(program.operatorId);
    programsById.set(program.operatorId, program);
  }
  requireExactKeys(graph.operators, programIds, 'operator directory');
  requireExactKeys(graph.inputs.control, programIds, 'control operator directory');

  const squadIds = graph.shared.resources.squad.map(member => member.operatorId);
  const expectedOrder = programs.map(program => program.operatorId);
  if (
    squadIds.length !== expectedOrder.length ||
    squadIds.some((operatorId, index) => operatorId !== expectedOrder[index])
  ) {
    throw new Error('restored resource squad order does not match combat operators');
  }
  requireExactKeys(graph.shared.resources.operators, programIds, 'resource operator directory');
  for (const member of graph.shared.resources.squad) {
    if (graph.shared.resources.operators.get(member.operatorId) !== member) {
      throw new Error(`restored resource operator '${member.operatorId}' uses another ledger`);
    }
  }
  for (const program of programs) {
    validateOperatorState(program, graph.operators.get(program.operatorId)!);
  }
  validateAbilityEntityBuffTopology(graph);
  const buffs = prepareCombatBuffRestore(graph);
  const skills = prepareSkillBindings(programs, graph.operators, fixedSkillPrograms);
  return Object.freeze({
    graph,
    programs: programsById,
    operators: graph.operators,
    skills,
    buffs,
  });
}
