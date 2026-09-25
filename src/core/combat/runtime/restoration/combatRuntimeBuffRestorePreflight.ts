/**
 * 在创建恢复对象前索引整场 Buff 实例，并检查稍后关系阶段使用的稳定引用。
 *
 * 这里只检查保存数据的身份、引用和寿命宿主归属，不解析固定定义，也不创建 Buff 句柄。
 */
import { logicalAbilityEntityRuntimeId } from '../../../game-data/logicalAbilityEntity';
import { buffReferenceKey, resolveBuffReferenceState } from '../../buffs/buffReference';
import type { ActionSequenceState, TimelineRuntimeState } from '../../state/actionState';
import type { CombatStateGraph } from '../../state/combatState';
import { type BuffReference } from '../../state/foundationState';
import type { BuffContainerState } from '../../state/instanceState';

export interface PreparedCombatBuffRestore {
  readonly instanceKeys: ReadonlySet<string>;
  readonly operatorSourceChildren: ReadonlyMap<string, BuffReference>;
  readonly abilityEntityChildren: ReadonlyMap<string, BuffReference>;
}

function addContainer(
  containers: Map<string, BuffContainerState<string>>,
  ownerId: string,
  state: BuffContainerState<string> | null,
): void {
  if (state === null) return;
  if (containers.has(ownerId)) throw new Error(`duplicate restored Buff target '${ownerId}'`);
  containers.set(ownerId, state);
}

function collectOwnedReferences(
  references: Iterable<BuffReference>,
  instanceKeys: ReadonlySet<string>,
  label: string,
): ReadonlyMap<string, BuffReference> {
  const result = new Map<string, BuffReference>();
  for (const reference of references) {
    const key = buffReferenceKey(reference);
    if (!instanceKeys.has(key)) throw new Error(`restored ${label} '${key}' is missing`);
    if (result.has(key)) throw new Error(`restored ${label} '${key}' has multiple owners`);
    result.set(key, reference);
  }
  return result;
}

function requireReference(
  reference: BuffReference,
  instanceKeys: ReadonlySet<string>,
  label: string,
  savedKey?: string,
): void {
  const key = buffReferenceKey(reference);
  if (savedKey !== undefined && savedKey !== key) {
    throw new Error(`restored ${label} key '${savedKey}' does not match '${key}'`);
  }
  if (!instanceKeys.has(key)) throw new Error(`restored ${label} '${key}' is missing`);
}

/** ObjectPtr 可以已经失效，但宿主、分配记录及引用键必须真实存在。 */
function validateAttachedReference(
  reference: BuffReference,
  containers: ReadonlyMap<string, BuffContainerState<string>>,
  savedKey: string,
): void {
  if (savedKey !== buffReferenceKey(reference))
    throw new Error(`restored attached Buff key '${savedKey}' does not match its identity`);
  const container = containers.get(reference.ownerId);
  if (container === undefined)
    throw new Error(`restored attached Buff owner '${reference.ownerId}' is missing`);
  resolveBuffReferenceState(container, reference);
}

/**
 * holdBuffsById 保证被持有实例仍存在，所以恢复前必须找到它。
 * finishByAction 和 inheritBuffById 保存的实例可以在动作结束前自然回收；它们的 End 会把缺失实例
 * 当作已经完成，因此不能在预检阶段误判为非法切面。
 */
function collectRequiredActionSequenceReferences(
  sequence: ActionSequenceState | null,
  references: BuffReference[],
): void {
  if (sequence === null) return;
  for (const data of sequence.steps) {
    if (data === null) continue;
    if (data.kind === 'buffHold') {
      references.push(...data.buffs.references);
    } else if (data.kind === 'sequence') {
      collectRequiredActionSequenceReferences(data.sequence, references);
    } else if (data.kind === 'branch') {
      for (const branch of data.branches)
        collectRequiredActionSequenceReferences(branch, references);
    } else if (data.kind === 'targets') {
      for (const body of data.loop.bodies.values()) {
        collectRequiredActionSequenceReferences(body.sequence, references);
      }
    } else if (data.kind === 'blackboardScope') {
      collectRequiredActionSequenceReferences(data.scope.body?.sequence ?? null, references);
    } else if (data.kind === 'repeat') {
      collectRequiredActionSequenceReferences(data.repetition.body, references);
    } else if (data.kind === 'listener') {
      for (const response of data.listener.responses) {
        collectRequiredActionSequenceReferences(response.sequence, references);
      }
    }
  }
}

function collectTimelineReferences(
  timeline: TimelineRuntimeState | null,
  references: BuffReference[],
): void {
  for (const sequence of timeline?.sequences ?? []) {
    collectRequiredActionSequenceReferences(sequence, references);
  }
}

/** 返回的目录仍引用候选图，只供后续对象阶段解析当前分支句柄。 */
export function prepareCombatBuffRestore(graph: CombatStateGraph): PreparedCombatBuffRestore {
  const containers = new Map<string, BuffContainerState<string>>();
  addContainer(containers, 'enemy', graph.enemy.buffs);
  for (const [operatorId, operator] of graph.operators) {
    addContainer(containers, operatorId, operator.buffs);
  }
  for (const [instanceId, entity] of graph.instances.abilityEntities.instances) {
    if (!entity.buffContainerCreated) continue;
    addContainer(containers, logicalAbilityEntityRuntimeId(instanceId), entity.buffs);
  }

  const instanceKeys = new Set<string>();
  for (const [ownerId, container] of containers) {
    for (const [instanceId, instance] of container.instances) {
      if (instance.identity.ownerId !== ownerId || instance.identity.instanceId !== instanceId) {
        throw new Error(
          `restored Buff target '${ownerId}' instance key '${instanceId}' does not match its identity`,
        );
      }
      const key = buffReferenceKey(instance.identity);
      if (instanceKeys.has(key)) throw new Error(`duplicate restored Buff instance '${key}'`);
      instanceKeys.add(key);
    }
  }

  for (const container of containers.values()) {
    for (const instance of container.instances.values()) {
      if (
        instance.sourceAttributeOwnerId !== null &&
        !containers.has(instance.sourceAttributeOwnerId)
      ) {
        throw new Error(
          `restored Buff '${buffReferenceKey(instance.identity)}' source attribute owner '${instance.sourceAttributeOwnerId}' is missing`,
        );
      }
      for (const [key, reference] of instance.children.members) {
        requireReference(reference, instanceKeys, 'Buff child', key);
      }
      for (const affix of instance.actionHost?.affixes ?? []) {
        for (const objectReference of affix.objectReferences.values()) {
          if (objectReference.kind === 'buff') {
            requireReference(objectReference.reference, instanceKeys, 'SkillAffix Buff');
          }
        }
      }
    }
  }

  const globalChildren = [...graph.instances.globalBuffs.groups.values()].flatMap(group =>
    group.flatMap(instance => instance.children),
  );
  for (const reference of globalChildren) {
    requireReference(reference, instanceKeys, 'global Buff child');
  }

  const operatorSourceChildren = collectOwnedReferences(
    [...graph.operators.values()].flatMap(state => [
      ...[...state.passives.values()].flatMap(passive => passive.host.childBuffs),
      ...(state.equipment === null
        ? []
        : [...state.equipment.contributions.values()].flatMap(
            contribution => contribution.host.childBuffs,
          )),
    ]),
    instanceKeys,
    'source child Buff',
  );

  const abilityEntityChildren = collectOwnedReferences(
    [...graph.instances.abilityEntities.instances.values()].flatMap(state => [
      ...state.childBuffs,
      ...[...state.passiveAbilities.values()].flatMap(passive => passive.host.childBuffs),
    ]),
    instanceKeys,
    'AbilityEntity child Buff',
  );

  for (const operator of graph.operators.values()) {
    for (const skill of operator.skills.values()) {
      for (const [key, reference] of skill.execution.attachedBuffs) {
        validateAttachedReference(reference, containers, key);
      }
    }
  }
  for (const projectile of graph.instances.projectiles.instances.values()) {
    for (const [key, reference] of projectile.callbacks.flatMap(callback => [
      ...(callback.host?.skill.execution.attachedBuffs ?? []),
    ])) {
      validateAttachedReference(reference, containers, key);
    }
  }

  const actionReferences: BuffReference[] = [];
  for (const operator of graph.operators.values()) {
    for (const skill of operator.skills.values()) {
      collectTimelineReferences(skill.timeline, actionReferences);
    }
    for (const passive of operator.passives.values()) {
      collectRequiredActionSequenceReferences(passive.enableSequence, actionReferences);
      for (const response of passive.responses) {
        collectRequiredActionSequenceReferences(response, actionReferences);
      }
    }
    for (const contribution of operator.equipment?.contributions.values() ?? []) {
      for (const response of contribution.responses) {
        collectRequiredActionSequenceReferences(response.sequence, actionReferences);
      }
    }
    for (const initialization of operator.initializations.values()) {
      collectRequiredActionSequenceReferences(
        initialization.initializationSequence,
        actionReferences,
      );
      collectRequiredActionSequenceReferences(initialization.enableSequence, actionReferences);
    }
  }
  for (const entity of graph.instances.abilityEntities.instances.values()) {
    for (const child of entity.childSkills) {
      collectTimelineReferences(child.host.skill.timeline, actionReferences);
    }
    for (const passive of entity.passiveAbilities.values()) {
      collectRequiredActionSequenceReferences(passive.enableSequence, actionReferences);
      for (const response of passive.responses) {
        collectRequiredActionSequenceReferences(response, actionReferences);
      }
    }
  }
  for (const container of containers.values()) {
    for (const instance of container.instances.values()) {
      const host = instance.actionHost;
      if (host === null) continue;
      collectRequiredActionSequenceReferences(host.enable, actionReferences);
      collectRequiredActionSequenceReferences(host.trigger, actionReferences);
      collectTimelineReferences(host.scheduled?.timeline ?? null, actionReferences);
      for (const response of host.eventResponses) {
        collectRequiredActionSequenceReferences(response.sequence, actionReferences);
      }
    }
  }
  for (const projectile of graph.instances.projectiles.instances.values()) {
    projectile.callbacks.forEach(callback =>
      collectTimelineReferences(callback.host?.skill.timeline ?? null, actionReferences),
    );
  }
  for (const reference of actionReferences) {
    requireReference(reference, instanceKeys, 'action-owned Buff');
  }

  return Object.freeze({ instanceKeys, operatorSourceChildren, abilityEntityChildren });
}
