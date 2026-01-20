import { Effect } from "./types";

export const AfflictionEffectMap = {
  PHYSICAL_VULNERABLE: Effect.PhysicalVulnerable().clone(),
  PHYSICAL_KNOCK_DOWN: Effect.PhysicalKnockDown().clone(),
  PHYSICAL_LIFT: Effect.PhysicalLift().clone(),
  PHYSICAL_BREACH: Effect.PhysicalBreach().clone(),
  PHYSICAL_CRUSH: Effect.PhysicalCrush().clone(),
  ELEMENT_HEAT: Effect.ElementHeat().clone(),
  ELEMENT_CRYO: Effect.ElementCryo().clone(),
  ELEMENT_ELECTRIC: Effect.ElementElectric().clone(),
  ELEMENT_NATURE: Effect.ElementNature().clone(),
  ELEMENT_COMBUSTION: Effect.ElementCombustion().clone(),
  ELEMENT_ELECTRIFICATION: Effect.ElementElectrification().clone(),
  ELEMENT_SOLIDIFICATION: Effect.ElementSolidification().clone(),
  ELEMENT_CORROSION: Effect.ElementCorrosion().clone(),
  ELEMENT_HEAT_BURST: Effect.ElementHeatBurst().clone(),
  ELEMENT_CRYO_BURST: Effect.ElementCryoBurst().clone(),
  ELEMENT_ELECTRIC_BURST: Effect.ElementElectricBurst().clone(),
  ELEMENT_NATURE_BURST: Effect.ElementNatureBurst().clone(),
} as const;
