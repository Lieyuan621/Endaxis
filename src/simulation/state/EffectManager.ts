import { Effect } from '../effects/types';
import type { EffectTag } from '../effects/types';
import { passesSkillFilter } from '@/data/filter';
import type { ConsumedStatEffect } from '@/simulation/compiler/types';

export type EffectInstanceContext = {
  targetId: string;
  actorId?: string;
  actionId?: string;
};

export type EffectInstance = {
  id: string;
  effect: Effect;
} & EffectInstanceContext;

type OneTimeEntry = ConsumedStatEffect & {
  id: string;
  stacks: number;
  maxStacks: number;
  skillTypes?: string | string[];
  skillId?: string | string[];
};

export class EffectManager {
  private counter = 0;
  private effectInstances: Map<string, EffectInstance> = new Map();
  private tagCounts: Map<EffectTag, number> = new Map();
  private oneTimeEffects: Map<string, OneTimeEntry> = new Map();

  constructor() {}

  add(effect: Effect, context: Partial<EffectInstanceContext> = {}): EffectInstance {
    if (effect.stackStrategy === 'REPLACE') {
      this.removeByEffectId(effect.id);
      return this.createInstance(effect, context);
    }

    if (effect.stackStrategy === 'INDEPENDENT') {
      const created = this.createInstance(effect, context);
      this.trimIndependentStacks(effect.id, effect.maxStacks);
      return this.effectInstances.get(created.id) || created;
    }

    const existing = this.getByEffectId(effect.id);

    // Same-id stacking.
    if (existing && existing.effect.isStackable()) {
      this.handleStacking(existing, effect, context);
      return existing;
    }

    return this.createInstance(effect, context);
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
    return tags.filter(tag => this.tagCounts.get(tag)! > 0);
  }

  applyOneTime(effect: any): number {
    if (!effect?.stat) return 0;
    const id = String(effect.id || `oneTime_${this.counter++}`);
    const stacks = Math.max(1, Number(effect.currentStacks ?? effect.stacks) || 1);
    const maxStacks = Math.max(1, Number(effect.maxStacks) || 1);
    const value = Number(effect.value ?? effect.properties?.value) || 0;
    const existing = this.oneTimeEffects.get(id);
    const nextStacks = Math.min(maxStacks, (existing?.stacks || 0) + stacks);
    this.oneTimeEffects.set(id, {
      id,
      stat: effect.stat,
      value,
      stacks: nextStacks,
      maxStacks,
      skillTypes: effect.skillTypes,
      skillId: effect.skillId,
    });
    return nextStacks;
  }

  consumeOneTime(type: string | undefined, skillId: string | undefined) {
    const consumed: (ConsumedStatEffect & { id: string })[] = [];
    for (const [key, entry] of this.oneTimeEffects) {
      if (entry.skillTypes && (!type || !passesSkillFilter(entry.skillTypes, type))) continue;
      if (entry.skillId && (!skillId || !passesSkillFilter(entry.skillId, skillId))) continue;
      consumed.push({
        id: key,
        stat: entry.stat,
        value: entry.value * entry.stacks,
      });
      this.oneTimeEffects.delete(key);
    }
    return consumed;
  }

  private handleStacking(
    existing: EffectInstance,
    incoming: Effect,
    context: Partial<EffectInstanceContext>,
  ): Effect {
    const effect = existing.effect;

    if (!effect.currentStacks) {
      effect.currentStacks = Math.min(effect.maxStacks, incoming.currentStacks);
    }

    if (effect.currentStacks < effect.maxStacks) {
      effect.currentStacks = Math.min(
        effect.maxStacks,
        effect.currentStacks + incoming.currentStacks,
      );
    }

    if (effect.stackStrategy === 'REFRESH_DURATION') {
      effect.startTime = incoming.startTime;
      existing.targetId = context.targetId || existing.targetId;
      existing.actorId = context.actorId;
      existing.actionId = context.actionId;
    }

    return effect;
  }

  private createInstance(effect: Effect, context: Partial<EffectInstanceContext>): EffectInstance {
    const instanceId = `${effect.id}_${this.counter++}`;
    const instance: EffectInstance = {
      id: instanceId,
      effect,
      targetId: context.targetId || '',
      actorId: context.actorId,
      actionId: context.actionId,
    };

    this.effectInstances.set(instanceId, instance);
    this.updateTags(effect, 1);

    return instance;
  }

  private getByEffectId(id: string): EffectInstance | undefined {
    return this.effectInstances.values().find(instance => instance.effect.id === id);
  }

  private getByMatchingEffectId(id: string): EffectInstance[] {
    return Array.from(this.effectInstances.values()).filter(instance => instance.effect.id === id);
  }

  private removeByEffectId(id: string) {
    this.getByMatchingEffectId(id).forEach(instance => {
      this.remove(instance.id);
    });
  }

  private trimIndependentStacks(id: string, maxStacks: number) {
    const instances = this.getByMatchingEffectId(id).sort((left, right) => {
      const timeDelta =
        (Number(left.effect.startTime) || 0) - (Number(right.effect.startTime) || 0);
      if (timeDelta !== 0) return timeDelta;
      return left.id.localeCompare(right.id);
    });
    const cap = Math.max(1, Number(maxStacks) || 1);
    let totalStacks = instances.reduce(
      (sum, instance) => sum + Math.max(0, Number(instance.effect.currentStacks) || 0),
      0,
    );

    for (const instance of instances) {
      if (totalStacks <= cap) break;
      const currentStacks = Math.max(0, Number(instance.effect.currentStacks) || 0);
      if (currentStacks <= 0) {
        this.remove(instance.id);
        continue;
      }

      const overflow = totalStacks - cap;
      if (currentStacks <= overflow) {
        totalStacks -= currentStacks;
        this.remove(instance.id);
        continue;
      }

      instance.effect.currentStacks = currentStacks - overflow;
      totalStacks = cap;
    }
  }

  private updateTags(effect: Effect, delta: number) {
    effect.tags.forEach(tag => {
      const current = this.tagCounts.get(tag) || 0;
      this.tagCounts.set(tag, Math.max(0, current + delta));
    });
  }
}
