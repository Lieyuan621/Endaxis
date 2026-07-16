import type { EffectManager } from '@/simulation/state/EffectManager';
import {
  Effect,
  type EffectTag,
  type ElementalEffectTag,
  type PhysicalEffectTag,
} from '../effects/types';
import { assert } from '@/utils/assert';
import { AfflictionEffectMap } from '@/simulation/effects/afflictionEffectMap';

export interface ReactionResult {
  name: string;
  cancelIncoming: boolean;
  removeIds: string[];
  spawnEffects: Effect[];
  overrideIncoming?: Effect;
}

const PHYSICAL_AFFLICTIONS = [
  'PHYSICAL_KNOCK_DOWN',
  'PHYSICAL_LIFT',
  'PHYSICAL_CRUSH',
  'PHYSICAL_BREACH',
] satisfies PhysicalEffectTag[];

const ELEMENTAL_AFFLICTIONS = [
  'ELEMENT_HEAT',
  'ELEMENT_CRYO',
  'ELEMENT_ELECTRIC',
  'ELEMENT_NATURE',
] satisfies ElementalEffectTag[];

type ItemsOf<T extends readonly any[]> = T[number];

const ELEMENT_REACTION_MATRIX: Record<
  ItemsOf<typeof ELEMENTAL_AFFLICTIONS>,
  Record<ItemsOf<typeof ELEMENTAL_AFFLICTIONS>, ElementalEffectTag>
> = {
  ELEMENT_HEAT: {
    ELEMENT_HEAT: 'ELEMENT_HEAT_BURST',
    ELEMENT_CRYO: 'ELEMENT_SOLIDIFICATION',
    ELEMENT_ELECTRIC: 'ELEMENT_ELECTRIFICATION',
    ELEMENT_NATURE: 'ELEMENT_CORROSION',
  },
  ELEMENT_CRYO: {
    ELEMENT_HEAT: 'ELEMENT_COMBUSTION',
    ELEMENT_CRYO: 'ELEMENT_CRYO_BURST',
    ELEMENT_ELECTRIC: 'ELEMENT_ELECTRIFICATION',
    ELEMENT_NATURE: 'ELEMENT_CORROSION',
  },
  ELEMENT_ELECTRIC: {
    ELEMENT_HEAT: 'ELEMENT_COMBUSTION',
    ELEMENT_CRYO: 'ELEMENT_SOLIDIFICATION',
    ELEMENT_ELECTRIC: 'ELEMENT_ELECTRIC_BURST',
    ELEMENT_NATURE: 'ELEMENT_CORROSION',
  },
  ELEMENT_NATURE: {
    ELEMENT_HEAT: 'ELEMENT_COMBUSTION',
    ELEMENT_CRYO: 'ELEMENT_SOLIDIFICATION',
    ELEMENT_ELECTRIC: 'ELEMENT_ELECTRIFICATION',
    ELEMENT_NATURE: 'ELEMENT_NATURE_BURST',
  },
};

function hasPhysicalAffliction(tags: EffectTag[]): boolean {
  return PHYSICAL_AFFLICTIONS.some(tag => tags.includes(tag));
}

function hasElementalAffliction(tags: EffectTag[]): boolean {
  return ELEMENTAL_AFFLICTIONS.some(tag => tags.includes(tag));
}

function getElementalAffliction(
  tags: EffectTag[],
): ItemsOf<typeof ELEMENTAL_AFFLICTIONS> | undefined {
  const existingElements = ELEMENTAL_AFFLICTIONS.filter(tag => tags.includes(tag));
  assert(
    existingElements.length <= 1,
    `There can only be one elemental affliction, found ${existingElements.length}`,
  );

  return existingElements[0];
}

function cloneEffectWithStacks(effect: Effect, stacks: number): Effect {
  const cloned = effect.clone();
  cloned.currentStacks = Math.max(1, Number(stacks) || 1);
  return cloned;
}

export const ReactionRegistry = {
  check(target: EffectManager, incoming: Effect): ReactionResult | null {
    if (hasPhysicalAffliction(incoming.tags)) {
      const forced = incoming.properties?.forced === true;
      const vulnerables = target.getByTag('PHYSICAL_VULNERABLE') || [];

      assert(vulnerables.length <= 1, 'Multiple vulnerable effects found');

      if (vulnerables.length === 0) {
        if (
          forced &&
          (incoming.tags.includes('PHYSICAL_LIFT') || incoming.tags.includes('PHYSICAL_KNOCK_DOWN'))
        ) {
          return {
            name: 'Physical Reaction',
            cancelIncoming: false,
            removeIds: [],
            spawnEffects: [
              cloneEffectWithStacks(Effect.PhysicalVulnerable(), incoming.currentStacks),
            ],
          };
        }

        return {
          name: 'Physical Reaction',
          cancelIncoming: true,
          removeIds: [],
          spawnEffects: [
            cloneEffectWithStacks(Effect.PhysicalVulnerable(), incoming.currentStacks),
          ],
        };
      }

      const vulnerableEffectInstance = vulnerables[0]!;
      const consumedStacks = vulnerableEffectInstance.effect.currentStacks;

      if (incoming.tags.includes('PHYSICAL_CRUSH')) {
        return {
          name: 'Physical Crush',
          cancelIncoming: false,
          removeIds: [vulnerableEffectInstance.id],
          spawnEffects: [],
          overrideIncoming: cloneEffectWithStacks(incoming, consumedStacks),
        };
      }

      if (incoming.tags.includes('PHYSICAL_BREACH')) {
        return {
          name: 'Physical Breach',
          cancelIncoming: false,
          removeIds: [vulnerableEffectInstance.id],
          spawnEffects: [],
          overrideIncoming: cloneEffectWithStacks(incoming, consumedStacks),
        };
      }

      if (incoming.tags.includes('PHYSICAL_LIFT')) {
        return {
          name: 'Physical Lift',
          cancelIncoming: false,
          removeIds: [],
          spawnEffects: [
            cloneEffectWithStacks(Effect.PhysicalVulnerable(), incoming.currentStacks),
          ],
        };
      }

      if (incoming.tags.includes('PHYSICAL_KNOCK_DOWN')) {
        return {
          name: 'Physical Knock Down',
          cancelIncoming: false,
          removeIds: [],
          spawnEffects: [
            cloneEffectWithStacks(Effect.PhysicalVulnerable(), incoming.currentStacks),
          ],
        };
      }
    }

    if (hasElementalAffliction(incoming.tags)) {
      const existingAffliction = getElementalAffliction(target.getAllTags());
      const incomingAffliction = getElementalAffliction(incoming.tags)!;

      if (!existingAffliction) {
        return null;
      }

      const existingEffect = target.getByTag(existingAffliction)[0]!;
      const reaction = ELEMENT_REACTION_MATRIX[existingAffliction][incomingAffliction];

      if (reaction.includes('BURST')) {
        return {
          name: `Arts Burst ${existingAffliction.replace('ELEMENT_', '')}`,
          cancelIncoming: false,
          removeIds: [],
          spawnEffects: [AfflictionEffectMap[reaction]],
        };
      }

      return {
        name: `Arts Reaction ${existingAffliction.replace('ELEMENT_', '')}`,
        cancelIncoming: true,
        removeIds: [existingEffect.id],
        spawnEffects: [
          cloneEffectWithStacks(AfflictionEffectMap[reaction], existingEffect.effect.currentStacks),
        ],
      };
    }

    return null;
  },
};
