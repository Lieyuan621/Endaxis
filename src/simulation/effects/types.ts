import type { SimulationContext } from "../engine/SimulationContext";
import type { SimEvent } from "../events/event.types";

export type ElementalEffectTag =
  // 法术
  | "ELEMENT_CRYO" // 寒冷
  | "ELEMENT_HEAT" // 灼热
  | "ELEMENT_ELECTRIC" // 电磁
  | "ELEMENT_NATURE" // 自然
  // 法术异常
  | "ELEMENT_COMBUSTION" // 燃烧
  | "ELEMENT_ELECTRIFICATION" // 导电
  | "ELEMENT_SOLIDIFICATION" // 冻结
  | "ELEMENT_CORROSION" // 腐蚀
  // 法术爆发
  | "ELEMENT_CRYO_BURST" // 寒冷爆发
  | "ELEMENT_HEAT_BURST" // 灼热爆发
  | "ELEMENT_ELECTRIC_BURST" // 电磁爆发
  | "ELEMENT_NATURE_BURST"; // 自然爆发

export type PhysicalEffectTag =
  // 物理异常
  | "PHYSICAL_VULNERABLE" // 破防
  // 物理异常2
  | "PHYSICAL_KNOCK_DOWN" // 倒地
  | "PHYSICAL_LIFT" // 击飞
  | "PHYSICAL_CRUSH" // 猛击
  | "PHYSICAL_BREACH"; // 碎甲

export type EffectTag =
  | ElementalEffectTag
  | PhysicalEffectTag
  // 增伤
  | "PHYSICAL_BONUS"
  // 减抗
  | "DEBUFF_RES_DOWN";

export interface EffectTrigger<T extends SimEvent = SimEvent> {
  event: T["type"];

  sourceMustBeWearer?: boolean;
  cooldownId?: string;
  cooldownDuration?: number;

  condition?: (event: T, ctx: SimulationContext) => boolean;

  action: (event: T, ctx: SimulationContext) => void;
}

export interface EffectSnapshot {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  tags: EffectTag[];
  duration: number;
  startTime: number;
  maxStacks: number;
  stackStrategy: "REFRESH_DURATION" | "INDEPENDENT" | "ADD_DURATION";
  currentStacks: number;
  properties: {
    value?: number;
    [key: string]: any;
  };
}

export class Effect {
  id: string;
  name: string;
  description?: string;
  type: string;

  tags: EffectTag[];

  duration: number;
  startTime: number = 0;

  maxStacks: number = 1;
  stackStrategy: "REFRESH_DURATION" | "INDEPENDENT" | "ADD_DURATION" =
    "REFRESH_DURATION";
  currentStacks: number = 1;

  properties: {
    value?: number;
    [key: string]: any;
  };

  triggers: EffectTrigger[];

  constructor(
    data: Partial<EffectSnapshot> & {
      id: string;
      tags: EffectTag[];
      triggers?: EffectTrigger[];
    },
  ) {
    this.id = data.id;
    this.name = data.name || "";
    this.description = data.description || "";
    this.startTime = data.startTime ?? 0;
    this.type = data.type || "UNKNOWN";
    this.tags = data.tags;
    this.duration = data.duration ?? Infinity;
    this.maxStacks = data.maxStacks || 1;
    this.stackStrategy = data.stackStrategy || "REFRESH_DURATION";
    this.currentStacks = data.currentStacks ?? 1;
    this.properties = data.properties || {};
    this.triggers = data.triggers || [];
  }

  isStackable() {
    return this.maxStacks > 1;
  }

  snapshot(): EffectSnapshot {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      tags: this.tags,
      duration: this.duration,
      startTime: this.startTime,
      maxStacks: this.maxStacks,
      stackStrategy: this.stackStrategy,
      currentStacks: this.currentStacks,
      properties: this.properties,
    };
  }

  clone() {
    return new Effect(this.snapshot());
  }

  static PhysicalVulnerable() {
    return new Effect({
      id: "PHYSICAL_VULNERABLE",
      tags: ["PHYSICAL_VULNERABLE"],
      name: "Physical Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static PhysicalKnockDown() {
    return new Effect({
      id: "PHYSICAL_KNOCK_DOWN",
      tags: ["PHYSICAL_KNOCK_DOWN"],
      name: "Physical Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static PhysicalLift() {
    return new Effect({
      id: "PHYSICAL_LIFT",
      tags: ["PHYSICAL_LIFT"],
      name: "Physical Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static PhysicalBreach() {
    return new Effect({
      id: "PHYSICAL_BREACH",
      tags: ["PHYSICAL_BREACH"],
      name: "Physical Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static PhysicalCrush() {
    return new Effect({
      id: "PHYSICAL_CRUSH",
      tags: ["PHYSICAL_CRUSH"],
      name: "Physical Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static ElementCryo() {
    return new Effect({
      id: "ELEMENT_CRYO",
      tags: ["ELEMENT_CRYO"],
      name: "Cryo Afflication",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static ElementHeat() {
    return new Effect({
      id: "ELEMENT_HEAT",
      tags: ["ELEMENT_HEAT"],
      name: "Heat Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static ElementElectric() {
    return new Effect({
      id: "ELEMENT_ELECTRIC",
      tags: ["ELEMENT_ELECTRIC"],
      name: "Electric Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static ElementNature() {
    return new Effect({
      id: "ELEMENT_NATURE",
      tags: ["ELEMENT_NATURE"],
      name: "Nature Affliction",
      duration: Number.POSITIVE_INFINITY,
      stackStrategy: "REFRESH_DURATION",
      maxStacks: 4,
    });
  }

  static ElementHeatBurst() {
    return new Effect({
      id: "ELEMENT_HEAT_BURST",
      tags: ["ELEMENT_HEAT_BURST"],
      name: "Heat Burst",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementCryoBurst() {
    return new Effect({
      id: "ELEMENT_CRYO_BURST",
      tags: ["ELEMENT_CRYO_BURST"],
      name: "Cryo Burst",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementElectricBurst() {
    return new Effect({
      id: "ELEMENT_ELECTRIC_BURST",
      tags: ["ELEMENT_ELECTRIC_BURST"],
      name: "Electric Burst",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementNatureBurst() {
    return new Effect({
      id: "ELEMENT_NATURE_BURST",
      tags: ["ELEMENT_NATURE_BURST"],
      name: "Nature Burst",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementCombustion() {
    return new Effect({
      id: "ELEMENT_COMBUSTION",
      tags: ["ELEMENT_COMBUSTION"],
      name: "Combustion",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementElectrification() {
    return new Effect({
      id: "ELEMENT_ELECTRIFICATION",
      tags: ["ELEMENT_ELECTRIFICATION"],
      name: "Electrification",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementSolidification() {
    return new Effect({
      id: "ELEMENT_SOLIDIFICATION",
      tags: ["ELEMENT_SOLIDIFICATION"],
      name: "Solidification",
      duration: Number.POSITIVE_INFINITY,
    });
  }

  static ElementCorrosion() {
    return new Effect({
      id: "ELEMENT_CORROSION",
      tags: ["ELEMENT_CORROSION"],
      name: "Corrosion",
      duration: Number.POSITIVE_INFINITY,
    });
  }
}
