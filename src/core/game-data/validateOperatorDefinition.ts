import {
  COMBO_SKILL_PRIORITIES,
  DAMAGE_ELEMENTS,
  OPERATOR_ATTRIBUTES,
  OPERATOR_RARITIES,
  OPERATOR_ROLES,
  OPERATOR_WEAPON_TYPES,
  type OperatorDefinition,
  type OperatorPassiveSkillDefinition,
} from './operatorDefinition';
import { listOperatorSkillDefinitionBindings } from './operatorSkillDefinitions';
import { validateComboSkillConditions } from './validateComboSkillConditions';
import { OPERATOR_PROGRESSION_SLOTS } from './operatorProgressionSlots';
import { isOperatorPassiveAbilityEvent } from './definitionGuards.ts';

import {
  validateLevelValuesDefinition,
  validateSkillDefinition,
  type SkillDefinitionValidationIssue,
} from './validateSkillDefinition';
import {
  validateAbilityEntityDefinition,
  validateActionGraphActions,
  validateActionGraphReferenceDefinition,
} from './validation/actionPrograms';

function push(issues: SkillDefinitionValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function validatePassiveSkill(
  passive: OperatorPassiveSkillDefinition,
  path: string,
  issues: SkillDefinitionValidationIssue[],
): void {
  if ('buffDefinitions' in passive)
    push(
      issues,
      `${path}.buffDefinitions`,
      'skills may reference Buffs but cannot own their definitions',
    );
  if (passive.key.length === 0) push(issues, `${path}.key`, 'expected a non-empty string');
  if (passive.actionGraph !== undefined)
    issues.push(...validateActionGraphActions(passive.actionGraph, `${path}.actionGraph`));
  for (const [key, values] of Object.entries(passive.blackboard ?? {})) {
    if (key.length === 0) push(issues, `${path}.blackboard`, 'expected a non-empty blackboard key');
    issues.push(
      ...validateLevelValuesDefinition(values, `${path}.blackboard.${JSON.stringify(key)}`),
    );
  }
  issues.push(
    ...validateActionGraphReferenceDefinition(passive.enableSequence, `${path}.enableSequence`),
  );
  if (passive.abilityEventResponses !== undefined) {
    if (!Array.isArray(passive.abilityEventResponses))
      push(issues, `${path}.abilityEventResponses`, 'expected an array');
    else
      passive.abilityEventResponses.forEach((response, index) => {
        const responsePath = `${path}.abilityEventResponses[${index}]`;
        if (!response || typeof response !== 'object') {
          push(issues, responsePath, 'expected an object');
          return;
        }
        if (!isOperatorPassiveAbilityEvent(response.event))
          push(issues, `${responsePath}.event`, 'unsupported passive ability event');
        if (!Number.isInteger(response.priority))
          push(issues, `${responsePath}.priority`, 'expected an integer');
        issues.push(
          ...validateActionGraphReferenceDefinition(response.sequence, `${responsePath}.sequence`),
        );
      });
  }
}

/**
 * 校验一份已进入公共 TypeScript 契约的完整干员定义。
 *
 * 不可信 JSON 的形状仍由项目加载校验负责；这里检查跨根集合、全部技能执行定义以及根级行为程序，
 * 供项目模板命令和编辑器共同调用，避免两处各维护一份“看起来像”的干员校验。
 * 程序一律按图形态校验：入口必须是所属资源图内的引用，节点动作在各自图内逐一检查。
 */
export function validateOperatorDefinition(
  definition: OperatorDefinition,
  path = '$',
): SkillDefinitionValidationIssue[] {
  const issues: SkillDefinitionValidationIssue[] = [];
  const presentation = definition.passiveUi;
  if (presentation?.kind === 'abilityEntityCount') {
    for (const field of ['abilityEntityId', 'icon', 'nameKey'] as const) {
      if (typeof presentation[field] !== 'string' || presentation[field].trim() === '')
        push(issues, `${path}.passiveUi.${field}`, 'expected a non-empty string');
    }
    if (!definition.abilityEntityDefinitions?.[presentation.abilityEntityId])
      push(issues, `${path}.passiveUi.abilityEntityId`, 'unknown ability entity');
  }
  if (presentation !== undefined) {
    // These are structural display inputs, not inferred combat restrictions.
    for (const [field, value] of Object.entries(presentation)) {
      if (field.endsWith('BuffId') && (typeof value !== 'string' || value.trim() === ''))
        push(issues, `${path}.passiveUi.${field}`, 'expected a non-empty Buff ID');
      if (
        ['maximum', 'activeAt', 'maximumArrows', 'maximumPoints'].includes(field) &&
        value !== undefined &&
        (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      )
        push(issues, `${path}.passiveUi.${field}`, 'expected a finite non-negative number');
    }
  }
  for (const [field, value] of [
    ['slug', definition.slug],
    ['gameId', definition.gameId],
  ] as const) {
    if (value.length === 0) push(issues, `${path}.${field}`, 'expected a non-empty string');
  }
  if (definition.displayName !== undefined && definition.displayName.length === 0)
    push(issues, `${path}.displayName`, 'expected a non-empty string');
  if (definition.assetSlug !== undefined && definition.assetSlug.length === 0)
    push(issues, `${path}.assetSlug`, 'expected a non-empty string');
  if (!(OPERATOR_RARITIES as readonly unknown[]).includes(definition.rarity))
    push(issues, `${path}.rarity`, 'expected a known operator rarity');
  if (!(OPERATOR_WEAPON_TYPES as readonly unknown[]).includes(definition.weaponType))
    push(issues, `${path}.weaponType`, 'expected a known weapon type');
  if (!(DAMAGE_ELEMENTS as readonly unknown[]).includes(definition.element))
    push(issues, `${path}.element`, 'expected a known damage element');
  if (!(OPERATOR_ROLES as readonly unknown[]).includes(definition.role))
    push(issues, `${path}.role`, 'expected a known operator role');
  for (const [field, value] of [
    ['mainAttribute', definition.mainAttribute],
    ['secondaryAttribute', definition.secondaryAttribute],
  ] as const) {
    if (!(OPERATOR_ATTRIBUTES as readonly unknown[]).includes(value))
      push(issues, `${path}.${field}`, 'expected a known operator attribute');
  }
  if (
    definition.defaultPotential !== undefined &&
    (!Number.isInteger(definition.defaultPotential) || definition.defaultPotential < 0)
  )
    push(issues, `${path}.defaultPotential`, 'expected a non-negative integer');

  const attributeFields = [...OPERATOR_ATTRIBUTES, 'baseAttack', 'baseHealth'] as const;
  let attributeLevelCount: number | null = null;
  for (const field of attributeFields) {
    const values = definition.attributes[field];
    if (values.length === 0)
      push(issues, `${path}.attributes.${field}`, 'expected a non-empty level array');
    values.forEach((value, index) => {
      if (!Number.isFinite(value))
        push(issues, `${path}.attributes.${field}[${index}]`, 'expected a finite number');
    });
    attributeLevelCount ??= values.length;
    if (values.length !== attributeLevelCount)
      push(issues, `${path}.attributes.${field}`, `expected ${attributeLevelCount} level values`);
  }
  if (definition.trustAttributeBonus !== undefined) {
    definition.trustAttributeBonus.values.forEach((value, index) => {
      if (!Number.isFinite(value))
        push(issues, `${path}.trustAttributeBonus.values[${index}]`, 'expected a finite number');
    });
    definition.trustAttributeBonus.attributes.forEach((attribute, index) => {
      if (
        attribute !== 'main' &&
        attribute !== 'secondary' &&
        !(OPERATOR_ATTRIBUTES as readonly unknown[]).includes(attribute)
      )
        push(
          issues,
          `${path}.trustAttributeBonus.attributes[${index}]`,
          'expected a known operator attribute selector',
        );
    });
  }

  const groupKeys = new Set<string>();
  const skillIdentities = new Set<string>();
  for (const group of definition.skillGroups) {
    const groupPath = `${path}.skillGroups[${definition.skillGroups.indexOf(group)}]`;
    if (group.key.length === 0) push(issues, `${groupPath}.key`, 'expected a non-empty string');
    if (groupKeys.has(group.key))
      push(issues, `${groupPath}.key`, `duplicate group key '${group.key}'`);
    groupKeys.add(group.key);
    (group.routedReplacementSkills ?? []).forEach((item, index) => {
      for (const field of ['executionSkillGroupKey', 'executionSkillKey'] as const) {
        if (item[field].trim() === '')
          push(
            issues,
            `${groupPath}.routedReplacementSkills[${index}].${field}`,
            'expected a non-empty execution identity',
          );
      }
    });
  }
  for (const { group, skill, origin, variant } of listOperatorSkillDefinitionBindings(definition)) {
    const groupIndex = definition.skillGroups.indexOf(group);
    const identity = `${group.key}\u0000${skill.key}`;
    const skillPath =
      origin === 'variant'
        ? `${path}.skillGroups[${groupIndex}].variants[${group.variants?.indexOf(variant!) ?? -1}].skills['${skill.key}']`
        : `${path}.skillGroups[${groupIndex}].${origin}Skills['${skill.key}']`;
    if (skillIdentities.has(identity))
      push(issues, skillPath, `duplicate skill identity '${group.key}/${skill.key}'`);
    skillIdentities.add(identity);
    issues.push(...validateSkillDefinition(skill, skillPath));
  }
  if (definition.dodgeSkill !== undefined) {
    issues.push(...validateSkillDefinition(definition.dodgeSkill, `${path}.dodgeSkill`));
    if (definition.dodgeSkill.skillType !== 'dodge')
      push(issues, `${path}.dodgeSkill.skillType`, "expected 'dodge'");
    if (definition.dodgeSkill.nativeSkillType !== 'dodge')
      push(issues, `${path}.dodgeSkill.nativeSkillType`, "expected 'dodge'");
  }

  issues.push(
    ...validateComboSkillConditions(
      definition.comboSkillConditions,
      `${path}.comboSkillConditions`,
      validateActionGraphReferenceDefinition,
    ),
  );
  const comboSkillKeys = new Set(
    listOperatorSkillDefinitionBindings(definition)
      .filter(({ skill }) => skill.skillType === 'comboSkill')
      .map(({ skill }) => skill.key),
  );
  for (const [index, condition] of (definition.comboSkillConditions ?? []).entries()) {
    if (!comboSkillKeys.has(condition.skillKey))
      push(
        issues,
        `${path}.comboSkillConditions[${index}].skillKey`,
        `unknown combo skill '${condition.skillKey}'`,
      );
  }

  for (const [id, entity] of Object.entries(definition.abilityEntityDefinitions ?? {}))
    issues.push(
      ...validateAbilityEntityDefinition(
        entity,
        `${path}.abilityEntityDefinitions[${JSON.stringify(id)}]`,
      ),
    );

  (definition.passiveSkills ?? []).forEach((passive, index) =>
    validatePassiveSkill(passive, `${path}.passiveSkills[${index}]`, issues),
  );
  (definition.eventHandlers ?? []).forEach((handler, index) => {
    const handlerPath = `${path}.eventHandlers[${index}]`;
    if (handler.key.length === 0) push(issues, `${handlerPath}.key`, 'expected a non-empty string');
    issues.push(
      ...validateActionGraphReferenceDefinition(handler.sequence, `${handlerPath}.sequence`),
    );
  });
  for (const collection of ['talents', 'potentials'] as const) {
    const count = OPERATOR_PROGRESSION_SLOTS[collection];
    if (definition[collection].length !== count)
      push(issues, `${path}.${collection}`, `expected exactly ${count} ${collection}`);
    definition[collection].forEach((upgrade, index) => {
      const upgradePath = `${path}.${collection}[${index}]`;
      if (!Number.isInteger(upgrade.levels) || upgrade.levels < 1)
        push(issues, `${upgradePath}.levels`, 'expected a positive integer');
      (upgrade.modifiers ?? []).forEach((modifier, modifierIndex) => {
        if (modifier.kind !== 'patchSkillBlackboard' && modifier.kind !== 'patchPassiveBlackboard')
          return;
        const modifierPath = `${upgradePath}.modifiers[${modifierIndex}]`;
        // Skills may intentionally introduce a new key; do not require it to already exist.
        if (modifier.blackboardKey.trim().length === 0)
          push(issues, `${modifierPath}.blackboardKey`, 'expected a non-empty blackboard key');
        issues.push(...validateLevelValuesDefinition(modifier.value, `${modifierPath}.value`));
      });
      if (upgrade.actionGraph !== undefined)
        issues.push(
          ...validateActionGraphActions(upgrade.actionGraph, `${upgradePath}.actionGraph`),
        );
      if (upgrade.initializationSequence !== undefined)
        issues.push(
          ...validateActionGraphReferenceDefinition(
            upgrade.initializationSequence,
            `${upgradePath}.initializationSequence`,
          ),
        );
      if (upgrade.initializationSequence !== undefined && (upgrade.attachedBuffs?.length ?? 0) > 0)
        push(issues, upgradePath, 'cannot mix initializationSequence with attachedBuffs');
      if (upgrade.attachedBuffs !== undefined && !Array.isArray(upgrade.attachedBuffs)) {
        push(issues, `${upgradePath}.attachedBuffs`, 'expected an array');
      } else {
        (upgrade.attachedBuffs ?? []).forEach((installation, installationIndex) => {
          const installationPath = `${upgradePath}.attachedBuffs[${installationIndex}]`;
          if (typeof installation.buffId !== 'string' || !installation.buffId)
            push(issues, `${installationPath}.buffId`, 'expected a non-empty Buff ID');
          for (const [key, value] of Object.entries(installation.blackboardAssignments ?? {})) {
            const valuePath = `${installationPath}.blackboardAssignments.${key}`;
            issues.push(...validateLevelValuesDefinition(value, valuePath));
            if (Array.isArray(value) && value.length !== upgrade.levels)
              push(issues, valuePath, `expected ${upgrade.levels} level values`);
          }
        });
      }
      (upgrade.passiveSkills ?? []).forEach((passive, passiveIndex) =>
        validatePassiveSkill(passive, `${upgradePath}.passiveSkills[${passiveIndex}]`, issues),
      );
      (upgrade.eventHandlers ?? []).forEach((handler, handlerIndex) => {
        const handlerPath = `${upgradePath}.eventHandlers[${handlerIndex}]`;
        for (const [key, values] of Object.entries(handler.blackboard ?? {}))
          issues.push(
            ...validateLevelValuesDefinition(
              values,
              `${handlerPath}.blackboard.${JSON.stringify(key)}`,
            ),
          );
        issues.push(
          ...validateActionGraphReferenceDefinition(handler.sequence, `${handlerPath}.sequence`),
        );
      });
    });
  }

  for (const [key, value] of Object.entries(definition.entityBlackboard ?? {})) {
    if (key.length === 0) push(issues, `${path}.entityBlackboard`, 'expected a non-empty key');
    if (typeof value === 'number' && !Number.isFinite(value))
      push(issues, `${path}.entityBlackboard.${JSON.stringify(key)}`, 'expected a finite number');
  }
  if (
    definition.comboSkillPriority !== undefined &&
    !(COMBO_SKILL_PRIORITIES as readonly unknown[]).includes(definition.comboSkillPriority)
  )
    push(issues, `${path}.comboSkillPriority`, 'expected a native combo priority');

  return issues;
}
