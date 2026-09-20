import { describe, expect, it } from 'vitest';
import type {
  OperatorDefinition,
  SkillDefinition,
  SkillGroupDefinition,
} from '../game-data/operatorDefinition';
import type { SkillCastDocument } from '../project/schema';
import { resolveEffectiveSkillDefinition } from './resolveSkillDefinition';

const catalogSkill: SkillDefinition = {
  key: 'battleSkill',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  timelineBlockFrames: 45,
  scheduledSequences: [],
};
const customSkill: SkillDefinition = {
  key: 'battleSkill',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  timelineBlockFrames: 60,
  availability: { kind: 'combatActive' },
  costs: [{ resource: 'sp', value: [80, 90, 100, 110, 120, 125, 130, 135, 140, 145, 150, 155] }],
  costFrame: 0,
  scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
};

const skillGroup: SkillGroupDefinition = {
  key: 'battleSkill',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  skills: catalogSkill,
};

const operator: OperatorDefinition = {
  slug: 'test',
  gameId: 'test',
  rarity: 5,
  weaponType: 'sword',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'strength',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    agility: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    intellect: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    will: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    baseAttack: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250],
    baseHealth: [
      1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400,
      2500,
    ],
  },
  skillGroups: [skillGroup],
  talents: [],
  potentials: [],
};

function createCast(overrides: Partial<SkillCastDocument> = {}): SkillCastDocument {
  return {
    id: 'cast:1',
    source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'battleSkill' },
    placement: { startFrame: 60 },
    ...overrides,
  } as SkillCastDocument;
}

describe('resolveEffectiveSkillDefinition', () => {
  it('returns catalog definition for an unedited cast', () => {
    const resolved = resolveEffectiveSkillDefinition(createCast(), operator);

    expect(resolved.definition).toBe(catalogSkill);
    expect(resolved.group).toBe(skillGroup);
    expect(resolved.group.skillType).toBe('battleSkill');
  });

  it('resolves a legacy skill identity through a canonical catalog alias', () => {
    const resolved = resolveEffectiveSkillDefinition(
      createCast({
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkillFemale',
          skillKey: 'battleSkillFemale',
        },
      }),
      {
        ...operator,
        skillAliases: [
          {
            from: ['battleSkillFemale', 'battleSkillFemale'],
            to: ['battleSkill', 'battleSkill'],
          },
        ],
      },
    );

    expect(resolved.definition).toBe(catalogSkill);
    expect(resolved.group).toBe(skillGroup);
  });

  it('resolves a named group variant with its own level source', () => {
    const enhanced: SkillDefinition = {
      key: 'enhancedBattleSkill',
      skillType: 'battleSkill',
      levelSource: 'ultimate',
      timelineBlockFrames: 30,
      scheduledSequences: [],
    };
    const groupWithVariant: SkillGroupDefinition = {
      ...skillGroup,
      variants: [{ key: 'enhanced', levelSource: 'ultimate', skills: enhanced }],
    };
    const resolved = resolveEffectiveSkillDefinition(
      createCast({
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: 'enhancedBattleSkill',
        },
      }),
      { ...operator, skillGroups: [groupWithVariant] },
    );

    expect(resolved.definition).toBe(enhanced);
    expect(resolved.variantKey).toBe('enhanced');
    expect(resolved.levelSource).toBe('ultimate');
  });

  it('resolves explicitly placed same-slot and routed replacement skills', () => {
    const replacement = { ...catalogSkill, key: 'battleSkillDuringUltimate' };
    const routed = {
      ...catalogSkill,
      key: 'comboWrapper',
      skillType: 'comboSkill' as const,
      levelSource: 'comboSkill' as const,
    };
    const group: SkillGroupDefinition = {
      ...skillGroup,
      replacementSkills: [replacement],
      routedReplacementSkills: [
        {
          skill: routed,
          skillType: 'comboSkill',
          levelSource: 'comboSkill',
          executionSkillGroupKey: 'comboSkill',
          executionSkillKey: 'comboSkill',
        },
      ],
    };
    const withReplacements = { ...operator, skillGroups: [group] };

    const sameSlot = resolveEffectiveSkillDefinition(
      createCast({
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: replacement.key,
        },
      }),
      withReplacements,
    );
    const routedSlot = resolveEffectiveSkillDefinition(
      createCast({
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'battleSkill',
          skillKey: routed.key,
        },
      }),
      withReplacements,
    );

    expect(sameSlot.definition).toBe(replacement);
    expect(sameSlot.levelSource).toBe('battleSkill');
    expect(routedSlot.definition).toBe(routed);
    expect(routedSlot.levelSource).toBe('comboSkill');
  });

  it('rejects an internal replacement as a player timeline input', () => {
    const internal = { ...catalogSkill, key: 'internalEnd' };
    const group: SkillGroupDefinition = {
      ...skillGroup,
      replacementSkills: [internal],
      replacementSkillPlacements: { internalEnd: 'internal' },
    };

    expect(() =>
      resolveEffectiveSkillDefinition(
        createCast({
          source: {
            kind: 'operatorSkill',
            skillGroupKey: 'battleSkill',
            skillKey: internal.key,
          },
        }),
        { ...operator, skillGroups: [group] },
      ),
    ).toThrow("skill 'test/battleSkill/internalEnd' is internal");
  });

  it('returns custom definition when present', () => {
    const resolved = resolveEffectiveSkillDefinition(
      createCast({ customDefinition: { ...customSkill, levelSource: 'ultimate' } }),
      operator,
    );

    expect(resolved.definition).toMatchObject({ key: customSkill.key, levelSource: 'ultimate' });
    expect(resolved.definition.timelineBlockFrames).toBe(60);
    expect(resolved.levelSource).toBe('ultimate');
  });

  it('rejects duplicate skill keys across the same group definition tree', () => {
    expect(() =>
      resolveEffectiveSkillDefinition(createCast(), {
        ...operator,
        skillGroups: [
          {
            ...skillGroup,
            replacementSkills: [{ ...catalogSkill }],
          },
        ],
      }),
    ).toThrow("skill group 'test/battleSkill' has multiple skills 'battleSkill'");
  });

  it('rejects custom definition whose key does not match source', () => {
    expect(() =>
      resolveEffectiveSkillDefinition(
        createCast({ customDefinition: { ...customSkill, key: 'wrongKey' } }),
        operator,
      ),
    ).toThrow('does not match source skill key');
  });

  it('rejects unknown skill group in source', () => {
    expect(() =>
      resolveEffectiveSkillDefinition(
        createCast({
          source: { kind: 'operatorSkill', skillGroupKey: 'missing', skillKey: 'battleSkill' },
        }),
        operator,
      ),
    ).toThrow("has no skill group 'missing'");
  });

  it('rejects unknown skill key in catalog', () => {
    expect(() =>
      resolveEffectiveSkillDefinition(
        createCast({
          source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'missing' },
        }),
        operator,
      ),
    ).toThrow("has no skill 'missing'");
  });

  it('rejects unsupported source kind', () => {
    expect(() =>
      resolveEffectiveSkillDefinition(
        createCast({ source: { kind: 'custom', actionType: 'shout', name: 'Test' } }),
        operator,
      ),
    ).toThrow('unsupported source kind');
  });
});
