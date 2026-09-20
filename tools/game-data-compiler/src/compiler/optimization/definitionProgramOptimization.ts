/**
 * 把干员、Buff 与实体定义中的各程序入口交给公共序列优化器，并收集候选审计。
 * 每个技能、Buff 和实体被动保持原有黑板与身份；不把一名干员当成没有外部消费者的封闭系统。
 */
import type {
  ActionSequenceDefinition,
  ScheduledSequenceDefinition,
} from '../../../../../packages/game-data-contract/src/actions.ts';
import type {
  OperatorDefinition,
  OperatorPassiveSkillDefinition,
  OperatorUpgradeDefinition,
} from '../../../../../packages/game-data-contract/src/operators.ts';
import type {
  AbilityEntityDefinition,
  SkillDefinition,
} from '../../../../../packages/game-data-contract/src/skills.ts';
import type { SkillBuffDefinition } from '../../../../../packages/game-data-contract/src/buffs.ts';
import {
  optimizeActionSequenceDefinition,
  type DefinitionOptimizationMode,
  type DefinitionOptimizationReport,
} from './definitionOptimization.ts';
import {
  pruneUnusedSkillValues,
  type SkillValueOptimizationReport,
} from './skillValueOptimization.ts';
import type { EquipmentValueOptimizationReport } from './equipmentValueOptimization.ts';
import {
  createEntityUsageContext,
  type SharedEntityValueUsage,
} from './definitionEntityUsageContext.ts';
import type { DefinitionUsageContext } from './definitionUsageAnalysis.ts';

export interface DefinitionProgramOptimizationReport {
  readonly mode: DefinitionOptimizationMode;
  readonly programs: readonly DefinitionOptimizationReport[];
  readonly before: { readonly steps: number; readonly conditions: number };
  readonly after: { readonly steps: number; readonly conditions: number };
  readonly skillValues: readonly SkillValueOptimizationReport[];
  readonly equipmentValues: readonly EquipmentValueOptimizationReport[];
}

/** 每个生成对象使用独立访问器；公共 Buff 与装备也通过这里分析相同的程序结构。 */
export function createDefinitionProgramOptimizer(
  mode: DefinitionOptimizationMode,
  protectedKeys: ReadonlySet<string> = new Set(),
  usageContext?: DefinitionUsageContext,
) {
  const programs: DefinitionOptimizationReport[] = [];
  const skillValues: SkillValueOptimizationReport[] = [];
  const sequence = (value: ActionSequenceDefinition, path: string, definitionId: string) => {
    // report 也继续分析简化后的候选，最终在本入口统一决定是否返回原对象。
    const result = optimizeActionSequenceDefinition(value, {
      mode: mode === 'off' ? 'off' : 'apply',
      path,
      definitionId,
    });
    programs.push({ ...result.report, mode });
    return result.sequence;
  };
  const scheduled = (values: readonly ScheduledSequenceDefinition[], path: string, id: string) =>
    values.map((value, index) => ({
      ...value,
      sequence: sequence(value.sequence, `${path}[${index}].sequence`, id),
    }));
  const skill = (value: SkillDefinition, path: string): SkillDefinition => {
    const id = value.key;
    const optimized: SkillDefinition = {
      ...value,
      scheduledSequences: scheduled(value.scheduledSequences, `${path}.scheduledSequences`, id),
      ...(value.switchToBuffCast === undefined
        ? {}
        : {
            switchToBuffCast: {
              ...value.switchToBuffCast,
              sequence: sequence(
                value.switchToBuffCast.sequence,
                `${path}.switchToBuffCast.sequence`,
                id,
              ),
            },
          }),
      ...(value.eventHandlers === undefined
        ? {}
        : {
            eventHandlers: value.eventHandlers.map((handler, index) => ({
              ...handler,
              scheduledSequences: scheduled(
                handler.scheduledSequences,
                `${path}.eventHandlers[${index}].scheduledSequences`,
                id,
              ),
            })),
          }),
    };
    if (mode === 'off') return optimized;
    const pruned = pruneUnusedSkillValues(optimized, protectedKeys, usageContext);
    skillValues.push(pruned.report);
    return pruned.skill;
  };
  const skills = (values: SkillDefinition | readonly SkillDefinition[], path: string) =>
    'key' in values
      ? skill(values, path)
      : values.map((value, index) => skill(value, `${path}[${index}]`));
  const passive = (
    value: OperatorPassiveSkillDefinition,
    path: string,
  ): OperatorPassiveSkillDefinition => ({
    ...value,
    enableSequence: sequence(value.enableSequence, `${path}.enableSequence`, value.key),
    ...(value.abilityEventResponses === undefined
      ? {}
      : {
          abilityEventResponses: value.abilityEventResponses.map((response, index) => ({
            ...response,
            sequence: sequence(
              response.sequence,
              `${path}.abilityEventResponses[${index}].sequence`,
              value.key,
            ),
          })),
        }),
  });
  const upgrade = (
    value: OperatorUpgradeDefinition,
    path: string,
    id: string,
  ): OperatorUpgradeDefinition => ({
    ...value,
    ...(value.initializationSequence === undefined
      ? {}
      : {
          initializationSequence: sequence(
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
            sequence: sequence(handler.sequence, `${path}.eventHandlers[${index}].sequence`, id),
          })),
        }),
    ...(value.passiveSkills === undefined
      ? {}
      : {
          passiveSkills: value.passiveSkills.map((item, index) =>
            passive(item, `${path}.passiveSkills[${index}]`),
          ),
        }),
  });
  const buff = (value: SkillBuffDefinition, path: string, id: string): SkillBuffDefinition => ({
    ...value,
    ...(value.scheduledSequences === undefined
      ? {}
      : {
          scheduledSequences: scheduled(value.scheduledSequences, `${path}.scheduledSequences`, id),
        }),
    ...(value.lifecycleSequences === undefined
      ? {}
      : {
          lifecycleSequences: Object.fromEntries(
            Object.entries(value.lifecycleSequences).map(([name, program]) => [
              name,
              program === undefined
                ? undefined
                : sequence(program, `${path}.lifecycleSequences.${name}`, id),
            ]),
          ),
        }),
    ...(value.abilityEventResponses === undefined
      ? {}
      : {
          abilityEventResponses: value.abilityEventResponses.map((response, index) => ({
            ...response,
            sequence: sequence(
              response.sequence,
              `${path}.abilityEventResponses[${index}].sequence`,
              id,
            ),
          })),
        }),
    ...(value.igniteEventResponses === undefined
      ? {}
      : {
          igniteEventResponses: value.igniteEventResponses.map((response, index) => ({
            ...response,
            sequence: sequence(
              response.sequence,
              `${path}.igniteEventResponses[${index}].sequence`,
              id,
            ),
          })),
        }),
    ...(value.damageModifiers === undefined
      ? {}
      : {
          damageModifiers: value.damageModifiers.map((modifier, index) => ({
            ...modifier,
            ...(modifier.conditionProgram === undefined
              ? {}
              : {
                  conditionProgram: sequence(
                    modifier.conditionProgram,
                    `${path}.damageModifiers[${index}].conditionProgram`,
                    id,
                  ),
                }),
          })),
        }),
  });
  const entity = (
    value: AbilityEntityDefinition,
    path: string,
    id: string,
  ): AbilityEntityDefinition => ({
    ...value,
    ...(value.childSkill === undefined
      ? {}
      : {
          childSkill: {
            ...value.childSkill,
            scheduledSequences: scheduled(
              value.childSkill.scheduledSequences,
              `${path}.childSkill.scheduledSequences`,
              value.childSkill.skillId,
            ),
          },
        }),
    ...(value.childSkills === undefined
      ? {}
      : {
          childSkills: Object.fromEntries(
            Object.entries(value.childSkills).map(([key, child]) => [
              key,
              {
                ...child,
                scheduledSequences: scheduled(
                  child.scheduledSequences,
                  `${path}.childSkills.${key}.scheduledSequences`,
                  child.skillId,
                ),
              },
            ]),
          ),
        }),
    ...(value.passiveSkills === undefined
      ? {}
      : {
          passiveSkills: value.passiveSkills.map((item, index) => ({
            ...item,
            enableSequence: sequence(
              item.enableSequence,
              `${path}.passiveSkills[${index}].enableSequence`,
              `${id}:${item.key}`,
            ),
            ...(item.abilityEventResponses === undefined
              ? {}
              : {
                  abilityEventResponses: item.abilityEventResponses.map(
                    (response, responseIndex) => ({
                      ...response,
                      sequence: sequence(
                        response.sequence,
                        `${path}.passiveSkills[${index}].abilityEventResponses[${responseIndex}].sequence`,
                        `${id}:${item.key}`,
                      ),
                    }),
                  ),
                }),
          })),
        }),
  });
  const total = (which: 'before' | 'after') =>
    programs.reduce(
      (sum, report) => ({
        steps: sum.steps + report[which].steps,
        conditions: sum.conditions + report[which].conditions,
      }),
      { steps: 0, conditions: 0 },
    );
  const report = (): DefinitionProgramOptimizationReport => ({
    mode,
    programs,
    before: total('before'),
    after: {
      ...total('after'),
      steps:
        total('after').steps -
        skillValues.reduce((sum, item) => sum + item.removedWrites.length, 0),
    },
    skillValues,
    equipmentValues: [],
  });
  return { sequence, scheduled, skill, skills, passive, upgrade, buff, entity, report };
}

/** report 模式完整分析候选，但把原对象交回生成器，保证只出报告时生成内容不变。 */
export function optimizeOperatorDefinitionPrograms(
  operator: OperatorDefinition,
  mode: DefinitionOptimizationMode,
  sharedEntityUsage?: SharedEntityValueUsage,
): {
  readonly operator: OperatorDefinition;
  readonly report: DefinitionProgramOptimizationReport;
} {
  // 保留所有养成补丁的目标键，不按默认等级或当前技能组推断补丁不会生效。
  const protectedKeys = new Set(
    [...operator.talents, ...operator.potentials].flatMap(
      upgrade =>
        upgrade.modifiers?.flatMap(modifier =>
          modifier.kind === 'patchSkillBlackboard' || modifier.kind === 'patchPassiveBlackboard'
            ? [modifier.blackboardKey]
            : [],
        ) ?? [],
    ),
  );
  const optimizer = createDefinitionProgramOptimizer(
    mode,
    protectedKeys,
    createEntityUsageContext(operator.abilityEntityDefinitions, sharedEntityUsage),
  );
  const { sequence, skill, skills, passive, upgrade, buff, entity } = optimizer;
  const result: OperatorDefinition = {
    ...operator,
    skillGroups: operator.skillGroups.map((group, index) => {
      const path = `skillGroups[${index}]`;
      return {
        ...group,
        skills: skills(group.skills, `${path}.skills`),
        ...(group.variants === undefined
          ? {}
          : {
              variants: group.variants.map((variant, index) => ({
                ...variant,
                skills: skills(variant.skills, `${path}.variants[${index}].skills`),
              })),
            }),
        ...(group.replacementSkills === undefined
          ? {}
          : {
              replacementSkills: group.replacementSkills.map((value, index) =>
                skill(value, `${path}.replacementSkills[${index}]`),
              ),
            }),
        ...(group.routedReplacementSkills === undefined
          ? {}
          : {
              routedReplacementSkills: group.routedReplacementSkills.map((route, index) => ({
                ...route,
                skill: skill(route.skill, `${path}.routedReplacementSkills[${index}].skill`),
              })),
            }),
      };
    }),
    talents: operator.talents.map((value, index) =>
      upgrade(value, `talents[${index}]`, operator.gameId),
    ),
    potentials: operator.potentials.map((value, index) =>
      upgrade(value, `potentials[${index}]`, operator.gameId),
    ),
    ...(operator.passiveSkills === undefined
      ? {}
      : {
          passiveSkills: operator.passiveSkills.map((value, index) =>
            passive(value, `passiveSkills[${index}]`),
          ),
        }),
    ...(operator.eventHandlers === undefined
      ? {}
      : {
          eventHandlers: operator.eventHandlers.map((handler, index) => ({
            ...handler,
            sequence: sequence(
              handler.sequence,
              `eventHandlers[${index}].sequence`,
              operator.gameId,
            ),
          })),
        }),
    ...(operator.comboSkillConditions === undefined
      ? {}
      : {
          comboSkillConditions: operator.comboSkillConditions.map(value => ({
            ...value,
            sequence: sequence(
              value.sequence,
              `comboSkillConditions.${value.key}.sequence`,
              value.key,
            ),
          })),
        }),
    ...(operator.buffDefinitions === undefined
      ? {}
      : {
          buffDefinitions: Object.fromEntries(
            Object.entries(operator.buffDefinitions).map(([id, value]) => [
              id,
              buff(value, `buffDefinitions.${id}`, id),
            ]),
          ),
        }),
    ...(operator.abilityEntityDefinitions === undefined
      ? {}
      : {
          abilityEntityDefinitions: Object.fromEntries(
            Object.entries(operator.abilityEntityDefinitions).map(([id, value]) => [
              id,
              entity(value, `abilityEntityDefinitions.${id}`, id),
            ]),
          ),
        }),
  };
  return {
    operator: mode === 'apply' ? result : operator,
    report: optimizer.report(),
  };
}
