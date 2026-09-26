import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import {
  compileOperatorActiveSkillRuntimeDefinitionSource,
  renderOperatorActiveSkillRuntimeDefinitionSource,
} from '../src/domains/operator/activeSkillRuntimeDefinition.ts';
import { createActionGraphBuilder } from '../src/compiler/actions/actionGraphBuilder.ts';
import { activeSkillFixture } from './sourceFixtures.ts';

const context = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'enemy',
} as const;

describe('Operator 主动技能正式运行定义', () => {
  it('把原生操作映射与接续窗口保留到最终技能定义', () => {
    const source = activeSkillFixture('native.attack1');
    source.castData = { startCdFrame: 0 };
    source.actionGroupData = {
      timelineActions: [
        {
          _startFrame: 6,
          _endFrame: 9,
          _sequenceActionData: {
            actionData: [
              {
                $type: 'Beyond.Gameplay.Core.ComboCacheAction+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 1,
                mappingDataList: [
                  {
                    cmdType: 'Attack',
                    skillId: 'native.attack2',
                    cacheEndByAction: true,
                    clearOffsetTargetSkillIdOnEnd: false,
                    overrideCacheTime: true,
                    cacheTime: { value: 0.2, useBlackboardKey: false, blackboardKey: '' },
                  },
                ],
              },
              {
                $type: 'Beyond.Gameplay.Core.AllowNextSkillAction+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 2,
                allowedSkillIdList: ['native.attack2'],
              },
            ],
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
          },
          forceSyncAnimData: {
            forceSync: false,
            montageName: '',
            targetFrame: 0,
            playbackSpeed: 1,
          },
        },
      ],
      passiveEventActions: [],
    };

    const definition = compileOperatorActiveSkillRuntimeDefinitionSource({
      key: 'native.attack1',
      skillType: 'basicAttack',
      value: source,
      sourcePath: 'native.attack1.json',
      patch: null,
      context,
    });

    expect(definition.inputWindows).toEqual({
      commandMappings: [
        {
          startFrame: 6,
          endFrame: 9,
          input: 'basicAttack',
          targetSkillId: 'native.attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 6, endFrame: 9, skillIds: ['native.attack2'] }],
    });
    expect(
      renderOperatorActiveSkillRuntimeDefinitionSource({
        operatorSlug: 'fixture',
        definition,
      }).content,
    ).toContain('"inputWindows"');
  });

  it('动态声明进入实例初值，同名等级补丁覆盖初值而不改变来源', () => {
    const source = activeSkillFixture('dynamic');
    source.castData = { startCdFrame: 0 };
    source.blackboard = [
      { key: 'count', valueDouble: 0, valueStr: '', isDynamic: true },
      { key: 'atb', valueDouble: 3, valueStr: '', isDynamic: true },
    ];
    const definition = compileOperatorActiveSkillRuntimeDefinitionSource({
      key: 'dynamic',
      skillType: 'comboSkill',
      value: source,
      sourcePath: 'dynamic',
      context,
      patch: {
        levels: [1, 2],
        blackboard: { atb: [7.5, 8] },
        cooldownSeconds: [0, 0],
        costTypes: [0, 0],
        costValues: [0, 0],
      },
    });
    expect(definition.blackboard).toEqual({ count: 0, atb: [7.5, 8] });
    expect(source.blackboard).toEqual([
      { key: 'count', valueDouble: 0, valueStr: '', isDynamic: true },
      { key: 'atb', valueDouble: 3, valueStr: '', isDynamic: true },
    ]);
  });

  it('从 SkillPatch 恢复等级黑板、战技费用与帧精确冷却', () => {
    const source = activeSkillFixture('battle');
    (source.castData as Record<string, unknown>).startCdFrame = 3;
    source.exclusiveFrame = 20;
    const definition = compileOperatorActiveSkillRuntimeDefinitionSource({
      key: 'battle',
      skillType: 'battleSkill',
      value: source,
      sourcePath: 'battle.json',
      patch: {
        levels: [1, 2],
        blackboard: { attack_scale: [1, 1.2] },
        cooldownSeconds: [1, 1.5],
        costTypes: [1, 1],
        costValues: [100, 100],
      },
      context,
    });
    expect(definition).toMatchObject({
      key: 'battle',
      blackboard: { attack_scale: [1, 1.2] },
      timelineBlockFrames: 21,
      naturalDurationFrames: 30,
      cooldownFrames: [30, 45],
      costs: [{ resource: 'sp', value: 100 }],
      costFrame: 3,
      scheduledSequences: [],
    });
    const rendered = renderOperatorActiveSkillRuntimeDefinitionSource({
      operatorSlug: 'fixture',
      definition,
      supplementalBuffDefinitions: {
        ready: {
          stackingType: 'unique',
          priority: 0,
          maxStackCount: 1,
          durationSeconds: 2,
          applyTags: [],
          extendTags: [],
          blackboard: {},
          attributeModifiers: [],
          actionGraph: { main: { nodes: {} }, macros: {} },
        },
      },
    });
    expect(rendered.relativePath).toBe('fixture.battle.runtime.generated.ts');
    expect(rendered.content).toContain('satisfies SkillDefinition');
    expect(rendered.content).toContain('export const supplementalBuffDefinitions');
    expect(rendered.content).toContain('"durationSeconds": 2');
    expect(rendered.content).not.toMatch(/[A-Z]:[\\/]|tmp[\\/]/i);

    const curveGraph = createActionGraphBuilder();
    const curveEntry = curveGraph.node({
      kind: 'startTimeDilation',
      parameters: {
        scope: 'entity',
        durationSeconds: { kind: 'constant', value: 1 },
        slot: 'Test/TimeSlot1',
        priority: 1,
        curve: {
          kind: 'inline',
          keys: [
            {
              time: 0,
              value: 1,
              inTangent: Number.POSITIVE_INFINITY,
              outTangent: Number.NEGATIVE_INFINITY,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
          ],
        },
        finishByAction: false,
        targets: ['caster'],
      },
    });
    const curveNodes = curveGraph.finish().nodes;
    for (const id of Object.keys(curveNodes))
      if (id in definition.actionGraph.main.nodes)
        throw new Error(`fixture node id collides with compiled graph: ${id}`);
    const curveRendered = renderOperatorActiveSkillRuntimeDefinitionSource({
      operatorSlug: 'fixture',
      definition: {
        ...definition,
        actionGraph: {
          main: { nodes: { ...definition.actionGraph.main.nodes, ...curveNodes } },
          macros: definition.actionGraph.macros,
        },
        scheduledSequences: [
          {
            startFrame: 0,
            endFrame: 1,
            sequence: curveEntry,
          },
        ],
      },
    });
    expect(curveRendered.content).toContain('Number.POSITIVE_INFINITY');
    expect(curveRendered.content).toContain('Number.NEGATIVE_INFINITY');
    expect(curveRendered.content).not.toContain('"inTangent": null');
  });

  it('不按技能 key 猜不匹配的费用类型', () => {
    const source = activeSkillFixture('battle');
    (source.castData as Record<string, unknown>).startCdFrame = 0;
    expect(() =>
      compileOperatorActiveSkillRuntimeDefinitionSource({
        key: 'battle',
        skillType: 'battleSkill',
        value: source,
        sourcePath: 'battle.json',
        patch: {
          levels: [1],
          blackboard: {},
          cooldownSeconds: [0],
          costTypes: [0],
          costValues: [100],
        },
        context,
      }),
    ).toThrow('non-zero cost does not match stable skill type');
  });
});
