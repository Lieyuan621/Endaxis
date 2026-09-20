/**
 * 项目机制选择与战斗程序之间的编译边界。调用方需同时提供版本化定义和对应 Adapter，
 * 编译失败说明规则证据或数据契约还没做通，不能静默跳过。
 */
import type {
  GameDataRepository,
  MechanicDefinitionRef,
  MechanicFamily,
} from '../game-data/gameDataRepository';
import { validateMechanicSelections } from '../game-data/mechanicValidation';
import type {
  MechanicParameterValue,
  MechanicSelectionDocument,
  ScenarioMechanicsDocument,
} from '../project/schema';
import type {
  CompiledMechanicContribution,
  MechanicAbilityEvent,
  MechanicContribution,
  MechanicGameLevelEvent,
} from './mechanicContribution';

/** Adapter 编译一次用户机制选择时获得的完整只读输入。 */
export interface MechanicAdapterInput {
  readonly definition: MechanicDefinitionRef;
  readonly selectionId: string;
  readonly parameters: Readonly<Record<string, MechanicParameterValue>>;
}

/** 数据源专用代码可以解析原始表，但只能返回核心原语。 */
export interface MechanicAdapter {
  readonly family: MechanicFamily;
  readonly revision: string;
  compile(input: MechanicAdapterInput): readonly MechanicContribution[];
}

/** 一组机制选择编译后的来源版本和可执行贡献。 */
export interface CompiledMechanics {
  readonly sources: readonly {
    readonly selectionId: string;
    readonly mechanicId: string;
    readonly definitionRevision: string;
    readonly adapterRevision: string;
  }[];
  readonly contributions: readonly CompiledMechanicContribution[];
}

type MechanicRepository = Pick<GameDataRepository, 'getMechanic'>;

/** 携带项目路径的机制编译错误，供 UI 精确定位非法选择。 */
export class MechanicCompilationError extends Error {
  constructor(
    message: string,
    readonly path: string,
  ) {
    super(`${path}: ${message}`);
    this.name = 'MechanicCompilationError';
  }
}

function resolveParameters(
  selection: MechanicSelectionDocument,
  definition: MechanicDefinitionRef,
): Readonly<Record<string, MechanicParameterValue>> {
  const resolved: Record<string, MechanicParameterValue> = {};
  for (const parameter of definition.parameters) {
    const selected = selection.parameters[parameter.key];
    if (selected !== undefined) {
      resolved[parameter.key] = selected;
    } else if (parameter.defaultValue !== undefined) {
      resolved[parameter.key] = parameter.defaultValue;
    }
  }
  return resolved;
}

function combatEventKey(event: MechanicAbilityEvent): string {
  return event;
}

function levelEventKey(event: MechanicGameLevelEvent): string {
  return event.kind;
}

function assertDataOnly(value: unknown, path: string, ancestors = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new MechanicCompilationError('contribution contains a non-finite number', path);
    }
    return;
  }
  if (typeof value !== 'object') {
    throw new MechanicCompilationError('contribution must contain data only', path);
  }
  if (ancestors.has(value)) {
    throw new MechanicCompilationError('contribution contains a circular reference', path);
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertDataOnly(entry, `${path}[${index}]`, ancestors));
  } else {
    for (const [key, entry] of Object.entries(value)) {
      assertDataOnly(entry, `${path}.${key}`, ancestors);
    }
  }
  ancestors.delete(value);
}

function validateContribution(
  contribution: MechanicContribution,
  path: string,
  occupiedAbilityPriorities: Set<string>,
  occupiedLevelEvents: Set<string>,
): void {
  assertDataOnly(contribution, path);
  if (contribution.kind === 'enemyProgramStatMultiplier') {
    if (contribution.multiplier <= 0) {
      throw new MechanicCompilationError(
        'enemy stat multiplier must be positive',
        `${path}.multiplier`,
      );
    }
    return;
  }
  if (contribution.kind === 'battleInitializationSequence') return;
  if (contribution.kind === 'combatEventSequence') {
    if (!Number.isInteger(contribution.priority)) {
      throw new MechanicCompilationError('event priority must be an integer', `${path}.priority`);
    }
    const key = `${combatEventKey(contribution.event)}:${contribution.priority}`;
    if (occupiedAbilityPriorities.has(key)) {
      throw new MechanicCompilationError(
        'equal-priority event ordering is not recovered; combine the source actions into one sequence',
        path,
      );
    }
    occupiedAbilityPriorities.add(key);
    return;
  }

  const key = levelEventKey(contribution.event);
  if (occupiedLevelEvents.has(key)) {
    throw new MechanicCompilationError(
      'cross-mechanic level-event registration order is not recovered; combine the source actions into one sequence',
      path,
    );
  }
  occupiedLevelEvents.add(key);
}

/** 按机制 family 装配唯一 Adapter；应用启动时注册，模拟期间保持稳定。 */
export class MechanicAdapterRegistry {
  readonly #adapters = new Map<MechanicFamily, MechanicAdapter>();

  constructor(adapters: readonly MechanicAdapter[] = []) {
    for (const adapter of adapters) this.register(adapter);
  }

  register(adapter: MechanicAdapter): void {
    if (this.#adapters.has(adapter.family)) {
      throw new Error(`mechanic adapter family '${adapter.family}' is already registered`);
    }
    this.#adapters.set(adapter.family, adapter);
  }

  get(family: MechanicFamily): MechanicAdapter | undefined {
    return this.#adapters.get(family);
  }
}

export function compileMechanics(
  mechanics: ScenarioMechanicsDocument,
  repository: MechanicRepository,
  registry: MechanicAdapterRegistry,
): CompiledMechanics {
  const issues = validateMechanicSelections(mechanics, repository);
  if (issues.length > 0) {
    const issue = issues[0]!;
    throw new MechanicCompilationError(issue.message, issue.path);
  }

  const sources: {
    selectionId: string;
    mechanicId: string;
    definitionRevision: string;
    adapterRevision: string;
  }[] = [];
  const contributions: CompiledMechanicContribution[] = [];
  const occupiedAbilityPriorities = new Set<string>();
  const occupiedLevelEvents = new Set<string>();

  mechanics.selections.forEach((selection, selectionIndex) => {
    if (!selection.enabled) return;
    const definition = repository.getMechanic(selection.mechanicId)!;
    const adapter = registry.get(definition.family);
    if (adapter === undefined) {
      throw new MechanicCompilationError(
        `no adapter is registered for mechanic family '${definition.family}'`,
        `$.mechanics.selections[${selectionIndex}].mechanicId`,
      );
    }
    sources.push({
      selectionId: selection.id,
      mechanicId: selection.mechanicId,
      definitionRevision: definition.revision,
      adapterRevision: adapter.revision,
    });
    const compiled = adapter.compile({
      definition,
      selectionId: selection.id,
      parameters: resolveParameters(selection, definition),
    });
    compiled.forEach((contribution, contributionIndex) => {
      const path = `$.mechanics.selections[${selectionIndex}].contributions[${contributionIndex}]`;
      validateContribution(contribution, path, occupiedAbilityPriorities, occupiedLevelEvents);
      contributions.push({
        selectionId: selection.id,
        mechanicId: selection.mechanicId,
        selectionIndex,
        contributionIndex,
        contribution,
      });
    });
  });

  return { sources, contributions };
}
