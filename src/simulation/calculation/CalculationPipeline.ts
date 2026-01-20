import type { CalculationResult, StaggerContext } from "./type";

export type ModifierFn<TContext> = (
  ctx: TContext,
  receipt: CalculationResult,
) => void;

export class CalculationPipeline<TContext> {
  private modifiers: ModifierFn<TContext>[] = [];

  public add(mod: ModifierFn<TContext>) {
    this.modifiers.push(mod);
  }

  public execute(ctx: TContext, initialBase: number): CalculationResult {
    const result: CalculationResult = {
      baseValue: initialBase,
      finalValue: initialBase,
      breakdown: [
        {
          source: "Base Value",
          type: "BASE",
          value: initialBase,
          contribution: initialBase,
        },
      ],
    };

    for (const mod of this.modifiers) {
      mod(ctx, result);
    }

    result.finalValue = Math.round(result.finalValue * 1000) / 1000;
    return result;
  }
}

export const OriginiumArtsModifier: ModifierFn<StaggerContext> = (
  ctx,
  result,
) => {
  const hasKnock =
    ctx.target.effects.hasTag("PHYSICAL_LIFT") ||
    ctx.target.effects.hasTag("PHYSICAL_KNOCK_DOWN");

  if (!hasKnock) return;

  const artsPower = ctx.source.stats.originium_arts_power || 0;
  if (artsPower <= 0) return;

  const factor = 0.005;
  const multiplier = 1 + artsPower * factor;

  const previousValue = result.finalValue;
  const newValue = previousValue * multiplier;
  const contribution = newValue - previousValue;

  result.finalValue = newValue;

  result.breakdown.push({
    source: "Knock Bonus",
    type: "MULTIPLIER",
    value: multiplier,
    contribution: contribution,
  });
};
