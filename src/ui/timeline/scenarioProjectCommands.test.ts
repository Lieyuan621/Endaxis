import { describe, expect, it } from 'vitest';
import { createEmptyProject, createEmptyScenario } from '../../core/project/createProject';
import type { EndaxisProjectDocument } from '../../core/project/schema';
import { getSkillCastPlacementChains } from '../../core/project/skillCastPlacement';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { validateProjectDocument } from '../../core/project/validation';
import { ProjectEditorSession } from '../../application/editor/projectEditorSession';
import { createSkillCastGroup } from './interaction/timelineDocumentCommands';
import {
  addProjectScenario,
  deleteActiveScenario,
  duplicateActiveScenario,
  renameActiveScenario,
  switchProjectScenario,
} from './scenarioProjectCommands';

function project(): EndaxisProjectDocument {
  return createEmptyProject({
    projectId: 'test',
    createdWith: 'test',
  });
}

describe('scenario project commands', () => {
  it('renames, adds and switches scenarios without mutating the input', () => {
    const original = project();
    const renamed = renameActiveScenario(original, '  主方案  ');
    const added = addProjectScenario(renamed, '副方案');
    const switched = switchProjectScenario(added, renamed.activeScenarioId);

    expect(original.scenarios[0]?.name).toBe('Scenario 1');
    expect(renamed.scenarios[0]?.name).toBe('主方案');
    expect(added.scenarios).toHaveLength(2);
    expect(added.scenarios[1]?.name).toBe('副方案');
    expect(added.scenarios[1]?.battle.resourceRules.spRecoveryPerSecond).toBe(8);
    expect(switched.activeScenarioId).toBe(renamed.activeScenarioId);
  });

  it('复制方案只更换方案身份，内部身份不变且副本可以独立编辑', () => {
    const original = project();
    const source = original.scenarios[0]!;
    source.tracks[0] = {
      id: 'track:old',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        {
          id: 'cast:old',
          source: { kind: 'operatorSkill', skillGroupKey: 'group-key', skillKey: 'skill-key' },
          placement: { startFrame: 10 },
        },
      ],
    };
    source.connections.push({
      id: 'connection:old',
      consumption: false,
      from: { kind: 'skillCast', skillCastId: 'cast:old' },
      to: { kind: 'skillCast', skillCastId: 'cast:old' },
    });
    source.battle.cycleBoundaries.push({ id: 'cycle:old', frame: 30 });
    source.battle.controlSwitches.push({ id: 'switch:old', frame: 10, trackIndex: 0 });
    const before = structuredClone(original);

    const result = duplicateActiveScenario(original, '副本');
    const copy = result.scenarios[1]!;
    const copiedCast = copy.tracks[0]!.skillCasts[0]!;
    expect(copy.id).not.toBe(source.id);
    expect(result.activeScenarioId).toBe(copy.id);
    expect(copy).toEqual({ ...source, id: copy.id, name: `${source.name} (副本)` });
    expect(validateProjectDocument(result)).toEqual({ ok: true, value: result });

    copiedCast.placement = { startFrame: 20 };
    copy.connections[0]!.to.skillCastId = 'edited';
    copy.tracks[0]!.initialState.ultimateEnergy = 50;
    copy.battle.cycleBoundaries[0]!.frame = 60;
    copy.battle.controlSwitches[0]!.frame = 20;
    expect(result.scenarios[0]).toBe(source);
    expect(original).toEqual(before);
  });

  it('复制连续组保留前驱和连线引用，两个方案可一起存档，并支持撤销重做', () => {
    const original = project();
    const source = original.scenarios[0]!;
    source.tracks[0] = {
      id: 'track:group',
      operator: null,
      weapon: null,
      gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
      initialState: { ultimateEnergy: 0 },
      skillCasts: [
        { id: 'c', placement: { startFrame: 70 } },
        { id: 'b', placement: { startFrame: 40 } },
        { id: 'a', placement: { startFrame: 10 } },
      ].map(cast => ({
        ...cast,
        source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: cast.id },
      })),
    };
    source.connections.push({
      id: 'group:connection',
      consumption: false,
      from: { kind: 'skillCast', skillCastId: 'a' },
      to: { kind: 'skillCast', skillCastId: 'c' },
    });
    original.scenarios[0] = createSkillCastGroup(
      source,
      new Set(['a', 'b', 'c']),
      new Map([
        ['a', 10],
        ['b', 40],
        ['c', 70],
      ]),
    );
    const before = structuredClone(original);
    const session = new ProjectEditorSession(original);
    expect(
      session.commit('duplicateScenario', value => duplicateActiveScenario(value, '副本')),
    ).toBe(true);
    const result = session.snapshot.project;
    const copy = result.scenarios[1]!;
    expect(copy.tracks).toEqual(original.scenarios[0]!.tracks);
    expect(copy.connections).toEqual(original.scenarios[0]!.connections);
    expect(
      getSkillCastPlacementChains(copy.tracks[0]!.skillCasts).map(chain =>
        chain.casts.map(cast => cast.id),
      ),
    ).toEqual([['a', 'b', 'c']]);
    expect(result.scenarios[0]).toBe(original.scenarios[0]);
    expect(original).toEqual(before);
    expect(validateProjectDocument(result)).toEqual({ ok: true, value: result });
    expect(parseProjectDocument(serializeProjectDocument(result))).toEqual({
      ok: true,
      value: result,
    });
    expect(session.undo()).toBe(true);
    expect(session.snapshot.project).toBe(original);
    expect(session.redo()).toBe(true);
    expect(session.snapshot.project).toBe(result);
  });

  it('deleting an inheritance source leaves its independent copy unchanged', () => {
    const original = project();
    const source = original.scenarios[0]!;
    source.battle.cycleBoundaries.push({ id: 'cycle:1', frame: 30 });
    const child = createEmptyScenario('test:scenario:2', '继承方案');
    child.inheritance = { sourceScenarioId: source.id, frame: 30 };
    const withChild = { ...original, scenarios: [source, child] };

    expect(deleteActiveScenario(withChild).scenarios).toEqual([child]);
    const childActive = { ...withChild, activeScenarioId: child.id };
    const deleted = deleteActiveScenario(childActive);
    expect(deleted.scenarios).toEqual([source]);
    expect(deleted.activeScenarioId).toBe(source.id);
  });
});
