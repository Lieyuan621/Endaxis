/** 一次原生 UseItem action 对目标干员施加的公共 Buff。 */
export interface ConsumableBuffApplicationDefinition {
  readonly buffId: string;
  readonly blackboardValues: Readonly<Record<string, number>>;
}

/** 当前固定木桩产品支持的主动增益消耗品。 */
export interface ConsumableDefinition {
  readonly id: string;
  readonly iconPath: string;
  readonly rarity: number;
  readonly kind: 'operatorBuff';
  readonly durationSeconds: number;
  /** 同组物品在同一干员身上互斥；使用新物品时结束旧物品的全部 Buff。 */
  readonly exclusiveGroup: 'operatorConsumableBuff';
  readonly applications: readonly ConsumableBuffApplicationDefinition[];
}
