/**
 * 决定一个技能块在模拟、显示和编辑时使用哪份技能定义。
 * 编译、投影和后续编辑器必须复用这里；各层不得自己推断定义来源。
 */
import type {
  OperatorDefinition,
  SkillDefinition,
  SkillGroupDefinition,
  SkillLevelSource,
} from '../game-data/operatorDefinition';
import type { SkillCastDocument } from '../project/schema';
import { listSkillGroupDefinitionBindings } from '../game-data/operatorSkillDefinitions';

/** 一次技能释放使用的技能定义及其所属技能组。 */
export interface ResolvedSkillDefinition {
  /** 模拟和显示使用的技能定义。自定义定义优先，否则使用技能模板。 */
  readonly definition: SkillDefinition;
  /** 定义所属的编辑器技能库分组；只能用于展示、放置和兼容旧项目身份。 */
  readonly group: SkillGroupDefinition;
  /** 单技能等级来源；旧生成产物迁移完成前才允许回退到组字段。 */
  readonly levelSource: SkillLevelSource;
  readonly variantKey?: string;
}

/** 解析技能块当前引用的游戏数据模板，不考虑完整自定义覆盖。 */
export function resolveSkillTemplateDefinition(
  cast: SkillCastDocument,
  operator: OperatorDefinition,
): ResolvedSkillDefinition {
  const source = cast.source;
  if (source.kind !== 'operatorSkill') {
    throw new Error(`skill cast '${cast.id}' uses unsupported source kind '${source.kind}'`);
  }

  const directGroup = operator.skillGroups.find(
    candidate => candidate.key === source.skillGroupKey,
  );
  const directBinding = directGroup
    ? listSkillGroupDefinitionBindings(directGroup).find(
        candidate => candidate.skill.key === source.skillKey,
      )
    : undefined;
  const alias =
    directBinding === undefined
      ? operator.skillAliases?.find(
          candidate =>
            candidate.from[0] === source.skillGroupKey && candidate.from[1] === source.skillKey,
        )
      : undefined;
  const groupKey = alias?.to[0] ?? source.skillGroupKey;
  const skillKey = alias?.to[1] ?? source.skillKey;
  const group = operator.skillGroups.find(candidate => candidate.key === groupKey);
  if (group === undefined) {
    throw new Error(`operator '${operator.slug}' has no skill group '${source.skillGroupKey}'`);
  }
  const matches = listSkillGroupDefinitionBindings(group).filter(
    candidate => candidate.skill.key === skillKey,
  );
  if (matches.length !== 1) {
    throw new Error(
      matches.length === 0
        ? `skill group '${operator.slug}/${group.key}' has no skill '${source.skillKey}'`
        : `skill group '${operator.slug}/${group.key}' has multiple skills '${source.skillKey}'`,
    );
  }
  const binding = matches[0]!;
  const resolvedDefinition = binding.skill;
  if (group.replacementSkillPlacements?.[resolvedDefinition.key] === 'internal') {
    throw new Error(
      `skill '${operator.slug}/${group.key}/${resolvedDefinition.key}' is internal and cannot be placed on the timeline`,
    );
  }
  if (resolvedDefinition.levelSource === undefined) {
    throw new Error(
      `skill '${operator.slug}/${group.key}/${resolvedDefinition.key}' has no per-skill level source`,
    );
  }
  return {
    definition: resolvedDefinition,
    group,
    levelSource: resolvedDefinition.levelSource,
    ...(binding.variant === undefined ? {} : { variantKey: binding.variant.key }),
  };
}

/**
 * 统一处理技能模板与自定义技能定义，调用方不应自行重复选择逻辑。
 * 先按 `source.kind` 确认来源类型，再决定定义来源：
 * - 已脱离模板（存在 `customDefinition`）：使用它，且 key 必须与 `source.skillKey` 一致；
 * - 未编辑块：从干员目录按 `source.skillGroupKey`/`source.skillKey` 反查。
 *
 * 调用方仍需按当前技能等级解析 `LevelValues`，并应用构筑修正。
 */
export function resolveEffectiveSkillDefinition(
  cast: SkillCastDocument,
  operator: OperatorDefinition,
): ResolvedSkillDefinition {
  const source = cast.source;
  if (source.kind !== 'operatorSkill') {
    throw new Error(`skill cast '${cast.id}' uses unsupported source kind '${source.kind}'`);
  }

  const template = resolveSkillTemplateDefinition(cast, operator);

  if (cast.customDefinition !== undefined) {
    const definition = cast.customDefinition;
    if (definition.key !== source.skillKey) {
      throw new Error(
        `custom definition key '${definition.key}' does not match source skill key '${source.skillKey}'`,
      );
    }
    return {
      definition,
      group: template.group,
      levelSource: definition.levelSource ?? template.levelSource,
      ...(template.variantKey === undefined ? {} : { variantKey: template.variantKey }),
    };
  }
  return template;
}
