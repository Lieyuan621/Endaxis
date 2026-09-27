import { supportsCustomAsset, type WorkspaceAssetDefinition } from './workspaceAssetDefinition';
import {
  listDefinitionResources,
  type DefinitionResource,
} from '../definition-editor/definitionResources';
import type {
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import { listDataInputs } from '../../core/action-graph/actionGraphDataNodes';

export type WorkspaceDefinitionResource = Omit<DefinitionResource, 'kind'> & {
  readonly kind: DefinitionResource['kind'] | 'consumable' | 'enemy' | 'globalEffect' | 'contract';
};

/** 导航身份只在当前资产内部有效，更新定义仍使用原始字段路径。 */
export interface WorkspaceResource {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly parent?: string;
  readonly definitionResource: WorkspaceDefinitionResource;
}

export interface WorkspaceResourceReference {
  readonly from: string;
  readonly to: string;
  readonly kind: string;
  /** 跨资产目标打开该资产；省略时 to 是当前资产内的资源路径。 */
  readonly targetAsset?: { readonly id: string; readonly name: string };
}

export interface WorkspaceSharedBuffTarget {
  readonly id: string;
  readonly assetId: string;
  readonly name: string;
}

/** 只列可从动作参数确定、且能在当前资产内唯一定位的引用，不把变量值猜成资源 ID。 */
export function workspaceActionReferences(
  definition: object,
  resources: readonly WorkspaceResource[],
  sharedBuffs: readonly WorkspaceSharedBuffTarget[] = [],
): readonly WorkspaceResourceReference[] {
  const sharedTargets = new Map<string, WorkspaceSharedBuffTarget[]>();
  for (const buff of sharedBuffs)
    sharedTargets.set(buff.id, [...(sharedTargets.get(buff.id) ?? []), buff]);
  const targets = new Map<string, WorkspaceResource[]>();
  for (const resource of resources) {
    const key = `${resource.kind}:${resource.definitionResource.identity}`;
    targets.set(key, [...(targets.get(key) ?? []), resource]);
  }
  const result = new Map<string, WorkspaceResourceReference>();
  for (const source of resources) {
    const owner = fieldValueAt(definition, source.definitionResource.path) as
      { actionGraph?: ActionGraphResourceDefinition } | undefined;
    if (!owner?.actionGraph) continue;
    for (const graph of [
      owner.actionGraph.main,
      ...Object.values(owner.actionGraph.macros).map(macro => macro.graph),
    ]) {
      const graphReferences = [
        ...Object.values(graph.nodes).flatMap(node => [
          ...actionReferences(node.action),
          ...listDataInputs(node.action).flatMap(input =>
            input.type === 'boolean' ? conditionReferences(input.value as CombatCondition) : [],
          ),
        ]),
        ...Object.values(graph.dataNodes ?? {}).flatMap(node =>
          node.type === 'boolean' ? conditionReferences(node.expression) : [],
        ),
      ];
      for (const reference of graphReferences) {
        const candidates = targets.get(`${reference.kind}:${reference.id}`) ?? [];
        const external = reference.kind === 'buff' ? (sharedTargets.get(reference.id) ?? []) : [];
        if (candidates.length === 0 && external.length === 1) {
          const target = external[0]!;
          const edge: WorkspaceResourceReference = {
            from: source.id,
            to: '[]',
            kind: 'uses',
            targetAsset: { id: target.assetId, name: target.name },
          };
          result.set(JSON.stringify([source.id, target.assetId]), edge);
          continue;
        }
        // 同名实体子技能可能属于不同实体，不能随意跳到其中一个。
        if (candidates.length !== 1 || external.length !== 0) continue;
        const target = candidates[0]!;
        const edge = { from: source.id, to: target.id, kind: 'uses' };
        result.set(`${source.id}:${target.id}`, edge);
      }
    }
  }
  return [...result.values()];
}

function conditionReferences(condition: CombatCondition): readonly { kind: string; id: string }[] {
  switch (condition.kind) {
    case 'not':
      return conditionReferences(condition.condition);
    case 'all':
    case 'any':
      return condition.conditions.flatMap(conditionReferences);
    case 'buffIdStackCompare':
    case 'contextTargetBuffIdStackCompare':
    case 'eventBuffIdMatch':
      return condition.buffIds.map(id => ({ kind: 'buff', id }));
    case 'buffBlackboardValueCompare':
      return condition.query.kind === 'id'
        ? condition.query.buffIds.map(id => ({ kind: 'buff', id }))
        : [];
    case 'eventSkillIdIn':
      return condition.skillIds.map(id => ({ kind: 'skill', id }));
    default:
      return [];
  }
}

function actionReferences(action: ActionGraphStep): readonly { kind: string; id: string }[] {
  const buffs = (ids: readonly string[]) => ids.map(id => ({ kind: 'buff', id }));
  switch (action.kind) {
    case 'applyBuff': {
      const p = action.parameters;
      return buffs([
        ...(typeof p.buffId === 'string' ? [p.buffId] : []),
        ...(p.onActionEndBuffs?.map(buff => buff.buffId) ?? []),
        ...(p.onActionEndFinishBuffs?.buffIds ?? []),
        ...(p.keywordEnhancements?.flatMap(item => item.triggerBuffIds) ?? []),
      ]);
    }
    case 'finishBuffsById':
    case 'holdBuffsById':
    case 'readBuffRemainingDuration':
      return buffs(action.parameters.buffIds);
    case 'inheritBuffById':
      return [
        ...buffs([action.parameters.buffId]),
        ...action.parameters.inheritToNextSkillIds.map(id => ({ kind: 'skill', id })),
      ];
    case 'spawnAbilityEntity':
      return [{ kind: 'entity', id: action.parameters.abilityEntityId }];
    case 'castSkillDuringAction':
      return typeof action.parameters.skillId === 'string'
        ? [{ kind: 'skill', id: action.parameters.skillId }]
        : [];
    default:
      return [];
  }
}

/** 技能组与变体属于编排页面，不把它们机械地变成新的资源导航层。 */
export function describeWorkspaceResources(
  edit: WorkspaceAssetDefinition,
  name: (resource: WorkspaceDefinitionResource) => string,
): readonly WorkspaceResource[] {
  if (!supportsCustomAsset(edit)) {
    const identity =
      edit.kind === 'buff'
        ? edit.id
        : edit.kind === 'contract'
          ? String(edit.definition.tagId)
          : edit.definition.id;
    const resource: WorkspaceDefinitionResource = { kind: edit.kind, path: [], identity };
    return [{ id: '[]', kind: edit.kind, name: name(resource), definitionResource: resource }];
  }
  const definitions = listDefinitionResources(edit.kind, edit.definition).filter(
    resource => resource.kind !== 'skillGroup' && resource.kind !== 'skillGroupVariant',
  );
  const byPath = new Map(definitions.map(resource => [JSON.stringify(resource.path), resource]));
  return definitions.map(resource => {
    let parent: DefinitionResource | undefined;
    for (let length = resource.path.length - 1; length >= 0; length--) {
      parent = byPath.get(JSON.stringify(resource.path.slice(0, length)));
      if (parent) break;
    }
    return {
      id: JSON.stringify(resource.path),
      kind: navigationKind(resource),
      name: name(resource),
      parent: parent ? JSON.stringify(parent.path) : undefined,
      definitionResource: resource,
    };
  });
}

function navigationKind(resource: DefinitionResource): string {
  switch (resource.kind) {
    case 'abilityEntity':
      return 'entity';
    case 'abilityEntityChildSkill':
    case 'abilityEntityPassiveSkill':
      return 'skill';
    case 'operatorUpgrade':
      return resource.path[0] === 'talents' ? 'talent' : 'potential';
    case 'operatorPassiveSkill':
    case 'weaponTrait':
    case 'gearTrait':
      return 'passive';
    case 'gearSet':
      return 'set';
    default:
      return resource.kind;
  }
}

/** 按真实包含关系定位；没有路径猜测，也不跨到另一资产的内部。 */
export function workspaceResourcePath(
  byId: ReadonlyMap<string, Pick<WorkspaceResource, 'id' | 'parent'>>,
  id: string,
): readonly string[] {
  const path: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(id);
  while (current) {
    if (visited.has(current.id)) throw new Error('cyclic asset containment');
    visited.add(current.id);
    path.unshift(current.id);
    current = current.parent === undefined ? undefined : byId.get(current.parent);
  }
  return path;
}
