import { describe, it, expect } from 'vitest';
import { scenario } from './fixture/scenario-2';
import { compileScenario, normalizeScenario } from './compileScenario';

describe('normalizeScenario', () => {
  it('should normalize a scenario', () => {
    const result = normalizeScenario(scenario);
    const skillAction = result.actions.find(action => action.node.type === 'battleSkill');

    expect(result).toBeDefined();
    expect(result.tracks).toBeDefined();
    expect(skillAction?.node.gaugeGain).toBe(6.5);
    expect(skillAction?.node.teamGaugeGain).toBe(6.5);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.every(action => Array.isArray(action.node.hits))).toBe(true);
    expect(result.actions.some(action => action.node.type === 'comboSkill')).toBe(true);
    expect(
      result.actions.some(action =>
        action.node.hits.some(hit => hit.effects?.some(effect => effect.kind === 'status')),
      ),
    ).toBe(true);
    expect(result.actors).toBeDefined();
  });
});

describe('enemy finisher damage taken multiplier', () => {
  const emptyScenario = { tracks: [] };

  it('uses the explicit enemy value for an advanced enemy', () => {
    const result = compileScenario(emptyScenario, {
      systemConstants: { tier: 'advanced', finisherMultiplier: 1.25 },
    });

    expect(result.enemyConfig.finisherMultiplier).toBe(1.25);
  });

  it('preserves an explicit zero multiplier', () => {
    const result = compileScenario(emptyScenario, {
      systemConstants: { finisherMultiplier: 0 },
    });

    expect(result.enemyConfig.finisherMultiplier).toBe(0);
  });

  it('does not derive the value from enemy tier', () => {
    const tiers = ['normal', 'advanced', 'elite', 'boss', 'leader'];
    const values = tiers.map(
      tier => compileScenario(emptyScenario, { systemConstants: { tier } }).enemyConfig,
    );

    expect(values.map(config => config.finisherMultiplier)).toEqual([1, 1, 1, 1, 1]);
  });
});
