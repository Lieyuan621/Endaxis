/** 按正式装配的原生阶段顺序驱动一个已经完成对象关系提交的恢复候选。 */
import type { CombatStatusContainer } from '../../status/combatStatuses';
import type { EnemyBuffRuntime } from '../combatRuntimeAssembly';
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import type { RestoredCombatRuntimeObjectGraph } from './combatRuntimeObjectGraphRestoration';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';
import { bindCombatFramePipeline } from '../combatFramePipeline';
import { OperatorControlRuntime } from '../../skills/operatorControlRuntime';
import { CombatResourceRuntime } from '../../resources/combatResourceRuntime';
import { CombatSimulation } from '../combatSimulation';
import { CombatStatusRuntime } from '../../status/combatStatusRuntime';
import { PlayerMultiDashRuntime } from '../../skills/playerMultiDashRuntime';

export interface RestoreCombatRuntimeFrameOptions {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly objects: RestoredCombatRuntimeObjectGraph;
  readonly enemyStatusContainer?: CombatStatusContainer;
  readonly operatorCenters?: readonly import('../combatSimulation').FrameRuntime[];
  readonly playerMultiDash?: import('../combatSimulation').FrameRuntime;
  /** 输入运行时已经绑定保存游标时，在与普通装配完全相同的位置安装两个输入阶段。 */
  readonly bindInputPhases?: boolean;
}

export interface RestoredCombatRuntimeFrame {
  readonly control: OperatorControlRuntime;
  readonly simulation: CombatSimulation;
  readonly enemyStatuses?: CombatStatusRuntime;
  advanceFrame(): void;
  advanceFrames(count: number): void;
}

export function bindRestoredCombatRuntimeFrame(
  options: RestoreCombatRuntimeFrameOptions,
): RestoredCombatRuntimeFrame {
  const { shared } = options.foundation;
  const enemyBuffs = options.foundation.enemyBuffTarget as EnemyBuffRuntime;
  let enemyStatuses: CombatStatusRuntime | undefined;
  const enemyStatusState = options.preparation.graph.enemy.statuses;
  if (options.enemyStatusContainer === undefined) {
    if (enemyStatusState !== null) {
      throw new Error('restored enemy has status data without definitions');
    }
  } else {
    if (options.enemyStatusContainer.ownerId !== 'enemy') {
      throw new Error(
        `status owner '${options.enemyStatusContainer.ownerId}' does not match enemy`,
      );
    }
    if (enemyStatusState === null) {
      throw new Error('restored enemy has status definitions without data');
    }
    enemyStatuses = new CombatStatusRuntime(
      options.enemyStatusContainer.bindRuntimeState(enemyStatusState),
      shared.clock,
      shared.receipt,
    );
  }

  const simulation = new CombatSimulation(shared.clock);
  const control = new OperatorControlRuntime(
    [...options.preparation.programs.keys()],
    shared.clock,
    options.foundation.environment.options.isOperatorControlled,
    options.foundation.environment.runtimeOptions.emitAbilityEvent,
    options.preparation.graph.inputs.control,
  );
  const cores = [...options.objects.operators.cores.values()];
  const multiDash = new PlayerMultiDashRuntime();
  bindCombatFramePipeline(simulation, {
    timeDilation: shared.timeDilation,
    control,
    enemyControl: options.foundation.boundEnvironment.enemyControlRuntime,
    resources: new CombatResourceRuntime(shared.resources, shared.clock, shared.receipt),
    globalBuffs: options.objects.buffs.globalBuffs,
    abilityEntities: options.entities.runtime,
    projectiles: options.objects.projectiles,
    enemyBuffs,
    enemyVitals: options.foundation.boundEnvironment.enemyVitalsRuntime,
    enemyStatuses,
    operatorStatuses: cores.flatMap(core => (core.statuses === undefined ? [] : [core.statuses])),
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
    enemyStatuses,
    advanceFrame: () => simulation.advanceFrame(),
    advanceFrames: count => simulation.advanceFrames(count),
  };
}
