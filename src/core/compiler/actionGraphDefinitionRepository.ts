import type { ResolvedAbilityEntityDefinition } from './combatProgram';
import type {
  ActionGraphDefinition,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { OperatorAbilityEntityDefinitions } from '../game-data/operatorDefinition';
import type { CommonDefinitionSource } from '../game-data/gameDataRepository';
import { compileCommonDefinitionSources } from './compileCommonDefinitionSources';
import { compileIndependentAbilityEntityDefinitions } from './compileCommonAbilityEntityImports';
import {
  createActionGraphCompilation,
  prepareActionGraphDefinition,
  type ActionGraphCompilation,
} from './compileActionGraph';

export type ImportedAbilityEntityDefinitions = Readonly<
  Record<string, ResolvedAbilityEntityDefinition>
>;
const EMPTY_IMPORTS: ImportedAbilityEntityDefinitions = Object.freeze({});
const EMPTY_ENTITIES: OperatorAbilityEntityDefinitions = Object.freeze({});

/**
 * 定义仓库拥有的图编译目录。已发布定义不可原地编辑：事务提交一个新的图／实体目录对象，
 * 就形成新的修订；不同等级和实体模板目录分别编译。缓存不保存战斗运行状态。
 */
export class ActionGraphDefinitionRepository {
  readonly #commonDefinitions = new WeakMap<
    readonly CommonDefinitionSource[],
    ReturnType<typeof compileCommonDefinitionSources>
  >();
  readonly #entityDefinitions = new WeakMap<
    OperatorAbilityEntityDefinitions,
    WeakMap<ImportedAbilityEntityDefinitions, Map<number, ImportedAbilityEntityDefinitions>>
  >();
  readonly #mergedImports = new WeakMap<
    ImportedAbilityEntityDefinitions,
    WeakMap<ImportedAbilityEntityDefinitions, ImportedAbilityEntityDefinitions>
  >();

  /** 公共资源集合随定义仓库发布，不随场景或技能落点重新建立。 */
  compileCommonDefinitions(sources: readonly CommonDefinitionSource[]) {
    const existing = this.#commonDefinitions.get(sources);
    if (existing) return existing;
    this.#publish(sources);
    const compiled = compileCommonDefinitionSources(sources, this);
    Object.freeze(compiled.buffDefinitions);
    Object.freeze(compiled);
    this.#commonDefinitions.set(sources, compiled);
    return compiled;
  }

  /** 同一份本地定义、外部依赖和等级共享模板；实体实例仍由运行时独立创建。 */
  compileAbilityEntities(
    definitions: OperatorAbilityEntityDefinitions = EMPTY_ENTITIES,
    level: number,
    external: ImportedAbilityEntityDefinitions = EMPTY_IMPORTS,
  ): ImportedAbilityEntityDefinitions {
    if (!Number.isSafeInteger(level) || level < 0) throw new Error('invalid entity skill level');
    this.#publish(definitions);
    Object.freeze(external);
    let contexts = this.#entityDefinitions.get(definitions);
    if (!contexts) this.#entityDefinitions.set(definitions, (contexts = new WeakMap()));
    let levels = contexts.get(external);
    if (!levels) contexts.set(external, (levels = new Map()));
    let compiled = levels.get(level);
    if (!compiled) {
      compiled = compileIndependentAbilityEntityDefinitions(definitions, level, this, external);
      levels.set(level, compiled);
    }
    return compiled;
  }

  /** 保留两侧资源自身的身份，仅复用供引用查找的合并表。 */
  mergeAbilityEntityImports(
    external: ImportedAbilityEntityDefinitions = EMPTY_IMPORTS,
    local: ImportedAbilityEntityDefinitions = EMPTY_IMPORTS,
  ): ImportedAbilityEntityDefinitions {
    Object.freeze(external);
    Object.freeze(local);
    let locals = this.#mergedImports.get(external);
    if (!locals) this.#mergedImports.set(external, (locals = new WeakMap()));
    let merged = locals.get(local);
    if (!merged) {
      merged = Object.freeze({ ...external, ...local });
      locals.set(local, merged);
    }
    return merged;
  }

  readonly #graphs = new WeakMap<
    ActionGraphDefinition | ActionGraphResourceDefinition,
    WeakMap<object, WeakMap<object, Map<number, ActionGraphCompilation>>>
  >();
  readonly #published = new WeakSet<object>();
  readonly #prepared = new WeakMap<
    ActionGraphDefinition | ActionGraphResourceDefinition,
    ReturnType<typeof prepareActionGraphDefinition>
  >();

  readonly #prepare: typeof prepareActionGraphDefinition = definition => {
    const existing = this.#prepared.get(definition);
    if (existing) return existing;
    this.#publish(definition);
    const prepared = prepareActionGraphDefinition(definition);
    this.#prepared.set(definition, prepared);
    return prepared;
  };

  compile(
    graph: ActionGraphDefinition | ActionGraphResourceDefinition,
    level: number,
    entities: OperatorAbilityEntityDefinitions = EMPTY_ENTITIES,
    imports: ImportedAbilityEntityDefinitions = EMPTY_IMPORTS,
  ): ActionGraphCompilation {
    this.#publish(graph);
    this.#publish(entities);
    let contexts = this.#graphs.get(graph);
    if (!contexts) {
      contexts = new WeakMap();
      this.#graphs.set(graph, contexts);
    }
    let importsByContext = contexts.get(entities);
    if (!importsByContext) {
      importsByContext = new WeakMap();
      contexts.set(entities, importsByContext);
    }
    // Only freeze the import directory. Compiled graphs lazily fill their own node maps.
    Object.freeze(imports);
    let levels = importsByContext.get(imports);
    if (!levels) {
      levels = new Map();
      importsByContext.set(imports, levels);
    }
    let compilation = levels.get(level);
    if (!compilation) {
      compilation = createActionGraphCompilation(
        graph,
        level,
        undefined,
        entities,
        imports,
        undefined,
        this.#prepare,
      );
      levels.set(level, compilation);
    }
    return compilation;
  }

  #publish(root: object): void {
    const pending = [root];
    while (pending.length) {
      const value = pending.pop()!;
      if (this.#published.has(value)) continue;
      this.#published.add(value);
      for (const child of Object.values(value))
        if (child !== null && typeof child === 'object') pending.push(child);
      Object.freeze(value);
    }
  }
}
