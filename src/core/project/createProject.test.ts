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

describe('default preparation area', () => {
  it('starts new scenarios collapsed', () => {
    expect(createEmptyScenario('test', 'Test').editor.prepExpanded).toBe(false);
  });

  it('starts the initial project scenario collapsed', () => {
    const project = createEmptyProject({ createdWith: 'test' });
    expect(project.scenarios[0]!.editor.prepExpanded).toBe(false);
  });
});
