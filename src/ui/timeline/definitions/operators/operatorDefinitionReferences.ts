import type {
  OperatorDefinition,
  SkillDefinition,
} from '../../../../core/game-data/operatorDefinition';

export type OperatorDefinitionReferenceKind = 'buff' | 'entity';
export type OperatorDefinitionReferenceOwnerKind =
  | 'skill'
  | 'buff'
  | 'entity'
  | 'passiveSkill'
  | 'operatorEvent'
  | 'comboCondition'
  | 'upgrade'
  | 'operator';

export interface OperatorDefinitionReference {
  readonly kind: OperatorDefinitionReferenceKind;
  readonly id: string;
  readonly path: string;
  readonly ownerKind: OperatorDefinitionReferenceOwnerKind;
  readonly ownerId: string;
  /** 仅筛选已有实例，不依赖从定义目录创建对象；仍保留导航与使用处索引。 */
  readonly usage?: 'instanceFilter';
}

type ReferenceSource = OperatorDefinition;

interface ReferenceOwner {
  readonly kind: OperatorDefinitionReferenceOwnerKind;
  readonly id: string;
}

function normalizeSkills(
  skills: OperatorDefinition['skillGroups'][number]['skills'] | undefined,
): readonly SkillDefinition[] {
  if (skills === undefined) return [];
  return Array.isArray(skills) ? skills : [skills as SkillDefinition];
}

function propertyPath(path: string, property: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(property)
    ? `${path}.${property}`
    : `${path}[${JSON.stringify(property)}]`;
}

function collectValueReferences(
  value: unknown,
  path: string,
  owner: ReferenceOwner,
  output: OperatorDefinitionReference[],
  instanceFilter = false,
): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectValueReferences(item, `${path}[${index}]`, owner, output),
    );
    return;
  }

  for (const [property, child] of Object.entries(value)) {
    const childPath = propertyPath(path, property);
    if (property === 'buffId' && typeof child === 'string' && !('definition' in value)) {
      output.push({
        kind: 'buff',
        id: child,
        path: childPath,
        ownerKind: owner.kind,
        ownerId: owner.id,
      });
    } else if (property === 'buffIds' && Array.isArray(child)) {
      child.forEach((id, index) => {
        if (typeof id !== 'string') return;
        output.push({
          kind: 'buff',
          id,
          path: `${childPath}[${index}]`,
          ownerKind: owner.kind,
          ownerId: owner.id,
          // 层数条件只统计目标已有实例；没有匹配实例时为 0，不需要创建定义。
          ...(instanceFilter || ('kind' in value && value.kind === 'buffIdStackCompare')
            ? { usage: 'instanceFilter' as const }
            : {}),
        });
      });
    } else if (
      property === 'abilityEntityId' &&
      typeof child === 'string' &&
      !('definition' in value)
    ) {
      output.push({
        kind: 'entity',
        id: child,
        path: childPath,
        ownerKind: owner.kind,
        ownerId: owner.id,
      });
    } else if (property === 'abilityEntityIds' && Array.isArray(child)) {
      child.forEach((id, index) => {
        if (typeof id !== 'string') return;
        output.push({
          kind: 'entity',
          id,
          path: `${childPath}[${index}]`,
          ownerKind: owner.kind,
          ownerId: owner.id,
        });
      });
    }
    // 只识别具体动作的直接参数，不能将整个子树里的 buffId 都当作可缺失的引用。
    collectValueReferences(
      child,
      childPath,
      owner,
      output,
      property === 'parameters' && 'kind' in value && value.kind === 'finishBuffsById',
    );
  }
}

/**
 * Index every stable Buff / ability-entity identity used by an operator's
 * component trees. Registry keys themselves are deliberately not references.
 */
export function collectOperatorDefinitionReferences(
  definition: ReferenceSource,
): readonly OperatorDefinitionReference[] {
  const references: OperatorDefinitionReference[] = [];

  definition.skillGroups.forEach((group, groupIndex) => {
    normalizeSkills(group.skills).forEach((skill, skillIndex) => {
      collectValueReferences(
        skill,
        `skillGroups[${groupIndex}].skills${Array.isArray(group.skills) ? `[${skillIndex}]` : ''}`,
        { kind: 'skill', id: `${group.key}/${skill.key}` },
        references,
      );
    });
    (group.variants ?? []).forEach((variant, variantIndex) => {
      normalizeSkills(variant.skills).forEach((skill, skillIndex) => {
        collectValueReferences(
          skill,
          `skillGroups[${groupIndex}].variants[${variantIndex}].skills${Array.isArray(variant.skills) ? `[${skillIndex}]` : ''}`,
          { kind: 'skill', id: `${group.key}/${variant.key}/${skill.key}` },
          references,
        );
      });
    });
    (group.replacementSkills ?? []).forEach((skill, skillIndex) => {
      collectValueReferences(
        skill,
        `skillGroups[${groupIndex}].replacementSkills[${skillIndex}]`,
        { kind: 'skill', id: `${group.key}/${skill.key}` },
        references,
      );
    });
    (group.routedReplacementSkills ?? []).forEach((replacement, replacementIndex) => {
      collectValueReferences(
        replacement.skill,
        `skillGroups[${groupIndex}].routedReplacementSkills[${replacementIndex}].skill`,
        { kind: 'skill', id: `${group.key}/${replacement.skill.key}` },
        references,
      );
    });
  });

  Object.entries(definition.buffDefinitions ?? {}).forEach(([id, buff]) => {
    collectValueReferences(
      buff,
      `buffDefinitions[${JSON.stringify(id)}]`,
      { kind: 'buff', id },
      references,
    );
  });

  Object.entries(definition.abilityEntityDefinitions ?? {}).forEach(([id, entity]) => {
    collectValueReferences(
      entity,
      `abilityEntityDefinitions[${JSON.stringify(id)}]`,
      { kind: 'entity', id },
      references,
    );
  });

  (definition.passiveSkills ?? []).forEach((passive, index) =>
    collectValueReferences(
      passive,
      `passiveSkills[${index}]`,
      { kind: 'passiveSkill', id: passive.key },
      references,
    ),
  );
  (definition.eventHandlers ?? []).forEach((handler, index) =>
    collectValueReferences(
      handler,
      `eventHandlers[${index}]`,
      { kind: 'operatorEvent', id: handler.key },
      references,
    ),
  );
  (definition.comboSkillConditions ?? []).forEach((condition, index) =>
    collectValueReferences(
      condition,
      `comboSkillConditions[${index}]`,
      { kind: 'comboCondition', id: condition.key },
      references,
    ),
  );
  for (const collection of ['talents', 'potentials'] as const) {
    definition[collection].forEach((upgrade, index) =>
      collectValueReferences(
        upgrade,
        `${collection}[${index}]`,
        { kind: 'upgrade', id: `${collection}/${index}` },
        references,
      ),
    );
  }
  for (const field of [
    'skillSlots',
    'playerActionRoutes',
    'playerActionModes',
    'passiveUi',
  ] as const) {
    collectValueReferences(
      definition[field],
      field,
      { kind: 'operator', id: definition.slug },
      references,
    );
  }

  const presentation = definition.passiveUi;
  if (presentation?.kind === 'abilityEntityCount' && presentation.abilityEntityId) {
    references.push({
      kind: 'entity',
      id: presentation.abilityEntityId,
      path: 'passiveUi.abilityEntityId',
      ownerKind: 'operator',
      ownerId: definition.slug,
    });
  }
  const presentationBuffs =
    presentation?.kind === 'buffProgress'
      ? { normalBuffId: presentation.normalBuffId, ultimateBuffId: presentation.ultimateBuffId }
      : presentation?.kind === 'buffCounters'
        ? {
            reserveArrowBuffId: presentation.reserveArrowBuffId,
            battleArrowBuffId: presentation.battleArrowBuffId,
            pointBuffId: presentation.pointBuffId,
          }
        : {};
  for (const [field, id] of Object.entries(presentationBuffs)) {
    if (!id) continue;
    references.push({
      kind: 'buff',
      id,
      path: `passiveUi.${field}`,
      ownerKind: 'operator',
      ownerId: definition.slug,
    });
  }

  return references;
}

export function referencesToDefinition(
  references: readonly OperatorDefinitionReference[],
  kind: OperatorDefinitionReferenceKind,
  id: string,
): readonly OperatorDefinitionReference[] {
  return references.filter(reference => reference.kind === kind && reference.id === id);
}
