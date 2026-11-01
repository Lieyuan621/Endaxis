/** 新战斗和恢复战斗使用同一份帧内顺序，不在两处分别维护游戏推进规则。 */
import type { EnemyBuffRuntime } from './combatRuntimeAssembly';
import type { CombatSimulation, FrameRuntime } from './combatSimulation';
import type { TimeDilationRuntime } from '../time/timeDilationRuntime';
import type { ProjectileLifecycleRuntime } from '../abilities/projectileLifecycleRuntime';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';

export interface EnemyFrameRuntimes {
  readonly ownerId: string;
  readonly buffs: Pick<
    EnemyBuffRuntime,
    'advanceFrame' | 'advanceWithDeltas' | 'recycleFinishedBuffs'
  >;
  readonly control?: { advance(deltaSeconds: number): void } | null;
  readonly vitals?: (FrameRuntime & { advance?(deltaSeconds: number): void }) | null;
}

export interface CombatFramePipeline {
  readonly primaryEnemyId: string;
  /** 切出仍存活；未出生或死亡后不推进生命和失衡恢复。 */
  readonly isEnemyAlive?: (ownerId: string) => boolean;
  readonly additionalEnemies?: readonly EnemyFrameRuntimes[];
  readonly enemyLifecycle?: FrameRuntime;
  readonly typhoeaArchery?: FrameRuntime;
  readonly frameEndEvents?: FrameRuntime;
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
  readonly enemyBuffs: EnemyFrameRuntimes['buffs'];
  readonly enemyVitals?: (FrameRuntime & { advance?(deltaSeconds: number): void }) | null;
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
  const enemies: readonly EnemyFrameRuntimes[] = [
    {
      ownerId: systems.primaryEnemyId,
      buffs: enemyBuffs,
      control: enemyControl,
      vitals: enemyVitals,
    },
    ...(systems.additionalEnemies ?? []),
  ];
  if (systems.enemyLifecycle !== undefined) simulation.add(systems.enemyLifecycle);
  if (systems.typhoeaArchery !== undefined) simulation.add(systems.typhoeaArchery);
  if (timeDilation !== null) simulation.add(timeDilation);
  simulation.addInputPhase('controlInputs', systems.control);
  // 控制组件 FixedTick 早于 AbilitySystem 的 Buff PreLateTick。
  for (const enemy of enemies) {
    if (enemy.control == null) continue;
    simulation.add({
      advanceFrame: () =>
        enemy.control!.advance(
          COMBAT_FRAME_INTERVAL * (timeDilation?.getEntityScale(enemy.ownerId) ?? 1),
        ),
    });
  }
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
  for (const enemy of enemies)
    simulation.add({
      advanceFrame: () => {
        if (timeDilation !== null && enemy.buffs.advanceWithDeltas !== undefined)
          enemy.buffs.advanceWithDeltas(
            timeDilation.getAbilityTickDeltas(enemy.ownerId, COMBAT_FRAME_INTERVAL),
          );
        else enemy.buffs.advanceFrame();
      },
    });
  for (const enemy of enemies) {
    const vitals = enemy.vitals;
    if (vitals != null)
      simulation.add({
        advanceFrame: () => {
          if (systems.isEnemyAlive?.(enemy.ownerId) !== false) advanceGlobal(vitals);
        },
      });
  }
  for (const enemy of enemies)
    simulation.add({ advanceFrame: () => enemy.buffs.recycleFinishedBuffs?.() });
  // 本帧归零的连携窗口不能再被同帧输入消费。
  simulation.add({ advanceFrame: () => advanceGlobal(systems.comboWindows) });
  simulation.add(systems.playerMultiDash);
  for (const center of systems.operatorCenters) simulation.add(center);
  if (systems.bindInputPhases) simulation.addInputPhase('skillInputs');
  for (const ability of systems.abilities) simulation.add(ability);
  simulation.add({ advanceFrame: () => projectiles.advanceAbilityFrame() });
  // 外部事实晚于技能，允许本帧刚创建的监听器接收。
  if (systems.bindInputPhases) simulation.addInputPhase('externalEvents');
  if (systems.frameEndEvents !== undefined) simulation.add(systems.frameEndEvents);
}
