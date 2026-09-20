import { describe, expect, it } from 'vitest';
import { createEmptyScenario } from '../../../core/project/createProject';
import type { ScenarioDocument, SkillCastDocument } from '../../../core/project/schema';
import {
  canCreateSkillCastConnection,
  createSkillCastConnection,
  retargetSkillCastConnection,
  removeTimelineConnection,
  updateTimelineConnection,
} from './timelineConnections';

function cast(id: string): SkillCastDocument {
  return {
    id,
    source: { kind: 'custom', actionType: 'test', name: id },
    placement: { startFrame: 0 },
  };
}

function scenarioWithCasts(): ScenarioDocument {
  const scenario = createEmptyScenario('scenario:1', 'test');
  scenario.tracks[0] = {
    id: 'track:0',
    operator: {
      operatorSlug: 'perlica',
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: {},
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [cast('cast:1'), cast('cast:2')],
  };
  return scenario;
}

describe('timeline connections', () => {
  it('exposes the same target validity used by the document command', () => {
    const original = scenarioWithCasts();
    expect(canCreateSkillCastConnection(original, 'cast:1', 'cast:2')).toBe(true);
    expect(canCreateSkillCastConnection(original, 'cast:1', 'cast:1')).toBe(false);
    expect(canCreateSkillCastConnection(original, 'missing', 'cast:2')).toBe(false);

    const connected = createSkillCastConnection(original, {
      id: 'connection:1',
      fromSkillCastId: 'cast:1',
      fromPort: 'right',
      toSkillCastId: 'cast:2',
      toPort: 'left',
    });
    expect(canCreateSkillCastConnection(connected, 'cast:1', 'cast:2')).toBe(false);
    expect(canCreateSkillCastConnection(connected, 'cast:2', 'cast:1')).toBe(true);
    expect(canCreateSkillCastConnection(connected, 'cast:1', 'cast:2', 'connection:1')).toBe(true);
    expect(canCreateSkillCastConnection(connected, 'cast:1', 'cast:2', 'connection:other')).toBe(
      false,
    );
    expect(canCreateSkillCastConnection(connected, 'cast:1', 'cast:1', 'connection:1')).toBe(false);
    expect(canCreateSkillCastConnection(connected, 'cast:1', 'missing', 'connection:1')).toBe(
      false,
    );
  });

  it('creates and removes a directed skill-cast connection', () => {
    const original = scenarioWithCasts();
    const connected = createSkillCastConnection(original, {
      id: 'connection:1',
      fromSkillCastId: 'cast:1',
      fromPort: 'right',
      toSkillCastId: 'cast:2',
      toPort: 'left',
    });

    expect(connected.connections).toEqual([
      {
        id: 'connection:1',
        consumption: false,
        from: { kind: 'skillCast', skillCastId: 'cast:1', port: 'right' },
        to: { kind: 'skillCast', skillCastId: 'cast:2', port: 'left' },
      },
    ]);
    expect(removeTimelineConnection(connected, 'connection:1').connections).toEqual([]);
  });

  it('does not create dangling, self or duplicate connections', () => {
    const original = scenarioWithCasts();
    const connected = createSkillCastConnection(original, {
      id: 'connection:1',
      fromSkillCastId: 'cast:1',
      fromPort: 'right',
      toSkillCastId: 'cast:2',
      toPort: 'left',
    });

    expect(
      createSkillCastConnection(connected, {
        id: 'connection:2',
        fromSkillCastId: 'cast:1',
        fromPort: 'bottom',
        toSkillCastId: 'cast:2',
        toPort: 'top',
      }),
    ).toBe(connected);
    expect(
      createSkillCastConnection(original, {
        id: 'connection:self',
        fromSkillCastId: 'cast:1',
        fromPort: 'right',
        toSkillCastId: 'cast:1',
        toPort: 'left',
      }),
    ).toBe(original);
    expect(
      createSkillCastConnection(original, {
        id: 'connection:missing',
        fromSkillCastId: 'missing',
        fromPort: 'right',
        toSkillCastId: 'cast:2',
        toPort: 'left',
      }),
    ).toBe(original);
  });

  it('retargets a selected connection without changing its identity', () => {
    const original = createSkillCastConnection(scenarioWithCasts(), {
      id: 'connection:1',
      fromSkillCastId: 'cast:1',
      fromPort: 'right',
      toSkillCastId: 'cast:2',
      toPort: 'left',
    });
    const changed = retargetSkillCastConnection(original, 'connection:1', 'cast:2', 'top');
    expect(changed.connections[0]).toMatchObject({
      id: 'connection:1',
      from: { skillCastId: 'cast:1', port: 'right' },
      to: { skillCastId: 'cast:2', port: 'top' },
    });
    expect(retargetSkillCastConnection(changed, 'connection:1', 'cast:1', 'left')).toBe(changed);
    expect(retargetSkillCastConnection(changed, 'connection:1', 'missing', 'left')).toBe(changed);
  });
});

describe('updateTimelineConnection', () => {
  it('updates ports and consumption immutably', () => {
    const original = createSkillCastConnection(scenarioWithCasts(), {
      id: 'connection:1',
      fromSkillCastId: 'cast:1',
      fromPort: 'right',
      toSkillCastId: 'cast:2',
      toPort: 'left',
    });
    const updated = updateTimelineConnection(original, 'connection:1', {
      fromPort: 'bottom',
      toPort: 'top',
      consumption: true,
    });

    expect(updated.connections[0]).toMatchObject({
      consumption: true,
      from: { port: 'bottom' },
      to: { port: 'top' },
    });
    expect(original.connections[0]).toMatchObject({ consumption: false, from: { port: 'right' } });
  });
});
