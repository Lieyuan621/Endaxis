import type { DeclaredBlackboardValueSource } from '../../source/blackboard.ts';
import type { ActionGraphBuilder } from '../actions/actionGraphBuilder.ts';
import type {
  ProjectileLaunchActionSource,
  ProjectileSkillCallbackSource,
} from '../../source/referenceActions.ts';
import type {
  CompiledBuffSequenceSource,
  CompiledBuffStepSource,
  CompiledActionValueOperandSource,
} from '../actions/combatActionProjectionTypes.ts';

export interface CompiledActionBlackboardScopeSource {
  readonly kind: 'withActionBlackboardScope';
  readonly parameters: {
    readonly scopeKey: string;
    readonly lifetime: 'execution';
    readonly alwaysNext?: boolean;
    readonly initialValues: Readonly<Record<string, number>>;
    readonly inheritParent: boolean;
    readonly entityInitialValues?: Readonly<Record<string, number>>;
    readonly entityAssignments?: Readonly<Record<string, CompiledActionValueOperandSource>>;
  };
  readonly body: CompiledBuffSequenceSource;
}

export interface ProjectileCallbackInvocationSource {
  readonly program: ActionGraphBuilder<CompiledBuffStepSource>;
  readonly event: ProjectileSkillCallbackSource['event'];
  readonly skillId: string;
  readonly declaredBlackboard: readonly DeclaredBlackboardValueSource[];
  readonly sequence: CompiledBuffSequenceSource;
}

/** 在发射时求值实体赋值和来源快照；回调只提供依赖信息，不在这里执行。 */
export function compileProjectileLaunchScopeSource(input: {
  readonly sourcePath: string;
  readonly launch: ProjectileLaunchActionSource;
  readonly template: {
    readonly projectileId: string;
    readonly entityBlackboard: readonly DeclaredBlackboardValueSource[];
  } | null;
  readonly invocations: readonly ProjectileCallbackInvocationSource[];
  readonly body: CompiledBuffSequenceSource;
  /** 仅限调用方已由完整 ProjectileData 证明不需要实体黑板的特殊回调。 */
  readonly allowMissingEntityBlackboardEvidence?: boolean;
}): CompiledActionBlackboardScopeSource {
  const { sourcePath, launch, template, invocations } = input;
  const projectedInvocations = invocations;
  const callbackEntityBlackboardKeys = new Set(
    projectedInvocations.flatMap(invocation => [
      ...invocation.declaredBlackboard
        .filter(value => value.key.startsWith('EntityBB_'))
        .map(value => value.key),
      ...collectEntityBlackboardReads(invocation.program.reachableActions(invocation.sequence)),
    ]),
  );
  const callbackReadsEntityBlackboard = callbackEntityBlackboardKeys.size > 0;
  if (
    template === null &&
    (!input.allowMissingEntityBlackboardEvidence || callbackReadsEntityBlackboard)
  )
    throw new Error(`${sourcePath}: projectile entity blackboard evidence is missing`);
  if (template !== null && template.projectileId !== launch.projectileId)
    throw new Error(`${sourcePath}: projectile template identity mismatch`);
  // 即使当前回调没有读取某个键，来源模板也必须先完整通过严格校验；筛选只控制
  // 运行时产物体积，不能让未使用字段绕过来源证据校验。
  const templateInitialValues =
    template === null
      ? undefined
      : numericInitialValues(template.entityBlackboard, sourcePath, true);
  const entityAssignments = projectEntityAssignments(
    launch,
    sourcePath,
    callbackEntityBlackboardKeys,
  );
  const routes = new Map<ProjectileSkillCallbackSource['event'], string>();
  for (const callback of launch.callbacks) {
    if (!callback.enabled) continue;
    if (callback.skillId.length === 0 || routes.has(callback.event))
      throw new Error(`${sourcePath}: invalid enabled projectile callback ${callback.event}`);
    routes.set(callback.event, callback.skillId);
  }
  const skills = new Set<string>();
  for (const invocation of projectedInvocations) {
    if (routes.get(invocation.event) !== invocation.skillId)
      throw new Error(
        `${sourcePath}: callback ${invocation.event} does not match the native route`,
      );
    if (skills.has(invocation.skillId))
      throw new Error(`${sourcePath}: repeated callback skill requires restart semantics`);
    skills.add(invocation.skillId);
  }
  return {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: `${sourcePath}:${launch.projectileId}`,
      lifetime: 'execution',
      initialValues: {},
      inheritParent: launch.assignBlackboard,
      entityInitialValues: Object.fromEntries(
        Object.entries(templateInitialValues ?? {}).filter(([key]) =>
          callbackEntityBlackboardKeys.has(key),
        ),
      ),
      ...(Object.keys(entityAssignments).length === 0 ? {} : { entityAssignments }),
    },
    body: input.body,
  };
}

function collectEntityBlackboardReads(value: unknown): string[] {
  const occurrences = new Map<string, number>();
  const pureWrites = new Map<string, number>();
  const visit = (item: unknown): void => {
    if (typeof item === 'string') {
      if (item.startsWith('EntityBB_')) occurrences.set(item, (occurrences.get(item) ?? 0) + 1);
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item !== null && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      if (
        record.kind === 'modifyActionValue' &&
        record.parameters !== null &&
        typeof record.parameters === 'object'
      ) {
        const parameters = record.parameters as Record<string, unknown>;
        if (
          parameters.operation === 'assign' &&
          typeof parameters.key === 'string' &&
          parameters.key.startsWith('EntityBB_')
        ) {
          pureWrites.set(parameters.key, (pureWrites.get(parameters.key) ?? 0) + 1);
        }
      }
      Object.values(record).forEach(visit);
    }
  };
  visit(value);
  return [...occurrences].flatMap(([key, count]) =>
    count > (pureWrites.get(key) ?? 0) ? [key] : [],
  );
}

/**
 * 唯一木桩被 ExcludeTarget 排除后，寻找弹射目标的投影会得到确定空组，后续发射也随之消失。
 * 此时原分支只剩“记录已经弹射”的实体黑板写入和空组写入；若本次及后续回调均不再读取它们，
 * 整个分支在 Next 的单敌人模型中不可观察。先从叶子确认消费者已消失，再删除条件，避免要求
 * 一个本来只服务多敌人弹射的 EntityBB 初值。
 */
export function omitDeadSingleEnemyBounceBookkeeping(
  graph: ActionGraphBuilder<CompiledBuffStepSource>,
  sequence: CompiledBuffSequenceSource,
  laterActions: readonly CompiledBuffStepSource[],
): CompiledBuffSequenceSource {
  const actions = graph.actions(sequence);
  const retained = actions.filter((step, index, steps) => {
    if (step.kind !== 'conditional' || step.whenFalse !== undefined) return true;
    if (step.parameters.alwaysNext !== true) return true;
    const writes: string[] = [];
    let hasEmptyTargetGroupWrite = false;
    for (const child of graph.actions(step.whenTrue)) {
      if (child.kind === 'modifyActionValue') {
        writes.push(child.parameters.key);
        continue;
      }
      if (child.kind === 'mergeContextTargets' && child.parameters.sources.length === 0) {
        writes.push(child.parameters.saveToContextKey);
        hasEmptyTargetGroupWrite = true;
        continue;
      }
      return true;
    }
    if (!hasEmptyTargetGroupWrite || writes.length < 2) return true;
    const remaining = [
      ...graph.reachableActions(graph.sequence(steps.slice(index + 1))),
      ...laterActions,
    ];
    return writes.some(key => containsStringValue(remaining, key));
  });
  return retained.length === actions.length ? sequence : graph.sequence(retained);
}

function containsStringValue(value: unknown, expected: string): boolean {
  if (value === expected) return true;
  if (Array.isArray(value)) return value.some(child => containsStringValue(child, expected));
  if (value === null || typeof value !== 'object') return false;
  return Object.values(value).some(child => containsStringValue(child, expected));
}

function projectEntityAssignments(
  launch: ProjectileLaunchActionSource,
  sourcePath: string,
  retainedKeys: ReadonlySet<string>,
): Readonly<Record<string, CompiledActionValueOperandSource>> {
  if (!launch.assignEntityBlackboard || launch.assignments.length === 0) return {};
  const entries: [string, CompiledActionValueOperandSource][] = [];
  launch.assignments.forEach((assignment, index) => {
    if (!assignment.targetKey.startsWith('EntityBB_')) {
      throw new Error(
        `${sourcePath}.assignPairs[${index}]: projectile entity assignment requires an EntityBB_ target`,
      );
    }
    if (assignment.useDirectValue && assignment.valueType !== 'Numeric') {
      throw new Error(
        `${sourcePath}.assignPairs[${index}]: projectile entity assignment requires a numeric value`,
      );
    }
    if (!retainedKeys.has(assignment.targetKey)) return;
    entries.push([
      assignment.targetKey,
      assignment.useDirectValue
        ? { kind: 'constant', value: assignment.numericValue }
        : { kind: 'blackboard', key: assignment.inputValueKey },
    ]);
  });
  return Object.fromEntries(entries);
}

export function numericInitialValues(
  values: readonly DeclaredBlackboardValueSource[],
  sourcePath: string,
  entity = false,
): Readonly<Record<string, number>> {
  const result: Record<string, number> = Object.create(null);
  for (const value of values) {
    if (
      typeof value.value !== 'number' ||
      !Number.isFinite(value.value) ||
      Object.hasOwn(result, value.key) ||
      (entity && !value.key.startsWith('EntityBB_'))
    )
      throw new Error(
        `${sourcePath}: unsupported or duplicate blackboard initial value ${value.key}`,
      );
    // 动态声明也必须保留初值；不能因它不是编译期常量而删掉。
    result[value.key] = value.value;
  }
  return result;
}
