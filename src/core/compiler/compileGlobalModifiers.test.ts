import { validateGlobalConfig } from '../project/scenarioValidation';
import { describe, expect, it } from 'vitest';
import { compileGlobalModifiers } from './compileGlobalModifiers';

describe('compileGlobalModifiers', () => {
  it('does not create an initialization action for empty configuration', () => {
    expect(compileGlobalModifiers({ modifiers: [] })).toEqual({
      buffDefinitions: {},
      initializationPrograms: [],
    });
  });

  it('retains disabled custom definitions but initializes only enabled selections', () => {
    const config = {
      modifiers: [],
      enabledPresetIds: ['combo-cdr-50'],
      customBuffs: [true, false].map((enabled, index) => ({
        id: `scenario:custom-global:${index}`,
        name: 'Custom',
        enabled,
        definition: {
          stackingType: 'unlimited' as const,
          attributeModifiers: [
            { attribute: 'criticalRate' as const, slot: 'baseAddition' as const, value: 0.1 },
          ],
        },
      })),
    };
    const issues: { path: string; message: string }[] = [];
    validateGlobalConfig(config, 'globalConfig', issues);
    expect(issues).toEqual([]);
    const compiled = compileGlobalModifiers(config);
    expect(Object.keys(compiled.buffDefinitions)).toContain('scenario:custom-global:1');
    expect(compiled.initializationPrograms.map(program => program.key)).toEqual([
      'scenario:global-attribute-modifiers',
      'scenario:custom-global:0',
    ]);
    validateGlobalConfig({ ...config, enabledPresetIds: ['unknown'] }, 'globalConfig', issues);
    expect(issues).not.toEqual([]);
  });

  it('rejects unsupported scopes and non-finite values before creating a combat session', () => {
    expect(() =>
      compileGlobalModifiers({
        modifiers: [
          {
            id: 'bad',
            kind: 'operatorStat',
            modifier: 'criticalRate',
            value: 0.1,
            skillType: 'comboSkill',
          },
        ],
      }),
    ).toThrow('does not support a skill-type scope');
    expect(() =>
      compileGlobalModifiers({
        modifiers: [
          {
            id: 'bad',
            kind: 'operatorStat',
            modifier: 'attackPercent',
            value: NaN,
          },
        ],
      }),
    ).toThrow('must be finite');
    for (const [skillType, value] of [
      ['battleSkill', 0.2],
      ['comboSkill', 1],
    ] as const) {
      expect(() =>
        compileGlobalModifiers({
          modifiers: [
            {
              id: 'bad',
              kind: 'operatorStat',
              modifier: 'skillCooldownReduction',
              value,
              skillType,
            },
          ],
        }),
      ).toThrow('requires comboSkill and a value less than 1');
    }
  });
});
