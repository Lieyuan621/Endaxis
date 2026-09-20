import type { OperatorUpgradeDefinition } from '../../../../core/game-data/operatorDefinition';
import { upgradeModifierLabels } from './upgradeModifierLabels';
import type { OperatorRuntimeDraft } from './operatorRuntimeDraft';
import {
  buildActionSequenceMindMap,
  buildCombatConditionMindMap,
  type SkillStructureNode,
} from '../skillStructureMindMapModel';

/** Embed the common projection without changing its document's actual containment paths. */
function prefix(node: SkillStructureNode, path: string, root = true): SkillStructureNode {
  const sourcePath = node.sourcePath ? `${path}.${node.sourcePath}` : path;
  return {
    ...node,
    id: sourcePath,
    sourcePath,
    ...(root ? { relationToParent: 'port' as const } : {}),
    children: node.children.map(child => prefix(child, path, false)),
  };
}
function node(
  path: string,
  label: string,
  kind: string,
  children: readonly SkillStructureNode[] = [],
): SkillStructureNode {
  return {
    id: path || 'upgrade',
    sourcePath: path,
    label,
    kind,
    summary: '',
    details: {},
    children,
    editorSection: 'overview',
    relationToParent: 'port',
    canDelete: false,
  };
}
export function buildOperatorUpgradeGraph(
  upgrade: OperatorUpgradeDefinition,
  title: string,
): SkillStructureNode {
  const modifiers = (upgrade.modifiers ?? []).map((modifier, index) => {
    const path = `modifiers[${index}]`;
    const children: SkillStructureNode[] = [];
    if (modifier.kind === 'addConditionalDamage') {
      // Combat condition projection has a named root; strip that one segment before rebasing.
      const condition = buildCombatConditionMindMap(modifier.condition);
      function rebase(n: SkillStructureNode): SkillStructureNode {
        const p = `${path}.${n.sourcePath}`;
        return { ...n, id: p, sourcePath: p, children: n.children.map(rebase) };
      }
      children.push(rebase(condition));
    }
    if (modifier.kind === 'patchSkillBlackboard' || modifier.kind === 'addSkillCooldownFrames') {
      children.push({
        ...node(`${path}.condition`, '构筑条件', modifier.condition ? '构筑条件' : '结构端口'),
        summary: modifier.condition ? '比较最终构筑四维' : '未设置 · 无条件应用',
        canDelete: !!modifier.condition,
        ...(modifier.condition ? {} : { canAddChild: 'lifecycle' as const }),
      });
    }
    return {
      ...node(path, upgradeModifierLabels[modifier.kind], '构筑修正', children),
      summary: `构筑修正 ${index + 1}`,
      payloadKind: 'upgradeModifier' as const,
      relationToParent: 'member' as const,
      canDelete: true,
    };
  });
  const handlers = (upgrade.eventHandlers ?? []).map((handler, index) => {
    const path = `eventHandlers[${index}]`;
    return {
      ...node(path, `监听 ${index + 1}`, '事件监听', [
        node(`${path}.event`, '触发事件', '触发事件'),
        prefix(buildActionSequenceMindMap(handler.sequence, '响应序列'), `${path}.sequence`),
      ]),
      summary: handler.event.kind,
      payloadKind: 'upgradeHandler' as const,
      relationToParent: 'member' as const,
      canDelete: true,
    };
  });
  const passives = (upgrade.passiveSkills ?? []).map((passive, index) => {
    const path = `passiveSkills[${index}]`;
    return {
      ...node(path, passive.key, '常驻被动', [
        prefix(
          buildActionSequenceMindMap(passive.enableSequence, '启用序列'),
          `${path}.enableSequence`,
        ),
      ]),
      payloadKind: 'upgradePassive' as const,
      relationToParent: 'member' as const,
      canDelete: true,
    };
  });
  return node('', title, '养成效果', [
    {
      ...node('modifiers', '构筑修正', '结构端口', modifiers),
      summary: '构筑阶段',
      canAddChild: 'upgradeModifier',
      acceptsChildKind: 'upgradeModifier',
    },
    upgrade.initializationSequence
      ? {
          ...prefix(
            buildActionSequenceMindMap(upgrade.initializationSequence, '初始化'),
            'initializationSequence',
          ),
          canDelete: true,
        }
      : {
          ...node('initializationSequence', '初始化', '结构端口'),
          summary: '未设置',
          canAddChild: 'lifecycle',
        },
    {
      ...node('eventHandlers', '事件监听', '结构端口', handlers),
      canAddChild: 'upgradeHandler',
      acceptsChildKind: 'upgradeHandler',
    },
    {
      ...node('passiveSkills', '常驻被动', '结构端口', passives),
      canAddChild: 'upgradePassive',
      acceptsChildKind: 'upgradePassive',
    },
  ]);
}

/** Role-owned programs: event is an OperatorEvent, not an UpgradeEvent. */
export function buildOperatorRuntimeGraph(document: OperatorRuntimeDraft): SkillStructureNode {
  const passives = document.passives.map((value, index) => {
    const path = `passives[${index}]`;
    return {
      ...node(path, value.key, '角色被动', [
        prefix(
          buildActionSequenceMindMap(value.enableSequence, '启用序列'),
          `${path}.enableSequence`,
        ),
      ]),
      payloadKind: 'upgradePassive' as const,
      canDelete: true,
      relationToParent: 'member' as const,
    };
  });
  const handlers = document.handlers.map((value, index) => {
    const path = `handlers[${index}]`;
    return {
      ...node(path, value.key, '角色监听', [
        prefix(buildActionSequenceMindMap(value.sequence, '响应序列'), `${path}.sequence`),
      ]),
      summary: value.event,
      payloadKind: 'upgradeHandler' as const,
      canDelete: true,
      relationToParent: 'member' as const,
    };
  });
  return node('', '角色行为', '角色行为', [
    {
      ...node('passives', '常驻被动', '角色端口', passives),
      canAddChild: 'upgradePassive',
      acceptsChildKind: 'upgradePassive',
    },
    {
      ...node('handlers', '事件监听', '角色端口', handlers),
      canAddChild: 'upgradeHandler',
      acceptsChildKind: 'upgradeHandler',
    },
  ]);
}
