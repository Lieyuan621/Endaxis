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
    appendInlineSpawnResources(result, definition);
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
  appendInlineSpawnResources(result, definition);
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
  return isInlineSpawnResourcePath(path)
    ? `inline:${JSON.stringify(parts)}`
    : parts.length
      ? parts.join('/')
      : 'root';
}

/** Existing graph owners only; each path is a distinct resource, even with shared values.
 * This discovers inline children, not a new runtime entity/skill ID directory. */
export function appendInlineSpawnResources(
  result: DefinitionResource[],
  definition: unknown,
): void {
  let work = 0;
  const spend = (count: number) => {
    if ((work += count) > 16_384) throw new Error('inline resource discovery budget exceeded');
  };
  const entries = (value: unknown) => {
    const items = Object.entries(record(value));
    spend(items.length);
    return items;
  };
  const read = (path: readonly (string | number)[]) =>
    path.reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object' && Object.hasOwn(value, key)
          ? (value as Record<string | number, unknown>)[key]
          : undefined,
      definition,
    );
  const queue = result.map(resource => ({ resource, ancestors: new Set<object>() }));
  const paths = new Set(result.map(resource => JSON.stringify(resource.path)));
  for (let index = 0; index < queue.length; index++) {
    if (++work > 16_384) throw new Error('inline resource discovery budget exceeded');
    const { resource, ancestors } = queue[index]!;
    const owner = record(read(resource.path));
    if (!owner.actionGraph) continue;
    if (ancestors.has(owner)) throw new Error('cyclic inline resource ownership');
    if (ancestors.size >= 64) throw new Error('inline resource discovery depth exceeded');
    const nextAncestors = new Set([...ancestors, owner]);
    const graphs = record(owner.actionGraph);
    const graphEntries: [readonly string[], unknown][] = [
      [['main'], graphs.main],
      ...entries(graphs.macros).map(
        ([id, macro]) =>
          [['macros', id, 'graph'], record(macro).graph] as [readonly string[], unknown],
      ),
    ];
    for (const [graphPath, graph] of graphEntries) {
      spend(1);
      for (const [id, node] of entries(record(graph).nodes)) {
        if (++work > 16_384) throw new Error('inline resource discovery budget exceeded');
        const action = record(record(node).action);
        if (action.kind !== 'spawnAbilityEntity') continue;
        const entity = record(record(action.parameters).definition);
        const prefix = [
          ...resource.path,
          'actionGraph',
          ...graphPath,
          'nodes',
          id,
          'action',
          'parameters',
          'definition',
        ];
        const children: [DefinitionResourceKind, readonly (string | number)[], unknown, string][] =
          [];
        if (entity.childSkill !== undefined)
          children.push([
            'abilityEntityChildSkill',
            [...prefix, 'childSkill'],
            entity.childSkill,
            String(record(entity.childSkill).skillId ?? 'child'),
          ]);
        for (const [key, child] of entries(entity.childSkills))
          children.push(['abilityEntityChildSkill', [...prefix, 'childSkills', key], child, key]);
        spend(array(entity.passiveSkills).length);
        for (const [offset, child] of array(entity.passiveSkills).entries())
          children.push([
            'abilityEntityPassiveSkill',
            [...prefix, 'passiveSkills', offset],
            child,
            String(offset + 1),
          ]);
        for (const [kind, path, child, fallback] of children) {
          if (++work > 16_384) throw new Error('inline resource discovery budget exceeded');
          const key = JSON.stringify(path);
          if (paths.has(key) || !record(child).actionGraph) continue;
          paths.add(key);
          add(result, kind, path, child, fallback);
          queue.push({ resource: result.at(-1)!, ancestors: nextAncestors });
        }
      }
    }
  }
}

export function isInlineSpawnResourcePath(path: readonly (string | number)[]): boolean {
  return path.some((part, index) => {
    if (part !== 'actionGraph') return false;
    const start =
      path[index + 1] === 'main'
        ? index + 2
        : path[index + 1] === 'macros' &&
            typeof path[index + 2] === 'string' &&
            path[index + 3] === 'graph'
          ? index + 4
          : -1;
    if (
      start < 0 ||
      path[start] !== 'nodes' ||
      typeof path[start + 1] !== 'string' ||
      path[start + 2] !== 'action' ||
      path[start + 3] !== 'parameters' ||
      path[start + 4] !== 'definition'
    )
      return false;
    return (
      path[start + 5] === 'childSkill' ||
      path[start + 5] === 'childSkills' ||
      path[start + 5] === 'passiveSkills'
    );
  });
}
