import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { compileActiveSkillRuntimeProjectionSource } from '../src/compiler/skills/activeSkillRuntimeProjection.ts';
import {
  BUFF_ACTION_CONTEXT,
  type CombatActionProjectionContextSource,
} from '../src/compiler/combatProjectionCommon.ts';
import { withProjectionGraph } from './support/projectionContext.ts';
import { activeSkillFixture, scalarFixture, targetFixture } from './sourceFixtures.ts';

function createActiveContext(): CombatActionProjectionContextSource {
  return withProjectionGraph({
    gameplayTagRegistry: fixtureGameplayTagRegistry,
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
  });
}

// 秋栗连携的原生形状：Sub/Level 中 Level 只是非 Specific 路径未使用的字段。
function snapshotAction(overrides: Record<string, unknown> = {}) {
  return {
    $type: 'Beyond.Gameplay.Core.StoreAttributeValue+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 20,
    targetSettings: { ...targetFixture('Owner'), target: 'ActionOwner' },
    primaryAttributeType: 'Sub',
    attributeType: 'Level',
    storeAttributeType: 'FinalNonConverted',
    useFloor: false,
    divisorValue: scalarFixture(1),
    multiplierValue: scalarFixture(1, 'sub_ratio'),
    baseValue: scalarFixture(1),
    key: 'atb_up',
    ...overrides,
  };
}

function project(overrides: Record<string, unknown> = {}, context = createActiveContext()) {
  const skill = activeSkillFixture();
  skill.blackboard = [{ key: 'sub_ratio', valueDouble: 0.02, valueStr: '', isDynamic: false }];
  skill.actionGroupData = {
    timelineActions: [
      {
        _startFrame: 5,
        _endFrame: 8,
        _sequenceActionData: {
          actionData: [snapshotAction(overrides)],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        forceSyncAnimData: { forceSync: false, montageName: '', targetFrame: 0, playbackSpeed: 1 },
      },
    ],
    passiveEventActions: [],
  };
  const projected = compileActiveSkillRuntimeProjectionSource({
    value: skill,
    sourcePath: 'snapshot',
    patch: null,
    context,
  });
  const entry = projected.scheduledSequences[0]!.sequence.$sequence;
  return entry === null ? undefined : projected.actionGraph.main.nodes[entry]?.action;
}

describe('公共属性快照投影', () => {
  it.each(['Owner', 'Source'])('%s 读取施术者副属性，不把 Level 或黑板当前值固化进结果', target => {
    expect(project({ targetSettings: targetFixture(target) })).toEqual({
      kind: 'storeSourceAttributeValue',
      parameters: {
        attribute: { kind: 'secondary' },
        stage: 'finalNonConverted',
        useFloor: false,
        divisor: { kind: 'constant', value: 1 },
        multiplier: { kind: 'blackboard', key: 'sub_ratio' },
        base: { kind: 'constant', value: 1 },
        targetKey: 'atb_up',
      },
    });
  });

  it('保留取整、除数和装备非转换属性阶段', () => {
    expect(
      project({
        storeAttributeType: 'BaseNonConverted',
        useFloor: true,
        divisorValue: scalarFixture(4),
      }),
    ).toMatchObject({
      parameters: {
        attribute: { kind: 'secondary' },
        stage: 'armedNonConverted',
        useFloor: true,
        divisor: { kind: 'constant', value: 4 },
      },
    });
  });

  it('Buff 宿主的 Source 复用相同投影，但不把 Buff Owner 当成来源', () => {
    expect(
      project(
        { targetSettings: targetFixture('Source') },
        withProjectionGraph(BUFF_ACTION_CONTEXT),
      ),
    ).toMatchObject({ parameters: { attribute: { kind: 'secondary' } } });
    expect(() => project({}, withProjectionGraph(BUFF_ACTION_CONTEXT))).toThrow(
      'unsupported attribute snapshot target',
    );
  });

  it('保留原有 Specific/MaxHp 支持', () => {
    expect(project({ primaryAttributeType: 'Specific', attributeType: 'MaxHp' })).toMatchObject({
      parameters: { attribute: { kind: 'specific', key: 'maxHealth' } },
    });
  });

  it('Specific 四维属性通过公共属性映射读取，不固化当前面板', () => {
    expect(project({ primaryAttributeType: 'Specific', attributeType: 'Wisd' })).toMatchObject({
      parameters: { attribute: { kind: 'specific', key: 'intellect' } },
    });
  });

  it('Specific/Level 不能误走 Sub 的忽略字段路径', () => {
    expect(() => project({ primaryAttributeType: 'Specific' })).toThrow(
      'unsupported attribute snapshot target or selector',
    );
  });

  it.each(['Target'])('仍拒绝未支持的属性目标 %s', target => {
    expect(() => project({ targetSettings: targetFixture(target) })).toThrow(
      'unsupported attribute snapshot target or selector',
    );
  });

  it('Group 不是原生 TargetSource，必须在来源边界拒绝', () => {
    expect(() => project({ targetSettings: targetFixture('Group') })).toThrow(
      'targetSource: unknown native enum',
    );
  });

  it('Owner 身份不可用时不能借用 Source', () => {
    expect(() =>
      project(
        {},
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          ...createActiveContext(),
          actionOwnerTarget: 'unavailable',
        },
      ),
    ).toThrow('action Owner projection is unavailable');
  });

  it('接收侧 Buff 的 buffSource 尚未投影时仍阻断', () => {
    expect(() =>
      project(
        { targetSettings: targetFixture('Source') },
        withProjectionGraph({
          ...BUFF_ACTION_CONTEXT,
          actionSourceTarget: 'buffSource',
        }),
      ),
    ).toThrow('unsupported attribute snapshot target or selector');
  });
});
