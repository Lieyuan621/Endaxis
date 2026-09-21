/**
 * 从已经复制出的战斗数据图建立一个可逐帧继续运行的恢复候选。
 *
 * 固定程序目录和环境工厂来自当前切面树；函数不会复制输入图，也不会读取或提交未来技能输入。
 */
import {
  bindRestoredCombatAbilityEntityDirectory,
  type RestoreCombatAbilityEntityDirectoryOptions,
  type RestoredCombatAbilityEntityDirectory,
} from './combatRuntimeAbilityEntityRestoration';
import {
  bindRestoredCombatRuntimeFrame,
  type RestoreCombatRuntimeFrameOptions,
  type RestoredCombatRuntimeFrame,
} from './combatRuntimeFrameRestoration';
import {
  bindRestoredCombatRuntimeObjectGraph,
  type RestoreCombatRuntimeObjectGraphOptions,
  type RestoredCombatRuntimeObjectGraph,
} from './combatRuntimeObjectGraphRestoration';
import {
  prepareCombatRuntimeRestore,
  type CombatRuntimeRestorePreparation,
} from './combatRuntimeRestorePreparation';
import {
  bindRestoredCombatRuntimeFoundation,
  type RestoreCombatRuntimeFoundationOptions,
  type RestoredCombatRuntimeFoundation,
} from './combatRuntimeRestoreFoundation';
import type { CombatOperatorProgram } from '../combatRuntimeAssembly';
import type { CombatStateGraph } from '../../state/combatState';
import type { CombatSkillPrograms } from '../../skills/combatSkillPrograms';
import { TimedMarkerContainer, type TimedMarkerContainerHooks } from '../../status/timedMarkers';

type RestoreCombatRuntimeObjectOptions = Omit<
  RestoreCombatRuntimeObjectGraphOptions,
  'preparation' | 'foundation' | 'entities'
>;

export interface RestoreCombatRuntimeObjectContext {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly enemyTimedMarkers: TimedMarkerContainer;
}

export interface RestoreCombatRuntimeOptions {
  readonly graph: CombatStateGraph;
  readonly programs: readonly CombatOperatorProgram[];
  readonly fixedSkillPrograms: CombatSkillPrograms;
  readonly foundation: Omit<RestoreCombatRuntimeFoundationOptions, 'preparation'>;
  readonly abilityEntities?: Omit<
    RestoreCombatAbilityEntityDirectoryOptions,
    'preparation' | 'foundation'
  >;
  readonly enemyTimedMarkerHooks?: TimedMarkerContainerHooks;
  readonly objects:
    | RestoreCombatRuntimeObjectOptions
    | ((context: RestoreCombatRuntimeObjectContext) => RestoreCombatRuntimeObjectOptions);
  readonly frame?: Omit<
    RestoreCombatRuntimeFrameOptions,
    'preparation' | 'foundation' | 'entities' | 'objects'
  >;
}

export interface RestoredCombatRuntime {
  readonly stateGraph: CombatStateGraph;
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly enemyTimedMarkers: TimedMarkerContainer;
  readonly objects: RestoredCombatRuntimeObjectGraph;
  readonly frame: RestoredCombatRuntimeFrame;
}

export function restoreCombatRuntime(options: RestoreCombatRuntimeOptions): RestoredCombatRuntime {
  const preparation = prepareCombatRuntimeRestore(
    options.graph,
    options.programs,
    options.fixedSkillPrograms,
  );
  const foundation = bindRestoredCombatRuntimeFoundation({
    preparation,
    ...options.foundation,
  });
  const entities = bindRestoredCombatAbilityEntityDirectory({
    preparation,
    foundation,
    ...options.abilityEntities,
  });
  const enemyTimedMarkers = new TimedMarkerContainer(
    'enemy',
    foundation.shared.timeDilation?.getEntityClock('enemy') ?? foundation.shared.clock,
    options.enemyTimedMarkerHooks,
    options.graph.enemy.timedMarkers,
    {
      global: foundation.shared.timeDilation ?? foundation.shared.clock,
      globalScaled: foundation.shared.timeDilation ?? foundation.shared.clock,
    },
  );
  const objectContext = { preparation, foundation, entities, enemyTimedMarkers };
  const objectOptions =
    typeof options.objects === 'function' ? options.objects(objectContext) : options.objects;
  const objects = bindRestoredCombatRuntimeObjectGraph({
    ...objectContext,
    ...objectOptions,
  });
  const frame = bindRestoredCombatRuntimeFrame({
    preparation,
    foundation,
    entities,
    objects,
    ...options.frame,
  });
  return {
    stateGraph: options.graph,
    preparation,
    foundation,
    entities,
    enemyTimedMarkers,
    objects,
    frame,
  };
}
