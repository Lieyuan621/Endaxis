/**
 * 战斗装配根的共享运行时对象。
 *
 * 新战斗和恢复战斗都必须通过这里一次性建立时钟、资源、回执、时间膨胀、连携、演出、冷却和
 * 编号目录。恢复时每个对象直接绑定同一份 `CombatSharedState` 数据，不能先创建空账本再覆盖。
 */
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { AbilityEntityInstanceIdAllocator } from '../abilities/abilityEntityInstanceIdAllocator';
import { CombatClock } from '../time/combatClock';
import type {
  CombatResourceRuntimeResolvers,
  CombatResourceSnapshot,
} from '../resources/combatResources';
import { CombatResources } from '../resources/combatResources';
import { createPlayerMultiDashState, type CombatSharedState } from '../state/environmentState';
import { ComboWindowRuntime } from '../skills/comboWindowRuntime';
import { GlobalCooldowns } from '../skills/globalCooldowns';
import { BasicAttackSkillCastInheritanceRegistry } from '../skills/skillCastInheritanceOperationExecutor';
import { SkillCastIdAllocator } from '../skills/skillCastInfo';
import {
  TimeDilationRuntime,
  type TimeDilationPrograms,
  type TimeDilationRuntimeConfig,
  type TimeDilationRuntimeObserver,
} from '../time/timeDilationRuntime';
import { UltimatePresentationRuntime } from '../skills/ultimatePresentationRuntime';

export interface CombatSharedRuntimeOptions {
  readonly resources: CombatResourceSnapshot;
  readonly resourceResolvers?: CombatResourceRuntimeResolvers;
  readonly operatorOrder: readonly string[];
  readonly initialFrame?: number;
  readonly receipt?: CombatReceiptCollector;
  readonly timeDilation?: {
    readonly config: TimeDilationRuntimeConfig;
    readonly observer?: TimeDilationRuntimeObserver;
  };
}

export interface RestoredCombatSharedRuntime {
  readonly state: CombatSharedState;
  /** 曲线程序是同一切面树共享的固定逻辑，不复制进数据。 */
  readonly timeDilationPrograms?: TimeDilationPrograms;
}

export class CombatSharedRuntime {
  readonly clock: CombatClock;
  readonly resources: CombatResources;
  readonly receipt: CombatReceiptCollector;
  readonly ultimatePresentation: UltimatePresentationRuntime;
  readonly comboWindows: ComboWindowRuntime;
  readonly timeDilation: TimeDilationRuntime | null;
  readonly globalCooldowns: GlobalCooldowns;
  readonly abilityEntityInstanceIds: AbilityEntityInstanceIdAllocator;
  readonly skillCastIds: SkillCastIdAllocator;
  readonly basicAttackInheritance: BasicAttackSkillCastInheritanceRegistry;
  readonly runtimeState: CombatSharedState;

  constructor(options: CombatSharedRuntimeOptions, restored?: RestoredCombatSharedRuntime) {
    const state = restored?.state;
    if (
      state !== undefined &&
      (state.timeDilation === null) !== (options.timeDilation === undefined)
    )
      throw new Error('restored time-dilation state does not match the scenario');
    if (
      state?.timeDilation !== undefined &&
      state.timeDilation !== null &&
      restored?.timeDilationPrograms === undefined
    )
      throw new Error('restored time dilation requires its shared program directory');

    this.clock = new CombatClock(state?.clock);
    if (state === undefined) this.clock.initializeFrame(options.initialFrame ?? 0);
    this.resources = new CombatResources(
      options.resources,
      options.resourceResolvers,
      state?.resources,
    );
    this.receipt = options.receipt ?? new CombatReceiptCollector();
    this.ultimatePresentation = new UltimatePresentationRuntime(
      this.clock,
      this.receipt,
      state?.ultimatePresentation,
    );
    this.comboWindows = new ComboWindowRuntime(
      this.clock,
      this.receipt,
      options.operatorOrder,
      state?.comboWindows,
    );
    this.timeDilation =
      options.timeDilation === undefined
        ? null
        : new TimeDilationRuntime(
            options.timeDilation.config,
            options.timeDilation.observer,
            state?.timeDilation === undefined || state.timeDilation === null
              ? undefined
              : {
                  state: state.timeDilation,
                  programs: restored!.timeDilationPrograms!,
                },
          );
    this.globalCooldowns = new GlobalCooldowns(this.clock, state?.globalCooldowns);
    this.abilityEntityInstanceIds = new AbilityEntityInstanceIdAllocator(
      state?.identities.abilityEntities,
    );
    this.skillCastIds = new SkillCastIdAllocator(state?.identities.skillCasts);
    this.basicAttackInheritance = new BasicAttackSkillCastInheritanceRegistry(
      state?.basicAttackInheritance,
    );
    this.runtimeState = state ?? {
      clock: this.clock.runtimeState,
      resources: this.resources.runtimeState,
      multiDash: createPlayerMultiDashState(),
      timeDilation: this.timeDilation?.runtimeState ?? null,
      comboWindows: this.comboWindows.runtimeState,
      ultimatePresentation: this.ultimatePresentation.runtimeState,
      globalCooldowns: this.globalCooldowns.runtimeState,
      basicAttackInheritance: this.basicAttackInheritance.runtimeState,
      identities: {
        abilityEntities: this.abilityEntityInstanceIds.runtimeState,
        skillCasts: this.skillCastIds.runtimeState,
      },
    };
  }
}
