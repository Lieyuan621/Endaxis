import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import {
  parseAirborneActionSource,
  parseKnockDownActionSource,
  parsePhysicalInflictionActionSource,
} from '../src/source/physicalInflictionActions.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { parseNativeSequenceSource } from '../src/source/controlFlow.ts';
import {
  collectSkillActionReferences,
  parseReferenceAwareActionLeafSource,
} from '../src/source/referenceGraph.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';
import { projectKnockDownAction } from '../src/compiler/actions/knockDownProjection.ts';
import { collectCompiledBuffApplications } from '../src/compiler/references/compiledReferences.ts';
import { projectPhysicalInflictionAction } from '../src/compiler/actions/physicalInflictionProjection.ts';
import { createPhysicalInflictionDefinitionHydrator } from '../src/compiler/actions/physicalInflictionHydration.ts';

const sequence = (actionData: unknown[]) => ({
  actionData,
  onlyExecuteWhenSourceIsMainChar: false,
  onlyExecuteWhenSourceIsGuard: false,
});
function knockDown(overrides: Record<string, unknown> = {}) {
  return {
    $type: 'Beyond.Gameplay.Core.KnockDownAction+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 27,
    source: targetFixture('Source'),
    targetSettings: targetFixture('Context', undefined, 'targets'),
    forceKnockDown: false,
    duration: scalarFixture(1.5),
    faceDirection: {
      directionType: 'TargetToSource',
      sourceMountPoint: 'None',
      targetMountPoint: 'None',
      customSourceAndTarget: false,
      clampToXZ: true,
      invertDirection: false,
    },
    immobilizedTime: 0,
    isExtra: false,
    deadOption: 'AllValid',
    returnTrueWhen: 'Always',
    ...overrides,
  };
}
function physical(kind: 'fracture' | 'crush', overrides: Record<string, unknown> = {}) {
  return {
    $type: `Beyond.Gameplay.Core.${kind === 'fracture' ? 'Fracture' : 'Crush'}Action+Data, Gameplay.Beyond`,
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 12,
    attackerTargetSettings: targetFixture('Owner'),
    targetSettings: targetFixture('Context', undefined, 'targets'),
    blowOffDistance: scalarFixture(3),
    distanceRandomRange: scalarFixture(0),
    overwriteHeight: false,
    blowOffHeight: scalarFixture(0),
    directionSettings: {
      directionType: 'SourceToTarget',
      sourceMountPoint: 'None',
      targetMountPoint: 'None',
      customSourceAndTarget: false,
      clampToXZ: true,
      invertDirection: false,
    },
    totalTime: scalarFixture(3),
    isExtra: false,
    deadOption: 'AllValid',
    ...(kind === 'crush' ? { damageMultiplier: scalarFixture(1), ignoreHitEffect: false } : {}),
    immobilizedTime: 0,
    ...overrides,
  };
}
function airborne(overrides: Record<string, unknown> = {}) {
  return {
    $type: 'Beyond.Gameplay.Core.AirborneAction+AirborneActionData, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 13,
    source: targetFixture('Owner'),
    target: targetFixture('Context', undefined, 'targets'),
    forceAirborne: false,
    floatingDuration: scalarFixture(1.5, 'airborne_duration'),
    floatingHeight: scalarFixture(2),
    speedFactorMultiplier: 3,
    faceDirection: {
      directionType: 'TargetToSource',
      sourceMountPoint: 'None',
      targetMountPoint: 'None',
      customSourceAndTarget: false,
      clampToXZ: true,
      invertDirection: false,
    },
    airborneEffect: { moveType: 'FollowTarget', effectName: '' },
    immobilizedTime: 1,
    isExtra: false,
    deadOption: 'AllValid',
    returnTrueWhen: 'Always',
    ...overrides,
  };
}
function references(action: unknown) {
  return collectSkillActionReferences({
    skillId: 'fixture',
    level: 1,
    durationFrame: 1,
    declaredBlackboard: [],
    actionGroup: {
      passiveEvents: [],
      timelineActions: [
        {
          startFrame: 0,
          endFrame: 1,
          forceSyncAnimation: {
            forceSync: false,
            montageName: '',
            targetFrame: 0,
            playbackSpeed: 1,
          },
          sequence: parseNativeSequenceSource(sequence([action]), 'fixture', {}, (value, path) =>
            parseReferenceAwareActionLeafSource(value, path, {}),
          ),
        },
      ],
    },
  });
}

describe('击倒来源与隐式引用', () => {
  it('读取余烬原生字段形状，不把控制时长改写为 Buff 初始赋值', () => {
    expect(parseKnockDownActionSource(knockDown(), 'fixture', {})).toMatchObject({
      kind: 'knockDown',
      source: { targetSource: 'Source' },
      target: { targetSource: 'Context', targetGroupKey: 'targets' },
      forceKnockDown: false,
      duration: { value: 1.5, blackboardKey: null },
      faceDirection: { directionType: 'TargetToSource', clampToXZ: true },
      immobilizedTime: 0,
      isExtra: false,
      deadOption: 'AllValid',
      returnTrueWhen: 'Always',
    });
    expect(parseKnownNativeActionLeafSource(knockDown(), 'fixture', {}).family).toBe(
      'physicalInfliction',
    );
  });

  it('受控状态和返回策略数字编码不改变完整击倒动作 IR', () => {
    const named = parseKnockDownActionSource(
      knockDown({
        deadOption: 'OnlyAlive',
        returnTrueWhen: 'OnlySuccess',
      }),
      'fixture',
      {},
    );
    expect(
      parseKnockDownActionSource(knockDown({ deadOption: 1, returnTrueWhen: 2 }), 'fixture', {}),
    ).toEqual(named);
  });

  it.each(['Always', 'BothSuccessAndInterrupted', 'OnlySuccess', 'OnlyInterrupted'])(
    '保留返回策略 %s 与运行时黑板引用',
    returnTrueWhen => {
      const action = parseKnockDownActionSource(
        knockDown({
          returnTrueWhen,
          duration: scalarFixture(1.5, 'control_duration'),
          forceKnockDown: true,
          isExtra: true,
        }),
        'fixture',
        { control_duration: [1, 2, 3] },
      );
      expect(action.returnTrueWhen).toBe(returnTrueWhen);
      expect(action.duration).toEqual({
        value: 1.5,
        blackboardKey: 'control_duration',
        levelValues: [1, 2, 3],
      });
      expect(action.forceKnockDown).toBe(true);
      expect(action.isExtra).toBe(true);
    },
  );

  it.each([
    ['returnTrueWhen', 'AnySuccess'],
    ['returnTrueWhen', undefined],
    ['deadOption', 'Any'],
    ['forceKnockDown', 1],
    ['immobilizedTime', '0'],
    ['unexpectedField', true],
  ])('拒绝字段漂移 %s', (key, value) => {
    expect(() => parseKnockDownActionSource(knockDown({ [key]: value }), 'fixture', {})).toThrow(
      key === 'unexpectedField' ? 'unexpected fields' : `fixture.${key}`,
    );
  });

  it('普通击倒同时引入状态与破防 Buff，强制击倒仅略去根破防门', () => {
    expect(references(knockDown())).toMatchObject([
      { kind: 'buff', usage: 'physicalStatus', id: 'buff_physical_knockdown', state: 'active' },
      { kind: 'buff', usage: 'physicalNoGuardGate', id: 'buff_physical_no_guard', state: 'active' },
    ]);
    expect(references(knockDown({ forceKnockDown: true }))).toMatchObject([
      { id: 'buff_physical_knockdown', state: 'active' },
    ]);
  });

  it.each([{ isEnable: false }, { deadOption: 'OnlyDead' }])(
    '保留非活动路径的审计记录 %j',
    overrides => {
      expect(references(knockDown(overrides)).map(ref => ref.state)).toEqual([
        'inactive',
        'inactive',
      ]);
    },
  );

  it('普通倒地输出根动作，不降成无效果或简单事件输出', () => {
    const source = parseNativeSequenceSource(
      sequence([knockDown()]),
      'fixture',
      {},
      (value, path) => parseKnownNativeActionLeafSource(value, path, {}),
    );
    expect(
      compileCombatActionSequenceSource(
        source,
        {
          gameplayTagRegistry: fixtureGameplayTagRegistry,
          actionOwnerTarget: 'caster',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'enemy',
          staticEnemyTargetGroupKeys: new Set(['targets']),
        },
        new Set(),
      ),
    ).toMatchObject({
      steps: [
        {
          kind: 'applyKnockDown',
          parameters: {
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
      ],
    });
  });

  const context = {
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
    staticEnemyTargetGroupKeys: new Set(['targets']),
  } as const;
  it('编译后的根动作仍保留隐式 Buff 依赖及敌方归属', () => {
    const project = (overrides: Record<string, unknown>) =>
      projectKnockDownAction(
        parseKnockDownActionSource(knockDown(overrides), 'fixture', {}),
        'fixture',
        context,
      );
    expect(collectCompiledBuffApplications([project({})])).toEqual([
      { buffId: 'buff_physical_knockdown', target: 'enemy' },
      { buffId: 'buff_physical_no_guard', target: 'enemy' },
    ]);
    expect(collectCompiledBuffApplications([project({ forceKnockDown: true })])).toHaveLength(1);
    expect(collectCompiledBuffApplications([project({ deadOption: 'OnlyDead' })])).toEqual([]);
  });
  it.each([
    ['Always', 'always'],
    ['BothSuccessAndInterrupted', 'successAndInterrupted'],
    ['OnlySuccess', 'success'],
    ['OnlyInterrupted', 'interrupted'],
  ])('投影返回策略 %s，不改变动作的分支语义', (native, projected) => {
    const result = projectKnockDownAction(
      parseKnockDownActionSource(
        knockDown({
          returnTrueWhen: native,
          duration: scalarFixture(0, 'duration'),
          forceKnockDown: true,
        }),
        'fixture',
        {},
      ),
      'fixture',
      context,
    );
    expect(result.parameters).toMatchObject({
      returnWhen: projected,
      force: true,
      duration: { kind: 'blackboard', key: 'duration' },
    });
  });
  it('OnlyDead 保留返回策略，但不对固定存活木桩施加控制', () => {
    expect(
      projectKnockDownAction(
        parseKnockDownActionSource(knockDown({ deadOption: 'OnlyDead' }), 'fixture', {}),
        'fixture',
        context,
      ).parameters.targetFilter,
    ).toBe('skipAll');
  });
  it('拒绝未证明的目标组、Buff 宿主和 extra 上下文', () => {
    const action = parseKnockDownActionSource(knockDown(), 'fixture', {});
    expect(() =>
      projectKnockDownAction(action, 'fixture', {
        ...context,
        staticEnemyTargetGroupKeys: new Set(),
      }),
    ).toThrow('source/target');
    expect(() =>
      projectKnockDownAction(
        parseKnockDownActionSource(knockDown({ source: targetFixture('Owner') }), 'fixture', {}),
        'fixture',
        { ...context, actionOwnerTarget: 'buffOwner' },
      ),
    ).toThrow('source/target');
    expect(() => projectKnockDownAction({ ...action, isExtra: true }, 'fixture', context)).toThrow(
      'extra knock-down',
    );
  });
});

describe('断裂与猛击公共物理异常链', () => {
  const context = {
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
    staticEnemyTargetGroupKeys: new Set(['targets']),
  } as const;

  it.each(['fracture', 'crush'] as const)('严格读取并投影 %s 的公共 Buff 身份', kind => {
    const source = parsePhysicalInflictionActionSource(physical(kind), 'fixture', {}, kind);
    expect(source).toMatchObject({
      kind,
      attacker: { targetSource: 'Owner' },
      target: { targetSource: 'Context', targetGroupKey: 'targets' },
      totalTime: { value: 3 },
      isExtra: false,
    });
    const projected = projectPhysicalInflictionAction(source, 'fixture', context);
    expect(collectCompiledBuffApplications([projected])).toEqual([
      { buffId: 'buff_physical_no_guard', target: 'enemy' },
      {
        buffId: kind === 'fracture' ? 'buff_physical_fracture' : 'buff_physical_crushed',
        target: 'enemy',
      },
    ]);
    expect(projected.parameters.noGuardDefinition.blackboard).toHaveProperty(
      '__compiler_deferred_physical_buff_definition',
    );
  });

  it('猛击保留运行时倍率与 hit-effect 控制，最终装配按 ID 内联真实蓝图', () => {
    const projected = projectPhysicalInflictionAction(
      parsePhysicalInflictionActionSource(
        physical('crush', {
          damageMultiplier: scalarFixture(0, 'crush_multiplier'),
          ignoreHitEffect: true,
        }),
        'fixture',
        {},
        'crush',
      ),
      'fixture',
      context,
    );
    expect(projected.parameters).toMatchObject({
      type: 'crush',
      damageMultiplier: { kind: 'blackboard', key: 'crush_multiplier' },
      ignoreHitEffect: true,
    });
    const definition = (marker: number) => ({
      stackingType: 'unlimited' as const,
      priority: marker,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    });
    const hydrate = createPhysicalInflictionDefinitionHydrator({
      buff_physical_no_guard: definition(10),
      buff_physical_crushed: definition(20),
    });
    expect(hydrate(projected).parameters).toMatchObject({
      noGuardDefinition: { priority: 10 },
      crushedDefinition: { priority: 20 },
    });
  });

  it('拒绝死亡目标分支与未证明的敌人目标组', () => {
    const dead = parsePhysicalInflictionActionSource(
      physical('fracture', { deadOption: 'OnlyDead' }),
      'fixture',
      {},
      'fracture',
    );
    expect(() => projectPhysicalInflictionAction(dead, 'fixture', context)).toThrow(
      'dead-only physical infliction',
    );
    const source = parsePhysicalInflictionActionSource(
      physical('fracture'),
      'fixture',
      {},
      'fracture',
    );
    expect(() =>
      projectPhysicalInflictionAction(source, 'fixture', {
        ...context,
        staticEnemyTargetGroupKeys: new Set(),
      }),
    ).toThrow('attacker/target');
  });
});

describe('浮空公共物理异常链', () => {
  const context = {
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
    staticEnemyTargetGroupKeys: new Set(['targets']),
  } as const;

  it('严格保留控制参数并投影破防、状态 Buff 与返回策略', () => {
    const source = parseAirborneActionSource(
      airborne({ returnTrueWhen: 'OnlySuccess' }),
      'fixture',
      { airborne_duration: [1.5, 2] },
    );
    expect(source).toMatchObject({
      kind: 'airborne',
      source: { targetSource: 'Owner' },
      target: { targetSource: 'Context', targetGroupKey: 'targets' },
      floatingDuration: { blackboardKey: 'airborne_duration', levelValues: [1.5, 2] },
      floatingHeight: { value: 2 },
      speedFactorMultiplier: 3,
      airborneEffect: { moveType: 'FollowTarget' },
    });
    const projected = projectPhysicalInflictionAction(source, 'fixture', context);
    expect(projected.parameters).toMatchObject({
      type: 'airborne',
      duration: { kind: 'blackboard', key: 'airborne_duration' },
      height: { kind: 'constant', value: 2 },
      speedFactorMultiplier: 3,
      force: false,
      targetFilter: 'aliveOnly',
      returnWhen: 'success',
    });
    expect(collectCompiledBuffApplications([projected])).toEqual([
      { buffId: 'buff_physical_no_guard', target: 'enemy' },
      { buffId: 'buff_physical_airborne', target: 'enemy' },
    ]);
  });

  it('强制浮空不引入根破防引用，OnlyDead 保留为固定木桩跳过', () => {
    expect(references(airborne({ forceAirborne: true }))).toMatchObject([
      { id: 'buff_physical_airborne', state: 'active' },
    ]);
    const projected = projectPhysicalInflictionAction(
      parseAirborneActionSource(airborne({ deadOption: 'OnlyDead' }), 'fixture', {}),
      'fixture',
      context,
    );
    expect(projected.parameters).toMatchObject({ targetFilter: 'skipAll', returnWhen: 'always' });
  });
});
