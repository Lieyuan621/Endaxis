/** 动作序列的作用域、目标循环和跳转控制；状态仍由动作宿主持有。 */
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import type { RuntimeTargetGroup, RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { ActionScopeState, TargetLoopState, TimelineJumpState } from '../state/actionState';
import type { ActionBlackboardState } from '../state/foundationState';

/** 动作宿主的 once 和黑板作用域规则。回调仅在本次执行期间使用，不存入状态。 */

export function resetActionScopes(state: ActionScopeState): void {
  state.executedOnce.clear();
  state.blackboards.clear();
}

/** 保留原有顺序：动作体完整返回后才记为已执行；false 结果也算执行过，抛错则不标记。 */
export function executeActionOnce(
  state: ActionScopeState,
  key: string,
  execute: () => void,
): boolean {
  if (state.executedOnce.has(key)) return true;
  execute();
  state.executedOnce.add(key);
  return true;
}

export function getActionScopeBlackboard(
  state: ActionScopeState,
  parent: ActionBlackboardState,
  parameters: ResolvedCombatStepForKind<'withActionBlackboardScope'>['parameters'],
  create: () => ActionBlackboardState,
): ActionBlackboardState {
  if (parameters.shareParentBlackboard === true) return parent;
  if (parameters.lifetime === 'execution') return create();
  let scopes = state.blackboards.get(parent);
  const existing = scopes?.get(parameters.scopeKey);
  if (existing !== undefined) return existing;
  const created = create();
  if (scopes === undefined) {
    scopes = new Map();
    state.blackboards.set(parent, scopes);
  }
  scopes.set(parameters.scopeKey, created);
  return created;
}

/**
 * 按目标快照创建子序列，维持它们到外层动作结束。
 * 子序列执行结果不影响遍历；End 不能提前到 Execute 后，否则会提前移除动作期间的 Buff。
 */

/** start 按顺序完成创建、Reset、Execute，返回战斗数据中该子序列的编号。 */
export interface TargetLoopHost {
  start(target: RuntimeTargetRef): number;
  tick(id: number, delta: number): void;
  end(id: number): void;
}

export function executeTargetLoop(
  state: TargetLoopState,
  targets: RuntimeTargetGroup,
  host: TargetLoopHost,
): void {
  for (const target of targets) {
    const id = host.start(target);
    state.activeBodies.push(id);
  }
}

export function tickTargetLoop(state: TargetLoopState, delta: number, host: TargetLoopHost): void {
  for (const id of state.activeBodies) host.tick(id, delta);
}

export function endTargetLoop(state: TargetLoopState, host: TargetLoopHost): void {
  for (const id of state.activeBodies) host.end(id);
  state.activeBodies.length = 0;
  state.bodies.clear();
}

/** 沿用原动作 Reset：丢弃活动列表，不调用 End。恢复切面不能调用此操作替代换数据。 */
export function resetTargetLoop(state: TargetLoopState): void {
  state.activeBodies.length = 0;
  state.bodies.clear();
}

/** 推进跳转动作。先记录已跳转，再调用同步请求，避免重入造成重复跳转。 */

/** 条件检查包含其同步通知；取请求时验证宿主，不能在已跳转后才发现缺少宿主。 */
export interface TimelineJumpExecutionHost {
  evaluate(): boolean;
  resolveRequest(): () => void;
}

export function executeTimelineJump(
  state: TimelineJumpState,
  host: TimelineJumpExecutionHost,
): void {
  state.skipInitialTick = true;
  tryJump(state, host);
}

export function tickTimelineJump(state: TimelineJumpState, host: TimelineJumpExecutionHost): void {
  if (state.skipInitialTick) {
    state.skipInitialTick = false;
    return;
  }
  tryJump(state, host);
}

export function resetTimelineJump(state: TimelineJumpState): void {
  state.jumped = false;
  state.skipInitialTick = false;
}

function tryJump(state: TimelineJumpState, host: TimelineJumpExecutionHost): void {
  if (state.jumped || !host.evaluate()) return;
  const request = host.resolveRequest();
  state.jumped = true;
  request();
}
