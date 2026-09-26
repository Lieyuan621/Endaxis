/** 节点图的排版数据。坐标使用画布单位，与技能逻辑、缩放和窗口大小无关。 */
import type { ScenarioDocument } from './schema';

export interface GraphPresentation {
  readonly dataPositions?: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
  readonly nodePositions: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
  readonly entryPositions: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
}

/** 场景采用不可变更新；只忽略图坐标，绝不能忽略禁用、种子或技能参数的变化。 */
export function sameScenarioExceptGraphPresentation(
  a: ScenarioDocument,
  b: ScenarioDocument,
): boolean {
  const same = (left: object, right: object, except: string) => {
    const l = Object.entries(left).filter(([key, value]) => key !== except && value !== undefined);
    const r = Object.entries(right).filter(([key, value]) => key !== except && value !== undefined);
    return (
      l.length === r.length &&
      l.every(
        ([key, value]) =>
          Object.hasOwn(right, key) && value === (right as Record<string, unknown>)[key],
      )
    );
  };
  return (
    a === b ||
    (same(a, b, 'tracks') &&
      a.tracks.every((track, i) => {
        const other = b.tracks[i];
        if (track === other) return true;
        if (
          !track ||
          !other ||
          !same(track, other, 'skillCasts') ||
          track.skillCasts.length !== other.skillCasts.length
        )
          return false;
        return track.skillCasts.every((cast, j) => {
          const next = other.skillCasts[j]!;
          return (
            cast === next ||
            (same(cast, next, 'presentation') &&
              same(cast.presentation ?? {}, next.presentation ?? {}, 'graph'))
          );
        });
      }))
  );
}

/** main 和每个宏各自保存一张完整图的排版，节点 ID 只在所属图内有意义。 */
export interface SkillGraphPresentation {
  readonly main?: GraphPresentation;
  readonly macros?: Readonly<Record<string, GraphPresentation>>;
}

/** 排版损坏不能阻止技能执行；导入或读取缓存时忽略无效坐标。 */
export function readGraphPresentation(value: unknown): SkillGraphPresentation {
  const record = (v: unknown): Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const positions = (v: unknown): GraphPresentation['nodePositions'] =>
    Object.fromEntries(
      Object.entries(record(v)).flatMap(([id, point]) => {
        const { x, y } = record(point);
        return typeof x === 'number' &&
          Number.isFinite(x) &&
          typeof y === 'number' &&
          Number.isFinite(y)
          ? [[id, { x, y }]]
          : [];
      }),
    );
  const graph = (v: unknown): GraphPresentation => {
    const data = record(v);
    return {
      dataPositions: positions(data.dataPositions),
      nodePositions: positions(data.nodePositions),
      entryPositions: positions(data.entryPositions),
    };
  };
  const data = record(value);
  return {
    ...(data.main ? { main: graph(data.main) } : {}),
    macros: Object.fromEntries(
      Object.entries(record(data.macros)).map(([id, v]) => [id, graph(v)]),
    ),
  };
}
