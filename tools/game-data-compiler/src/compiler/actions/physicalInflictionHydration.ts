import type { SkillBuffDefinition } from '../../../../../packages/game-data-contract/src/buffs.ts';
import type { CompiledBuffDefinitionSource } from '../buffs/buffProjectionTypes.ts';

/** 编译器只在闭包完成前保留物理异常 Buff ID；正式定义树必须内联完整蓝图。 */
export function createPhysicalInflictionDefinitionHydrator(
  definitions: Readonly<Record<string, CompiledBuffDefinitionSource>>,
) {
  const cache = new Map<string, SkillBuffDefinition>();
  const resolving = new Set<string>();
  const resolve = (id: string): SkillBuffDefinition => {
    const cached = cache.get(id);
    if (cached) return cached;
    const definition = definitions[id];
    if (!definition) throw new Error(`physical infliction Buff definition is missing: ${id}`);
    if (resolving.has(id)) throw new Error(`physical infliction Buff definition cycle: ${id}`);
    resolving.add(id);
    const hydrated = hydrate(definition) as SkillBuffDefinition;
    resolving.delete(id);
    cache.set(id, hydrated);
    return hydrated;
  };
  const hydrate = <T>(value: T): T => {
    if (Array.isArray(value)) return value.map(item => hydrate(item)) as T;
    if (value === null || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    if (record.kind === 'applyPhysicalInfliction') {
      const parameters = record.parameters as Record<string, unknown>;
      const noGuardBuffId = parameters.noGuardBuffId;
      if (typeof noGuardBuffId !== 'string')
        throw new Error('physical infliction is missing no-guard Buff identity');
      if (parameters.type === 'fracture') {
        const fractureBuffId = parameters.fractureBuffId;
        if (typeof fractureBuffId !== 'string')
          throw new Error('fracture is missing Buff identity');
        return {
          kind: 'applyPhysicalInfliction',
          parameters: {
            ...parameters,
            noGuardDefinition: resolve(noGuardBuffId),
            fractureDefinition: resolve(fractureBuffId),
          },
        } as T;
      }
      if (parameters.type === 'crush') {
        const crushedBuffId = parameters.crushedBuffId;
        if (typeof crushedBuffId !== 'string') throw new Error('crush is missing Buff identity');
        return {
          kind: 'applyPhysicalInfliction',
          parameters: {
            ...parameters,
            noGuardDefinition: resolve(noGuardBuffId),
            crushedDefinition: resolve(crushedBuffId),
          },
        } as T;
      }
      if (parameters.type === 'airborne') {
        const airborneBuffId = parameters.airborneBuffId;
        if (typeof airborneBuffId !== 'string')
          throw new Error('airborne is missing Buff identity');
        return {
          kind: 'applyPhysicalInfliction',
          parameters: {
            ...parameters,
            noGuardDefinition: resolve(noGuardBuffId),
            airborneDefinition: resolve(airborneBuffId),
          },
        } as T;
      }
      throw new Error(`unsupported physical infliction type ${String(parameters.type)}`);
    }
    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, hydrate(item)]),
    ) as T;
  };
  return hydrate;
}
