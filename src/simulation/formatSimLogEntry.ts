import type { SimLogEntry } from "@/simulation/events/event.types.ts";

function withPrefix(entry: SimLogEntry, message: string) {
  return `[${entry.time.toFixed(3)}] [${entry.type}] ${message}`;
}

export function formatSimLogEntry(entry: SimLogEntry) {
  switch (entry.type) {
    case "ACTION_START":
      return withPrefix(entry, `action start ${entry.payload.skillId}`);
    case "ACTION_END":
      return withPrefix(entry, `action end ${entry.payload.skillId}`);
    case "DAMAGE_TICK":
      return withPrefix(
        entry,
        `damage ${entry.payload.damage} (stagger ${entry.payload.stagger})`,
      );
    case "STAGGER":
      return withPrefix(
        entry,
        `${entry.payload.actorId} ${
          entry.payload.actionId
        } ${entry.payload.stagger.toFixed(1)} (${entry.payload.amount.toFixed(
          1,
        )}) ${entry.payload.isBroken ? "(BROKEN)" : ""}`,
      );
    case "SP_CHANGE":
      return withPrefix(
        entry,
        `sp change ${entry.payload.change} -> ${entry.payload.sp} (${entry.payload.reason})`,
      );
    case "SP_REGEN_PAUSE":
      return withPrefix(
        entry,
        `sp regen paused for ${entry.payload.duration.toFixed(3)}s`,
      );
    case "EFFECT_START":
      return withPrefix(
        entry,
        `effect start ${entry.payload.effectSnapshot.id}`,
      );
    case "EFFECT_END":
      return withPrefix(
        entry,
        `${entry.payload.effectId} ${entry.payload.type}`,
      );
    case "REACTION_OCCURRED":
      return withPrefix(
        entry,
        `${entry.payload.actorId} ${entry.payload.reactionName}`,
      );
  }
}
