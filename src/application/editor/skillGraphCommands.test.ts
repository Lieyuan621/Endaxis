import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { createGameDataRepository } from '../../data/createGameDataRepository';
import { perlica } from '../../data/operators/perlica.generated';
import { ScenarioEditorSession } from './scenarioEditorSession';
import { editSkillCastGraph, replaceSkillCastDefinition } from './skillGraphCommands';
import {
  readGraphPresentation,
  sameScenarioExceptGraphPresentation,
} from '../../core/project/graphPresentation';

it('自定义图的排版独立保存，撤销不改变技能逻辑和模拟输入', () => {
  const { project, scenario, repository, definition } = fixture();
  scenario.tracks[0]!.skillCasts[0]!.customDefinition = definition;
  const session = new ScenarioEditorSession(scenario);
  const presentation = {
    main: {
      nodePositions: { a: { x: 12, y: 34 } },
      entryPositions: { timeline: { x: -400, y: 0 } },
    },
    macros: { damage: { nodePositions: { hit: { x: 50, y: 70 } }, entryPositions: {} } },
  };
  session.commit(
    'layout',
    replaceSkillCastDefinition(repository, 'first', definition, definition, presentation),
  );
  const next = session.snapshot.scenario;
  expect(next.tracks[0]!.skillCasts[0]!.customDefinition).toBe(definition);
  expect(sameScenarioExceptGraphPresentation(scenario, next)).toBe(true);
  expect(next.tracks[0]!.skillCasts[0]!.presentation?.graph).toEqual(presentation);
  expect(parseProjectDocument(serializeProjectDocument({ ...project, scenarios: [next] }))).toEqual(
    { ok: true, value: { ...project, scenarios: [next] } },
  );
  session.undo();
  expect(session.snapshot.scenario.tracks[0]!.skillCasts[0]!.presentation).toBeUndefined();
  session.redo();
  expect(session.snapshot.scenario.tracks[0]!.skillCasts[0]!.presentation?.graph).toEqual(
    presentation,
  );
  const disabled = { ...next, tracks: [...next.tracks] } as typeof next;
  disabled.tracks[0] = {
    ...next.tracks[0]!,
    skillCasts: next.tracks[0]!.skillCasts.map(cast => ({
      ...cast,
      presentation: { ...cast.presentation, disabled: true },
    })),
  };
  expect(sameScenarioExceptGraphPresentation(next, disabled)).toBe(false);
});

it('库图不因传入排版而产生存档改动', () => {
  const { scenario, repository, definition } = fixture(false);
  const next = replaceSkillCastDefinition(repository, 'first', definition, definition, {
    main: { nodePositions: { a: { x: 12, y: 34 } }, entryPositions: {} },
  })(scenario);
  expect(next).toBe(scenario);
  expect(next.tracks[0]!.skillCasts[0]!.customDefinition).toBeUndefined();
  expect(next.tracks[0]!.skillCasts[0]!.presentation).toBeUndefined();
});

it('存档中的无效坐标被忽略，主图和宏的同名节点互不覆盖', () => {
  const result = readGraphPresentation({
    main: { nodePositions: { a: { x: NaN, y: 0 }, b: { x: 1, y: 2 } } },
    macros: { m: { nodePositions: { b: { x: 3, y: 4 } } } },
  });
  expect(result.main?.nodePositions).toEqual({ b: { x: 1, y: 2 } });
  expect(result.macros?.m?.nodePositions.b).toEqual({ x: 3, y: 4 });
});

it('库图命令不能隐式开启自定义，显式自定义产生独立不可变副本', () => {
  const { scenario, repository, definition } = fixture(false);
  let called = false;
  expect(() =>
    editSkillCastGraph(repository, 'first', { kind: 'main' }, graph => {
      called = true;
      return graph;
    })(scenario),
  ).toThrow('只读');
  expect(called).toBe(false);
  expect(() =>
    replaceSkillCastDefinition(repository, 'first', { ...definition, timelineBlockFrames: 31 })(
      scenario,
    ),
  ).toThrow('只读');
  const next = replaceSkillCastDefinition(
    repository,
    'first',
    definition,
    definition,
    undefined,
    true,
  )(scenario);
  const custom = next.tracks[0]!.skillCasts[0]!.customDefinition!;
  expect(custom).toEqual(definition);
  expect(custom.actionGraph).not.toBe(definition.actionGraph);
  expect(Object.isFrozen(custom.actionGraph.main.nodes)).toBe(true);
  expect(scenario.tracks[0]!.skillCasts[0]!.customDefinition).toBeUndefined();
});

function fixture(custom = true) {
  const definition: SkillDefinition = {
    key: 'editable',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    timelineBlockFrames: 30,
    blackboard: { scale: 2 },
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'a' } }],
    actionGraph: {
      main: {
        nodes: {
          a: { action: { kind: 'callMacro', macroId: 'damage' }, next: 'b' },
          b: { action: { kind: 'callMacro', macroId: 'damage' }, next: null },
        },
      },
      macros: {
        damage: {
          entry: { $sequence: 'hit' },
          graph: {
            nodes: {
              hit: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
            },
          },
        },
      },
    },
  };
  const repository = createGameDataRepository({
    revision: 'edit',
    operators: [
      {
        ...perlica,
        skillGroups: [
          {
            key: 'basicAttack',
            skillType: 'basicAttack',
            levelSource: 'basicAttack',
            skills: [definition],
          },
        ],
      },
    ],
  });
  const project = createEmptyProject({ createdWith: 'test' });
  const scenario = project.scenarios[0]!;
  scenario.tracks[0] = {
    id: 'track',
    operator: {
      operatorSlug: perlica.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 1 },
      talentStates: {},
    },
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: ['first', 'second'].map(id => ({
      id,
      ...(custom && id === 'first' ? { customDefinition: structuredClone(definition) } : {}),
      source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'editable' },
      placement: { startFrame: 0 },
    })),
  };
  const command = editSkillCastGraph(
    repository,
    'first',
    { kind: 'macro', macroId: 'damage' },
    graph => ({
      ...graph,
      nodes: {
        ...graph.nodes,
        hit: { action: { kind: 'dealStagger', parameters: { value: 5 } }, next: null },
      },
    }),
  );
  return { project, scenario, repository, definition, command };
}

it('正式图直接进入场景事务，保留共享宏及元数据，编辑只影响选中的技能块', () => {
  const { project, scenario, definition, command } = fixture();
  const session = new ScenarioEditorSession(scenario);
  expect(session.commit('edit-skill-graph', command)).toBe(true);
  const edited = session.snapshot.scenario;
  const skill = edited.tracks[0]!.skillCasts[0]!.customDefinition!;
  expect(skill.actionGraph.main).toEqual(definition.actionGraph.main);
  expect(skill.actionGraph.main).not.toBe(definition.actionGraph.main);
  expect(skill.blackboard).toEqual(definition.blackboard);
  expect(skill.actionGraph.macros.damage!.graph.nodes.hit!.action).toMatchObject({
    parameters: { value: 5 },
  });
  expect(definition.actionGraph.macros.damage!.graph.nodes.hit!.action).toMatchObject({
    parameters: { value: 2 },
  });
  expect(edited.tracks[0]!.skillCasts[1]!.customDefinition).toBeUndefined();
  expect(
    parseProjectDocument(serializeProjectDocument({ ...project, scenarios: [edited] })),
  ).toEqual({ ok: true, value: { ...project, scenarios: [edited] } });
  session.undo();
  expect(session.snapshot.scenario).toBe(scenario);
  session.redo();
  expect(session.snapshot.scenario).toBe(edited);
});

it('非法回边和删除被引用节点均不能进入历史', () => {
  const { scenario, repository } = fixture();
  const session = new ScenarioEditorSession(scenario);
  const invalidGraphs: ActionGraphDefinition[] = [
    { nodes: { hit: { action: { kind: 'dealStagger', parameters: { value: 1 } }, next: 'hit' } } },
    { nodes: {} },
  ];
  for (const graph of invalidGraphs) {
    const command = editSkillCastGraph(
      repository,
      'first',
      { kind: 'macro', macroId: 'damage' },
      () => graph,
    );
    expect(() => session.commit('invalid', command)).toThrow();
    expect(session.snapshot.scenario).toBe(scenario);
    expect(session.canUndo).toBe(false);
  }
});

it('复用场景继承边界，禁止通过编辑图改变冻结的历史输入', () => {
  const { scenario, command } = fixture();
  const session = new ScenarioEditorSession(scenario, 50, { inputBeforeFrame: 30 });
  expect(() => session.commit('edit-history', command)).toThrow();
  expect(session.snapshot.scenario).toBe(scenario);
  expect(session.canUndo).toBe(false);
});

it('无改动不创建覆盖，不增加撤销记录', () => {
  const { scenario, repository } = fixture();
  const session = new ScenarioEditorSession(scenario);
  expect(
    session.commit(
      'noop',
      editSkillCastGraph(repository, 'first', { kind: 'main' }, graph => graph),
    ),
  ).toBe(false);
  expect(session.snapshot.scenario).toBe(scenario);
  expect(session.canUndo).toBe(false);
});

it('重接边与删除节点可以原子提交，缺失的宏不能误编辑主图', () => {
  const { scenario, repository } = fixture();
  const session = new ScenarioEditorSession(scenario);
  expect(() =>
    session.commit(
      'missing',
      editSkillCastGraph(
        repository,
        'first',
        {
          kind: 'macro',
          macroId: 'toString',
        },
        graph => graph,
      ),
    ),
  ).toThrow('has no macro');
  session.commit(
    'remove-second-call',
    editSkillCastGraph(repository, 'first', { kind: 'main' }, graph => ({
      nodes: { a: { ...graph.nodes.a!, next: null } },
    })),
  );
  expect(
    Object.keys(
      session.snapshot.scenario.tracks[0]!.skillCasts[0]!.customDefinition!.actionGraph.main.nodes,
    ),
  ).toEqual(['a']);
  session.undo();
  expect(session.snapshot.scenario).toBe(scenario);
});

it('完整技能保存一次提交元数据和图，克隆的打开快照支持撤销、重做与序列化', () => {
  const { project, scenario, repository, definition } = fixture();
  const session = new ScenarioEditorSession(scenario);
  const replacement: SkillDefinition = {
    ...definition,
    timelineBlockFrames: 60,
    blackboard: { scale: 3 },
    actionGraph: {
      ...definition.actionGraph,
      main: { nodes: { a: { ...definition.actionGraph.main.nodes.a!, next: null } } },
    },
  };
  expect(
    session.commit(
      'save-resource',
      replaceSkillCastDefinition(
        repository,
        'first',
        replacement,
        JSON.parse(JSON.stringify(definition)) as SkillDefinition,
      ),
    ),
  ).toBe(true);
  const saved = session.snapshot.scenario;
  expect(saved.tracks[0]!.skillCasts[0]!.customDefinition).toEqual(replacement);
  expect(saved.tracks[0]!.skillCasts[0]!.customDefinition).not.toBe(replacement);
  expect(saved.tracks[0]!.skillCasts[1]).toBe(scenario.tracks[0]!.skillCasts[1]);
  expect(definition.timelineBlockFrames).toBe(30);
  expect(
    parseProjectDocument(serializeProjectDocument({ ...project, scenarios: [saved] })),
  ).toEqual({
    ok: true,
    value: { ...project, scenarios: [saved] },
  });
  expect(session.undo()).toBe(true);
  expect(session.snapshot.scenario).toBe(scenario);
  expect(session.canUndo).toBe(false);
  expect(session.redo()).toBe(true);
  expect(session.snapshot.scenario).toBe(saved);
});

it('完整保存拒绝错误技能身份、非法参数、过期快照，失败不写入撤销记录', () => {
  const { scenario, repository, definition } = fixture();
  const session = new ScenarioEditorSession(scenario);
  expect(() =>
    session.commit(
      'wrong-skill',
      replaceSkillCastDefinition(repository, 'first', {
        ...definition,
        key: 'another-skill',
      }),
    ),
  ).toThrow('does not match source skill key');
  expect(() =>
    session.commit(
      'bad-value',
      replaceSkillCastDefinition(repository, 'first', {
        ...definition,
        timelineBlockFrames: -1,
      }),
    ),
  ).toThrow('timelineBlockFrames');
  expect(session.canUndo).toBe(false);
  session.commit(
    'first-save',
    replaceSkillCastDefinition(
      repository,
      'first',
      {
        ...definition,
        timelineBlockFrames: 40,
      },
      definition,
    ),
  );
  const saved = session.snapshot.scenario;
  expect(() =>
    session.commit(
      'stale-save',
      replaceSkillCastDefinition(
        repository,
        'first',
        {
          ...definition,
          timelineBlockFrames: 50,
        },
        definition,
      ),
    ),
  ).toThrow('changed after the editor was opened');
  expect(session.snapshot.scenario).toBe(saved);
  session.undo();
  expect(session.canUndo).toBe(false);
});

it('完整保存复用冻结输入约束，同内容定义不创建无意义覆盖', () => {
  const { scenario, repository, definition } = fixture();
  const session = new ScenarioEditorSession(scenario, 50, { inputBeforeFrame: 30 });
  expect(
    session.commit(
      'noop',
      replaceSkillCastDefinition(
        repository,
        'first',
        {
          ...definition,
        },
        definition,
      ),
    ),
  ).toBe(false);
  expect(() =>
    session.commit(
      'edit-history',
      replaceSkillCastDefinition(
        repository,
        'first',
        {
          ...definition,
          timelineBlockFrames: 40,
        },
        definition,
      ),
    ),
  ).toThrow();
  expect(session.snapshot.scenario).toBe(scenario);
  expect(session.canUndo).toBe(false);
});

it('自由展示块没有技能来源身份，携带完整定义也不能通过技能图命令保存', () => {
  const { scenario, repository, definition } = fixture();
  const cast = scenario.tracks[0]!.skillCasts[0]!;
  cast.source = { kind: 'custom', actionType: 'note', name: '自由展示块' };
  cast.customDefinition = definition;
  const session = new ScenarioEditorSession(scenario);
  const commands = [
    replaceSkillCastDefinition(repository, 'first', definition),
    editSkillCastGraph(repository, 'first', { kind: 'main' }, graph => graph),
  ];
  for (const command of commands) {
    expect(() => session.commit('unsupported-source', command)).toThrow(
      "uses unsupported source kind 'custom'",
    );
    expect(session.snapshot.scenario).toBe(scenario);
    expect(session.canUndo).toBe(false);
  }
});
