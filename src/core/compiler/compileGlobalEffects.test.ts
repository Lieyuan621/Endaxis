import { validateGlobalConfig } from '../project/scenarioValidation';
import { validateGlobalEffectDefinition } from '../game-data/validateGlobalEffectDefinition';
import { describe, expect, it } from 'vitest';
import { createGameDataRepository } from '../../data/createGameDataRepository';
import { GLOBAL_EFFECT_PRESETS } from '../../data/globalEffectPresets';
import type { GlobalEffectDefinition } from '../game-data/globalEffectDefinition';
import { compileGlobalEffects } from './compileGlobalEffects';

const emptyRepository = createGameDataRepository({ revision: 'test' });

function effectWithBuff(id: string, value: number): GlobalEffectDefinition {
  return {
    id,

    buff: {
      actionGraph: { main: { nodes: {} }, macros: {} },
      stackingType: 'unlimited',
      attributeModifiers: [{ attribute: 'criticalRate', slot: 'baseAddition', value }],
    },
  };
}

describe('compileGlobalEffects', () => {
  it('validates modifier values when assembling a repository, including disabled effects', () => {
    expect(() =>
      createGameDataRepository({
        revision: 'test',
        globalEffects: [
          {
            id: 'invalid',
            buff: {
              stackingType: 'unlimited',
              attributeModifiers: [{ attribute: 'criticalRate', slot: 'baseAddition', value: NaN }],
            },
          },
        ],
      }),
    ).toThrow(/attributeModifiers/);
    const repository = createGameDataRepository({
      revision: 'test',
      globalEffects: [{ id: 'static', buff: { stackingType: 'unlimited' } }],
    });
    expect(repository.getGlobalEffect('static')?.buff).toEqual({ stackingType: 'unlimited' });
  });
  it('rejects tree programs, missing graph entries and invalid action parameters at the save boundary', () => {
    const buff = {
      stackingType: 'unlimited',
      lifecycleSequences: { start: { $sequence: 'set' } },
      actionGraph: {
        main: {
          nodes: {
            set: {
              action: {
                kind: 'modifyActionValue',
                parameters: {
                  key: 'count',
                  operation: 'assign',
                  value: { kind: 'constant', value: 1 },
                },
              },
              next: null,
            },
          },
        },
        macros: {},
      },
    };
    const validate = (buffDefinition: unknown) => {
      const issues: { path: string; message: string }[] = [];
      validateGlobalEffectDefinition(
        { id: 'project:globalEffect:test', buff: buffDefinition },
        '$.definition',
        issues,
      );
      return issues;
    };
    expect(validate(buff)).toEqual([]);
    expect(validate({ ...buff, lifecycleSequences: { start: { steps: [] } } })).not.toEqual([]);
    expect(
      validate({ ...buff, lifecycleSequences: { start: { $sequence: 'missing' } } }).some(issue =>
        issue.message.includes('missing'),
      ),
    ).toBe(true);
    expect(
      validate({
        ...buff,
        actionGraph: {
          main: { nodes: { invalid: { action: { kind: 'unknown' }, next: null } } },
          macros: {},
        },
      }),
    ).not.toEqual([]);
    // 纯数值 Buff 无需动作图；存在行为入口时仍必须提供图。
    expect(validate({ stackingType: 'unlimited' })).toEqual([]);
    expect(
      validate({
        stackingType: 'unlimited',
        lifecycleSequences: { enable: { $sequence: 'missing' } },
      }),
    ).not.toEqual([]);
  });

  it('does not create an initialization action for empty configuration', () => {
    expect(compileGlobalEffects({}, emptyRepository)).toEqual({
      buffDefinitions: {},
      sources: [],
      contributions: [],
    });
  });

  it('initializes and registers only enabled effects', () => {
    const repository = createGameDataRepository({
      revision: 'test',
      globalEffects: [
        ...GLOBAL_EFFECT_PRESETS,
        effectWithBuff('project:globalEffect:first', 0.1),
        effectWithBuff('project:globalEffect:second', 0.2),
      ],
    });
    const config = {
      effects: [
        { effectId: 'combo-cdr-50', enabled: true },
        { effectId: 'project:globalEffect:first', enabled: true },
        { effectId: 'project:globalEffect:second', enabled: false },
      ],
    };
    const issues: { path: string; message: string }[] = [];
    validateGlobalConfig(config, 'globalConfig', issues);
    expect(issues).toEqual([]);
    const compiled = compileGlobalEffects(config, repository);
    expect(Object.keys(compiled.buffDefinitions!)).not.toContain(
      'scenario:effect:project:globalEffect:second',
    );
    expect(compiled.contributions.map(entry => entry.selectionId)).toEqual([
      'scenario:effect:combo-cdr-50',
      'scenario:effect:project:globalEffect:first',
    ]);
    const duplicateIssues: { path: string; message: string }[] = [];
    validateGlobalConfig(
      {
        effects: [
          { effectId: 'combo-cdr-50', enabled: true },
          { effectId: 'combo-cdr-50', enabled: false },
        ],
      },
      'globalConfig',
      duplicateIssues,
    );
    expect(duplicateIssues).not.toEqual([]);
  });

  it('fails explicitly for missing, duplicate or colliding effect references', () => {
    const repository = createGameDataRepository({
      revision: 'test',
      globalEffects: [effectWithBuff('project:globalEffect:first', 0.1)],
    });
    expect(() =>
      compileGlobalEffects({ effects: [{ effectId: 'missing', enabled: true }] }, repository),
    ).toThrow("unknown global effect 'missing'");
    expect(() =>
      compileGlobalEffects(
        {
          effects: [
            { effectId: 'project:globalEffect:first', enabled: true },
            { effectId: 'project:globalEffect:first', enabled: false },
          ],
        },
        repository,
      ),
    ).toThrow("duplicate global effect reference 'project:globalEffect:first'");
    expect(() =>
      createGameDataRepository({
        revision: 'test',
        globalEffects: [
          effectWithBuff('project:globalEffect:first', 0.1),
          effectWithBuff('project:globalEffect:first', 0.2),
        ],
      }),
    ).toThrow("duplicate global effect definition 'project:globalEffect:first'");
  });
});
