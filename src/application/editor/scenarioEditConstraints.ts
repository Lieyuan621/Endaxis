import type { ScenarioDocument, SkillCastDocument } from '../../core/project/schema';
import { getSkillCastPlacementChains } from '../../core/project/skillCastPlacement';

/** 编辑约束只检查作者输入，不把模拟结果或界面状态作为可编辑文档保存。 */
export class ScenarioEditConstraintError extends Error {
  constructor(
    readonly inputId: string,
    readonly code = 'locked-input-position',
  ) {
    super(`${code}: ${inputId}`);
    this.name = 'ScenarioEditConstraintError';
  }
}

export interface ScenarioEditPolicy {
  readonly configurationLocked?: boolean;
  readonly inputBeforeFrame?: number;
  readonly lockedInputs?: readonly { readonly kind: ScenarioInputKind; readonly id: string }[];
  /** 必须来自对应文档的已确认输入位置；不能用旧模拟结果解析候选文档。 */
  readonly resolveSkillFrame?: (scenario: ScenarioDocument, castId: string) => number | undefined;
}

type ScenarioInputKind =
  'skill' | 'consumable' | 'controlSwitch' | 'externalEvent' | 'dodge' | 'dodgeSuccess';
interface EditableInput {
  kind: ScenarioInputKind;
  id: string;
  frame: number | undefined;
  value: unknown;
}

/** 存档为普通数据；按字段比较，不依赖对象属性的插入顺序。 */
function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const a = Object.entries(left),
    b = Object.entries(right);
  return (
    a.length === b.length &&
    a.every(
      ([key, value]) =>
        Object.prototype.hasOwnProperty.call(right, key) && equal(value, Reflect.get(right, key)),
    )
  );
}

function inputs(scenario: ScenarioDocument, policy: ScenarioEditPolicy): EditableInput[] {
  const result: EditableInput[] = [];
  for (const [trackIndex, track] of scenario.tracks.entries()) {
    if (track === null) continue;
    for (const cast of track.skillCasts) {
      const { presentation, ...input } = cast;
      result.push({
        kind: 'skill',
        id: cast.id,
        frame: cast.placement.startFrame ?? policy.resolveSkillFrame?.(scenario, cast.id),
        value: {
          trackIndex,
          trackId: track.id,
          ...input,
          disabled: presentation?.disabled ?? false,
        },
      });
    }
    for (const use of track.consumableUses ?? [])
      result.push({
        kind: 'consumable',
        id: use.id,
        frame: use.frame,
        value: { trackIndex, trackId: track.id, ...use },
      });
  }
  for (const marker of scenario.battle.controlSwitches)
    result.push({ kind: 'controlSwitch', id: marker.id, frame: marker.frame, value: marker });
  for (const marker of scenario.battle.externalEventMarkers ?? [])
    result.push({ kind: 'externalEvent', id: marker.id, frame: marker.frame, value: marker });
  for (const marker of scenario.battle.dodgeMarkers ?? []) {
    const { mode, ...dash } = marker;
    result.push({ kind: 'dodge', id: marker.id, frame: marker.frame, value: dash });
    if (mode.kind === 'perfectDodge') {
      const frame = marker.frame + mode.successDelayFrames;
      result.push({
        kind: 'dodgeSuccess',
        id: marker.id,
        frame,
        value: { id: marker.id, trackIndex: marker.trackIndex, frame },
      });
    }
  }
  return result;
}

function configuration(scenario: ScenarioDocument) {
  return {
    tracks: scenario.tracks.map(track => {
      if (track === null) return null;
      const { skillCasts: _skills, consumableUses: _items, ...config } = track;
      return config;
    }),
    enemy: scenario.enemy,
    mechanics: scenario.mechanics,
    globalConfig: scenario.globalConfig,
    prepFrames: scenario.battle.prepFrames,
    resources: scenario.battle.resourceRules,
    random: scenario.battle.random,
  };
}

export function assertScenarioPolicy(
  before: ScenarioDocument,
  after: ScenarioDocument,
  policy: ScenarioEditPolicy,
) {
  if (before === after) return;
  // 继承只是固定策略的一个调用方；禁止通过编辑元数据卸掉固有约束。
  if (before.inheritance !== undefined) {
    if (!equal(before.inheritance, after.inheritance))
      throw new ScenarioEditConstraintError(before.id, 'fixed-inheritance-boundary');
    if (after.battle.simulationRange?.startFrame !== before.battle.simulationRange?.startFrame)
      throw new ScenarioEditConstraintError(before.id, 'fixed-inheritance-boundary');
    policy = {
      ...policy,
      configurationLocked: true,
      inputBeforeFrame: Math.max(
        before.inheritance.frame,
        policy.inputBeforeFrame ?? before.inheritance.frame,
      ),
      // 创建时已将历史组截成完整历史前缀。其后禁止改写整条历史组；
      // 新组锚点在边界后时，接续输入也不可能先于锚点，不需要为编辑重新模拟。
      resolveSkillFrame:
        policy.resolveSkillFrame ??
        ((document, id) => {
          for (const track of document.tracks) {
            if (track === null) continue;
            const chain = getSkillCastPlacementChains(track.skillCasts).find(group =>
              group.casts.some(cast => cast.id === id),
            );
            if (chain !== undefined) return chain.anchor.placement.startFrame;
          }
          return undefined;
        }),
    };
  }
  if (policy.configurationLocked && !equal(configuration(before), configuration(after)))
    throw new ScenarioEditConstraintError(before.id, 'locked-configuration');
  if (policy.inputBeforeFrame === undefined && !policy.lockedInputs?.length) return;
  const previous = inputs(before, policy),
    next = inputs(after, policy);
  for (const ref of policy.lockedInputs ?? []) {
    const a = previous.find(input => input.kind === ref.kind && input.id === ref.id);
    const b = next.find(input => input.kind === ref.kind && input.id === ref.id);
    if (a?.frame === undefined || b?.frame === undefined)
      throw new ScenarioEditConstraintError(ref.id, 'unresolved-input-position');
    if (a === undefined || b === undefined || !equal(a, b))
      throw new ScenarioEditConstraintError(ref.id, 'locked-input');
  }
  const boundary = policy.inputBeforeFrame;
  if (boundary === undefined) return;
  if (!Number.isSafeInteger(boundary)) throw new RangeError('input boundary must be an integer');
  for (const input of [...previous, ...next]) {
    if (input.frame === undefined || !Number.isSafeInteger(input.frame))
      throw new ScenarioEditConstraintError(input.id, 'unresolved-input-position');
  }
  // 比较完整有序历史，既保护对象，也保护空白和同帧声明顺序。
  if (
    !equal(
      previous.filter(input => input.frame! < boundary),
      next.filter(input => input.frame! < boundary),
    )
  )
    throw new ScenarioEditConstraintError(before.id, 'frozen-input-history');
  if (
    after.battle.durationFrames < boundary ||
    (after.battle.simulationRange?.endFrame ?? boundary) < boundary
  )
    throw new ScenarioEditConstraintError(before.id, 'end-before-input-boundary');
}

/**
 * 现有 locked 表示位置锁。检查旧文档的锁，避免“解锁并移动”在一笔事务中绕过保护。
 * 连续成员的位置依赖前驱，必须同时保护前驱链；不锁定定义计算出的展示宽度。
 */
export function assertScenarioEditAllowed(
  before: ScenarioDocument,
  after: ScenarioDocument,
  policy: ScenarioEditPolicy = {},
): void {
  if (before === after) return;
  assertScenarioPolicy(before, after, policy);
  const locked = before.tracks.flatMap(track =>
    (track?.skillCasts ?? []).filter(cast => cast.presentation?.locked),
  );
  if (locked.length === 0) return;
  const index = (scenario: ScenarioDocument) => {
    const entries = new Map<string, { trackId: string; cast: SkillCastDocument }>();
    for (const track of scenario.tracks) {
      if (track === null) continue;
      for (const cast of track.skillCasts) {
        if (entries.has(cast.id)) throw new Error(`Duplicate skill input '${cast.id}'`);
        entries.set(cast.id, { trackId: track.id, cast });
      }
    }
    return entries;
  };
  const oldInputs = index(before);
  const newInputs = index(after);
  for (const lockedCast of locked) {
    let id: string | undefined = lockedCast.id;
    const visited = new Set<string>();
    while (id !== undefined) {
      if (visited.has(id)) throw new ScenarioEditConstraintError(lockedCast.id);
      visited.add(id);
      const oldInput = oldInputs.get(id);
      const newInput = newInputs.get(id);
      if (
        oldInput === undefined ||
        newInput === undefined ||
        oldInput.trackId !== newInput.trackId ||
        oldInput.cast.placement.startFrame !== newInput.cast.placement.startFrame ||
        oldInput.cast.placement.afterCastId !== newInput.cast.placement.afterCastId
      )
        throw new ScenarioEditConstraintError(lockedCast.id);
      id = oldInput.cast.placement.afterCastId;
    }
  }
}
