import type { ResolvedAbilityEntityDefinition } from './combatProgram';
import type {
  ActionGraphDefinition,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { OperatorAbilityEntityDefinitions } from '../game-data/operatorDefinition';
import { createActionGraphCompilation, type ActionGraphCompilation } from './compileActionGraph';

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
  readonly #graphs = new WeakMap<
    ActionGraphDefinition | ActionGraphResourceDefinition,
    WeakMap<object, WeakMap<object, Map<number, ActionGraphCompilation>>>
  >();
  readonly #published = new WeakSet<object>();

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
      compilation = createActionGraphCompilation(graph, level, undefined, entities, imports);
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
