import type {
  ActionSequenceDefinition,
  AbilityEntityDefinition,
  AbilityEntityChildSkillDefinition,
  CombatCondition,
  CombatEventResponseDefinition,
  CombatEventHandlerDefinition,
  CombatStepDefinition,
  ScheduledSequenceDefinition,
  SkillBuffDefinition,
  SkillDefinition,
  SkillGlobalBuffDefinition,
} from '../../../core/game-data/operatorDefinition';
import { buildSkillInputWindowGraph } from './skills/skillInputWindowGraph';
import { buildBuffDamageModifierGraph } from './buffs/buffDamageModifierGraph';
import { buildBuffFlatCollectionGraph } from './buffs/buffFlatCollectionGraph';
import { buildBuffCalculationModifierGraph } from './buffs/buffCalculationModifierGraph';
import { buildBuffShieldGraph } from './buffs/buffShieldGraph';
import type { EquipmentContributionDefinition } from '../../../core/game-data/equipmentDefinition';
import {
  resolveStructureValue,
  structureRecordEntryPath,
  structurePathSegments,
} from './skillStructureEditorCommands';

/** 图视图统一把根属性路径分解为所属节点与节点内字段，不推测用户操作来源。 */
export function locateStructureProperty(
  root: SkillStructureNode,
  focus: readonly (string | number)[],
) {
  let target = root;
  let consumed = 0;
  for (const node of indexSkillStructureNodes(root).values()) {
    const path = structurePathSegments(node.sourcePath);
    if (path.length > consumed && path.every((part, index) => focus[index] === part)) {
      target = node;
      consumed = path.length;
    }
  }
  return { path: target.sourcePath, propertyPath: focus.slice(consumed) };
}

export type SkillStructureEditorSection = 'overview' | 'blackboard' | 'availability' | number;

export interface SkillStructureNode {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly summary: string;
  readonly sourcePath: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly children: readonly SkillStructureNode[];
  readonly editorSection: SkillStructureEditorSection;
  readonly reference?: { readonly kind: 'buff' | 'entity'; readonly id: string };
  readonly canAddChild?:
    | 'sequence'
    | 'step'
    | 'lifecycle'
    | 'childSkill'
    | 'upgradeModifier'
    | 'upgradeHandler'
    | 'upgradePassive'
    | 'equipmentModifier'
    | 'equipmentHandler'
    | 'combatCondition'
    | 'eventResponse'
    | 'skillEventHandler'
    | 'buffAbilityResponse'
    | 'buffIgniteResponse'
    | 'buffMember'
    | 'globalBuffChild';
  readonly payloadKind?:
    | 'buffShield'
    | 'buffHealModifier'
    | 'buffHealProcessor'
    | 'buffHealCondition'
    | 'buffPoiseModifier'
    | 'buffPoiseProcessor'
    | 'buffPoiseCondition'
    | 'buffAttributeModifier'
    | 'buffSlotReplacement'
    | 'buffKeywordEnhancement'
    | 'buffDamageModifier'
    | 'buffDamageProcessor'
    | 'buffDamageCondition'
    | 'scheduledSequence'
    | 'combatStep'
    | 'childSkill'
    | 'upgradeModifier'
    | 'upgradeHandler'
    | 'upgradePassive'
    | 'equipmentModifier'
    | 'equipmentHandler'
    | 'combatCondition'
    | 'eventResponse'
    | 'skillEventHandler'
    | 'buffAbilityResponse'
    | 'buffIgniteResponse'
    | 'globalBuffDefinition'
    | 'globalBuffChild';
  readonly acceptsChildKind?:
    | 'buffShield'
    | 'buffHealModifier'
    | 'buffHealProcessor'
    | 'buffHealCondition'
    | 'buffPoiseModifier'
    | 'buffPoiseProcessor'
    | 'buffPoiseCondition'
    | 'buffAttributeModifier'
    | 'buffSlotReplacement'
    | 'buffKeywordEnhancement'
    | 'buffDamageModifier'
    | 'buffDamageProcessor'
    | 'buffDamageCondition'
    | 'scheduledSequence'
    | 'combatStep'
    | 'childSkill'
    | 'upgradeModifier'
    | 'upgradeHandler'
    | 'upgradePassive'
    | 'equipmentModifier'
    | 'equipmentHandler'
    | 'combatCondition'
    | 'eventResponse'
    | 'skillEventHandler'
    | 'buffAbilityResponse'
    | 'buffIgniteResponse'
    | 'globalBuffChild';
  readonly canDelete?: boolean;
  readonly canMove?: boolean;
  readonly canCopy?: boolean;
  /** 固定字段/结构槽位使用端口关系；数组成员使用普通成员关系。 */
  readonly relationToParent?: 'port' | 'member';
}

export interface SkillStructureMindMapLabels {
  readonly blackboard: string;
  readonly availability: string;
  readonly sequence: string;
}

function shortValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) return `${value.length} 项`;
  return `${Object.keys(value as object).length} 个字段`;
}

function summarizeParameters(parameters: Readonly<Record<string, unknown>>): string {
  const entries = Object.entries(parameters).slice(0, 2);
  if (entries.length === 0) return '无参数';
  return entries.map(([key, value]) => `${key}: ${shortValue(value)}`).join(' · ');
}

function describeCondition(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return '未设置条件';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) {
    const entries = value.slice(0, 3).map(entry => describeCondition(entry, depth + 1));
    return `${entries.join(', ')}${value.length > 3 ? ` … +${value.length - 3}` : ''}`;
  }
  const record = value as Readonly<Record<string, unknown>>;
  const kind = typeof record.kind === 'string' ? record.kind : 'condition';
  if (depth >= 2) return kind;
  const parameters = Object.entries(record)
    .filter(([key]) => key !== 'kind')
    .slice(0, 3)
    .map(([key, entry]) => `${key}=${describeCondition(entry, depth + 1)}`);
  return parameters.length === 0 ? kind : `${kind}(${parameters.join(', ')})`;
}

/** 独立条件工作区与技能/事件导图共用同一个节点投影。 */
export function buildCombatConditionMindMap(condition: CombatCondition): SkillStructureNode {
  return conditionNode(condition, 'condition', 'condition', condition.kind, 0, false, false);
}

function conditionNode(
  condition: CombatCondition,
  id: string,
  sourcePath: string,
  label: string = condition.kind,
  editorSection: SkillStructureEditorSection = 0,
  canDelete = true,
  canMove = true,
  relationToParent: SkillStructureNode['relationToParent'] = 'port',
): SkillStructureNode {
  const children =
    condition.kind === 'not'
      ? [
          conditionNode(
            condition.condition,
            `${id}:condition`,
            `${sourcePath}.condition`,
            'NOT',
            editorSection,
            false,
            false,
          ),
        ]
      : condition.kind === 'all' || condition.kind === 'any'
        ? condition.conditions.map((child, index) =>
            conditionNode(
              child,
              `${id}:condition:${index}`,
              `${sourcePath}.conditions[${index}]`,
              `${index + 1}. ${child.kind}`,
              editorSection,
              condition.conditions.length > 1,
              condition.conditions.length > 1,
              'member',
            ),
          )
        : [];
  const composite = condition.kind === 'all' || condition.kind === 'any';
  return {
    id,
    label,
    kind: '战斗条件',
    summary: describeCondition(condition),
    sourcePath,
    details: { 条件类型: condition.kind },
    editorSection,
    children,
    payloadKind: 'combatCondition',
    canDelete,
    canMove,
    relationToParent,
    ...(composite
      ? { canAddChild: 'combatCondition' as const, acceptsChildKind: 'combatCondition' as const }
      : {}),
  };
}

function sequenceNode(
  sequence: ActionSequenceDefinition,
  id: string,
  label: string,
  sourcePath: string,
  summary: string,
  editorSection: number,
  relationToParent: SkillStructureNode['relationToParent'] = 'port',
): SkillStructureNode {
  return {
    id,
    label,
    kind: '动作序列',
    summary,
    sourcePath,
    details: { 步骤数: sequence.steps.length },
    editorSection,
    children: sequence.steps.map((step, index) =>
      stepNode(
        step,
        `${id}:step:${index}`,
        `${sourcePath ? `${sourcePath}.` : ''}steps[${index}]`,
        index,
        editorSection,
      ),
    ),
    canAddChild: 'step',
    acceptsChildKind: 'combatStep',
    relationToParent,
  };
}

/** An action sequence is a document in its own right, not a synthetic castable skill. */
export function buildActionSequenceMindMap(
  sequence: ActionSequenceDefinition,
  label = '动作序列',
): SkillStructureNode {
  const { relationToParent: _relation, ...root } = sequenceNode(
    sequence,
    'action-sequence',
    label,
    '',
    `${sequence.steps.length} 个直属步骤`,
    0,
  );
  return expandInlineBuffDefinitions(root, sequence);
}

/** Hosts opt in when they provide an Inspector for inline Buff definitions. */
function expandInlineBuffDefinitions(
  root: SkillStructureNode,
  document: unknown,
): SkillStructureNode {
  function expandInlineBuffs(node: SkillStructureNode): SkillStructureNode {
    const children = node.children.map(expandInlineBuffs);
    if (node.payloadKind === 'combatStep') {
      const step = resolveStructureValue(document, node.sourcePath) as CombatStepDefinition;
      if (step.kind === 'applyBuff' && step.parameters.definition !== undefined) {
        children.push(
          expandInlineBuffs(
            inlineBuffDefinitionNode(
              step.parameters.definition,
              `${node.id}:definition`,
              `${node.sourcePath}.parameters.definition`,
              '内联 Buff',
              typeof step.parameters.buffId === 'string' ? step.parameters.buffId : '动态 Buff',
              0,
            ),
          ),
        );
      }
    }
    return { ...node, children };
  }
  return expandInlineBuffs(root);
}

function eventResponseNode(
  response: CombatEventResponseDefinition,
  id: string,
  sourcePath: string,
  index: number,
  responseCount: number,
  editorSection: number,
): SkillStructureNode {
  return {
    id,
    label: `${index + 1}. ${response.key}`,
    kind: '事件响应',
    summary: response.event.kind,
    sourcePath,
    details: { 事件: response.event.kind, 条件: describeCondition(response.condition) },
    editorSection,
    payloadKind: 'eventResponse',
    canDelete: responseCount > 1,
    canMove: responseCount > 1,
    ...(response.condition === undefined ? { canAddChild: 'combatCondition' as const } : {}),
    children: [
      ...(response.condition === undefined
        ? []
        : [
            conditionNode(
              response.condition,
              `${id}:condition`,
              `${sourcePath}.condition`,
              '响应条件',
              editorSection,
              true,
              false,
            ),
          ]),
      sequenceNode(
        response.sequence,
        `${id}:sequence`,
        '响应序列',
        `${sourcePath}.sequence`,
        `${response.sequence.steps.length} 个直属步骤`,
        editorSection,
      ),
    ],
  };
}

function inlineBuffDefinitionNode(
  definition: SkillBuffDefinition,
  id: string,
  sourcePath: string,
  label: string,
  buffId: string,
  editorSection: number,
): SkillStructureNode {
  const root = buildBuffStructureMindMap(buffId, definition);
  function project(node: SkillStructureNode): SkillStructureNode {
    return {
      ...node,
      id: node.id === root.id ? id : `${id}:${node.id}`,
      sourcePath: node.sourcePath === '' ? sourcePath : `${sourcePath}.${node.sourcePath}`,
      editorSection,
      children: node.children.map(project),
      ...(node.id === root.id
        ? {
            label,
            kind: '内联 Buff 定义',
            summary: `${buffId} · ${root.summary}`,
            details: { BuffID: buffId, ...root.details },
            relationToParent: 'port' as const,
          }
        : {}),
    };
  }
  return project(root);
}

function globalBuffDefinitionNode(
  definition: SkillGlobalBuffDefinition,
  id: string,
  sourcePath: string,
  editorSection: number,
): SkillStructureNode {
  return {
    id,
    label: 'GlobalBuff 定义',
    kind: '父实例定义',
    summary: `${definition.stackingType} · ${definition.children.length} 个子 Buff`,
    sourcePath,
    details: {
      叠加方式: definition.stackingType,
      持续时间: shortValue(definition.durationSeconds),
      子Buff数: definition.children.length,
    },
    editorSection,
    relationToParent: 'port',
    payloadKind: 'globalBuffDefinition',
    canCopy: false,
    canMove: false,
    canDelete: false,
    canAddChild: 'globalBuffChild',
    acceptsChildKind: 'globalBuffChild',
    children: definition.children.map((child, index) => ({
      id: `${id}:child:${index}`,
      label: `${index + 1}. ${child.buffId}`,
      kind: 'GlobalBuff 子 Buff',
      summary: `${Object.keys(child.blackboardAssignments).length} 项父黑板赋值`,
      sourcePath: `${sourcePath}.children[${index}]`,
      details: {
        BuffID: child.buffId,
        黑板赋值数: Object.keys(child.blackboardAssignments).length,
      },
      editorSection,
      relationToParent: 'member',
      payloadKind: 'globalBuffChild',
      canDelete: definition.children.length > 1,
      canMove: definition.children.length > 1,
      children: [],
    })),
  };
}

function inlineAbilityEntityChildSkillNode(
  childSkill: AbilityEntityChildSkillDefinition,
  id: string,
  sourcePath: string,
  editorSection: number,
): SkillStructureNode {
  const sequenceArrayPath = `${sourcePath}.scheduledSequences`;
  return {
    id,
    label: childSkill.skillId,
    kind: '内联实体子技能',
    summary: `${childSkill.scheduledSequences.length} 条调度序列`,
    sourcePath: sequenceArrayPath,
    details: {
      子技能ID: childSkill.skillId,
      黑板参数数: Object.keys(childSkill.blackboard ?? {}).length,
    },
    editorSection,
    relationToParent: 'port',
    payloadKind: 'childSkill',
    canCopy: false,
    canMove: false,
    canDelete: false,
    canAddChild: 'sequence',
    acceptsChildKind: 'scheduledSequence',
    children: childSkill.scheduledSequences.map((sequence, index) =>
      scheduledSequenceNodeAtPath(
        sequence,
        `${id}:sequence:${index}`,
        `${sequenceArrayPath}[${index}]`,
        `子序列 ${index + 1}`,
        editorSection,
        true,
        childSkill.scheduledSequences.length > 1,
      ),
    ),
  };
}

function stepNode(
  step: CombatStepDefinition,
  id: string,
  sourcePath: string,
  index: number,
  editorSection: number,
): SkillStructureNode {
  const children: SkillStructureNode[] = [];
  if (step.kind === 'conditional') {
    children.push(
      conditionNode(
        step.parameters.condition,
        `${id}:condition`,
        `${sourcePath}.parameters.condition`,
        '判断条件',
        editorSection,
        false,
        false,
      ),
    );
    children.push(
      sequenceNode(
        step.whenTrue,
        `${id}:true`,
        'TRUE / Then',
        `${sourcePath}.whenTrue`,
        `${step.whenTrue.steps.length} 个直属步骤`,
        editorSection,
      ),
    );
    const whenFalse = step.whenFalse ?? { steps: [] };
    children.push(
      sequenceNode(
        whenFalse,
        `${id}:false`,
        'FALSE / Else',
        `${sourcePath}.whenFalse`,
        `${whenFalse.steps.length} 个直属步骤`,
        editorSection,
      ),
    );
  } else if (step.kind === 'switch') {
    children.push(
      ...step.options.map((option, optionIndex) =>
        sequenceNode(
          option.sequence,
          `${id}:option:${optionIndex}`,
          `${optionIndex + 1}. CASE ${option.value.kind === 'constant' ? option.value.value : option.value.key}`,
          `${sourcePath}.options[${optionIndex}].sequence`,
          `${option.sequence.steps.length} 个直属步骤`,
          editorSection,
        ),
      ),
    );
  } else if (step.kind === 'launchProjectile') {
    step.callbacks.forEach((callback, index) =>
      children.push({
        ...inlineAbilityEntityChildSkillNode(
          callback.skill,
          `${id}:callback:${index}`,
          `${sourcePath}.callbacks[${index}].skill`,
          editorSection,
        ),
        kind: `投射物回调：${callback.event}`,
      }),
    );
  } else if (
    step.kind === 'once' ||
    step.kind === 'withActionBlackboardScope' ||
    step.kind === 'repeatEachTick' ||
    step.kind === 'forEachContextTarget' ||
    step.kind === 'repeatByActionValue'
  ) {
    children.push(
      sequenceNode(
        step.body,
        `${id}:body`,
        'Body',
        `${sourcePath}.body`,
        `${step.body.steps.length} 个直属步骤`,
        editorSection,
      ),
    );
  } else if (step.kind === 'listenForCombatEvents') {
    children.push(
      ...step.parameters.responses.map((response, responseIndex) =>
        eventResponseNode(
          response,
          `${id}:response:${responseIndex}`,
          `${sourcePath}.parameters.responses[${responseIndex}]`,
          responseIndex,
          step.parameters.responses.length,
          editorSection,
        ),
      ),
    );
  } else if (step.kind === 'jumpTimeline') {
    children.push(
      step.parameters.condition === undefined
        ? {
            id: `${id}:condition`,
            label: '跳转条件',
            kind: '可选条件',
            summary: '未设置',
            sourcePath: `${sourcePath}.parameters.condition`,
            details: {},
            editorSection,
            children: [],
            canAddChild: 'combatCondition',
            relationToParent: 'port',
          }
        : conditionNode(
            step.parameters.condition,
            `${id}:condition`,
            `${sourcePath}.parameters.condition`,
            '跳转条件',
            editorSection,
            true,
            false,
          ),
    );
  } else if (step.kind === 'applyPhysicalInfliction') {
    const statusDefinition =
      step.parameters.type === 'crush'
        ? step.parameters.crushedDefinition
        : step.parameters.type === 'airborne'
          ? step.parameters.airborneDefinition
          : step.parameters.fractureDefinition;
    const statusDefinitionKey =
      step.parameters.type === 'crush'
        ? 'crushedDefinition'
        : step.parameters.type === 'airborne'
          ? 'airborneDefinition'
          : 'fractureDefinition';
    const statusLabel =
      step.parameters.type === 'crush'
        ? '压制 Buff'
        : step.parameters.type === 'airborne'
          ? '浮空 Buff'
          : '碎甲 Buff';
    const statusBuffId =
      step.parameters.type === 'crush'
        ? step.parameters.crushedBuffId
        : step.parameters.type === 'airborne'
          ? step.parameters.airborneBuffId
          : step.parameters.fractureBuffId;
    children.push(
      inlineBuffDefinitionNode(
        step.parameters.noGuardDefinition,
        `${id}:no-guard-definition`,
        `${sourcePath}.parameters.noGuardDefinition`,
        '破防层 Buff',
        step.parameters.noGuardBuffId,
        editorSection,
      ),
      inlineBuffDefinitionNode(
        statusDefinition,
        `${id}:${step.parameters.type}-definition`,
        `${sourcePath}.parameters.${statusDefinitionKey}`,
        statusLabel,
        statusBuffId,
        editorSection,
      ),
    );
  } else if (step.kind === 'createGlobalBuff') {
    children.push(
      globalBuffDefinitionNode(
        step.parameters.definition,
        `${id}:definition`,
        `${sourcePath}.parameters.definition`,
        editorSection,
      ),
    );
  } else if (step.kind === 'startCurrentAbilityEntityChildSkill') {
    children.push(
      inlineAbilityEntityChildSkillNode(
        step.parameters.childSkill,
        `${id}:child-skill`,
        `${sourcePath}.parameters.childSkill`,
        editorSection,
      ),
    );
  }

  const parameters = step.parameters as Readonly<Record<string, unknown>>;
  const conditionText =
    step.kind === 'conditional' ? describeCondition(parameters.condition) : undefined;
  const reference =
    step.kind === 'applyBuff' && typeof parameters.buffId === 'string'
      ? { kind: 'buff' as const, id: String(parameters.buffId ?? '') }
      : step.kind === 'spawnAbilityEntity'
        ? { kind: 'entity' as const, id: String(parameters.abilityEntityId ?? '') }
        : undefined;
  return {
    id,
    label: step.kind === 'conditional' ? `${index + 1}. IF` : `${index + 1}. ${step.kind}`,
    kind: '战斗步骤',
    summary: conditionText ?? summarizeParameters(parameters),
    sourcePath,
    details: {
      步骤类型: step.kind,
      稳定键: step.key ?? '—',
      ...(conditionText === undefined ? {} : { 条件表达式: conditionText }),
      ...parameters,
    },
    editorSection,
    children,
    payloadKind: 'combatStep',
    ...(step.kind === 'listenForCombatEvents'
      ? { canAddChild: 'eventResponse' as const, acceptsChildKind: 'eventResponse' as const }
      : {}),
    ...(reference === undefined || reference.id === '' ? {} : { reference }),
  };
}

function scheduledSequenceNode(
  sequence: ScheduledSequenceDefinition,
  index: number,
  sequenceLabel: string,
): SkillStructureNode {
  return scheduledSequenceNodeAtPath(
    sequence,
    `sequence:${index}`,
    `scheduledSequences[${index}]`,
    `${sequenceLabel} ${index + 1}`,
    index,
  );
}

function scheduledSequenceNodeAtPath(
  sequence: ScheduledSequenceDefinition,
  id: string,
  sourcePath: string,
  label: string,
  editorSection: number,
  canDelete = true,
  canMove = true,
): SkillStructureNode {
  const range =
    sequence.endFrame === undefined
      ? `第 ${sequence.startFrame} 帧`
      : `第 ${sequence.startFrame}–${sequence.endFrame} 帧`;
  const node = sequenceNode(
    sequence.sequence,
    id,
    label,
    `${sourcePath}.sequence`,
    `${range} · ${sequence.sequence.steps.length} 个直属步骤`,
    editorSection,
  );
  return {
    ...node,
    sourcePath,
    relationToParent: 'member',
    payloadKind: 'scheduledSequence',
    canDelete,
    canMove,
    details: {
      开始帧: sequence.startFrame,
      结束帧: sequence.endFrame ?? '—',
      直属步骤数: sequence.sequence.steps.length,
    },
  };
}

function skillEventHandlerNode(
  handler: CombatEventHandlerDefinition,
  index: number,
  handlerCount: number,
): SkillStructureNode {
  const id = `skill:handler:${index}`;
  const sourcePath = `eventHandlers[${index}]`;
  return {
    id,
    label: handler.key,
    kind: '技能事件响应',
    summary: handler.event.kind,
    sourcePath,
    details: { 事件: handler.event.kind, 条件: describeCondition(handler.condition) },
    editorSection: 'overview',
    payloadKind: 'skillEventHandler',
    canDelete: true,
    canMove: handlerCount > 1,
    children: [
      handler.condition === undefined
        ? {
            id: `${id}:condition`,
            label: '响应条件',
            kind: '可选条件',
            summary: '未设置',
            sourcePath: `${sourcePath}.condition`,
            details: {},
            editorSection: 'overview',
            children: [],
            canAddChild: 'combatCondition',
          }
        : conditionNode(
            handler.condition,
            `${id}:condition`,
            `${sourcePath}.condition`,
            '响应条件',
            'overview',
            true,
            false,
          ),
      {
        id: `${id}:sequences`,
        label: '响应调度序列',
        kind: '序列分组',
        summary: `${handler.scheduledSequences.length} 条`,
        sourcePath: `${sourcePath}.scheduledSequences`,
        details: { 数量: handler.scheduledSequences.length },
        editorSection: 'overview',
        relationToParent: 'port',
        canAddChild: 'sequence',
        acceptsChildKind: 'scheduledSequence',
        children: handler.scheduledSequences.map((sequence, sequenceIndex) =>
          scheduledSequenceNodeAtPath(
            sequence,
            `${id}:sequence:${sequenceIndex}`,
            `${sourcePath}.scheduledSequences[${sequenceIndex}]`,
            `响应序列 ${sequenceIndex + 1}`,
            0,
            handler.scheduledSequences.length > 1,
            handler.scheduledSequences.length > 1,
          ),
        ),
      },
    ],
  };
}

function switchToBuffCastNode(skill: SkillDefinition): SkillStructureNode {
  const path = 'switchToBuffCast';
  const value = skill.switchToBuffCast;
  const root: SkillStructureNode = {
    id: path,
    sourcePath: path,
    label: '施放旁路',
    kind: '施放旁路',
    summary: value ? '满足条件时执行旁路序列' : '未设置',
    details: {},
    children: [],
    editorSection: 0,
    relationToParent: 'port',
  };
  if (!value) return { ...root, canAddChild: 'lifecycle' };
  return {
    ...root,
    canDelete: true,
    children: [
      value.condition
        ? conditionNode(
            value.condition,
            `${path}.condition`,
            `${path}.condition`,
            '旁路条件',
            0,
            true,
            false,
          )
        : {
            id: `${path}.condition`,
            sourcePath: `${path}.condition`,
            label: '旁路条件',
            kind: '结构端口',
            summary: '未设置',
            details: {},
            children: [],
            editorSection: 0,
            relationToParent: 'port',
            canAddChild: 'combatCondition',
          },
      {
        ...sequenceNode(
          value.sequence,
          `${path}.sequence`,
          '旁路响应',
          `${path}.sequence`,
          `${value.sequence.steps.length} 个直属步骤`,
          0,
        ),
        canDelete: false,
      },
    ],
  };
}

export function buildSkillStructureMindMap(
  skill: SkillDefinition,
  labels: SkillStructureMindMapLabels = {
    blackboard: '初始黑板',
    availability: '可用条件',
    sequence: '时间序列',
  },
): SkillStructureNode {
  const sequences = skill.scheduledSequences.map((sequence, index) =>
    scheduledSequenceNode(sequence, index, labels.sequence),
  );
  const handlers = skill.eventHandlers ?? [];
  return expandInlineBuffDefinitions(
    {
      id: 'skill',
      label: skill.key,
      kind: '技能定义',
      summary: `${skill.timelineBlockFrames} 帧 · ${sequences.length} 条时间序列 · ${handlers.length} 个事件响应`,
      sourcePath: '',
      details: {
        时间轴宽度帧: skill.timelineBlockFrames,
        冷却帧: skill.cooldownFrames ?? '—',
        费用数: skill.costs?.length ?? 0,
      },
      editorSection: 'overview',
      children: [
        {
          id: 'blackboard',
          label: labels.blackboard,
          kind: '技能设置',
          summary: `${Object.keys(skill.blackboard ?? {}).length} 个参数`,
          sourcePath: 'blackboard',
          details: skill.blackboard ?? {},
          editorSection: 'blackboard',
          children: [],
          relationToParent: 'port',
        },
        skill.availability === undefined
          ? {
              id: 'availability',
              label: labels.availability,
              kind: '技能设置',
              summary: '未设置',
              sourcePath: 'availability',
              details: {},
              editorSection: 'availability',
              children: [],
              canAddChild: 'combatCondition',
              relationToParent: 'port',
            }
          : conditionNode(
              skill.availability,
              'availability',
              'availability',
              labels.availability,
              'availability',
              true,
              false,
            ),
        {
          id: 'skill:handlers',
          label: '技能事件响应',
          kind: '结构分组',
          summary: `${handlers.length} 项`,
          sourcePath: 'eventHandlers',
          details: { 数量: handlers.length },
          editorSection: 'overview',
          canAddChild: 'skillEventHandler',
          acceptsChildKind: 'skillEventHandler',
          children: handlers.map((handler, index) =>
            skillEventHandlerNode(handler, index, handlers.length),
          ),
          relationToParent: 'port',
        },
        buildSkillInputWindowGraph(skill),
        switchToBuffCastNode(skill),
        ...sequences,
      ],
      canAddChild: 'sequence',
      acceptsChildKind: 'scheduledSequence',
    },
    skill,
  );
}

/** 武器、装备与套装共享同一贡献结构图；事件响应的动作序列继续使用技能步骤树。 */
export function buildEquipmentContributionMindMap(
  contribution: EquipmentContributionDefinition,
  label = '装备贡献',
): SkillStructureNode {
  const modifiers = contribution.modifiers ?? [];
  const handlers = contribution.eventHandlers ?? [];
  const initializationSequence = contribution.initializationSequence;
  return {
    id: 'equipment:contribution',
    label,
    kind: '装备贡献',
    summary: `${modifiers.length} 项修正 · ${handlers.length} 个事件响应${initializationSequence === undefined ? '' : ' · 帧 0 初始化'}`,
    sourcePath: '',
    details: { 属性修正: modifiers.length, 事件响应: handlers.length },
    editorSection: 'overview',
    children: [
      {
        id: 'equipment:modifiers',
        label: '属性修正',
        kind: '贡献分组',
        summary: `${modifiers.length} 项`,
        sourcePath: 'modifiers',
        details: { 数量: modifiers.length },
        editorSection: 'overview',
        canAddChild: 'equipmentModifier',
        acceptsChildKind: 'equipmentModifier',
        children: modifiers.map((modifier, index) => ({
          id: `equipment:modifier:${index}`,
          label: `${index + 1}. ${modifier.kind}`,
          kind: '属性修正',
          summary: shortValue(modifier.value),
          sourcePath: `modifiers[${index}]`,
          details: { ...modifier },
          editorSection: index,
          children: [],
          payloadKind: 'equipmentModifier',
        })),
        relationToParent: 'port',
      },
      {
        id: 'equipment:handlers',
        label: '事件响应',
        kind: '贡献分组',
        summary: `${handlers.length} 项`,
        sourcePath: 'eventHandlers',
        details: { 数量: handlers.length },
        editorSection: 'overview',
        canAddChild: 'equipmentHandler',
        acceptsChildKind: 'equipmentHandler',
        children: handlers.map((handler, index) => {
          const handlerPath = `eventHandlers[${index}]`;
          const eventLabel = handler.abilityEvent ?? handler.event?.kind ?? '未设置';
          return {
            id: `equipment:handler:${index}`,
            label: handler.key,
            kind: '事件响应',
            summary: eventLabel,
            sourcePath: handlerPath,
            details: { 事件: eventLabel, 条件: describeCondition(handler.condition) },
            editorSection: index,
            payloadKind: 'equipmentHandler' as const,
            ...(handler.condition === undefined ? { canAddChild: 'combatCondition' as const } : {}),
            children: [
              ...(handler.condition === undefined
                ? []
                : [
                    conditionNode(
                      handler.condition,
                      `equipment:handler:${index}:condition`,
                      `${handlerPath}.condition`,
                      '响应条件',
                      index,
                      true,
                      false,
                    ),
                  ]),
              sequenceNode(
                handler.sequence,
                `equipment:handler:${index}:sequence`,
                '响应序列',
                `${handlerPath}.sequence`,
                `${handler.sequence.steps.length} 个直属步骤`,
                index,
              ),
            ],
          };
        }),
        relationToParent: 'port',
      },
      ...(contribution.enableSequence === undefined
        ? []
        : [
            {
              ...sequenceNode(
                contribution.enableSequence,
                'equipment:enable-sequence',
                '启用前安装',
                'enableSequence',
                `${contribution.enableSequence.steps.length} 个直属步骤`,
                0,
              ),
              relationToParent: 'port' as const,
            },
          ]),
      ...(initializationSequence === undefined
        ? []
        : [
            {
              ...sequenceNode(
                initializationSequence,
                'equipment:initialization-sequence',
                '启用后初始化',
                'initializationSequence',
                `${initializationSequence.steps.length} 个直属步骤`,
                0,
              ),
              relationToParent: 'port' as const,
            },
          ]),
    ],
  };
}

const BUFF_LIFECYCLE_LABELS: Readonly<Record<string, string>> = {
  start: 'Start',
  enable: 'Enable',
  disable: 'Disable',
  beforeEnhance: 'Before Enhance',
  enhanceChanged: 'Enhance Changed',
  afterEnhance: 'After Enhance',
  trigger: 'Trigger',
  finish: 'Finish',
};

export function buildBuffStructureMindMap(
  buffId: string,
  definition: SkillBuffDefinition,
): SkillStructureNode {
  const scheduledSequences = definition.scheduledSequences ?? [];
  const lifecycleNodes = Object.entries(definition.lifecycleSequences ?? {}).flatMap(
    ([key, sequence]) => {
      if (sequence === undefined) return [];
      return [
        sequenceNode(
          sequence,
          `buff:lifecycle:${key}`,
          BUFF_LIFECYCLE_LABELS[key] ?? key,
          `lifecycleSequences.${key}`,
          `${sequence.steps.length} 个直属步骤`,
          0,
        ),
      ];
    },
  );
  const abilityResponses = definition.abilityEventResponses ?? [];
  const igniteResponses = definition.igniteEventResponses ?? [];
  return {
    id: 'buff',
    label: buffId,
    kind: 'Buff 定义',
    summary: `${scheduledSequences.length} 条调度序列 · ${lifecycleNodes.length} 个生命周期 · ${abilityResponses.length + igniteResponses.length} 个事件响应`,
    sourcePath: '',
    details: {
      叠加类型: definition.stackingType,
      持续秒数: definition.durationSeconds ?? '—',
      生命周期数: lifecycleNodes.length,
      调度序列数: scheduledSequences.length,
      事件响应数: abilityResponses.length + igniteResponses.length,
    },
    editorSection: 'overview',
    children: [
      {
        id: 'buff:scheduled-sequences',
        label: '调度序列',
        kind: '序列分组',
        summary: `${scheduledSequences.length} 条`,
        sourcePath: 'scheduledSequences',
        details: { 数量: scheduledSequences.length },
        editorSection: 0,
        children: scheduledSequences.map((sequence, index) =>
          scheduledSequenceNodeAtPath(
            sequence,
            `buff:sequence:${index}`,
            `scheduledSequences[${index}]`,
            `调度序列 ${index + 1}`,
            index,
          ),
        ),
        canAddChild: 'sequence',
        acceptsChildKind: 'scheduledSequence',
        relationToParent: 'port',
      },
      ...lifecycleNodes,
      ...buildBuffFlatCollectionGraph(definition),
      ...buildBuffCalculationModifierGraph(definition),
      buildBuffShieldGraph(definition.shields ?? []),
      buildBuffDamageModifierGraph(definition.damageModifiers ?? [], (sequence, path) =>
        sequenceNode(
          sequence,
          `buff:${path}`,
          '条件程序',
          path,
          `${sequence.steps.length} 个直属步骤`,
          0,
        ),
      ),
      {
        id: 'buff:ability-responses',
        label: 'Ability 事件响应',
        kind: '响应集合',
        summary: `${abilityResponses.length} 项`,
        sourcePath: 'abilityEventResponses',
        details: { 响应数: abilityResponses.length },
        editorSection: 0,
        children: abilityResponses.map((response, index) => {
          const responsePath = `abilityEventResponses[${index}]`;
          return {
            id: `buff:ability-response:${index}`,
            label: `${index + 1}. ${response.event}`,
            kind: 'Ability 事件响应',
            summary: `优先级 ${response.priority}`,
            sourcePath: responsePath,
            details: { 事件: response.event, 优先级: response.priority },
            editorSection: index,
            payloadKind: 'buffAbilityResponse' as const,
            canDelete: true,
            canMove: abilityResponses.length > 1,
            children: [
              sequenceNode(
                response.sequence,
                `buff:ability-response:${index}:sequence`,
                '响应序列',
                `${responsePath}.sequence`,
                `${response.sequence.steps.length} 个直属步骤`,
                index,
              ),
            ],
          };
        }),
        canAddChild: 'buffAbilityResponse' as const,
        acceptsChildKind: 'buffAbilityResponse' as const,
        relationToParent: 'port' as const,
      },
      {
        id: 'buff:ignite-responses',
        label: '点燃响应',
        kind: '响应集合',
        summary: `${igniteResponses.length} 项`,
        sourcePath: 'igniteEventResponses',
        details: { 响应数: igniteResponses.length },
        editorSection: 0,
        children: igniteResponses.map((response, index) => {
          const responsePath = `igniteEventResponses[${index}]`;
          return {
            id: `buff:ignite-response:${index}`,
            label: `${index + 1}. ${response.igniteType}`,
            kind: '点燃响应',
            summary: response.finishAfterIgnited ? '触发后结束 Buff' : '触发后保留 Buff',
            sourcePath: responsePath,
            details: {
              点燃类型: response.igniteType,
              触发后结束: response.finishAfterIgnited,
            },
            editorSection: index,
            payloadKind: 'buffIgniteResponse' as const,
            canDelete: true,
            canMove: igniteResponses.length > 1,
            children: [
              sequenceNode(
                response.sequence,
                `buff:ignite-response:${index}:sequence`,
                '响应序列',
                `${responsePath}.sequence`,
                `${response.sequence.steps.length} 个直属步骤`,
                index,
              ),
            ],
          };
        }),
        canAddChild: 'buffIgniteResponse' as const,
        acceptsChildKind: 'buffIgniteResponse' as const,
        relationToParent: 'port' as const,
      },
    ],
    canAddChild: 'lifecycle',
  };
}

export function buildAbilityEntityStructureMindMap(
  abilityEntityId: string,
  definition: AbilityEntityDefinition,
): SkillStructureNode {
  function childSkillNode(
    childSkill: AbilityEntityChildSkillDefinition,
    sourcePath: string,
    id: string,
    relationToParent: 'port' | 'member',
    sequenceIdRoot = id,
  ): SkillStructureNode {
    const sequenceNodes = childSkill.scheduledSequences.map((sequence, index) => {
      const node = sequenceNode(
        sequence.sequence,
        `${sequenceIdRoot}:sequence:${index}`,
        `子序列 ${index + 1}`,
        `${sourcePath}.scheduledSequences[${index}].sequence`,
        `第 ${sequence.startFrame}–${sequence.endFrame ?? '∞'} 帧 · ${sequence.sequence.steps.length} 个直属步骤`,
        index,
      );
      return {
        ...node,
        sourcePath: `${sourcePath}.scheduledSequences[${index}]`,
        payloadKind: 'scheduledSequence' as const,
      };
    });
    return {
      id,
      label: childSkill.skillId,
      kind: '实体子技能',
      summary: `${sequenceNodes.length} 条子序列`,
      sourcePath,
      details: { 黑板参数数: Object.keys(childSkill.blackboard ?? {}).length },
      editorSection: 'overview',
      children: sequenceNodes,
      canAddChild: 'sequence',
      acceptsChildKind: 'scheduledSequence',
      payloadKind: 'childSkill',
      relationToParent,
      canDelete: true,
      canCopy: false,
      canMove: false,
    };
  }
  const legacyChildNode =
    definition.childSkill === undefined
      ? undefined
      : childSkillNode(definition.childSkill, 'childSkill', 'entity:child-skill', 'port', 'entity');
  const namedChildNodes = Object.entries(definition.childSkills ?? {}).map(
    ([skillId, childSkill], index) =>
      childSkillNode(
        childSkill,
        structureRecordEntryPath('childSkills', skillId),
        `entity:named-child-skill:${index}`,
        'member',
      ),
  );
  const childNodes = [
    ...(legacyChildNode === undefined ? [] : [legacyChildNode]),
    ...namedChildNodes,
  ];
  const sequenceCount = childNodes.reduce((total, node) => total + node.children.length, 0);
  return expandInlineBuffDefinitions(
    {
      id: 'entity',
      label: abilityEntityId,
      kind: '能力实体',
      summary:
        definition.lifetime.kind === 'limited'
          ? `${definition.lifetime.durationSeconds}s · ${childNodes.length} 个子技能 · ${sequenceCount} 条子序列`
          : `无限生命周期 · ${childNodes.length} 个子技能 · ${sequenceCount} 条子序列`,
      sourcePath: '',
      details: {
        生命周期: definition.lifetime.kind,
        子技能数: childNodes.length,
        子序列数: sequenceCount,
      },
      editorSection: 'overview',
      children: [
        {
          id: 'entity:lifetime',
          label: '生命周期',
          kind: '实体设置',
          summary:
            definition.lifetime.kind === 'limited'
              ? `${definition.lifetime.durationSeconds} 秒`
              : '无限',
          sourcePath: 'lifetime',
          details: definition.lifetime,
          editorSection: 'overview',
          children: [],
          relationToParent: 'port',
        },
        ...childNodes,
      ],
      ...(definition.childSkill === undefined ? { canAddChild: 'childSkill' as const } : {}),
      ...(definition.childSkill === undefined ? { acceptsChildKind: 'childSkill' as const } : {}),
    },
    definition,
  );
}

export function indexSkillStructureNodes(
  root: SkillStructureNode,
): ReadonlyMap<string, SkillStructureNode> {
  const nodes = new Map<string, SkillStructureNode>();
  function visit(node: SkillStructureNode): void {
    nodes.set(node.id, node);
    node.children.forEach(visit);
  }
  visit(root);
  return nodes;
}

export function findSkillStructureNodeForPath(
  root: SkillStructureNode,
  rawPath: string,
): SkillStructureNode {
  const path = rawPath.replace(/^\$\.?/, '');
  let best = root;
  function visit(node: SkillStructureNode): void {
    const sourcePath = node.sourcePath;
    if (
      sourcePath.length > best.sourcePath.length &&
      (path === sourcePath ||
        path.startsWith(`${sourcePath}.`) ||
        path.startsWith(`${sourcePath}[`))
    ) {
      best = node;
    }
    node.children.forEach(visit);
  }
  visit(root);
  return best;
}
