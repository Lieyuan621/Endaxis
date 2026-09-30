/** 主控身份由手动切人和玩家输入修改；切面仅保存 runtimeState。 */
import type { CombatClock } from '../time/combatClock';
import type { CombatReceiptCollector } from '../receipt/combatReceipt';
import type { PlayerSkillInput, SkillType } from '../../game-data/operatorDefinition';
import type { FrameRuntime } from '../runtime/combatSimulation';

/** 一次模拟的固定配置，随装配传递，不写入战斗切面。 */
export interface OperatorControlConfiguration {
  readonly initialOperatorId: string | null;
  readonly automaticSwitches: boolean;
  /** 固定排程用；逐帧提交的模拟保持空数组，由 applyInput 接收手动切人。 */
  readonly scheduledSwitches: readonly {
    readonly frame: number;
    readonly operatorId: string | null;
  }[];
}

export interface OperatorControlRuntimeOptions {
  readonly clock: CombatClock;
  readonly state: Map<string, boolean>;
  readonly configuration?: OperatorControlConfiguration;
  /** 未提供场景配置的独立运行环境可以直接提供控制查询。 */
  readonly readControl?: (operatorId: string, frame: number) => boolean;
  readonly emit?: (
    operatorId: string,
    event: 'ownerSwitchToCenter' | 'ownerSwitchToGuard',
    payload: { sourceId: string; targetId: string },
  ) => void;
  readonly receipt: CombatReceiptCollector;
}

export class OperatorControlRuntime implements FrameRuntime {
  readonly runtimeState: Map<string, boolean>;
  readonly #scheduledSwitches: ReadonlyMap<number, string | null>;

  constructor(private readonly options: OperatorControlRuntimeOptions) {
    this.runtimeState = options.state;
    this.#scheduledSwitches = new Map(
      options.configuration?.scheduledSwitches.map(input => [input.frame, input.operatorId]),
    );
  }

  advanceFrame(): void {
    if (this.options.configuration !== undefined) {
      this.applyInput(this.#scheduledSwitches.get(this.options.clock.frame));
    } else if (this.options.readControl !== undefined) {
      this.#apply(id => this.options.readControl!(id, this.options.clock.frame));
    }
  }

  /** 在技能输入判定前执行；仍允许模拟有告警的输入，已是主控时不重复发事件或回执。 */
  beforeSkillInput(
    operatorId: string,
    action: PlayerSkillInput | undefined,
    skillType: SkillType | undefined,
    castId?: string,
  ): void {
    if (!this.options.configuration?.automaticSwitches) return;
    if (action !== 'basicAttack' && skillType !== 'finisher' && skillType !== 'plungingAttack')
      return;
    if (this.runtimeState.get(operatorId) === true) return;
    this.applyInput(operatorId);
    this.options.receipt.record({
      frame: this.options.clock.frame,
      time: this.options.clock.time,
      event: 'AutomaticControlSwitched',
      sourceId: operatorId,
      ...(castId === undefined ? {} : { data: { castId } }),
    });
  }

  applyInput(controlledOperatorId?: string | null): void {
    if (controlledOperatorId === undefined) return;
    if (controlledOperatorId !== null && !this.runtimeState.has(controlledOperatorId)) {
      throw new Error(`unknown controlled operator '${controlledOperatorId}'`);
    }
    this.#apply(id => id === controlledOperatorId);
  }

  #apply(readControl: (id: string) => boolean): void {
    const changes: [string, boolean][] = [];
    for (const [id, previous] of this.runtimeState) {
      const current = readControl(id);
      if (previous !== current) changes.push([id, current]);
    }
    // 先完整更新身份，再发通知，避免监听器读到半次切人。
    for (const [id, current] of changes) this.runtimeState.set(id, current);
    for (const [id, current] of changes) {
      this.options.emit?.(id, current ? 'ownerSwitchToCenter' : 'ownerSwitchToGuard', {
        sourceId: id,
        targetId: id,
      });
    }
  }
}
