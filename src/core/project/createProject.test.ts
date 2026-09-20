import { describe, expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from './createProject';

describe('default team SP', () => {
  it('starts new scenarios with a 120 second timeline', () => {
    expect(createEmptyScenario('test', 'Test').battle.durationFrames).toBe(120 * 30);
  });
  it('starts new scenarios at 200 without changing the 300 cap', () => {
    expect(createEmptyScenario('test', 'Test').battle.resourceRules).toMatchObject({
      initialSp: 200,
      maxSp: 300,
    });
  });

  it('uses the same default for the initial project scenario', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    expect(project.scenarios[0]!.battle.resourceRules.initialSp).toBe(200);
  });
});
