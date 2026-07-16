import { describe, it, expect } from 'vitest';
import { ReactionRegistry } from './reactions';
import { Effect, type EffectTag } from '../effects/types';
import { EffectManager } from '@/simulation/state/EffectManager';

describe('ReactionRegistry', () => {
  it('returns null when no reaction exists', () => {
    const effectManager = new EffectManager();
    const incomingEffect = new Effect({
      id: 'NOTHING',
      tags: ['NOTHING' as EffectTag],
    });

    const result = ReactionRegistry.check(effectManager, incomingEffect);

    expect(result).toBeNull();
  });

  describe('arts reactions', () => {
    it.each(['ELEMENT_HEAT', 'ELEMENT_CRYO', 'ELEMENT_ELECTRIC', 'ELEMENT_NATURE'])(
      'applies attachment directly when no existing attachment is present: %s',
      incoming => {
        const effectManager = new EffectManager();
        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).toBeNull();
      },
    );

    it.each([
      ['ELEMENT_HEAT', 'ELEMENT_HEAT', 'ELEMENT_HEAT_BURST'],
      ['ELEMENT_CRYO', 'ELEMENT_CRYO', 'ELEMENT_CRYO_BURST'],
      ['ELEMENT_ELECTRIC', 'ELEMENT_ELECTRIC', 'ELEMENT_ELECTRIC_BURST'],
      ['ELEMENT_NATURE', 'ELEMENT_NATURE', 'ELEMENT_NATURE_BURST'],
    ])(
      'creates burst without consuming the original attachment: %s + %s -> %s',
      (existing, incoming, expected) => {
        const effectManager = new EffectManager();
        effectManager.add(
          new Effect({
            id: existing,
            tags: [existing as EffectTag],
          }),
        );

        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        expect(result!.removeIds).toHaveLength(0);
        expect(result!.spawnEffects).toHaveLength(1);
        expect(result!.spawnEffects[0]?.tags).toContain(expected as EffectTag);
      },
    );

    it.each([
      ['ELEMENT_CRYO', 'ELEMENT_HEAT', 'ELEMENT_COMBUSTION'],
      ['ELEMENT_ELECTRIC', 'ELEMENT_HEAT', 'ELEMENT_COMBUSTION'],
      ['ELEMENT_NATURE', 'ELEMENT_HEAT', 'ELEMENT_COMBUSTION'],
      ['ELEMENT_CRYO', 'ELEMENT_ELECTRIC', 'ELEMENT_ELECTRIFICATION'],
      ['ELEMENT_NATURE', 'ELEMENT_ELECTRIC', 'ELEMENT_ELECTRIFICATION'],
      ['ELEMENT_HEAT', 'ELEMENT_ELECTRIC', 'ELEMENT_ELECTRIFICATION'],
      ['ELEMENT_CRYO', 'ELEMENT_NATURE', 'ELEMENT_CORROSION'],
      ['ELEMENT_HEAT', 'ELEMENT_NATURE', 'ELEMENT_CORROSION'],
      ['ELEMENT_ELECTRIC', 'ELEMENT_NATURE', 'ELEMENT_CORROSION'],
      ['ELEMENT_HEAT', 'ELEMENT_CRYO', 'ELEMENT_SOLIDIFICATION'],
      ['ELEMENT_ELECTRIC', 'ELEMENT_CRYO', 'ELEMENT_SOLIDIFICATION'],
      ['ELEMENT_NATURE', 'ELEMENT_CRYO', 'ELEMENT_SOLIDIFICATION'],
    ])(
      'creates anomaly and consumes the existing attachment: %s + %s -> %s',
      (existing, incoming, expected) => {
        const effectManager = new EffectManager();
        effectManager.add(
          new Effect({
            id: existing,
            tags: [existing as EffectTag],
          }),
        );

        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        expect(result?.removeIds).toHaveLength(1);
        expect(result?.spawnEffects).toHaveLength(1);
        expect(result?.spawnEffects[0]?.tags).toContain(expected as EffectTag);
      },
    );

    it('inherits consumed attachment stacks when spawning an anomaly', () => {
      const effectManager = new EffectManager();
      effectManager.add(
        new Effect({
          id: 'ELEMENT_CRYO',
          tags: ['ELEMENT_CRYO'],
          currentStacks: 3,
        }),
      );

      const incomingEffect = new Effect({
        id: 'ELEMENT_HEAT',
        tags: ['ELEMENT_HEAT'],
      });

      const result = ReactionRegistry.check(effectManager, incomingEffect);

      expect(result).not.toBeNull();
      expect(result?.cancelIncoming).toBe(true);
      expect(result?.spawnEffects[0]?.tags).toContain('ELEMENT_COMBUSTION');
      expect(result?.spawnEffects[0]?.currentStacks).toBe(3);
    });
  });

  describe('physical reactions', () => {
    it.each(['PHYSICAL_KNOCK_DOWN', 'PHYSICAL_LIFT', 'PHYSICAL_BREACH', 'PHYSICAL_CRUSH'])(
      'creates vulnerable when no vulnerable stack exists: %s',
      incoming => {
        const effectManager = new EffectManager();
        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        expect(result?.removeIds).toHaveLength(0);
        expect(result?.spawnEffects).toHaveLength(1);
        expect(result?.spawnEffects[0]?.tags).toContain('PHYSICAL_VULNERABLE');
      },
    );

    it('inherits incoming stacks when physical affliction first creates vulnerable', () => {
      const effectManager = new EffectManager();
      const incomingEffect = new Effect({
        id: 'PHYSICAL_KNOCK_DOWN',
        tags: ['PHYSICAL_KNOCK_DOWN'],
        currentStacks: 2,
      });

      const result = ReactionRegistry.check(effectManager, incomingEffect);

      expect(result).not.toBeNull();
      expect(result?.spawnEffects[0]?.tags).toContain('PHYSICAL_VULNERABLE');
      expect(result?.spawnEffects[0]?.currentStacks).toBe(2);
    });

    it.each(['PHYSICAL_KNOCK_DOWN', 'PHYSICAL_LIFT'])(
      'adds vulnerable stacks from the incoming control effect: %s',
      incoming => {
        const effectManager = new EffectManager();
        effectManager.add(
          new Effect({
            id: 'PHYSICAL_VULNERABLE',
            tags: ['PHYSICAL_VULNERABLE'],
            currentStacks: 1,
          }),
        );

        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
          currentStacks: 2,
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        expect(result?.removeIds).toHaveLength(0);
        expect(result?.spawnEffects).toHaveLength(1);
        expect(result?.spawnEffects[0]?.tags).toContain('PHYSICAL_VULNERABLE');
        expect(result?.spawnEffects[0]?.currentStacks).toBe(2);
      },
    );

    it.each(['PHYSICAL_BREACH', 'PHYSICAL_CRUSH'])(
      'inherits consumed vulnerable stacks when converting to the reaction result: %s',
      incoming => {
        const effectManager = new EffectManager();
        effectManager.add(
          new Effect({
            id: 'PHYSICAL_VULNERABLE',
            tags: ['PHYSICAL_VULNERABLE'],
            currentStacks: 2,
          }),
        );

        const incomingEffect = new Effect({
          id: incoming,
          tags: [incoming as EffectTag],
        });

        const result = ReactionRegistry.check(effectManager, incomingEffect);

        expect(result).not.toBeNull();
        expect(result?.removeIds).toHaveLength(1);
        expect(result?.removeIds).toContain('PHYSICAL_VULNERABLE_0');
        expect(result?.cancelIncoming).toBe(false);
        expect(result?.spawnEffects).toHaveLength(0);
        expect(result?.overrideIncoming?.tags).toContain(incoming as EffectTag);
        expect(result?.overrideIncoming?.currentStacks).toBe(2);
      },
    );
  });
});
