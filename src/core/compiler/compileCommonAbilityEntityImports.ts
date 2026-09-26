import type { ResolvedAbilityEntityDefinition } from './combatProgram';
import type { OperatorAbilityEntityDefinitions } from '../game-data/operatorDefinition';
import type {
  ActionGraphDefinitionRepository,
  ImportedAbilityEntityDefinitions,
} from './actionGraphDefinitionRepository';
import { createProgramDefinitionCompiler } from './compileProgramDefinitions';

/** 先登记每个独立资源的实体身份，再连接相互引用，最后编译各自图内的动作。 */
export function createIndependentAbilityEntityImportResolver(
  definitions: OperatorAbilityEntityDefinitions,
  programs: ActionGraphDefinitionRepository,
  importsForLevel?: (level: number) => ImportedAbilityEntityDefinitions,
): (level: number) => ImportedAbilityEntityDefinitions {
  const entries = Object.entries(definitions);
  const byLevel = new Map<number, ImportedAbilityEntityDefinitions>();
  return level => {
    const cached = byLevel.get(level);
    if (cached) return cached;
    const external = importsForLevel?.(level) ?? {};
    const linked: Record<string, ResolvedAbilityEntityDefinition> = {};
    for (const [id] of entries) {
      if (!id || Object.hasOwn(external, id))
        throw new Error(`duplicate imported AbilityEntity definition '${id}'`);
      linked[id] = {} as ResolvedAbilityEntityDefinition;
    }
    const imports = { ...external, ...linked };
    const compiler = createProgramDefinitionCompiler(
      level,
      (_entry, path) => {
        throw new Error(`${path}: entity template has no action entry; use its skill resource`);
      },
      graph => programs.compile(graph, level, undefined, imports).compileEntry,
    );
    entries.forEach(([id, definition]) => {
      Object.assign(
        linked[id]!,
        compiler.entity(definition, `abilityEntityDefinitions.${JSON.stringify(id)}`),
      );
    });
    Object.values(linked).forEach(Object.freeze);
    const result = Object.freeze(linked);
    byLevel.set(level, result);
    return result;
  };
}
