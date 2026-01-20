import { Effect } from "../effects/types";
import type { EffectTag } from "../effects/types";

export type EffectInstance = {
  id: string;
  effect: Effect;
};

export class EffectManager {
  private counter = 0;
  private effectInstances: Map<string, EffectInstance> = new Map();
  private tagCounts: Map<EffectTag, number> = new Map();

  constructor() {}

  add(effect: Effect): EffectInstance {
    const existing = this.getByEffectId(effect.id);

    // 同id堆叠
    if (existing && existing.effect.isStackable()) {
      return {
        id: existing.id,
        effect: this.handleStacking(existing.effect, effect),
      };
    }

    const instanceId = `${effect.id}_${this.counter++}`;

    this.effectInstances.set(instanceId, { id: instanceId, effect });
    this.updateTags(effect, 1);

    return {
      id: instanceId,
      effect,
    };
  }

  remove(instanceId: string): EffectInstance | undefined {
    const instance = this.effectInstances.get(instanceId);
    if (instance) {
      this.effectInstances.delete(instanceId);
      this.updateTags(instance.effect, -1);
    }
    return instance;
  }

  hasTag(tag: EffectTag): boolean {
    return (this.tagCounts.get(tag) || 0) > 0;
  }

  getByTag(tag: EffectTag): EffectInstance[] {
    const results: EffectInstance[] = [];
    for (const instance of this.effectInstances.values()) {
      if (instance.effect.tags.includes(tag)) results.push(instance);
    }
    return results;
  }

  getAll(): EffectInstance[] {
    return Array.from(this.effectInstances.values());
  }

  getAllTags(): EffectTag[] {
    const tags = Array.from(this.tagCounts.keys());
    return tags.filter((tag) => this.tagCounts.get(tag)! > 0);
  }

  private handleStacking(existing: Effect, incoming: Effect): Effect {
    if (!existing.currentStacks) {
      existing.currentStacks = Math.min(
        existing.maxStacks,
        incoming.currentStacks,
      );
    }

    if (existing.currentStacks < existing.maxStacks) {
      existing.currentStacks = Math.min(
        existing.maxStacks,
        existing.currentStacks + incoming.currentStacks,
      );
    }

    if (existing.stackStrategy === "REFRESH_DURATION") {
      existing.startTime = incoming.startTime;
    }

    return existing;
  }

  private getByEffectId(id: string): EffectInstance | undefined {
    return this.effectInstances
      .values()
      .find((instance) => instance.effect.id === id);
  }

  private updateTags(effect: Effect, delta: number) {
    effect.tags.forEach((tag) => {
      const current = this.tagCounts.get(tag) || 0;
      this.tagCounts.set(tag, Math.max(0, current + delta));
    });
  }
}
