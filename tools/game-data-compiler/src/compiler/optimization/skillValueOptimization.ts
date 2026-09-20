/**
 * 删除一份技能程序中无人使用的算术写入和黑板初值。
 * 分析覆盖全部时间线和监听入口；复制整板或跨作用域访问尚未闭合时保留整份技能的数据。
 * Buff 算术会刷新属性，本模块只接收技能程序，不用于 Buff 生命周期。
 */
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
  CombatStepForKind,
} from '../../../../../packages/game-data-contract/src/actions.ts';
import type { SkillDefinition } from '../../../../../packages/game-data-contract/src/skills.ts';
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../../packages/game-data-contract/src/conditions.ts';
import {
  analyzeConditionUsage,
  analyzeStepUsage,
  type DefinitionUsageContext,
  type DefinitionValueUsage,
} from './definitionUsageAnalysis.ts';

type ArithmeticStep = CombatStepForKind<'modifyActionValue' | 'calculateActionValue'>;

export interface SkillValueOptimizationReport {
  readonly skillId: string;
  readonly removedWrites: readonly { readonly path: string; readonly key: string }[];
  readonly removedInitialKeys: readonly string[];
  readonly retainedReason?: 'unresolved-blackboard-access';
  /** 删除整个序列会改变重复执行的返回值，至少保留原有一个步骤。 */
  readonly retainedLifetimePaths: readonly string[];
}

/** 保留补丁等外部入口指向的键；生成器不按当前等级把初值冻结成常量。 */
export function pruneUnusedSkillValues(
  skill: SkillDefinition,
  protectedKeys: ReadonlySet<string> = new Set(),
  usageContext?: DefinitionUsageContext,
): { readonly skill: SkillDefinition; readonly report: SkillValueOptimizationReport } {
  const live = new Set([...protectedKeys, NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY]);
  const candidates: {
    readonly step: ArithmeticStep;
    readonly path: string;
    readonly usage: DefinitionValueUsage;
  }[] = [];
  const initial = skill.blackboard ?? {};
  let unresolvedAccess = false;
  const observe = (usage: DefinitionValueUsage) => {
    usage.reads.forEach(key => live.add(key));
    // 非算术动作的写入可能参与其返回值或与事件一起被观察，首批不删除其初始化。
    usage.writes.forEach(key => live.add(key));
    unresolvedAccess ||= usage.unknownAccess;
  };
  const collect = (program: ActionSequenceDefinition, path: string): void => {
    program.steps.forEach((step, index) => {
      const stepPath = `${path}.steps[${index}]`;
      if (step.kind === 'modifyActionValue' || step.kind === 'calculateActionValue') {
        const usage = analyzeStepUsage(step, usageContext);
        candidates.push({ step, path: stepPath, usage });
        const operands =
          step.kind === 'modifyActionValue'
            ? [step.parameters.value]
            : [step.parameters.left, step.parameters.right];
        const canResolveInputs = operands.every(
          operand =>
            operand.kind === 'constant' ||
            operand.fallback !== undefined ||
            Object.hasOwn(initial, operand.key),
        );
        // EntityBB_ 是原生动态写入路由，不是对象特例；它可能被同一实体的其他技能读取。
        if (
          step.key !== undefined ||
          step.parameters.key.startsWith('EntityBB_') ||
          protectedKeys.has(step.parameters.key) ||
          !canResolveInputs
        ) {
          live.add(step.parameters.key);
        }
        return;
      }
      switch (step.kind) {
        case 'conditional':
          observe(analyzeConditionUsage(step.parameters.condition));
          collect(step.whenTrue, `${stepPath}.whenTrue`);
          if (step.whenFalse !== undefined) collect(step.whenFalse, `${stepPath}.whenFalse`);
          return;
        case 'switch':
          observe(
            analyzeStepUsage(
              {
                ...step,
                options: step.options.map(option => ({ ...option, sequence: { steps: [] } })),
              },
              usageContext,
            ),
          );
          step.options.forEach((option, optionIndex) =>
            collect(option.sequence, `${stepPath}.options[${optionIndex}].sequence`),
          );
          return;
        case 'once':
        case 'repeatEachTick':
        case 'repeatByActionValue':
        case 'forEachContextTarget':
          observe(analyzeStepUsage({ ...step, body: { steps: [] } }, usageContext));
          collect(step.body, `${stepPath}.body`);
          return;
        case 'listenForCombatEvents':
          step.parameters.responses.forEach((response, responseIndex) => {
            if (response.condition !== undefined)
              observe(analyzeConditionUsage(response.condition));
            collect(
              response.sequence,
              `${stepPath}.parameters.responses[${responseIndex}].sequence`,
            );
          });
          return;
        default:
          observe(analyzeStepUsage(step, usageContext));
      }
    });
  };
  const mapRoots = (
    input: SkillDefinition,
    transform: (sequence: ActionSequenceDefinition, path: string) => ActionSequenceDefinition,
  ): SkillDefinition => ({
    ...input,
    scheduledSequences: input.scheduledSequences.map((item, index) => ({
      ...item,
      sequence: transform(item.sequence, `scheduledSequences[${index}].sequence`),
    })),
    ...(input.eventHandlers === undefined
      ? {}
      : {
          eventHandlers: input.eventHandlers.map((handler, handlerIndex) => ({
            ...handler,
            scheduledSequences: handler.scheduledSequences.map((item, index) => ({
              ...item,
              sequence: transform(
                item.sequence,
                `eventHandlers[${handlerIndex}].scheduledSequences[${index}].sequence`,
              ),
            })),
          })),
        }),
    ...(input.switchToBuffCast === undefined
      ? {}
      : {
          switchToBuffCast: {
            ...input.switchToBuffCast,
            sequence: transform(input.switchToBuffCast.sequence, 'switchToBuffCast.sequence'),
          },
        }),
  });
  if (skill.availability !== undefined) observe(analyzeConditionUsage(skill.availability));
  if (skill.switchToBuffCast?.condition !== undefined)
    observe(analyzeConditionUsage(skill.switchToBuffCast.condition));
  skill.eventHandlers?.forEach(handler => {
    if (handler.condition !== undefined) observe(analyzeConditionUsage(handler.condition));
  });
  mapRoots(skill, (program, path) => {
    collect(program, path);
    return program;
  });
  const skillId = skill.key;
  if (unresolvedAccess)
    return {
      skill,
      report: {
        skillId,
        removedWrites: [],
        removedInitialKeys: [],
        retainedLifetimePaths: [],
        retainedReason: 'unresolved-blackboard-access',
      },
    };
  const retainInputs = () => {
    let changed: boolean;
    do {
      changed = false;
      for (const { step, usage } of candidates) {
        if (!live.has(step.parameters.key)) continue;
        for (const key of usage.reads) {
          if (!live.has(key)) {
            live.add(key);
            changed = true;
          }
        }
      }
    } while (changed);
  };
  retainInputs();
  const candidatePaths = new Map(candidates.map(candidate => [candidate.path, candidate]));
  const retainedLifetimePaths = new Set<string>();
  const removedWrites: { path: string; key: string }[] = [];
  const transform = (program: ActionSequenceDefinition, path: string): ActionSequenceDefinition => {
    const steps: CombatStepDefinition[] = [];
    for (const [index, step] of program.steps.entries()) {
      const stepPath = `${path}.steps[${index}]`;
      const candidate = candidatePaths.get(stepPath);
      if (candidate !== undefined && !live.has(candidate.step.parameters.key)) {
        removedWrites.push({ path: stepPath, key: candidate.step.parameters.key });
        continue;
      }
      switch (step.kind) {
        case 'conditional':
          steps.push({
            ...step,
            whenTrue: transform(step.whenTrue, `${stepPath}.whenTrue`),
            ...(step.whenFalse === undefined
              ? {}
              : { whenFalse: transform(step.whenFalse, `${stepPath}.whenFalse`) }),
          });
          break;
        case 'switch':
          steps.push({
            ...step,
            options: step.options.map((option, optionIndex) => ({
              ...option,
              sequence: transform(option.sequence, `${stepPath}.options[${optionIndex}].sequence`),
            })),
          });
          break;
        case 'once':
        case 'repeatEachTick':
        case 'repeatByActionValue':
        case 'forEachContextTarget':
          steps.push({ ...step, body: transform(step.body, `${stepPath}.body`) });
          break;
        case 'listenForCombatEvents':
          steps.push({
            ...step,
            parameters: {
              ...step.parameters,
              responses: step.parameters.responses.map((response, responseIndex) => ({
                ...response,
                sequence: transform(
                  response.sequence,
                  `${stepPath}.parameters.responses[${responseIndex}].sequence`,
                ),
              })),
            },
          });
          break;
        default:
          steps.push(step);
      }
    }
    if (steps.length === 0 && program.steps.length > 0) {
      const firstPath = `${path}.steps[0]`;
      const first = candidatePaths.get(firstPath)!;
      live.add(first.step.parameters.key);
      retainedLifetimePaths.add(firstPath);
    }
    return { ...program, steps };
  };
  // 若删空某条序列，先把其首项及依赖加入保留集合，再重新生成，不能留下新的缺键读取。
  let result: SkillDefinition;
  let liveCount: number;
  do {
    liveCount = live.size;
    removedWrites.length = 0;
    result = mapRoots(skill, transform);
    retainInputs();
  } while (live.size !== liveCount);
  const removedInitialKeys = Object.keys(initial).filter(
    key => !live.has(key) && !key.startsWith('EntityBB_'),
  );
  if (removedInitialKeys.length > 0) {
    const removed = new Set(removedInitialKeys);
    result = {
      ...result,
      blackboard: Object.fromEntries(Object.entries(initial).filter(([key]) => !removed.has(key))),
    };
  }
  return {
    skill: removedWrites.length === 0 && removedInitialKeys.length === 0 ? skill : result,
    report: {
      skillId,
      removedWrites,
      removedInitialKeys,
      retainedLifetimePaths: [...retainedLifetimePaths],
    },
  };
}
