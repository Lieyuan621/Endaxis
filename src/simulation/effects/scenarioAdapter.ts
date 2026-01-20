import type { EffectTag } from "./types";

export const SCNEARIO_EFFECT_TYPE_MAP = {
  armor_break: "PHYSICAL_BREACH",
  stagger: "PHYSICAL_CRUSH",
  knockdown: "PHYSICAL_KNOCK_DOWN",
  knockup: "PHYSICAL_LIFT",
  blaze_attach: "ELEMENT_HEAT",
  emag_attach: "ELEMENT_ELECTRIC",
  cold_attach: "ELEMENT_CRYO",
  nature_attach: "ELEMENT_NATURE",
} satisfies Record<string, EffectTag>;
