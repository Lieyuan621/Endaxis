import type {
  ProjectileFlightDefinition,
  ProjectileFlightTemplateDefinition,
  ProjectileLaunchDefinition,
} from '../../../packages/game-data-contract/src/projectiles';
import type { CompiledInputs } from './compiledGraphData';

/** 只绑定资源和变量读取；飞行推进仍由现有投射物运行时完成。 */
export function compileProjectileFlight(
  id: string,
  template: ProjectileFlightTemplateDefinition,
  launch: CompiledInputs<ProjectileLaunchDefinition>,
): CompiledInputs<ProjectileFlightDefinition> {
  if (template.segments.length !== launch.segmentTargets.length)
    throw new Error(`Projectile '${id}': launch targets do not match path segments`);
  const bind = (value: unknown): unknown => {
    if (value === null || typeof value !== 'object') return value;
    if ('blackboardKey' in value) {
      const { blackboardKey, ...rest } = value;
      return {
        kind: 'valueNode',
        nodeId: `projectile:${id}:${String(blackboardKey)}`,
        node: { type: 'number', expression: { kind: 'blackboard', key: blackboardKey, ...rest } },
      };
    }
    if (Array.isArray(value)) return value.map(bind);
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, bind(child)]));
  };
  const bound = bind(template) as Omit<
    CompiledInputs<ProjectileFlightDefinition>,
    'start' | 'segments'
  > & {
    segments: readonly (Omit<
      CompiledInputs<ProjectileFlightDefinition>['segments'][number],
      'target'
    > & { targetKey: string | null })[];
  };
  return {
    ...bound,
    start: launch.start,
    segments: bound.segments.map(({ targetKey: _, ...segment }, index) => ({
      ...segment,
      target: launch.segmentTargets[index]!,
    })),
    ...(launch.landingAtTarget === undefined ? {} : { landingAtTarget: launch.landingAtTarget }),
  };
}
