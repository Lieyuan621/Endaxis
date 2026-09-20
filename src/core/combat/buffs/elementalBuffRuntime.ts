/**
 * 将单个战斗实体的 Buff 容器、严格定义和元素附着写入适配器收束为同一运行时。
 * 装配层应为每个实体创建一个实例；每条技能执行链再按来源创建独立适配器，避免共享投影状态。
 */
import type { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer, type CombatBuffAddOptions } from './combatBuffs';
import type { CompiledCombatBuffDefinitions } from './combatBuffDefinitions';
import { ElementalInflictionBuffAdapter } from '../infliction/elementalInflictionBuffAdapter';
import type { GameplayTagRegistry } from '../tags/gameplayTags';
import type { SharedSpGainModifierSet } from '../resources/sharedSpGainModifiers';
import { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';

export interface ElementalBuffRuntimeOptions<Key extends string> {
  readonly ownerId: string;
  readonly attributes: CombatAttributeSet<Key>;
  readonly index: CompiledCombatBuffDefinitions<Key>;
  readonly tagRegistry?: GameplayTagRegistry;
  readonly sharedSpGainModifiers?: SharedSpGainModifierSet;
}

/**
 * 元素附着和通用 Buff 操作共享的实体运行时。
 * `createInflictionAdapter` 返回的对象只供一条技能操作链使用，不能跨技能缓存。
 */
export class ElementalBuffRuntime<Key extends string> extends BuffDefinitionOperationTarget<Key> {
  readonly index: CompiledCombatBuffDefinitions<Key>;

  constructor(options: ElementalBuffRuntimeOptions<Key>) {
    const container = new CombatBuffContainer(
      options.ownerId,
      options.attributes,
      options.tagRegistry,
      options.sharedSpGainModifiers ?? null,
    );
    super(container, options.index);
    this.index = options.index;
  }

  createInflictionAdapter(
    sourceId: string,
    addOptions?: CombatBuffAddOptions,
  ): ElementalInflictionBuffAdapter<Key> {
    return new ElementalInflictionBuffAdapter(this.container, sourceId, this.index, addOptions);
  }
}
