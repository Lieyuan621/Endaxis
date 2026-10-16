/** 按正式装配的原生阶段顺序驱动一个已经完成对象关系提交的恢复候选。 */
import { CombatResourceRuntime } from '../../resources/combatResourceRuntime';
import type { OperatorControlRuntime } from '../../skills/operatorControlRuntime';
import { PlayerMultiDashRuntime } from '../../skills/playerMultiDashRuntime';
import { bindCombatFramePipeline } from '../combatFramePipeline';
import type { EnemyBuffRuntime } from '../combatRuntimeAssembly';
import type { FrameRuntime } from '../combatSimulation';
import { CombatSimulation } from '../combatSimulation';
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import type { RestoredCombatBuffInstances } from './combatRuntimeBuffInstanceRestoration';
import type { RestoredCombatRuntimeOperators } from './combatRuntimeOperatorRestoration';
import type { ProjectileLifecycleRuntime } from '../../abilities/projectileLifecycleRuntime';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';

export interface RestoreCombatRuntimeFrameOptions {
  /** 已绑定当前切面身份的主控运行时；此层只负责安排推进顺序。 */
  readonly control: OperatorControlRuntime;
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly objects: {
    readonly projectiles: ProjectileLifecycleRuntime;
    readonly buffs: RestoredCombatBuffInstances;
    readonly operators: RestoredCombatRuntimeOperators;
  };
  readonly operatorCenters?: readonly FrameRuntime[];
  readonly playerMultiDash?: FrameRuntime;
  /** 输入运行时已经绑定保存游标时，在与普通装配完全相同的位置安装两个输入阶段。 */
  readonly bindInputPhases?: boolean;
}

export interface RestoredCombatRuntimeFrame {
  readonly control: OperatorControlRuntime;
  readonly simulation: CombatSimulation;
  advanceFrame(): void;
  advanceFrames(count: number): void;
}

export function bindRestoredCombatRuntimeFrame(
  options: RestoreCombatRuntimeFrameOptions,
): RestoredCombatRuntimeFrame {
  const { shared } = options.foundation;
  const enemyBuffs = options.foundation.enemyBuffTarget as EnemyBuffRuntime;
  const simulation = new CombatSimulation(shared.clock);
  const control = options.control;
  const cores = [...options.objects.operators.cores.values()];
  const multiDash = new PlayerMultiDashRuntime();
  bindCombatFramePipeline(simulation, {
    timeDilation: shared.timeDilation,
    frameEndEvents: options.foundation.boundEnvironment.frameEndEvents,
    control,
    enemyControl: options.foundation.boundEnvironment.enemyControlRuntime,
    resources: new CombatResourceRuntime(shared.resources, shared.clock, shared.receipt),
    globalBuffs: options.objects.buffs.globalBuffs,
    abilityEntities: options.entities.runtime,
    projectiles: options.objects.projectiles,
    enemyBuffs,
    enemyVitals: options.foundation.boundEnvironment.enemyVitalsRuntime,
    comboWindows: shared.comboWindows,
    playerMultiDash: options.playerMultiDash ?? {
      advanceFrame: () =>
        multiDash.advanceFrame(
          shared.runtimeState.multiDash,
          shared.timeDilation?.currentGlobalScale ?? 1,
        ),
    },
    operatorCenters: options.operatorCenters ?? [],
    abilities: cores.map(core => core.ability),
    bindInputPhases: options.bindInputPhases === true,
  });

  return {
    control,
    simulation,
    advanceFrame: () => simulation.advanceFrame(),
    advanceFrames: count => simulation.advanceFrames(count),
  };
}
