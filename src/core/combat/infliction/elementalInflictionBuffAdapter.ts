import type { GameplayTag } from '../../../../packages/game-data-contract/src/gameplayTags';
/**
 * 元素附着纯决策结果与目标 Buff 容器之间的执行适配层。
 * 调用前必须使用同一时刻的附着快照完成解析，避免决策与写入之间状态漂移。
 */
import type { InflictionElement } from '../../game-data/operatorDefinition';
import type {
  BuffLifecycleActions,
  CombatBuff,
  CombatBuffAddOptions,
  CombatBuffContainer,
  CombatBuffDefinition,
} from '../buffs/combatBuffs';
import type { AbilityOutputBuffPayload } from '../events/combatAbilityEvent';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type {
  ElementalInflictionOperation,
  ExistingElementalAttachment,
} from './elementalInfliction';
import { NATIVE_ELEMENT_VALUES } from './elementalInfliction';

/** 附着适配器读取 Buff 定义和复合状态工厂的定义端口。 */
export interface ElementalInflictionBuffIndex<Key extends string> {
  getAttachmentElement(definition: CombatBuffDefinition<Key>): InflictionElement | null;
  getAttachment(element: InflictionElement): CombatBuffDefinition<Key>;
  getBurst(element: InflictionElement): CombatBuffDefinition<Key>;
  getCompoundStatus(
    consumedElement: InflictionElement,
    incomingElement: InflictionElement,
  ): CombatBuffDefinition<Key>;
}

/** 附着实际写入后发布给关卡事件系统的稳定负载。 */
export interface ElementalInflictionStartedPayload {
  readonly element: InflictionElement;
  readonly layers: number;
}

/** 本次操作实际触及的实例；仅用于记录因果，不改变附着决策。 */
export interface ElementalInflictionBuffIdentity {
  readonly buffId: string;
  readonly instanceId: number;
}

export interface ElementalBuffAppliedPayload {
  readonly skillCastInfo: CombatSkillCastInfo | null;
  readonly targetId: string;
  readonly buffId: string;
  readonly sourceId: string;
  readonly buffTags: readonly GameplayTag[];
}

export type ResolveCompoundStatusBlackboard = (
  consumedElement: InflictionElement,
  incomingElement: InflictionElement,
  input: Readonly<Record<string, number>>,
) => Readonly<Record<string, number>>;

export function createElementalAttachmentLifecycleActions<Key extends string>(
  element: InflictionElement,
  emitStarted: (payload: ElementalInflictionStartedPayload, buff: CombatBuff<Key>) => void,
): BuffLifecycleActions<Key> {
  return {
    afterEnhance: buff => {
      emitStarted({ element, layers: buff.enhanceCount }, buff);
    },
  };
}

/** 将已解析的元素操作应用到目标的原生风格 Buff 容器。 */
export class ElementalInflictionBuffAdapter<Key extends string> {
  #projectedAttachment: CombatBuff<Key> | null = null;

  constructor(
    readonly target: CombatBuffContainer<Key>,
    readonly sourceId: string,
    readonly index: ElementalInflictionBuffIndex<Key>,
    readonly addOptions?: CombatBuffAddOptions,
    readonly onBuffApplied?: (event: ElementalBuffAppliedPayload, buff: CombatBuff<Key>) => void,
    readonly resolveCompoundStatusBlackboard?: ResolveCompoundStatusBlackboard,
    readonly onBeforeOutputBuff?: (event: ElementalBuffAppliedPayload) => void,
    readonly onOutputBuff?: (event: AbilityOutputBuffPayload) => void,
    readonly onBeforeAddedBuff?: (event: ElementalBuffAppliedPayload) => void,
  ) {}

  getExistingAttachment(): ExistingElementalAttachment | null {
    const match = this.findAttachment();
    this.#projectedAttachment = match?.buff ?? null;
    return match === undefined ? null : { element: match.element, layers: match.buff.enhanceCount };
  }

  apply(
    operation: ElementalInflictionOperation,
    addOptions = this.addOptions,
  ): ElementalInflictionBuffIdentity | void {
    switch (operation.kind) {
      case 'addAttachment':
        return this.add(this.index.getAttachment(operation.element), addOptions);
      case 'triggerBurst':
        return this.add(this.index.getBurst(operation.element), addOptions);
      case 'consumeAttachment': {
        const projected = this.#projectedAttachment;
        if (
          projected === null ||
          this.index.getAttachmentElement(projected.definition) !== operation.attachment.element
        ) {
          throw new Error('projected elemental attachment no longer matches the target');
        }
        if (
          !this.target.finishInstance(
            projected,
            'ignite',
            this.sourceId,
            addOptions?.skillCastInfo ?? null,
          )
        ) {
          throw new Error('projected elemental attachment could not be consumed');
        }
        this.#projectedAttachment = null;
        return { buffId: projected.definition.id, instanceId: projected.instanceId };
      }
      case 'createCompoundStatus':
        const firstElement = operation.inverseReaction
          ? operation.incomingElement
          : operation.consumedElement;
        const secondElement = operation.inverseReaction
          ? operation.consumedElement
          : operation.incomingElement;
        const inputBlackboard = {
          consumed_type: NATIVE_ELEMENT_VALUES[operation.consumedElement],
          consumed_layer: operation.consumedLayers,
          count: operation.consumedLayers,
        };
        const factoryBlackboard = this.resolveCompoundStatusBlackboard?.(
          firstElement,
          secondElement,
          inputBlackboard,
        );
        return this.add(this.index.getCompoundStatus(firstElement, secondElement), {
          ...addOptions,
          blackboardValues: {
            ...addOptions?.blackboardValues,
            ...inputBlackboard,
            ...factoryBlackboard,
          },
        });
    }
  }

  private add(
    definition: CombatBuffDefinition<Key>,
    options: CombatBuffAddOptions | undefined = this.addOptions,
  ): ElementalInflictionBuffIdentity | void {
    const event: ElementalBuffAppliedPayload = {
      targetId: this.target.ownerId,
      buffId: definition.id,
      sourceId: this.sourceId,
      buffTags: definition.applyTags ?? [],
      skillCastInfo: options?.skillCastInfo ?? null,
    };
    this.onBeforeOutputBuff?.(event);
    this.onBeforeAddedBuff?.(event);
    const added = this.target.add(definition, this.sourceId, options);
    if (added === null) return;
    this.onBuffApplied?.(event, added);
    this.onOutputBuff?.({ ...event, buff: added });
    return { buffId: added.definition.id, instanceId: added.instanceId };
  }

  private findAttachment():
    { readonly buff: CombatBuff<Key>; readonly element: InflictionElement } | undefined {
    const buff = this.target.findFirst(
      candidate => this.index.getAttachmentElement(candidate.definition) !== null,
    );
    if (buff === undefined) return undefined;
    const element = this.index.getAttachmentElement(buff.definition);
    if (element === null) {
      throw new Error('elemental attachment index changed during lookup');
    }
    return { buff, element };
  }
}
