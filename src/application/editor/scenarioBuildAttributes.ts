import {
  ATTRIBUTE_MODIFIER_SLOTS,
  type AttributeModifierSlot,
} from '../../../packages/game-data-contract/src/modifiers';
import { resolveScenarioBuilds } from '../../core/compiler/resolveScenarioBuilds';
import { resolveOperatorPanel } from '../../core/compiler/resolveOperatorPanel';
/** 构筑属性在独立初始化环境中结算，不消费时间轴输入或推进战斗时间。 */
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { ScenarioDocument } from '../../core/project/schema';
import { mapLevelEnemies } from '../../core/project/level';
import { CombatAttributeSet } from '../../core/combat/attributes/combatAttributes';
import { resolveOperatorAttack } from '../../core/combat/attributes/operatorAttackAttributes';
import { createScenarioSimulationService } from '../simulation/createScenarioSimulationService';

export interface BuildAttributeModifier {
  readonly buffId: string;
  readonly sourceActionId: string;
  readonly attribute: string;
  readonly slot: AttributeModifierSlot;
  readonly value: number;
}
export interface ScenarioBuildAttributes {
  readonly operatorModifiers: ReadonlyMap<string, readonly BuildAttributeModifier[]>;
  readonly enemies: ReadonlyMap<string, Readonly<Record<string, number>>>;
  readonly operators: ReadonlyMap<string, Readonly<Record<string, number>>>;
}

export function resolveScenarioBuildAttributes(
  scenario: ScenarioDocument,
  repository: GameDataRepository,
): ScenarioBuildAttributes {
  const build: ScenarioDocument = {
    ...scenario,
    inheritance: undefined,
    level: mapLevelEnemies(scenario.level, instance => ({
      ...instance,
      enemy: { ...instance.enemy, lifecycle: { spawnFrame: 0, presenceChanges: [] } },
    })),
    battle: {
      ...scenario.battle,
      enemyAutomaticDeath: false,
      controlSwitches: [],
      enemyTargetSwitches: [],
    },
  };
  const runtime = createScenarioSimulationService(repository).createBuildAttributeRuntime(build);
  const graph = runtime.stateGraph;
  const capture = (attributes: CombatAttributeSet<string>) =>
    Object.fromEntries(
      [...attributes.runtimeState.definitions.keys()].map(key => [key, attributes.get(key)]),
    );
  return {
    operatorModifiers: new Map(
      [...graph.operators].map(([id, operator]) => [
        id,
        [...(operator.buffs?.instances.values() ?? [])].flatMap(buff =>
          buff.attributes.modifiers.flatMap(modifier =>
            ATTRIBUTE_MODIFIER_SLOTS.flatMap(slot => {
              const value = modifier.values[slot];
              const neutral = slot === 'finalMultiplier' || slot === 'baseFinalMultiplier' ? 1 : 0;
              return value === neutral
                ? []
                : [
                    {
                      buffId: buff.identity.definitionId,
                      sourceActionId: buff.sourceActionId,
                      attribute: modifier.attribute,
                      slot,
                      value,
                    },
                  ];
            }),
          ),
        ),
      ]),
    ),
    enemies: new Map(
      [...(graph.environment?.enemyInstances ?? [])].map(([id, enemy]) => [
        id,
        capture(new CombatAttributeSet(enemy.buffs.attributes)),
      ]),
    ),
    operators: new Map(
      resolveScenarioBuilds(build, repository).flatMap(resolved => {
        const operator = { operatorId: resolved.track.id, panel: resolveOperatorPanel(resolved) };
        const state = graph.operators.get(operator.operatorId)?.buffs;
        if (!state || !operator.panel) return [];
        const attributes = new CombatAttributeSet(state.attributes);
        return [
          [
            operator.operatorId,
            {
              ...capture(attributes),
              attack: resolveOperatorAttack(operator.panel, attributes).value,
            },
          ],
        ];
      }),
    ),
  };
}
