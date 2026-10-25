import type {
  ProjectileDefinitionNumber,
  ProjectileFlightTemplateDefinition,
} from '../../../../../packages/game-data-contract/src/projectiles.ts';

import type { ScalarSource } from '../../source/scalar.ts';

type BoundTemplate<T> = T extends { readonly blackboardKey: string; readonly fallback?: number }
  ? { readonly kind: 'blackboard'; readonly key: string; readonly fallback?: number }
  : T extends object
    ? { [K in keyof T]: BoundTemplate<T[K]> }
    : T;

type BoundFlightTemplate = BoundTemplate<ProjectileFlightTemplateDefinition>;

/** 原生变量开关不启用时使用直接值；启用时不擅自把直接值当作缺省值。 */
export function projectileDefinitionNumber(source: ScalarSource): ProjectileDefinitionNumber {
  return source.blackboardKey === null
    ? { kind: 'constant', value: source.value }
    : { blackboardKey: source.blackboardKey };
}

/** 发布发射图时绑定变量读取；不读取变量值，也不共享调用状态。 */
export function bindProjectileTemplateParameters(
  source: ProjectileFlightTemplateDefinition,
): BoundFlightTemplate {
  return mapParameters(source) as BoundFlightTemplate;
}

function mapParameters(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => mapParameters(item));
  if ('blackboardKey' in value) {
    const { blackboardKey, ...rest } = value;
    return { kind: 'blackboard', key: blackboardKey, ...rest };
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, mapParameters(child)]),
  );
}
