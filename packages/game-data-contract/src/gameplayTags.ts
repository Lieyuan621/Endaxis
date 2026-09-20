/**
 * 定义战斗数据中使用的 GameplayTag、标签查询和预定义标签文档。
 *
 * 标签以游戏中的可读路径保存，例如由 Buff、技能和事件条件引用。这里还规定了标签查询
 * 的匹配方式，并保存生成该标签表时使用的源数据版本，供编译器和模拟器共同读取。
 */

/** GameplayTag 的完整可读路径。 */
export type GameplayTag = string;

/** 验证一个外部值是否是格式正确的可读标签路径。 */
export function assertGameplayTag(value: unknown): asserts value is GameplayTag {
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    value.split('/').some(segment => !segment || !/[\p{L}_]/u.test(segment)) ||
    /^(?:unknown|unresolved)(?:[:/]|$)/i.test(value)
  ) {
    throw new Error(`GameplayTag 必须是可读路径：${JSON.stringify(value)}`);
  }
}

/** 标签集合支持的四种查询方式。 */
export const GAMEPLAY_TAG_QUERY_TYPES = ['hasAny', 'hasAll', 'exceptAny', 'exceptAll'] as const;
/** 标签集合查询方式。 */
export type GameplayTagQueryType = (typeof GAMEPLAY_TAG_QUERY_TYPES)[number];

/** 事件载荷支持的标签匹配方式；`exact` 表示两组标签完全相同。 */
export const GAMEPLAY_TAG_MATCH_TYPES = ['exact', ...GAMEPLAY_TAG_QUERY_TYPES] as const;
/** 事件载荷的标签匹配方式。 */
export type GameplayTagMatchType = (typeof GAMEPLAY_TAG_MATCH_TYPES)[number];

/** 一项标签集合查询：用 `queryType` 指定的规则检查 `tags`。 */
export interface GameplayTagQueryDefinition {
  /** 对标签集合执行的匹配规则。 */
  readonly queryType: GameplayTagQueryType;
  /** 参与匹配的标签路径。 */
  readonly tags: readonly GameplayTag[];
}

/** 游戏预定义的标签、复用查询和标签免疫规则。 */
export interface GameplayTagPredefineDefinition {
  /** 原生枚举名称到可读标签路径的映射。 */
  readonly tags: Readonly<Record<string, GameplayTag>>;
  /** 查询名称到具体查询条件的映射，供其他定义按名称复用。 */
  readonly queries: Readonly<Record<string, GameplayTagQueryDefinition>>;
  /** 添加某个标签前需要检查的免疫条件。 */
  readonly immunityQueries: readonly {
    /** 尝试添加的标签。 */
    readonly tag: GameplayTag;
    /** 满足时阻止添加该标签的查询。 */
    readonly query: GameplayTagQueryDefinition;
  }[];
}

/** 带生成版本和源文件校验信息的预定义标签文档。 */
export interface GameplayTagPredefineDocument extends GameplayTagPredefineDefinition {
  /** 文档格式版本；读取方据此判断是否支持这份数据。 */
  readonly schemaVersion: 1;
  /** 生成人填写或生成器取得的游戏数据修订号。 */
  readonly revision: string;
  /** 源数据内容的 SHA-256，用于确认文档对应哪一份输入。 */
  readonly sourceSha256: string;
}
