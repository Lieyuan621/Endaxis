import type { ActorSnapshot, EnemyConfig, TeamConfig } from '@/simulation/state/types.ts';
import { SimulationEngine } from './SimulationEngine';
import { HitHandler } from '../events/HitHandler';
import { ActionStartHandler } from '../events/ActionStartHandler';
import { ActionEndHandler } from '../events/ActionEndHandler';
import { SpChangeHandler } from '../events/SpChangeHandler';
import { SpRegenPauseHandler } from '../events/SpRegenPauseHandler';
import { StaggerChangeHandler } from '../events/StaggerChangeHandler';
import { UltEnergyHandler } from '../events/UltEnergyHandler';
import { OperatorEffectHandler } from '../events/OperatorEffectHandler';
import { EnemyEffectHandler } from '../events/EnemyEffectHandler';
import type { ResolvedTimeline } from '../compiler/types';
import type { TriggerRegistry } from './TriggerRegistry';

export function createEngine(
  teamConfig: TeamConfig,
  enemyConfig: EnemyConfig,
  actors: ActorSnapshot[],
  timeline: ResolvedTimeline,
  triggerRegistry?: TriggerRegistry,
) {
  const engine = new SimulationEngine(timeline, teamConfig, enemyConfig, actors);

  engine.registerHandler('DAMAGE_HIT', new HitHandler(triggerRegistry));
  engine.registerHandler('ACTION_START', new ActionStartHandler(triggerRegistry));
  engine.registerHandler('ACTION_END', new ActionEndHandler());
  engine.registerHandler('SP_CHANGE', new SpChangeHandler(triggerRegistry));
  engine.registerHandler('ULT_ENERGY_CHANGE', new UltEnergyHandler());
  engine.registerHandler('SP_REGEN_PAUSE', new SpRegenPauseHandler());
  engine.registerHandler('STAGGER_CHANGE', new StaggerChangeHandler());
  engine.registerHandler('OPERATOR_EFFECT_APPLY', new OperatorEffectHandler(triggerRegistry));
  engine.registerHandler('OPERATOR_EFFECT_EXPIRE', new OperatorEffectHandler(triggerRegistry));
  engine.registerHandler('ENEMY_EFFECT_APPLY', new EnemyEffectHandler(triggerRegistry));
  engine.registerHandler('ENEMY_EFFECT_EXPIRE', new EnemyEffectHandler(triggerRegistry));
  engine.registerHandler('ARTS_BURST', new EnemyEffectHandler(triggerRegistry));
  engine.registerHandler('CORROSION_TICK', new EnemyEffectHandler(triggerRegistry));
  engine.registerHandler('DOT_TICK', new EnemyEffectHandler(triggerRegistry));

  return engine;
}
