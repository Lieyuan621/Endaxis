import { ActionGraphDefinitionRepository } from '../../../src/core/compiler/actionGraphDefinitionRepository.ts';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import {
  renderOperatorDefinitionSource,
  renderCommonBuffDefinitionsSource,
} from '../src/domains/operator/definitionSourceRenderer.ts';
import type * as graph from '../../../packages/game-data-contract/src/actionGraph.ts';
import type {
  ComboSkillConditionDefinition,
  OperatorDefinition,
  OperatorPassiveSkillDefinition,
} from '../../../packages/game-data-contract/src/operators.ts';
import type {
  AbilityEntityDefinition,
  SkillDefinition,
} from '../../../packages/game-data-contract/src/skills.ts';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs.ts';
import {
  compileSkill,
  compileIndependentBuffResource,
  compileIndependentAbilityEntityResource,
} from '../../../src/core/compiler/compileSkill.ts';
import { rootActionSteps } from '../../../src/core/compiler/actionProgramInspection.ts';
import { perlica } from '../../../src/data/operators/perlica.generated.ts';

/** 实际执行生成源码，比较公开定义；不把生成器锁死在某种文本写法上。 */
function evaluate(source: string): Record<string, unknown> {
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
  }).outputText;
  const output: Record<string, unknown> = {};
  new Function('require', 'exports', code)((id: string) => {
    throw new Error(`Unexpected generated import ${id}`);
  }, output);
  return output;
}

/** 单节点图资源夹具。 */
const singleNodeGraph = (
  id: string,
  action: graph.ActionGraphStep,
): graph.ActionGraphResourceDefinition => ({
  main: { nodes: { [id]: { action, next: null } } },
  macros: {},
});
const entryOf = (id: string): graph.ActionGraphReference => ({ $sequence: id });

describe('independent operator resource renderer', () => {
  it('preserves skill exports, blackboard, numbers, callbacks and shared source identities', () => {
    const skill = {
      key: 'battleSkill',
      blackboard: { scale: [0.2, 0.3] },
      timelineBlockFrames: 10,
      scheduledSequences: [
        { startFrame: 0, sequence: entryOf('hit') },
        { startFrame: 1, sequence: entryOf('hit') },
      ],
      actionGraph: singleNodeGraph('hit', {
        kind: 'dealDamage',
        key: 'SkillData.hit',
        parameters: {
          damageType: 'physical',
          attackScale: [0.2, 0.3],
          tags: ['normalSkill'],
        },
      }),
    };
    const operator = {
      slug: 'sample',
      skillGroups: [
        { key: 'battleSkill', skillType: 'battleSkill', levelSource: 'battleSkill', skills: skill },
      ],
    };
    const source = renderOperatorDefinitionSource({ operator });
    expect(source).not.toContain('expandActionGraph');
    const exported = evaluate(source);
    const definition = exported.sampleBattleSkill as SkillDefinition;
    expect(exported.sampleActionGraph).toBeUndefined();
    expect(definition.blackboard).toEqual(skill.blackboard);
    expect(definition.scheduledSequences[0]!.sequence).toEqual(
      definition.scheduledSequences[1]!.sequence,
    );
    expect(Object.keys(definition.actionGraph.main.nodes)).toHaveLength(1);
    expect(exported.default).toEqual({
      ...operator,
      skillGroups: [{ ...operator.skillGroups[0], skills: definition }],
    });
    const program = compileSkill({
      operatorId: 'sample',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 2,
      skill: definition,
      programs: new ActionGraphDefinitionRepository(),
    });
    expect(program.initialBlackboard).toEqual({ scale: 0.3 });
    expect(
      program.timelineActions.map(entry => rootActionSteps(entry.sequence)[0]!.parameters),
    ).toEqual([
      { damageType: 'physical', attackScale: 0.3, tags: ['normalSkill'] },
      { damageType: 'physical', attackScale: 0.3, tags: ['normalSkill'] },
    ]);
    expect(program.timelineActions[0]!.sequence.graph).toBe(
      program.timelineActions[1]!.sequence.graph,
    );
    expect(program.timelineActions[0]!.sequence.callSite).not.toBe(
      program.timelineActions[1]!.sequence.callSite,
    );
  });
});

it('同名作用域只在各自技能内判断共享，不跨干员目录合并', () => {
  const skill = (key: string) => ({
    key,
    scheduledSequences: [{ startFrame: 0, sequence: entryOf('scope') }],
    actionGraph: {
      main: {
        nodes: {
          scope: {
            action: {
              kind: 'once',
              parameters: { scopeKey: 'SkillData.sharedScope' },
              body: entryOf('end'),
            },
            next: null,
          },
          end: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
        },
      },
      macros: {},
    } satisfies graph.ActionGraphResourceDefinition,
  });
  const output = evaluate(
    renderOperatorDefinitionSource({
      operator: {
        slug: 'sample',
        skillGroups: [
          { key: 'first', skills: skill('first') },
          { key: 'second', skills: skill('second') },
        ],
      },
    }),
  );
  const first = output.sampleFirst as SkillDefinition;
  const second = output.sampleSecond as SkillDefinition;
  expect(first.actionGraph).not.toBe(second.actionGraph);
  for (const definition of [first, second]) {
    const once = Object.values(definition.actionGraph.main.nodes).find(
      node => node.action.kind === 'once',
    );
    if (once?.action.kind !== 'once') throw new Error('missing once node');
    expect(once.action.parameters).not.toHaveProperty('scopeKey');
  }
});

it('原生常驻被动各自拥有完整图，不借用干员总图', () => {
  const passive = (key: string) => ({
    key,
    enableSequence: entryOf('hit'),
    actionGraph: singleNodeGraph('hit', { kind: 'dealStagger', parameters: { value: 3 } }),
  });
  const output = evaluate(
    renderOperatorDefinitionSource({
      operator: {
        slug: 'sample',
        skillGroups: [],
        passiveSkills: [passive('native-passive-a')],
        talents: [{ levels: 1, passiveSkills: [passive('native-passive-b')] }],
        potentials: [],
      },
    }),
  );
  const operator = output.default as OperatorDefinition;
  const first = operator.passiveSkills![0] as OperatorPassiveSkillDefinition;
  const second = operator.talents[0]!.passiveSkills![0] as OperatorPassiveSkillDefinition;
  expect(output.sampleActionGraph).toBeUndefined();
  expect(first.actionGraph).not.toBe(second.actionGraph);
  expect(Object.keys(first.actionGraph.main.nodes)).toHaveLength(1);
  expect(Object.keys(second.actionGraph.main.nodes)).toHaveLength(1);
  expect(first.enableSequence).toMatchObject({ $sequence: expect.any(String) });
});

it('公共 Buff 生成的生命周期保留共享图引用，可直接进入正式 Buff 编译', () => {
  const body = entryOf('hit');
  const source = renderCommonBuffDefinitionsSource({
    shared: {
      stackingType: 'refresh',
      lifecycleSequences: { start: body, finish: body },
      actionGraph: singleNodeGraph('hit', {
        kind: 'dealStagger',
        parameters: { value: { kind: 'blackboard', key: 'poise' } },
      }),
    },
  });
  expect(source).not.toContain('expandActionGraph');
  const exported = evaluate(source);
  const definitions = exported.commonBuffDefinitions as Record<string, SkillBuffDefinition>;
  const definition = definitions.shared!;
  if (definition.actionGraph === undefined) throw new Error('expected an action buff definition');
  expect(Object.keys(definition.actionGraph.main.nodes)).toHaveLength(1);
  const result = compileIndependentBuffResource(
    definition,
    'shared',
    new ActionGraphDefinitionRepository(),
  );
  const lifecycle = result.lifecycleSequences!;
  expect(lifecycle.start!.graph).toBe(lifecycle.finish!.graph);
  expect(lifecycle.start!.entry).toBe(lifecycle.finish!.entry);
  expect(lifecycle.start!.callSite).not.toBe(lifecycle.finish!.callSite);
  expect(rootActionSteps(lifecycle.start!)[0]!.parameters).toEqual({
    value: { kind: 'blackboard', key: 'poise' },
  });
});

it('只有数值的 Buff 不生成空动作图', () => {
  const exported = evaluate(
    renderCommonBuffDefinitionsSource({ pure: { stackingType: 'unlimited' } }),
  );
  const definition = (exported.commonBuffDefinitions as Record<string, Record<string, unknown>>)
    .pure!;
  expect(definition.stackingType).toBe('unlimited');
  expect(definition).not.toHaveProperty('actionGraph');
});

it('干员私有 Buff 也保存自己的图，不进入干员过渡图', () => {
  const source = renderOperatorDefinitionSource({
    operator: {
      slug: 'sample',
      skillGroups: [],
      buffDefinitions: {
        owned: {
          stackingType: 'unlimited',
          lifecycleSequences: { start: entryOf('hit') },
          actionGraph: singleNodeGraph('hit', {
            kind: 'dealStagger',
            parameters: { value: 4 },
          }),
        },
      },
    },
  });
  const exported = evaluate(source);
  const operator = exported.default as OperatorDefinition;
  const buff = operator.buffDefinitions!.owned as SkillBuffDefinition;
  expect('actionGraph' in operator).toBe(false);
  if (buff.actionGraph === undefined) throw new Error('expected an action buff definition');
  expect(Object.keys(buff.actionGraph.main.nodes)).toHaveLength(1);
  const compiled = compileIndependentBuffResource(
    buff,
    'owned',
    new ActionGraphDefinitionRepository(),
  );
  const start = compiled.lifecycleSequences!.start!;
  const startNode = start.graph.nodes.get(start.entry!)!;
  if (startNode.action.kind !== 'dealStagger') throw new Error('expected a dealStagger node');
  expect(startNode.action.parameters).toEqual({ value: 4 });
});

it('原生连携条件各自保存完整图，不占用干员图', () => {
  const source = renderOperatorDefinitionSource({
    operator: {
      slug: 'sample',
      skillGroups: [],
      comboSkillConditions: [
        {
          key: 'combo:one',
          skillKey: 'native-combo',
          event: 'addedBuff',
          immediately: false,
          initialValues: null,
          sequence: entryOf('hit'),
          actionGraph: singleNodeGraph('hit', {
            kind: 'dealStagger',
            parameters: { value: 3 },
          }),
        },
      ],
    },
  });
  const operator = evaluate(source).default as OperatorDefinition;
  const condition = operator.comboSkillConditions![0] as ComboSkillConditionDefinition;
  expect('actionGraph' in operator).toBe(false);
  expect(Object.keys(condition.actionGraph.main.nodes)).toHaveLength(1);
  expect(condition.sequence.$sequence).not.toBeNull();
});

it('干员能力实体保存自己的图，不进入干员过渡图', () => {
  const source = renderOperatorDefinitionSource({
    operator: {
      slug: 'sample',
      skillGroups: [],
      abilityEntityDefinitions: {
        owned: {
          lifetime: { kind: 'infinite' },
          childSkill: {
            skillId: 'owned-child',
            nativeSkillType: 'normalSkill' as const,
            naturalDurationFrames: 30,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
            },
            scheduledSequences: [{ startFrame: 0, sequence: entryOf('hit') }],
            actionGraph: singleNodeGraph('hit', {
              kind: 'dealStagger',
              parameters: { value: 5 },
            }),
          },
        },
      },
    },
  });
  const exported = evaluate(source);
  const operator = exported.default as OperatorDefinition;
  const entity = operator.abilityEntityDefinitions!.owned as AbilityEntityDefinition;
  expect('actionGraph' in operator).toBe(false);
  expect(Object.keys(entity.childSkill!.actionGraph.main.nodes)).toHaveLength(1);
  const compiled = compileIndependentAbilityEntityResource(
    entity,
    'owned',
    1,
    new ActionGraphDefinitionRepository(),
  );
  const entry = compiled.childSkill!.timelineActions[0]!.sequence;
  const entryNode = entry.graph.nodes.get(entry.entry!)!;
  if (entryNode.action.kind !== 'dealStagger') throw new Error('expected a dealStagger node');
  expect(entryNode.action.parameters).toEqual({ value: 5 });
});

it('真实佩丽卡生成定义直接编译战技，不重新当作来源树渲染', () => {
  const operator = perlica;
  expect('actionGraph' in operator).toBe(false);
  const group = operator.skillGroups.find(item => item.key === 'battleSkill');
  expect(group).toBeDefined();
  if (group === undefined || Array.isArray(group.skills)) throw new Error('missing battle skill');
  const skill = group.skills as SkillDefinition;
  expect(Object.keys(skill.actionGraph.main.nodes).length).toBeGreaterThan(0);
  const compiled = compileSkill({
    operatorId: operator.slug,
    skillGroupKey: group.key,
    skillType: 'battleSkill',
    skillLevel: 12,
    skill,
    programs: new ActionGraphDefinitionRepository(),
  });
  expect(compiled.timelineActions.length).toBeGreaterThan(0);
  expect(compiled.timelineActions.every(action => !('steps' in action.sequence))).toBe(true);
});

it('养成初始化和事件响应属于养成局部图，未归属程序阻止发布', () => {
  const write: graph.ActionGraphStep = {
    kind: 'modifyActionValue',
    parameters: {
      key: 'count',
      operation: 'add',
      value: { kind: 'constant', value: 1 },
    },
  };
  const source = renderOperatorDefinitionSource({
    operator: {
      slug: 'sample',
      skillGroups: [],
      talents: [
        {
          levels: 1,
          initializationSequence: entryOf('write'),
          eventHandlers: [
            { event: { kind: 'elementalAttachmentConsumed' }, sequence: entryOf('write') },
          ],
          actionGraph: singleNodeGraph('write', write),
        },
      ],
    },
  });
  const operator = evaluate(source).default as OperatorDefinition;
  const upgrade = operator.talents[0]!;
  expect('actionGraph' in operator).toBe(false);
  expect(upgrade.actionGraph).toBeDefined();
  const compilation = new ActionGraphDefinitionRepository().compile(upgrade.actionGraph!, 1);
  for (const entry of [upgrade.initializationSequence!, upgrade.eventHandlers![0]!.sequence]) {
    const compiled = compilation.compileEntry(entry, 'upgrade');
    expect(compiled.graph.nodes.get(compiled.entry!)!.action.kind).toBe('modifyActionValue');
  }
  // 渲染层不再在投影期发现未归属程序；裸引用照常落盘，悬空入口在编译期被拒绝。
  const unowned = renderOperatorDefinitionSource({
    operator: {
      slug: 'sample',
      skillGroups: [],
      eventHandlers: [
        { key: 'unowned', event: 'deckAttributesChanged', sequence: entryOf('write') },
      ],
    },
  });
  const unownedOperator = evaluate(unowned).default as OperatorDefinition;
  expect(() =>
    new ActionGraphDefinitionRepository()
      .compile({ main: { nodes: {} }, macros: {} }, 1)
      .compileEntry(unownedOperator.eventHandlers![0]!.sequence, 'upgrade'),
  ).toThrow('missing action graph node');
});
