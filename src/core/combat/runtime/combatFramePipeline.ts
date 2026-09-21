/** 新战斗和恢复战斗使用同一份帧内顺序，不在两处分别维护游戏推进规则。 */
import type { EnemyBuffRuntime } from './combatRuntimeAssembly';
import type { CombatSimulation, FrameRuntime } from './combatSimulation';
import type { TimeDilationRuntime } from '../time/timeDilationRuntime';
import type { ProjectileLifecycleRuntime } from '../abilities/projectileLifecycleRuntime';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';

export interface CombatFramePipeline {
  readonly timeDilation: TimeDilationRuntime | null;
  readonly control: FrameRuntime;
  readonly enemyControl?: { advance(deltaSeconds: number): void } | null;
  readonly resources: FrameRuntime & { advance?(deltaSeconds: number): void };
  readonly globalBuffs: FrameRuntime & { advance?(deltaSeconds: number): void };
  readonly abilityEntities: FrameRuntime;
  readonly projectiles: Pick<
    ProjectileLifecycleRuntime,
    'advanceFrame' | 'beginAbilityFrame' | 'advanceAbilityFrame'
  >;
  readonly enemyBuffs: EnemyBuffRuntime;
  readonly enemyVitals?: (FrameRuntime & { advance?(deltaSeconds: number): void }) | null;
  readonly enemyStatuses?: FrameRuntime;
  readonly operatorStatuses: readonly FrameRuntime[];
  readonly comboWindows: FrameRuntime & { advance?(deltaSeconds: number): void };
  /** PlayerController 的连续闪避窗口，每帧只推进一次。 */
  readonly playerMultiDash: FrameRuntime;
  readonly operatorCenters: readonly FrameRuntime[];
  readonly abilities: readonly FrameRuntime[];
  readonly bindInputPhases: boolean;
}

export function bindCombatFramePipeline(
  simulation: CombatSimulation,
  systems: CombatFramePipeline,
): void {
  const { timeDilation, enemyBuffs, enemyControl, enemyVitals, projectiles } = systems;
  if (timeDilation !== null) simulation.add(timeDilation);
  simulation.addInputPhase('controlInputs', systems.control);
  // 控制组件 FixedTick 早于 AbilitySystem 的 Buff PreLateTick。
  if (enemyControl != null)
    simulation.add({
      advanceFrame: () =>
        enemyControl.advance(COMBAT_FRAME_INTERVAL * (timeDilation?.getEntityScale('enemy') ?? 1)),
    });
  const advanceGlobal = (runtime: FrameRuntime & { advance?(deltaSeconds: number): void }) => {
    if (runtime.advance === undefined) runtime.advanceFrame();
    else runtime.advance(COMBAT_FRAME_INTERVAL * (timeDilation?.currentGlobalScale ?? 1));
  };
  simulation.add({ advanceFrame: () => advanceGlobal(systems.resources) });
  // 父 Buff、实体与投射物寿命先于输入和技能动作推进。
  simulation.add({ advanceFrame: () => advanceGlobal(systems.globalBuffs) });
  simulation.add(systems.abilityEntities);
  simulation.add(projectiles);
  simulation.add({ advanceFrame: () => projectiles.beginAbilityFrame() });
  simulation.add({
    advanceFrame: () => {
      if (timeDilation === null || enemyBuffs.advanceWithDeltas === undefined) {
        enemyBuffs.advanceFrame();
      } else {
        enemyBuffs.advanceWithDeltas(
          timeDilation.getAbilityTickDeltas('enemy', COMBAT_FRAME_INTERVAL),
        );
      }
    },
  });
  if (enemyVitals != null)
    simulation.add({
      advanceFrame: () => {
        if (timeDilation === null || enemyVitals.advance === undefined) enemyVitals.advanceFrame();
        else enemyVitals.advance(COMBAT_FRAME_INTERVAL * timeDilation.currentGlobalScale);
      },
    });
  if (systems.enemyStatuses !== undefined) simulation.add(systems.enemyStatuses);
  simulation.add({ advanceFrame: () => enemyBuffs.recycleFinishedBuffs?.() });
  for (const status of systems.operatorStatuses) simulation.add(status);
  // 本帧归零的连携窗口不能再被同帧输入消费。
  simulation.add({ advanceFrame: () => advanceGlobal(systems.comboWindows) });
  simulation.add(systems.playerMultiDash);
  for (const center of systems.operatorCenters) simulation.add(center);
  if (systems.bindInputPhases) simulation.addInputPhase('skillInputs');
  for (const ability of systems.abilities) simulation.add(ability);
  simulation.add({ advanceFrame: () => projectiles.advanceAbilityFrame() });
  // 外部事实晚于技能，允许本帧刚创建的监听器接收。
  if (systems.bindInputPhases) simulation.addInputPhase('externalEvents');
}
