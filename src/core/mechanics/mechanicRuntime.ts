/**
 * 已编译场景机制与一次战斗实例之间的装配边界。
 * 只能安装编译器产物；Adapter 不会获得序列执行器或运行时可变对象。
 */
import type {
  AbilityEventContext,
  AbilityEventDispatcher,
} from '../combat/events/abilityEventDispatcher';
import type {
  GameLevelEventContext,
  GameLevelEventDispatcher,
} from '../combat/events/gameLevelEventDispatcher';
import type { ResolvedActionSequence } from '../compiler/combatProgram';
import type { CompiledMechanics } from './mechanicCompiler';
import type { MechanicAbilityEvent, MechanicGameLevelEvent } from './mechanicContribution';

/** 执行机制序列时保留的项目选择和定义机制身份。 */
export interface MechanicExecutionSource {
  readonly selectionId: string;
  readonly mechanicId: string;
}

/** 机制序列收到的 Ability 或关卡事件上下文。 */
export type MechanicEventContext<AbilityPayload, LevelPayload> =
  | { readonly domain: 'battleInitialization' }
  | {
      readonly domain: 'ability';
      readonly event: AbilityEventContext<MechanicAbilityEvent, AbilityPayload>;
    }
  | {
      readonly domain: 'gameLevel';
      readonly event: GameLevelEventContext<MechanicGameLevelEvent['kind'], LevelPayload>;
    };

/** 执行核心序列；活动适配器不会获得此运行时端口。 */
export interface MechanicSequenceExecutor<AbilityPayload = unknown, LevelPayload = unknown> {
  execute(
    sequence: ResolvedActionSequence,
    source: MechanicExecutionSource,
    context: MechanicEventContext<AbilityPayload, LevelPayload>,
  ): void;
}

/** 安装机制贡献所需的事件总线和核心序列执行端口。 */
export interface MechanicRuntimeDependencies<AbilityPayload = unknown, LevelPayload = unknown> {
  readonly abilityEvents: AbilityEventDispatcher<
    MechanicAbilityEvent,
    Record<MechanicAbilityEvent, AbilityPayload>
  >;
  readonly gameLevelEvents: GameLevelEventDispatcher<MechanicGameLevelEvent['kind'], LevelPayload>;
  readonly sequenceExecutor: MechanicSequenceExecutor<AbilityPayload, LevelPayload>;
}

/** 将已编译的数据贡献安装到还原出的事件边界。 */
export function installMechanicContributions<AbilityPayload = unknown, LevelPayload = unknown>(
  mechanics: CompiledMechanics,
  dependencies: MechanicRuntimeDependencies<AbilityPayload, LevelPayload>,
): void {
  for (const entry of mechanics.contributions) {
    const source = { selectionId: entry.selectionId, mechanicId: entry.mechanicId };
    const contribution = entry.contribution;
    if (contribution.kind === 'enemyProgramStatMultiplier') {
      // 静态敌人程序已经在生命账本创建前消费该贡献，不能在事件运行时重复应用。
      continue;
    } else if (contribution.kind === 'battleInitializationSequence') {
      dependencies.sequenceExecutor.execute(contribution.sequence, source, {
        domain: 'battleInitialization',
      });
    } else if (contribution.kind === 'combatEventSequence') {
      dependencies.abilityEvents.registerAction(contribution.event, contribution.priority, event =>
        dependencies.sequenceExecutor.execute(contribution.sequence, source, {
          domain: 'ability',
          event,
        }),
      );
    } else {
      dependencies.gameLevelEvents.registerCallback(contribution.event.kind, event =>
        dependencies.sequenceExecutor.execute(contribution.sequence, source, {
          domain: 'gameLevel',
          event,
        }),
      );
    }
  }
}
