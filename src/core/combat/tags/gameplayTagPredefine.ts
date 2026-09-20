import type {
  GameplayTagPredefineDefinition,
  GameplayTagQueryDefinition,
} from '../../../../packages/game-data-contract/src/gameplayTags';
import type { CombatBuffContainer } from '../buffs/combatBuffs';
import type { NativeSkillType } from '../../game-data/operatorDefinition';
import { assertGameplayTag, type GameplayTag } from './gameplayTags';

/** 复用实体当前的标签存储，不另建一套与 Buff/条件查询分离的控制状态标签。 */
type EntityTags = Pick<
  CombatBuffContainer<string>,
  'hasEntityTag' | 'matchesEntityTags' | 'addEntityTags' | 'removeEntityTags'
>;

/** 原生 Entity.CanAddTag / 预定义标签操作；本对象只有配置，实体可变状态由调用者持有。 */
export class GameplayTagPredefine {
  readonly #tags: ReadonlyMap<string, GameplayTag>;
  readonly #queries: ReadonlyMap<string, GameplayTagQueryDefinition>;
  readonly #immunity: ReadonlyMap<GameplayTag, GameplayTagQueryDefinition>;

  constructor(definition: GameplayTagPredefineDefinition) {
    Object.values(definition.tags).forEach(assertGameplayTag);
    this.#tags = new Map(Object.entries(definition.tags));
    Object.values(definition.queries).forEach(query => query.tags.forEach(assertGameplayTag));
    this.#queries = new Map(Object.entries(definition.queries));
    const immunity = new Map<GameplayTag, GameplayTagQueryDefinition>();
    for (const entry of definition.immunityQueries) {
      const tag = entry.tag;
      assertGameplayTag(tag);
      entry.query.tags.forEach(assertGameplayTag);
      if (immunity.has(tag)) throw new Error(`duplicate immunity tag ${tag}`);
      immunity.set(tag, entry.query);
    }
    this.#immunity = immunity;
  }

  getTag(name: string): GameplayTag {
    const tag = this.#tags.get(name);
    if (tag === undefined) throw new Error(`missing predefined gameplay tag '${name}'`);
    return tag;
  }

  getQuery(name: string): GameplayTagQueryDefinition {
    const query = this.#queries.get(name);
    if (query === undefined) throw new Error(`missing predefined gameplay tag query '${name}'`);
    return query;
  }

  /** Skill.CheckTag 的公共前缀；类型专用检查不在此冒充完成。 */
  getCommonSkillCastBlocker(
    entity: Pick<EntityTags, 'matchesEntityTags'>,
  ): 'CantCastAnySkill' | 'CantCastSkillWhenChanneling' | undefined {
    const query = this.getQuery('CantCastAnySkill');
    if (entity.matchesEntityTags(query.tags, query.queryType)) return 'CantCastAnySkill';
    if (entity.matchesEntityTags([this.getTag('CantCastSkillWhenChanneling')], 'hasAny'))
      return 'CantCastSkillWhenChanneling';
    return undefined;
  }

  /** 未导入主战技身份时不猜测；终结技按钮状态不属于标签查询。 */
  getSkillTypeCastBlocker(
    entity: Pick<EntityTags, 'matchesEntityTags'>,
    type: NativeSkillType,
    isCurrentNormalSkill?: boolean,
  ):
    | 'InDisarmed'
    | 'InSilence'
    | 'DisableNormalSkill'
    | 'DisableCastComboSkill'
    | 'InDisableDash'
    | undefined {
    const matches = (name: string) => {
      const query = this.getQuery(name);
      return entity.matchesEntityTags(query.tags, query.queryType);
    };
    switch (type) {
      case 'attack':
      case 'breakingAttack':
        return matches('InDisarmed') ? 'InDisarmed' : undefined;
      case 'normalSkill':
        if (matches('InSilence')) return 'InSilence';
        return isCurrentNormalSkill === true && matches('DisableNormalSkill')
          ? 'DisableNormalSkill'
          : undefined;
      case 'ultimateSkill':
      case 'extraActiveSkill':
        return matches('InSilence') ? 'InSilence' : undefined;
      case 'comboSkill':
        if (matches('InSilence')) return 'InSilence';
        return matches('DisableCastComboSkill') ? 'DisableCastComboSkill' : undefined;
      case 'dodge':
        return matches('InDisableDash') ? 'InDisableDash' : undefined;
      case 'attachSkill':
      case 'passiveSkill':
        return undefined;
    }
  }

  /**
   * PlayerController.OnSprintPressed 与 Center 的三条进入 Dash 转换共同使用的门禁。
   * 三项原生查询彼此独立；全部返回，便于时间轴在强制执行非法输入时完整说明原因。
   */
  getDashInputBlockers(
    entity: Pick<EntityTags, 'matchesEntityTags'>,
  ): readonly ('InImmobilized' | 'InDisableDash' | 'SuperArmor')[] {
    const blockers: ('InImmobilized' | 'InDisableDash' | 'SuperArmor')[] = [];
    for (const name of ['InImmobilized', 'InDisableDash'] as const) {
      const query = this.getQuery(name);
      if (entity.matchesEntityTags(query.tags, query.queryType)) blockers.push(name);
    }
    if (entity.matchesEntityTags([this.getTag('SuperArmor')], 'hasAny')) {
      blockers.push('SuperArmor');
    }
    return blockers;
  }

  canAddTag(entity: EntityTags, tag: GameplayTag): boolean {
    const query = this.#immunity.get(tag);
    return query === undefined || !entity.matchesEntityTags(query.tags, query.queryType);
  }

  /** 安装时重新准入；先前 Before 成功不保证事件回调之后仍能安装。 */
  addTagIfNotHaving(entity: EntityTags, name: string): void {
    const tag = this.getTag(name);
    if (!entity.hasEntityTag(tag) && this.canAddTag(entity, tag)) entity.addEntityTags([tag]);
  }

  /** 与原生控制组件退出一致：移除一次已有计数，不假造“只删自己”的句柄。 */
  removeTagIfHaving(entity: EntityTags, name: string): void {
    const tag = this.getTag(name);
    if (entity.hasEntityTag(tag)) entity.removeEntityTags([tag]);
  }
}
