/**
 * 将玩家主动技能当前已闭环的元素附着与伤害执行器接入同一后继责任链。
 * 本模块只完成运行时接线；一个 Hit 内的真实先后仍完全由已编译 sequence 的 step 顺序决定。
 */
import type { CombatVitals } from '../resources/combatVitals';
import {
  ElementalInflictionOperationExecutor,
  type ElementalInflictionOperationDependencies,
} from '../infliction/elementalInflictionOperationExecutor';
import {
  PlayerDamageOperationExecutor,
  type PlayerDamageOperationDependencies,
} from './playerDamageOperationExecutor';
import type { CombatOperationExecutorContext } from '../runtime/combatRuntimeAssembly';
import type { ElementalBuffRuntime } from '../buffs/elementalBuffRuntime';
import type { CombatOperationExecutor } from '../skills/skillRuntime';

type DamagePorts = Omit<
  PlayerDamageOperationDependencies,
  'sourceOperatorId' | 'targetId' | 'targetVitals' | 'clock' | 'receipt' | 'delegate'
>;

type InflictionPorts = Omit<
  ElementalInflictionOperationDependencies,
  'sourceOperatorId' | 'targetId' | 'skillId' | 'clock' | 'receipt' | 'delegate'
>;

type InflictionEventPorts = Pick<
  ElementalInflictionOperationDependencies,
  'emitSourceEvent' | 'emitTargetEvent'
>;

/** 标准玩家主动操作链仍需由战斗环境提供的实体状态与事件端口。 */
export interface PlayerActiveOperationExecutorOptions {
  readonly context: CombatOperationExecutorContext;
  readonly targetId: string;
  readonly targetVitals: CombatVitals;
  readonly damage: DamagePorts;
  readonly infliction: InflictionPorts;
  /** 尚未由本组合闭环的操作必须继续交给显式后继，不能静默吞掉。 */
  readonly delegate: CombatOperationExecutor;
}

/** 使用实体元素 Buff 运行时装配附着端口时所需的额外输入。 */
export interface PlayerActiveElementalTargetOptions<Key extends string> extends Omit<
  PlayerActiveOperationExecutorOptions,
  'infliction'
> {
  readonly elementalTarget: ElementalBuffRuntime<Key>;
  readonly inflictionEvents: InflictionEventPorts;
}

/** 创建可直接用作 `CombatRuntimeAssembly.createOperationExecutor` 返回值的标准责任链。 */
export function createPlayerActiveOperationExecutor(
  options: PlayerActiveOperationExecutorOptions,
): CombatOperationExecutor {
  const shared = {
    sourceOperatorId: options.context.program.operatorId,
    skillId: options.context.program.skillId,
    skillType: options.context.program.skillType,
    resolveCriticalOverride: (
      step: Parameters<
        NonNullable<PlayerDamageOperationDependencies['resolveCriticalOverride']>
      >[0],
    ) =>
      step.key === undefined
        ? undefined
        : options.context.readSimulationInputs?.()?.criticalOverrides?.[step.key],
    targetId: options.targetId,
    clock: options.context.clock,
    receipt: options.context.receipt,
  };
  const damage = new PlayerDamageOperationExecutor({
    ...options.damage,
    ...shared,
    targetVitals: options.targetVitals,
    delegate: options.delegate,
  });
  return new ElementalInflictionOperationExecutor({
    ...options.infliction,
    ...shared,
    skillId: options.context.program.skillId,
    delegate: damage,
  });
}

/**
 * 为一条玩家主动技能链创建独立的元素适配器，并接入标准伤害执行器。
 * 适配器不能跨技能复用，因为它会暂存本次附着决策读取到的目标 Buff 实例。
 */
export function createPlayerActiveOperationExecutorForElementalTarget<Key extends string>(
  options: PlayerActiveElementalTargetOptions<Key>,
): CombatOperationExecutor {
  const adapter = options.elementalTarget.createInflictionAdapter(
    options.context.program.operatorId,
  );
  return createPlayerActiveOperationExecutor({
    context: options.context,
    targetId: options.targetId,
    targetVitals: options.targetVitals,
    damage: options.damage,
    delegate: options.delegate,
    infliction: {
      getExistingAttachment: () => adapter.getExistingAttachment(),
      applyOperation: (operation, skillCastInfo, producedBy) =>
        adapter.apply(operation, { skillCastInfo, producedBy }),
      ...options.inflictionEvents,
    },
  });
}
