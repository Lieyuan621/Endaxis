/**
 * 元素附着状态机的纯决策层。调用方提供目标当前附着快照，
 * 再把返回操作交给 Buff 适配器执行；这里本身不修改目标状态。
 */
import type { InflictionElement } from '../../game-data/operatorDefinition';

/** 原生 INFLICTION_TAG_QUERY 查询此父标签；按标签层级匹配，不从 Buff ID 猜测。 */
export function hasElementalAttachmentTag(tags: readonly string[]): boolean {
  const parent = 'Skill/Character/Common/SpellInflict';
  return tags.some(tag => tag === parent || tag.startsWith(`${parent}/`));
}

/** 原生 EnergyShardType；条件 savedKey 与复合状态载荷共用同一编号。 */
export const NATIVE_ELEMENT_VALUES: Readonly<Record<InflictionElement, number>> = {
  heat: 0,
  electric: 1,
  cryo: 2,
  nature: 3,
};

/** 爆发事件同样携带原生 SpellInflictionContext.inflictionType。未知载荷不能匹配元素条件。 */
export function spellBurstElement(type: string): InflictionElement | undefined {
  switch (type) {
    case 'Fire':
      return 'heat';
    case 'Pulse':
      return 'electric';
    case 'Cryst':
      return 'cryo';
    case 'Natural':
      return 'nature';
    default:
      return undefined;
  }
}

export const ELEMENTAL_INFLICTION_OUTCOME_KINDS = [
  'attachmentOnly',
  'burst',
  'compoundStatus',
] as const;
/** 一次附着申请实际进入的仅附着、爆发或复合状态分支。 */
export type ElementalInflictionOutcomeKind = (typeof ELEMENTAL_INFLICTION_OUTCOME_KINDS)[number];

/** 目标当前活动附着的元素、层数和对应 Buff 身份。 */
export interface ExistingElementalAttachment {
  readonly element: InflictionElement;
  readonly layers: number;
}

/** 附着状态机返回、等待 Buff 适配器执行的语义操作。 */
export type ElementalInflictionOperation =
  | { readonly kind: 'addAttachment'; readonly element: InflictionElement }
  | { readonly kind: 'triggerBurst'; readonly element: InflictionElement }
  | { readonly kind: 'consumeAttachment'; readonly attachment: ExistingElementalAttachment }
  | {
      readonly kind: 'createCompoundStatus';
      readonly inverseReaction?: boolean;
      readonly consumedElement: InflictionElement;
      readonly incomingElement: InflictionElement;
      readonly consumedLayers: number;
    };

/** 解析已还原的空附着、同类附着和异类附着分支。 */
export function resolveElementalInfliction(
  incomingElement: InflictionElement,
  existingAttachment: ExistingElementalAttachment | null,
  inverseReaction = false,
): readonly ElementalInflictionOperation[] {
  if (existingAttachment === null) {
    return [{ kind: 'addAttachment', element: incomingElement }];
  }
  if (existingAttachment.element === incomingElement) {
    return [
      { kind: 'triggerBurst', element: incomingElement },
      { kind: 'addAttachment', element: incomingElement },
    ];
  }
  return [
    { kind: 'consumeAttachment', attachment: existingAttachment },
    {
      kind: 'createCompoundStatus',
      ...(inverseReaction ? { inverseReaction: true } : {}),
      consumedElement: existingAttachment.element,
      incomingElement,
      consumedLayers: existingAttachment.layers,
    },
  ];
}
