import { describe, it, expect } from 'vitest';
import { scenario } from './fixture/scenario-2';
import { normalizeScenario } from './compileScenario';

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
