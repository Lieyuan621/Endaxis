import { type ActiveCombatStatus, type CombatStatusState } from '../state/environmentState';
/**
 * 保存一次模拟中的通用语义状态，并按显式定义处理层数、持续时间、消费和到期。
 * 所有缺省行为都必须写进定义；调用方不能依赖未声明的隐式层数或时长规则。
 */

export const STATUS_DURATION_STACKING_TYPES = ['refresh', 'extend', 'overwrite'] as const;
export type StatusDurationStackingType = (typeof STATUS_DURATION_STACKING_TYPES)[number];

/** `all` 表示未指定消费层数时消费当前全部层数。 */
export type StatusDefaultConsumeStacks = number | 'all';

/** 一个状态身份在运行时所需的全部缺省规则。 */
export interface CombatStatusDefinition {
  readonly statusKey: string;
  readonly applyStacks: number;
  readonly maxStacks: number;
  /** null 明确表示无限持续时间，而不是“缺少数据”。 */
  readonly durationFrames: number | null;
  readonly durationStacking: StatusDurationStackingType;
  readonly consumeStacks: StatusDefaultConsumeStacks;
}

/** 某个状态在一次动作边界上的实际快照；null 时长表示没有有限到期时间。 */
export interface CombatStatusSnapshot {
  readonly stacks: number;
  readonly remainingFrames: number | null;
}

export const COMBAT_STATUS_CHANGE_REASONS = ['applied', 'consumed', 'expired'] as const;
export type CombatStatusChangeReason = (typeof COMBAT_STATUS_CHANGE_REASONS)[number];

/** 状态所有者完成一次变化后返回的事实，同时保留创建该实例的来源身份。 */
export interface CombatStatusTransition {
  readonly statusKey: string;
  readonly reason: CombatStatusChangeReason;
  readonly sourceId: string;
  readonly skillId: string;
  readonly previous: CombatStatusSnapshot;
  readonly current: CombatStatusSnapshot;
}

export interface CombatStatusApplyRequest {
  readonly statusKey: string;
  readonly sourceId: string;
  readonly skillId: string;
  readonly stacks?: number;
  readonly maxStacks?: number;
  readonly durationFrames?: number;
}

export interface CombatStatusConsumeRequest {
  readonly statusKey: string;
  readonly sourceId: string;
  readonly skillId: string;
  readonly stacks?: number;
}

const EMPTY_STATUS: CombatStatusSnapshot = { stacks: 0, remainingFrames: null };

/** 单个实体的通用状态所有者；状态只存在于一次模拟中，不进入存档。 */
export class CombatStatusContainer {
  readonly #definitions = new Map<string, CombatStatusDefinition>();

  constructor(
    readonly ownerId: string,
    definitions: readonly CombatStatusDefinition[],
    readonly runtimeState: CombatStatusState = { statuses: new Map() },
  ) {
    if (ownerId.length === 0) throw new Error('combat status owner id must not be empty');
    for (const definition of definitions) {
      validateDefinition(definition);
      if (this.#definitions.has(definition.statusKey)) {
        throw new Error(`duplicate combat status definition '${definition.statusKey}'`);
      }
      this.#definitions.set(definition.statusKey, definition);
    }
  }

  /**
   * 复用当前容器的固定状态定义，为复制后的战斗数据创建对象外壳。
   * 此过程不施加状态、不推进持续时间，也不复制传入的数据。
   */
  bindRuntimeState(state: CombatStatusState): CombatStatusContainer {
    return new CombatStatusContainer(this.ownerId, [...this.#definitions.values()], state);
  }

  getSnapshot(statusKey: string): CombatStatusSnapshot {
    return snapshot(this.runtimeState.statuses.get(statusKey));
  }

  getStacks(statusKey: string): number {
    return this.runtimeState.statuses.get(statusKey)?.stacks ?? 0;
  }

  apply(request: CombatStatusApplyRequest): CombatStatusTransition {
    const definition = this.requireDefinition(request.statusKey);
    const incomingStacks = request.stacks ?? definition.applyStacks;
    const maxStacks = request.maxStacks ?? definition.maxStacks;
    const incomingDuration = request.durationFrames ?? definition.durationFrames;
    requirePositiveSafeInteger(incomingStacks, `status '${request.statusKey}' apply stacks`);
    requirePositiveSafeInteger(maxStacks, `status '${request.statusKey}' max stacks`);
    requireDuration(incomingDuration, `status '${request.statusKey}' duration`);
    if (request.sourceId.length === 0 || request.skillId.length === 0) {
      throw new Error(`status '${request.statusKey}' requires source and skill identities`);
    }

    const existing = this.runtimeState.statuses.get(request.statusKey);
    const previous = snapshot(existing);
    if (existing === undefined) {
      this.runtimeState.statuses.set(request.statusKey, {
        statusKey: request.statusKey,
        sourceId: request.sourceId,
        skillId: request.skillId,
        stacks: Math.min(incomingStacks, maxStacks),
        remainingFrames: incomingDuration,
      });
    } else {
      existing.stacks = Math.min(existing.stacks + incomingStacks, maxStacks);
      existing.remainingFrames = stackDuration(
        existing.remainingFrames,
        incomingDuration,
        definition.durationStacking,
      );
    }

    const current = snapshot(this.runtimeState.statuses.get(request.statusKey));
    return {
      statusKey: request.statusKey,
      reason: 'applied',
      sourceId: request.sourceId,
      skillId: request.skillId,
      previous,
      current,
    };
  }

  consume(request: CombatStatusConsumeRequest): CombatStatusTransition {
    const definition = this.requireDefinition(request.statusKey);
    const existing = this.runtimeState.statuses.get(request.statusKey);
    const previous = snapshot(existing);
    const requested = request.stacks ?? definition.consumeStacks;
    if (request.sourceId.length === 0 || request.skillId.length === 0) {
      throw new Error(`status '${request.statusKey}' requires source and skill identities`);
    }
    if (requested !== 'all') {
      requirePositiveSafeInteger(requested, `status '${request.statusKey}' consume stacks`);
    }

    if (existing === undefined) {
      return {
        statusKey: request.statusKey,
        reason: 'consumed',
        sourceId: request.sourceId,
        skillId: request.skillId,
        previous,
        current: previous,
      };
    }

    const consumedStacks = requested === 'all' ? existing.stacks : requested;
    existing.stacks = Math.max(0, existing.stacks - consumedStacks);
    if (existing.stacks === 0) this.runtimeState.statuses.delete(request.statusKey);
    return {
      statusKey: request.statusKey,
      reason: 'consumed',
      sourceId: request.sourceId,
      skillId: request.skillId,
      previous,
      current: snapshot(this.runtimeState.statuses.get(request.statusKey)),
    };
  }

  /** 每次调用推进一帧，并按状态插入顺序返回这一帧自然到期的事实。 */
  advanceFrame(): readonly CombatStatusTransition[] {
    const expired: CombatStatusTransition[] = [];
    for (const [statusKey, status] of this.runtimeState.statuses) {
      if (status.remainingFrames === null) continue;
      const previous = snapshot(status);
      status.remainingFrames = Math.max(0, status.remainingFrames - 1);
      if (status.remainingFrames > 0) continue;
      this.runtimeState.statuses.delete(statusKey);
      expired.push({
        statusKey,
        reason: 'expired',
        sourceId: status.sourceId,
        skillId: status.skillId,
        previous,
        current: EMPTY_STATUS,
      });
    }
    return expired;
  }

  private requireDefinition(statusKey: string): CombatStatusDefinition {
    const definition = this.#definitions.get(statusKey);
    if (definition === undefined) {
      throw new Error(`unknown combat status '${statusKey}'`);
    }
    return definition;
  }
}

function snapshot(status: ActiveCombatStatus | undefined): CombatStatusSnapshot {
  return status === undefined
    ? EMPTY_STATUS
    : { stacks: status.stacks, remainingFrames: status.remainingFrames };
}

function stackDuration(
  current: number | null,
  incoming: number | null,
  type: StatusDurationStackingType,
): number | null {
  if (type === 'overwrite') return incoming;
  if (current === null || incoming === null) return null;
  if (type === 'extend') return current + incoming;
  return Math.max(current, incoming);
}

function validateDefinition(definition: CombatStatusDefinition): void {
  if (definition.statusKey.length === 0) throw new Error('combat status key must not be empty');
  if (!STATUS_DURATION_STACKING_TYPES.includes(definition.durationStacking)) {
    throw new Error(
      `status '${definition.statusKey}' has unknown duration stacking '${definition.durationStacking}'`,
    );
  }
  requirePositiveSafeInteger(
    definition.applyStacks,
    `status '${definition.statusKey}' default apply stacks`,
  );
  requirePositiveSafeInteger(
    definition.maxStacks,
    `status '${definition.statusKey}' default max stacks`,
  );
  requireDuration(definition.durationFrames, `status '${definition.statusKey}' default duration`);
  if (definition.consumeStacks !== 'all') {
    requirePositiveSafeInteger(
      definition.consumeStacks,
      `status '${definition.statusKey}' default consume stacks`,
    );
  }
}

function requirePositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive safe integer`);
  }
}

function requireDuration(value: number | null, label: string): void {
  if (value !== null && (!Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError(`${label} must be null or a non-negative safe integer`);
  }
}
