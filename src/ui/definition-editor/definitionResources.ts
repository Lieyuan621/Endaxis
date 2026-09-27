import type {
  ProjectTemplateDefinition,
  ProjectTemplateKind,
} from '../../application/editor/projectTemplateCommands';

export type DefinitionResourceKind =
  | ProjectTemplateKind
  | 'skill'
  | 'skillGroup'
  | 'skillGroupVariant'
  | 'buff'
  | 'abilityEntity'
  | 'abilityEntityChildSkill'
  | 'abilityEntityPassiveSkill'
  | 'operatorPassiveSkill'
  | 'operatorUpgrade'
  | 'weaponTrait'
  | 'gearTrait';

export interface DefinitionResource {
  readonly kind: DefinitionResourceKind;
  readonly path: readonly (string | number)[];
  readonly identity: string;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function add(
  result: DefinitionResource[],
  kind: DefinitionResourceKind,
  path: readonly (string | number)[],
  value: unknown,
  fallback: string,
): void {
  const data = record(value);
  result.push({ kind, path, identity: String(data.key ?? data.id ?? fallback) });
}

/** 仅列出当前对象实际拥有的资源；路径始终从同一份父定义草稿开始。 */
export function listDefinitionResources(
  kind: ProjectTemplateKind,
  definition: ProjectTemplateDefinition,
): readonly DefinitionResource[] {
  const result: DefinitionResource[] = [
    { kind, path: [], identity: 'slug' in definition ? definition.slug : definition.id },
  ];
  const root = record(definition);
  if (kind === 'globalEffect') {
    // 全局效果的 Buff 以效果 ID 为身份编译；资源导航沿用同一身份。
    if (root.buff)
      result.push({
        kind: 'buff',
        path: ['buff'],
        identity: 'slug' in definition ? definition.slug : definition.id,
      });
    return result;
  }
  const buffs = record(root.buffDefinitions);
  for (const [id, value] of Object.entries(buffs))
    add(result, 'buff', ['buffDefinitions', id], value, id);

  if (kind === 'operator') {
    for (const [index, group] of array(root.skillGroups).entries()) {
      const path = ['skillGroups', index] as const;
      add(result, 'skillGroup', path, group, `${index + 1}`);
      const groupData = record(group);
      const skills = Array.isArray(groupData.skills) ? groupData.skills : [groupData.skills];
      for (const [skillIndex, skill] of skills.entries()) {
        if (skill !== undefined)
          add(
            result,
            'skill',
            [...path, 'skills', ...(Array.isArray(groupData.skills) ? [skillIndex] : [])],
            skill,
            `${skillIndex + 1}`,
          );
      }
      for (const [variantIndex, variant] of array(groupData.variants).entries()) {
        const variantPath = [...path, 'variants', variantIndex] as const;
        add(result, 'skillGroupVariant', variantPath, variant, `${variantIndex + 1}`);
        const variantSkills = record(variant).skills;
        for (const [skillIndex, skill] of (Array.isArray(variantSkills)
          ? variantSkills
          : [variantSkills]
        ).entries()) {
          if (skill !== undefined)
            add(
              result,
              'skill',
              [...variantPath, 'skills', ...(Array.isArray(variantSkills) ? [skillIndex] : [])],
              skill,
              `${skillIndex + 1}`,
            );
        }
      }
      for (const [skillIndex, skill] of array(groupData.replacementSkills).entries())
        add(
          result,
          'skill',
          [...path, 'replacementSkills', skillIndex],
          skill,
          `${skillIndex + 1}`,
        );
      for (const [skillIndex, route] of array(groupData.routedReplacementSkills).entries()) {
        const skill = record(route).skill;
        if (skill)
          add(
            result,
            'skill',
            [...path, 'routedReplacementSkills', skillIndex, 'skill'],
            skill,
            `${skillIndex + 1}`,
          );
      }
    }
    if (root.dodgeSkill) add(result, 'skill', ['dodgeSkill'], root.dodgeSkill, 'dodge');
    for (const [id, value] of Object.entries(record(root.abilityEntityDefinitions))) {
      const path = ['abilityEntityDefinitions', id] as const;
      add(result, 'abilityEntity', path, value, id);
      const entity = record(value);
      if (entity.childSkill)
        add(result, 'abilityEntityChildSkill', [...path, 'childSkill'], entity.childSkill, 'child');
      for (const [key, child] of Object.entries(record(entity.childSkills)))
        add(result, 'abilityEntityChildSkill', [...path, 'childSkills', key], child, key);
      for (const [index, child] of array(entity.passiveSkills).entries())
        add(
          result,
          'abilityEntityPassiveSkill',
          [...path, 'passiveSkills', index],
          child,
          `${index + 1}`,
        );
    }
    for (const [index, value] of array(root.passiveSkills).entries())
      add(result, 'operatorPassiveSkill', ['passiveSkills', index], value, `${index + 1}`);
    for (const type of ['talents', 'potentials'] as const)
      for (const [index, value] of array(root[type]).entries())
        add(result, 'operatorUpgrade', [type, index], value, `${index + 1}`);
  } else if (kind === 'weapon') {
    for (const [index, value] of array(root.traits).entries())
      add(result, 'weaponTrait', ['traits', index], value, `${index + 1}`);
  } else if (kind === 'gear') {
    for (const [index, value] of array(root.traits).entries())
      add(result, 'gearTrait', ['traits', index], value, `${index + 1}`);
  }
  return result;
}

/** 排版按所属资源身份保存；数组重排不会把旧坐标误配给别的技能或词条。 */
export function resourcePresentationKey(
  definition: object,
  path: readonly (string | number)[],
): string {
  const parts: string[] = [];
  let current: unknown = definition;
  for (const part of path) {
    const child =
      current && typeof current === 'object'
        ? (current as Record<string | number, unknown>)[part]
        : undefined;
    if (typeof part === 'number') {
      const item = record(child);
      parts.push(String(item.key ?? item.skillId ?? item.id ?? part));
    } else parts.push(part);
    current = child;
  }
  return parts.length ? parts.join('/') : 'root';
}
