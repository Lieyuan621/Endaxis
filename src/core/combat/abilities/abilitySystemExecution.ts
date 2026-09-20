/** 能力系统的延迟施放和模式切换算法；技能查找与生命周期通知由执行阶段的宿主负责。 */
import type { AbilitySystemState, BeforeSkillCastPreparation } from '../state/abilityState';
import type { CombatSkillCastInfo, PostSkillCastRequest } from '../state/foundationState';

/** 执行时才绑定当前分支的槽位、冷却账本与回执，不保存这些函数。 */
export interface SkillSlotReplacementHost {
  currentSkillKey(group: string): string;
  changeSkillSlot(group: string, skill: string, inheritCooldown: boolean): void;
}

/** 先撤销同槽旧替换，再读取还原目标；不把旧替换层层压栈。 */
export function replaceAbilitySkillSlot(
  state: AbilitySystemState,
  parameters: {
    readonly skillGroupKey: string;
    readonly targetSkillKey: string;
    readonly revertedSkillKey?: string;
    readonly inheritOriginSkillCooldownProgress: boolean;
  },
  host: SkillSlotReplacementHost,
): number {
  const previous = state.skillSlotReplacements.get(parameters.skillGroupKey);
  if (previous !== undefined)
    finishAbilitySkillSlotReplacement(
      state,
      parameters.skillGroupKey,
      previous.registrationId,
      host,
    );
  const revertedSkillKey =
    parameters.revertedSkillKey ?? host.currentSkillKey(parameters.skillGroupKey);
  host.changeSkillSlot(
    parameters.skillGroupKey,
    parameters.targetSkillKey,
    parameters.inheritOriginSkillCooldownProgress,
  );
  const registrationId = state.nextSkillSlotReplacementId++;
  state.skillSlotReplacements.set(parameters.skillGroupKey, {
    registrationId,
    revertedSkillKey,
    inheritOriginSkillCooldownProgress: parameters.inheritOriginSkillCooldownProgress,
  });
  return registrationId;
}

/** 先解除登记再还原；已经被替代的编号不能撤销新替换。 */
export function finishAbilitySkillSlotReplacement(
  state: AbilitySystemState,
  group: string,
  registrationId: number,
  host: SkillSlotReplacementHost,
): void {
  const replacement = state.skillSlotReplacements.get(group);
  if (replacement?.registrationId !== registrationId) return;
  state.skillSlotReplacements.delete(group);
  host.changeSkillSlot(
    group,
    replacement.revertedSkillKey,
    replacement.inheritOriginSkillCooldownProgress,
  );
}

/** 新登记排在已有映射之后，查询时保持后登记优先的顺序。 */
export function registerAbilityBasicAttackMapping(
  state: AbilitySystemState,
  skillId: string,
): number {
  const id = state.nextBasicAttackMappingId++;
  state.buffBasicAttackMappings.set(id, skillId);
  return id;
}

/** 只撤销指定登记，不把更早的映射快照重新写回。 */
export function finishAbilityBasicAttackMapping(state: AbilitySystemState, id: number): void {
  state.buffBasicAttackMappings.delete(id);
}

/** 保存切换前的模式；同层覆盖顺序沿用原有逻辑，不改成额外的模式栈。 */
export function activateAbilityPlayerActionMode(
  state: AbilitySystemState,
  layer: string,
  modeId: string,
): number {
  const id = state.nextPlayerActionModeActivationId++;
  const previousModeId = state.activePlayerActionModeByLayer.get(layer) ?? null;
  state.playerActionModeActivations.set(id, { layer, modeId, previousModeId });
  state.activePlayerActionModeByLayer.set(layer, modeId);
  return id;
}

/** 先删除登记，再决定是否还原；重复结束无效，被其他模式覆盖时不覆盖当前模式。 */
export function finishAbilityPlayerActionMode(state: AbilitySystemState, id: number): void {
  const activation = state.playerActionModeActivations.get(id);
  if (activation === undefined) return;
  state.playerActionModeActivations.delete(id);
  if (state.activePlayerActionModeByLayer.get(activation.layer) !== activation.modeId) return;
  if (activation.previousModeId === null)
    state.activePlayerActionModeByLayer.delete(activation.layer);
  else state.activePlayerActionModeByLayer.set(activation.layer, activation.previousModeId);
}

/** 同帧写入覆盖旧请求；继承信息按写入当时的值保存。 */
export function storePostSkillCastRequest(
  state: AbilitySystemState,
  request: PostSkillCastRequest,
): CombatSkillCastInfo | null {
  const inheritedSkillCastInfo =
    request.inheritedSkillCastInfo === undefined
      ? undefined
      : Object.freeze({ ...request.inheritedSkillCastInfo });
  state.postSkillCastRequest = { ...request, inheritedSkillCastInfo };
  return inheritedSkillCastInfo ?? null;
}

/** 执行前先清空；执行中写入的新请求留到下一帧，不能被本次清理覆盖。 */
export function takePostSkillCastRequest(state: AbilitySystemState): PostSkillCastRequest | null {
  const request = state.postSkillCastRequest;
  state.postSkillCastRequest = null;
  return request;
}

/** 在进入施放或旁路之前消费准备记录；通知期间重新登记的记录属于下一次操作。 */
export function takeBeforeSkillCastPreparation(
  state: AbilitySystemState,
  skillKey: string,
): BeforeSkillCastPreparation | undefined {
  const preparation = state.beforeCastStarts.get(skillKey);
  state.beforeCastStarts.delete(skillKey);
  return preparation;
}
