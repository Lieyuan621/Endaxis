import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';

import { compileBuffLeafNode } from '../src/compiler/actions/combatEntityAndTimeProjection.ts';
import {
  canOmitUnusedNativeCondition,
  compileEventCondition,
} from '../src/compiler/conditions/combatConditionProjection.ts';
import {
  isDynamicSingleEnemyTagTargetGroup,
  isStaticSingleEnemyTargetGroup,
  type CombatActionProjectionContextSource,
} from '../src/compiler/combatProjectionCommon.ts';
import {
  parseKnownNativeActionLeafSource,
  parseKnownNativeActionSequenceSource,
} from '../src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../packages/game-data-contract/src/conditions.ts';

const META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

const ACTIVE_SKILL_CONTEXT: CombatActionProjectionContextSource = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'enemy',
  staticEnemyTargetGroupKeys: new Set(['tar']),
};

function node(value: ReturnType<typeof parseKnownNativeActionLeafSource>) {
  return {
    sourcePath: 'fixture.action',
    metadata: {
      nativeType: 'Example.fixture+Data, Example',
      nativeName: 'fixture',
      enabled: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 1,
    },
    body: { kind: 'leaf' as const, value },
  };
}

function blowOff(deadOption: string | number) {
  return parseKnownNativeActionLeafSource(
    {
      ...META,
      $type: 'Beyond.Gameplay.Core.BlowOffEnemyAction+Data, Gameplay.Beyond',
      attackerTargetSettings: targetFixture('Owner'),
      targetSettings: targetFixture('Context', undefined, 'tar'),
      blowOffDistance: scalarFixture(3.2),
      distanceRandomRange: scalarFixture(0.2),
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
      totalTime: scalarFixture(0),
      isExtra: false,
      deadOption,
    },
    'fixture.action',
    {},
  );
}

it('木桩控制动作使用与物理异常相同的原生死活枚举读取器', () => {
  expect(blowOff(0)).toEqual(blowOff('AllValid'));
  expect(blowOff(2)).toEqual(blowOff('OnlyDead'));
  expect(() => blowOff(3)).toThrow('deadOption');
});

describe('施法输入限制与木桩物理控制投影', () => {
  const pull = {
    ...META,
    $type: 'Beyond.Gameplay.Core.PullAction+Data, Gameplay.Beyond',
    targetSettings: targetFixture('Context', undefined, 'tar'),
    destination: targetFixture('Owner'),
    pullSpeedUseBb: false,
    pullSpeed: 1,
    pullSpeedBb: '',
    isInfinity: false,
    pullDuration: 1,
    stopTolerance: 0,
    unmovable: false,
    finishPullByAction: false,
    pullTargetType: 'All',
    fixedDistanceMode: false,
    attenuationBySuperArmor: false,
    attenuationValues: [],
  };

  it('Pull 默认返回分支沿用既有固定敌人投影，不增加位移步骤', () => {
    const old = parseKnownNativeActionLeafSource(pull, 'fixture.action', {});
    const current = parseKnownNativeActionLeafSource(
      { ...pull, alwaysNext: false },
      'fixture.action',
      {},
    );
    expect(current).toEqual(old);
    expect(
      compileBuffLeafNode(node(current), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toMatchObject({ steps: [] });
  });

  it.each([0, 'false', null, undefined])('Pull 非法返回策略继续阻断 %j', alwaysNext => {
    expect(() =>
      parseKnownNativeActionLeafSource({ ...pull, alwaysNext }, 'fixture.action', {}),
    ).toThrow('alwaysNext');
  });

  it.each([false, true])('Pull 仍不能把队伍目标误当作固定敌人消除，alwaysNext=%s', alwaysNext => {
    const source = parseKnownNativeActionLeafSource(
      { ...pull, alwaysNext, targetSettings: targetFixture('Owner') },
      'fixture.action',
      {},
    );
    expect(() =>
      compileBuffLeafNode(node(source), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toThrow('unsupported static-enemy control projection');
  });

  it('Pull 来源保留继续策略，省略位移后保留前后有效动作的顺序', () => {
    const parse = (actionData: unknown[]) =>
      parseKnownNativeActionSequenceSource(
        {
          actionData,
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        'sequence',
        {},
      );
    const write = (key: string) => ({
      ...META,
      $type: 'Beyond.Gameplay.Core.SimpleCalcBBAction+Data, Gameplay.Beyond',
      key,
      operation: 'Add',
      value1: scalarFixture(1),
      value2: scalarFixture(2),
    });
    const current = {
      ...pull,
      alwaysNext: true,
      destination: targetFixture('Context', undefined, 'mainPos'),
    };
    expect(parseKnownNativeActionLeafSource(current, 'pull', {})).toMatchObject({
      family: 'stumpControl',
      action: { kind: 'pull', alwaysNext: true },
    });
    expect(
      compileCombatActionSequenceSource(
        parse([write('before'), current, write('after')]),
        ACTIVE_SKILL_CONTEXT,
      ),
    ).toEqual(
      compileCombatActionSequenceSource(
        parse([write('before'), write('after')]),
        ACTIVE_SKILL_CONTEXT,
      ),
    );
  });

  it('Pull 的继续选项不放开未知目标组或作为条件求值的用途', () => {
    const parse = (actionData: unknown[]) =>
      parseKnownNativeActionSequenceSource(
        {
          actionData,
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        'sequence',
        {},
      );
    expect(() =>
      compileCombatActionSequenceSource(
        parse([
          {
            ...pull,
            alwaysNext: true,
            targetSettings: targetFixture('Context', undefined, 'unknown'),
          },
        ]),
        ACTIVE_SKILL_CONTEXT,
      ),
    ).toThrow('unsupported static-enemy control projection');
    const source = parse([
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.IfElseAction+IfElseActionData, Gameplay.Beyond',
        conditionAction: {
          actionData: [{ ...pull, alwaysNext: true }],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        succeedActions: {
          actionData: [],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        failActions: {
          actionData: [],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        alwaysNext: true,
      },
    ]);
    expect(() => compileCombatActionSequenceSource(source, ACTIVE_SKILL_CONTEXT)).toThrow(
      'expected a condition-only sequence',
    );
  });

  it('只把已证明的 Buff Owner 职业筛选投影为干员定位条件', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckProfession+Data, Gameplay.Beyond',
        checkTarget: targetFixture('Owner'),
        professionCategories: 'Guard, Supporter, Caster',
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        {
          actionOwnerTarget: 'buffOwner',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'eventTarget',
        },
        new Map(),
      ),
    ).toEqual({
      kind: 'operatorRoleIn',
      target: 'buffOwner',
      roles: ['guard', 'supporter', 'caster'],
    });
  });

  it('能力实体 Buff 的 Source 生命条件读取已证明的施法干员', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckHp+Data, Gameplay.Beyond',
        hpOwner: targetFixture('Source'),
        compare: 'LE',
        isRatio: true,
        value: scalarFixture(0),
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        {
          actionOwnerTarget: 'buffOwner',
          actionSourceTarget: 'caster',
          actionTargetTarget: 'currentAbilityEntity',
          fixedBuffOwnerTarget: 'currentAbilityEntity',
          fixedBuffSourceTarget: 'caster',
        },
        new Map(),
      ),
    ).toEqual({
      kind: 'healthCompare',
      target: 'caster',
      valueType: 'ratio',
      operator: 'lessOrEqual',
      value: { kind: 'constant', value: 0 },
    });
  });

  it('仅在动作环境来源施法已闭环时保留 Buff 查询的施法实例限制', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.CheckBuffStackNumAdvanced+Data, Gameplay.Beyond',
        checkTarget: targetFixture('Target'),
        buffSettings: {
          checkType: 'Id',
          buffIdList: ['buff_test_same_cast'],
          tagQuery: { queryType: 'HasAny', tags: [] },
        },
        buffStackNumType: 'BuffCount',
        compareType: 'LT',
        value: scalarFixture(2),
        limitSkillCastId: true,
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, actionEnvironmentSkillCastInfoIsSourceCast: true },
        new Map(),
      ),
    ).toEqual({
      kind: 'buffIdStackCompare',
      target: 'enemy',
      buffIds: ['buff_test_same_cast'],
      operator: 'less',
      value: { kind: 'constant', value: 2 },
      sameSourceSkillCast: true,
    });
    expect(() => compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toThrow(
      'unsupported event target Buff count condition',
    );
  });

  it('主控到能力实体 Context 的零距离条件仍保留空组失败语义', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.CheckDistanceCondition+Data, Gameplay.Beyond',
        source: targetFixture('MainCharacter'),
        target: targetFixture('Context', undefined, 'center_entity'),
        distance: 8,
        lessThan: true,
        includeTargetRadius: false,
        containsHittableObj: false,
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        ACTIVE_SKILL_CONTEXT,
        new Map([['center_entity', 'abilityEntity']]),
      ),
    ).toEqual({
      kind: 'all',
      conditions: [
        {
          kind: 'contextTargetCountCompare',
          contextKey: 'center_entity',
          operator: 'greater',
          value: 0,
        },
        {
          kind: 'actionValueCompare',
          left: { kind: 'constant', value: 0 },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 8 },
        },
      ],
    });
  });

  it('能力实体子技能可在 Owner 自身创建实体时钟定时标记', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.CreateTimedMarker+Data, Gameplay.Beyond',
        targetSettings: targetFixture('Owner'),
        markerId: { useBlackboardKey: false, value: 'self_marker', blackboardKey: '' },
        duration: scalarFixture(4),
        autoFinishByAction: true,
        useTimeDilationDt: true,
      },
      'fixture.action',
      {},
    );
    expect(
      compileBuffLeafNode(node(action), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        actionOwnerTarget: 'currentAbilityEntity',
        actionTargetTarget: 'currentAbilityEntity',
      }),
    ).toEqual({
      steps: [
        {
          kind: 'createAbilityEntityTimedMarker',
          parameters: {
            markerId: 'self_marker',
            durationSeconds: { kind: 'constant', value: 4 },
            autoFinishByAction: true,
            timeDomain: 'self',
          },
        },
      ],
      state: new Map(),
    });
  });

  it('把主动技能 CheckSkillHasHit 投影为本次技能实例的命中状态', () => {
    const action = {
      family: 'condition' as const,
      action: { kind: 'skillHasHit' as const, sourceType: 'CheckSkillHasHit' },
    } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>;
    expect(
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, timelineRange: { startFrame: 12, endFrame: 13 } },
        new Map(),
      ),
    ).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY },
      operator: 'greater',
      right: { kind: 'constant', value: 0 },
    });
    expect(() => compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toThrow(
      'CheckSkillHasHit requires an active skill timeline context',
    );
  });

  it('允许在已证明的唯一木桩 Context 上读取超级护甲', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckSuperArmor+Data, Gameplay.Beyond',
        checkTarget: targetFixture('Context', undefined, 'tar'),
        compareType: 'GT',
        value: scalarFixture(10),
      },
      'fixture.action',
      {},
    );
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'enemySuperArmorCompare',
      operator: 'greater',
      value: { kind: 'constant', value: 10 },
    });
  });

  it('允许主动技能在已证明的唯一敌人 Target 上读取敌人等级', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckEnemyRank+Data, Gameplay.Beyond',
        target: targetFixture('Target'),
        enemyRankSet: 'Elite, Boss',
      },
      'fixture.action',
      {},
    );
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'enemyRankIn',
      ranks: ['elite', 'boss'],
    });
    const contextAction = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckEnemyRank+Data, Gameplay.Beyond',
        target: targetFixture('Context', undefined, 'smart_target'),
        enemyRankSet: 'Elite',
      },
      'fixture.contextAction',
      {},
    );
    expect(
      compileEventCondition(
        node(contextAction),
        {
          ...ACTIVE_SKILL_CONTEXT,
          staticEnemyTargetGroupKeys: new Set(['smart_target']),
        },
        new Map(),
      ),
    ).toEqual({ kind: 'enemyRankIn', ranks: ['elite'] });
    expect(() =>
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, actionTargetTarget: 'caster' },
        new Map(),
      ),
    ).toThrow('enemy rank condition requires a proven enemy target');
  });

  it('敌人动作 Target 不会污染 Owner 上的全局冷却条件宿主', () => {
    const action = {
      family: 'condition' as const,
      action: {
        kind: 'globalCooldown' as const,
        sourceType: 'CheckGlobalCDTimerAction',
        targetSource: 'Owner',
        targetGroupKey: '',
        buffId: 'buff_chr_0031_mifu_shield',
      },
    } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>;
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'not',
      condition: {
        kind: 'globalCooldownPresent',
        target: 'caster',
        markerId: 'buff_chr_0031_mifu_shield',
      },
    });

    const application = {
      family: 'globalCooldown' as const,
      action: {
        kind: 'globalCooldownApplication' as const,
        target: { targetSource: 'Owner', targetGroupKey: '' },
        buffId: 'buff_chr_0031_mifu_shield',
        duration: { value: 1, blackboardKey: null, levelValues: null },
      },
    } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>;
    expect(
      compileBuffLeafNode(node(application), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toEqual({
      steps: [
        {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'caster',
            markerId: 'buff_chr_0031_mifu_shield',
            durationSeconds: { kind: 'constant', value: 1 },
          },
        },
      ],
      state: new Map(),
    });
  });

  it('在已执行的 OwnerSpawned 查询 Context 上读取能力实体 TimedMarker', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTimedMarkerCondition+Data, Gameplay.Beyond',
        checkTarget: targetFixture('Context', undefined, 'water_group'),
        id: 'tangtang_waterabilityentity01',
        blackboardKey: '',
        useBlackboardKey: false,
        returnTrueIfNotExists: false,
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        ACTIVE_SKILL_CONTEXT,
        new Map([['water_group', 'abilityEntity']]),
      ),
    ).toEqual({
      kind: 'abilityEntityTimedMarkerPresent',
      contextKey: 'water_group',
      markerId: 'tangtang_waterabilityentity01',
    });
    expect(() => compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toThrow(
      'unsupported timed marker condition',
    );
  });

  it('只消去已证明唯一敌人且 Always 返回的 LaunchUpwardAction', () => {
    const source = {
      family: 'stumpControl' as const,
      action: {
        kind: 'launchUpward' as const,
        source: { targetSource: 'Owner', targetGroupKey: '' },
        target: { targetSource: 'Context', targetGroupKey: 'tar' },
        teammateBigStagger: false,
        floatingDuration: { value: 0.8, blackboardKey: null },
        floatingHeight: { value: 1.6, blackboardKey: null },
        speedFactorMultiplier: 5,
        faceDirection: {
          directionType: 'TargetToSource',
          sourceMountPoint: 'None',
          targetMountPoint: 'None',
          customSourceAndTarget: true,
          clampToXZ: true,
          invertDirection: false,
          source: { targetSource: 'Context', targetGroupKey: 'pos' },
          target: { targetSource: 'Context', targetGroupKey: 'tar' },
        },
        airborneEffect: {},
        immobilizedTime: 0,
        deadOption: 'AllValid',
        returnTrueWhen: 'Always',
      },
    } as ReturnType<typeof parseKnownNativeActionLeafSource>;

    expect(compileBuffLeafNode(node(source), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map(),
    });
    expect(() =>
      compileBuffLeafNode(
        node({
          ...source,
          action: { ...source.action, returnTrueWhen: 'OnlySuccess' },
        } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>),
        new Set(),
        new Map(),
        ACTIVE_SKILL_CONTEXT,
      ),
    ).toThrow('unsupported LaunchUpward stump projection');
  });

  it('唯一木桩模型允许 HitBox 显式包含死亡普通敌人，但不接受未解析存活字段', () => {
    const hitBox = {
      producerType: 'FindTargetAction',
      finderType: 'HitBoxFinder',
      finderFactionTarget: 'Anti',
      finderTargetObjectType: 'Normal',
      finderCheckAlive: false,
      validatorTypes: [],
      postProcessorTypes: [],
      priorityFilters: [],
    };
    expect(isStaticSingleEnemyTargetGroup(hitBox as never)).toBe(true);
    expect(isStaticSingleEnemyTargetGroup({ ...hitBox, finderCheckAlive: null } as never)).toBe(
      false,
    );
    expect(
      isStaticSingleEnemyTargetGroup({
        ...hitBox,
        finderTargetObjectType: 'NoInteractive',
      } as never),
    ).toBe(true);
    expect(
      isStaticSingleEnemyTargetGroup({ ...hitBox, finderTargetObjectType: 'Interactive' } as never),
    ).toBe(false);
  });

  it('无 Buff 过滤且至少保留一个目标的 PriorityFilter 不会改变唯一木桩集合', () => {
    const hitBox = {
      producerType: 'FindTargetAction',
      finderType: 'HitBoxFinder',
      finderFactionTarget: 'Anti',
      finderTargetObjectType: 'Normal',
      finderCheckAlive: true,
      validatorTypes: [],
      postProcessorTypes: ['PriorityFilter'],
      priorityFilters: [
        {
          filterType: 'DistanceFromCenterAsc',
          onlyReserveMaxPriorityTargets: false,
          limitMaxNum: true,
          maxNum: 1,
          buffFilter: {
            checkType: 'Id',
            buffIds: [],
            tagQuery: { queryType: 'hasAny', tagIds: [] },
            stackCountType: 'BuffCount',
          },
        },
      ],
    };
    expect(isStaticSingleEnemyTargetGroup(hitBox as never)).toBe(true);
    expect(
      isStaticSingleEnemyTargetGroup({
        ...hitBox,
        priorityFilters: [{ ...hitBox.priorityFilters[0], maxNum: 0 }],
      } as never),
    ).toBe(false);
  });

  it('AllEnemy 和已选 Typhoea 目标在唯一活体敌人模型下折叠为同一木桩', () => {
    const base = {
      producerType: 'FindTargetAction',
      validatorTypes: [],
      postProcessorTypes: [],
      priorityFilters: [],
    };
    expect(isStaticSingleEnemyTargetGroup({ ...base, finderType: 'AllEnemyFinder' } as never)).toBe(
      true,
    );
    expect(
      isStaticSingleEnemyTargetGroup({
        ...base,
        finderType: 'TyphoeaArcherySelectedFinder',
      } as never),
    ).toBe(true);
  });

  it('屏幕可见性与非负距离上限在固定零空间模型下不排除木桩', () => {
    const write = {
      producerType: 'FindTargetAction',
      finderType: 'AllEnemyFinder',
      validatorTypes: ['InScreenValidator', 'DistanceValidator'],
      distanceValidators: [
        {
          compareType: 'LE',
          threshold: { value: 30, blackboardKey: null, levelValues: null },
        },
      ],
      postProcessorTypes: [],
      priorityFilters: [],
    };
    expect(isStaticSingleEnemyTargetGroup(write as never)).toBe(true);
    expect(
      isStaticSingleEnemyTargetGroup({
        ...write,
        distanceValidators: [
          {
            compareType: 'LT',
            threshold: { value: 0.01, blackboardKey: null, levelValues: null },
          },
        ],
      } as never),
    ).toBe(true);
    expect(
      isStaticSingleEnemyTargetGroup({
        ...write,
        distanceValidators: [
          {
            compareType: 'LT',
            threshold: { value: 0, blackboardKey: null, levelValues: null },
          },
        ],
      } as never),
    ).toBe(false);
    expect(
      isStaticSingleEnemyTargetGroup({
        ...write,
        distanceValidators: [
          {
            compareType: 'GE',
            threshold: { value: 30, blackboardKey: null, levelValues: null },
          },
        ],
      } as never),
    ).toBe(false);
  });

  it('唯一木桩上的 TagValidator 保留为运行时动态目标组筛选', () => {
    const base = {
      producerType: 'FindTargetAction' as const,
      targetGroupKey: 'fire_inflicted',
      finderType: 'HitBoxFinder',
      finderFactionTarget: 'Anti',
      finderTargetObjectType: 'Normal',
      finderCheckAlive: true,
      finderShape: null,
      finderOwnerPartsQuery: null,
      validatorTypes: ['TagValidator'],
      postProcessorTypes: [],
      inputTargets: [],
      intervalSeconds: null,
      finderSpawnedObjectType: null,
      validatorTagQueries: [['HasAny', [-1369794537]]] as const,
      finderFixedPointSnapToNavmesh: null,
      center: 'ActionSource',
      centerContextKey: '',
      selectorOwner: 'ActionOwner',
      selectorOwnerContextKey: '',
      directionTarget: 'ActionSource',
      directionContextKey: '',
      characterTeamSelection: null,
      excludesCurrentTarget: false,
      excludesOwner: false,
      smartTargetFallsBackToMainTarget: false,
      distanceValidatorsPassAtZero: true,
      priorityFilterMaxTargets: null,
      priorityFilters: [],
      shuffleTargets: [],
      distanceValidators: [],
      circularOrderIndexKey: null,
      circularOrderDesiredCount: null,
      circularOrderReverseFlag: null,
      circularOrderHeightOffset: null,
      circularOrderRangeThreshold: null,
      circularOrderRangeCheckTarget: null,
      pickIndexValue: null,
      pickIndexBlackboardKey: null,
    };
    expect(isStaticSingleEnemyTargetGroup(base as never)).toBe(false);
    expect(isDynamicSingleEnemyTagTargetGroup(base as never)).toBe(true);
    const action = { family: 'targetGroup' as const, action: base } as ReturnType<
      typeof parseKnownNativeActionLeafSource
    >;

    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [
        {
          kind: 'conditional',
          parameters: {
            condition: {
              kind: 'entityTagMatch',
              target: 'enemy',
              tagQueryType: 'hasAny',
              tags: ['Test/Tag123'],
            },
          },
          whenTrue: {
            steps: [
              {
                kind: 'mergeContextTargets',
                parameters: {
                  saveToContextKey: 'fire_inflicted',
                  sources: [{ kind: 'target', target: 'enemy' }],
                },
              },
            ],
          },
          whenFalse: {
            steps: [
              {
                kind: 'mergeContextTargets',
                parameters: { saveToContextKey: 'fire_inflicted', sources: [] },
              },
            ],
          },
        },
      ],
      state: new Map([['fire_inflicted', 'dynamicEnemy']]),
    });
  });

  it('技能动作 Owner 已证明为施术者时，可作为元素附着来源', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.SpellInfliction+Data, Gameplay.Beyond',
        source: targetFixture('Owner'),
        target: targetFixture('Target', undefined, 'stale_targets'),
        inflictionType: 'Fire',
        isExtra: false,
      },
      'fixture.action',
      {},
    );
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [
        {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
      ],
      state: new Map(),
    });
  });

  it('唯一木桩输入 Target 与无过滤 MainTargetFinder 恒指向同一敌人', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetsEqual+Data, Gameplay.Beyond',
        firstTargetSettings: targetFixture('Target'),
        secondTargetSettings: targetFixture('InstantSearch', {
          finderData: { $type: 'Example.Selector+MainTargetFinder+Data, Example' },
          validatorData: [],
          postProcessorData: [],
        }),
      },
      'fixture.action',
      {},
    );
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'equal',
      right: { kind: 'constant', value: 1 },
    });
  });

  it('唯一木桩输入 Target 与直接 MainTarget 来源恒指向同一敌人', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetsEqual+Data, Gameplay.Beyond',
        firstTargetSettings: targetFixture('Target'),
        secondTargetSettings: targetFixture('MainTarget'),
      },
      'fixture.action',
      {},
    );
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'equal',
      right: { kind: 'constant', value: 1 },
    });
  });

  it('已证明由主控干员持有的 Buff 中 Owner 与 MainCharacter 恒为同一实例', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetsEqual+Data, Gameplay.Beyond',
        firstTargetSettings: targetFixture('Owner'),
        secondTargetSettings: targetFixture('MainCharacter'),
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, actionOwnerTarget: 'buffOwner', fixedBuffOwnerTarget: 'caster' },
        new Map(),
      ),
    ).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'equal',
      right: { kind: 'constant', value: 1 },
    });
  });

  it('Channeling 当前 Target 与已证明敌人 Context 保持同一木桩身份', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetsEqual+Data, Gameplay.Beyond',
        firstTargetSettings: targetFixture('Target', undefined, 'stale_tar'),
        secondTargetSettings: targetFixture('Context', undefined, 'smart_target'),
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, staticEnemyTargetGroupKeys: new Set(['smart_target']) },
        new Map(),
      ),
    ).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'equal',
      right: { kind: 'constant', value: 1 },
    });
  });

  it('目标包含条件没有写回副作用，可随纯表现空分支一同省略', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetContains+Data, Gameplay.Beyond',
        parentTargetSettings: targetFixture('Context', undefined, 'targets'),
        childTargetSettings: targetFixture('Target'),
      },
      'fixture.action',
      {},
    );
    expect(canOmitUnusedNativeCondition(node(action))).toBe(true);
  });

  it('屏幕内条件只保留相机查询目标且可随空间表现分支省略', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetInScreen+Data, Gameplay.Beyond',
        targetSettings: targetFixture('Owner'),
      },
      'fixture.action',
      {},
    );
    expect(action).toMatchObject({
      family: 'condition',
      action: { kind: 'targetInScreen', target: { targetSource: 'Owner' } },
    });
    expect(canOmitUnusedNativeCondition(node(action))).toBe(true);
  });

  it('跨调度段保留的唯一木桩 Context 仍包含主动技能输入 Target', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetContains+Data, Gameplay.Beyond',
        parentTargetSettings: targetFixture('Context', undefined, 'tar'),
        childTargetSettings: targetFixture('Target'),
      },
      'fixture.action',
      {},
    );
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'equal',
      right: { kind: 'constant', value: 1 },
    });
  });

  it('Channeling 当前唯一木桩 Target 包含同 tick MainTarget Context', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetContains+Data, Gameplay.Beyond',
        parentTargetSettings: targetFixture('Target', undefined, 'stale_tar'),
        childTargetSettings: targetFixture('Context', undefined, 'MainTar'),
      },
      'fixture.action',
      {},
    );
    expect(
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, staticEnemyTargetGroupKeys: new Set(['MainTar']) },
        new Map(),
      ),
    ).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'equal',
      right: { kind: 'constant', value: 1 },
    });
  });

  it('唯一木桩没有原生死亡标记，Target 存活过滤仍保留同一敌人', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
        checkTarget: targetFixture('Target'),
        minNum: 1,
        containsHittableTarget: false,
        compareType: 'GE',
        excludeDeadEntity: true,
        storeKey: '',
      },
      'fixture.action',
      {},
    );
    expect(compileEventCondition(node(action), ACTIVE_SKILL_CONTEXT, new Map())).toEqual({
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 1 },
      operator: 'greaterOrEqual',
      right: { kind: 'constant', value: 1 },
    });
  });

  it.each([
    ['输入目标的序列化残留组名', targetFixture('Target', undefined, 'stale_target'), new Map()],
    [
      '已解析空间点',
      targetFixture('Context', undefined, 'target_position'),
      new Map([['target_position', 'spatialPoint' as const]]),
    ],
  ])('零空间距离允许%s作为已证明端点', (_name, target, groups) => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.SaveTargetDistanceAction+Data, Gameplay.Beyond',
        source: targetFixture('Owner'),
        target,
        bbKey: 'effect_z_scale',
      },
      'fixture.action',
      {},
    );
    expect(compileBuffLeafNode(node(action), new Set(), groups, ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [
        {
          kind: 'modifyActionValue',
          parameters: {
            key: 'effect_z_scale',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
      ],
      state: groups,
    });
  });

  it('零空间距离允许主动技能入口已经证明的 smart_target 作为端点', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.SaveTargetDistanceAction+Data, Gameplay.Beyond',
        source: targetFixture('Owner'),
        target: targetFixture('Context', undefined, 'smart_target'),
        bbKey: 'distance',
      },
      'fixture.action',
      {},
    );
    expect(
      compileBuffLeafNode(node(action), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        staticEnemyTargetGroupKeys: new Set(['smart_target']),
      }),
    ).toEqual({
      steps: [
        {
          kind: 'modifyActionValue',
          parameters: {
            key: 'distance',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
      ],
      state: new Map(),
    });
  });

  it('无 DamageUnit 且始终继续的环境命中特效不进入木桩数值模拟', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.DamageAction+Data, Gameplay.Beyond',
        alwaysNext: true,
        attacker: 'ActionSource',
        targetSettings: targetFixture('Target'),
        effectSource: targetFixture('Owner'),
        hitEnvironment: true,
        hitEnvData: {},
        damageUnits: [],
      },
      'fixture.environmentHit',
      {},
    );
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map(),
    });
  });

  it('当前技能可中断标记只属于客户端施法互斥门禁', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.MarkCanInterrupt+Data, Gameplay.Beyond',
      },
      'fixture.action',
      {},
    );
    expect(action).toEqual({ family: 'inputControl', action: { kind: 'markCanInterrupt' } });
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map(),
    });
  });

  it('根技能敌人上下文不遮蔽动作自身的施术者冷却目标', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.SetSkillCdAtOnce+Data, Gameplay.Beyond',
        target: targetFixture('Owner'),
        useSkillType: true,
        skillTypeMask: 'ComboSkill',
        skillId: '',
        functionType: 'Set',
        isPercentage: false,
        value: scalarFixture(0),
      },
      'fixture.action',
      {},
    );
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [
        {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'type', skillType: 'comboSkill' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 0 },
          },
        },
      ],
      state: new Map(),
    });
  });

  it('已证明为施术者的 ActionSource 可作为全队选择器所有者', () => {
    const action = {
      family: 'targetGroup' as const,
      action: {
        producerType: 'FindTargetAction' as const,
        targetGroupKey: 'party',
        finderType: 'CharacterTeamFinder' as const,
        finderFactionTarget: null,
        finderTargetObjectType: null,
        finderCheckAlive: null,
        finderShape: null,
        finderOwnerPartsQuery: null,
        validatorTypes: [],
        postProcessorTypes: [],
        inputTargets: [],
        intervalSeconds: null,
        finderSpawnedObjectType: null,
        validatorTagQueries: [],
        finderFixedPointSnapToNavmesh: null,
        center: 'ActionSource',
        centerContextKey: '',
        selectorOwner: 'ActionSource',
        selectorOwnerContextKey: '',
        directionTarget: 'ActionSource',
        directionContextKey: '',
        characterTeamSelection: null,
        excludesCurrentTarget: false,
        excludesOwner: false,
        smartTargetFallsBackToMainTarget: false,
        distanceValidatorsPassAtZero: true,
        priorityFilterMaxTargets: null,
        priorityFilters: [],
        shuffleTargets: [],
        distanceValidators: [],
        circularOrderIndexKey: null,
        circularOrderDesiredCount: null,
        circularOrderReverseFlag: null,
        circularOrderHeightOffset: null,
        circularOrderRangeThreshold: null,
        circularOrderRangeCheckTarget: null,
        pickIndexValue: null,
        pickIndexBlackboardKey: null,
      },
    } as ReturnType<typeof parseKnownNativeActionLeafSource>;

    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map([['party', 'party']]),
    });
  });

  it('实体标签条件识别已经证明为唯一敌人的上下文目标组', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckTagMatch+Data, Gameplay.Beyond',
        checkTarget: targetFixture('Context', undefined, 'smart_target'),
        query: { queryType: 'HasAny', tags: [{ tagId: -1369794537 }] },
      },
      'fixture.action',
      {},
    );

    expect(
      compileEventCondition(
        node(action),
        ACTIVE_SKILL_CONTEXT,
        new Map([['smart_target', 'enemy']]),
      ),
    ).toEqual({
      kind: 'entityTagMatch',
      target: 'enemy',
      tagQueryType: 'hasAny',
      tags: ['Test/Tag123'],
    });
  });

  it('生命条件读取已保存的队伍目标，而不重新运行最低生命选择器', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckHp+Data, Gameplay.Beyond',
        hpOwner: targetFixture('Context', undefined, 'CureTarget'),
        compare: 'LT',
        isRatio: true,
        value: scalarFixture(0.99),
      },
      'fixture.action',
      {},
    );

    expect(
      compileEventCondition(
        node(action),
        ACTIVE_SKILL_CONTEXT,
        new Map([['CureTarget', 'contextOperator']]),
      ),
    ).toEqual({
      kind: 'healthCompare',
      target: 'contextTarget',
      contextKey: 'CureTarget',
      valueType: 'ratio',
      operator: 'less',
      value: { kind: 'constant', value: 0.99 },
    });
  });

  it('生命条件把已证明为唯一敌人的命名目标折叠到木桩账本', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.Conditions.CheckHp+Data, Gameplay.Beyond',
        hpOwner: targetFixture('Context', undefined, 'maintar'),
        compare: 'GT',
        isRatio: true,
        value: scalarFixture(0),
      },
      'fixture.action',
      {},
    );

    expect(
      compileEventCondition(
        node(action),
        { ...ACTIVE_SKILL_CONTEXT, staticEnemyTargetGroupKeys: new Set(['maintar']) },
        new Map(),
      ),
    ).toEqual({
      kind: 'healthCompare',
      target: 'enemy',
      valueType: 'ratio',
      operator: 'greater',
      value: { kind: 'constant', value: 0 },
    });
  });

  it('能力实体子技能的 Owner 受击表现不产生木桩模拟步骤', () => {
    const action = {
      family: 'stumpControl' as const,
      action: {
        kind: 'enemyHurtAnimation' as const,
        source: { targetSource: 'Owner', targetGroupKey: '' },
        target: { targetSource: 'Context', targetGroupKey: 'tar' },
      },
    } as ReturnType<typeof parseKnownNativeActionLeafSource>;
    const context = {
      gameplayTagRegistry: fixtureGameplayTagRegistry,
      ...ACTIVE_SKILL_CONTEXT,
      actionOwnerTarget: 'currentAbilityEntity' as const,
    };

    expect(
      compileBuffLeafNode(node(action), new Set(), new Map([['tar', 'enemy']]), context),
    ).toEqual({ steps: [], state: new Map([['tar', 'enemy']]) });
  });

  it('固定木桩拉拽不要求把纯空间目的点建模为战斗实体', () => {
    const action = {
      family: 'stumpControl' as const,
      action: {
        kind: 'pull' as const,
        source: { targetSource: 'Context', targetGroupKey: 'spatial_destination' },
        target: { targetSource: 'Context', targetGroupKey: 'tar' },
      },
    } as ReturnType<typeof parseKnownNativeActionLeafSource>;

    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map(),
    });
  });

  it('普通战技公共 Buff 按已解析 ratio 恢复全队终结技回能', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.ObtainUspInNormalSkill+Data, Gameplay.Beyond',
        source: targetFixture('Source'),
        coefficient: { useBlackboardKey: true, value: 1, blackboardKey: 'ratio' },
      },
      'fixture.action',
      { ratio: 1 },
    );
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [{ kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } }],
      state: new Map(),
    });
    const direct = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.ObtainUspInNormalSkill+Data, Gameplay.Beyond',
        source: targetFixture('Source'),
        coefficient: { useBlackboardKey: false, value: 0.75, blackboardKey: '' },
      },
      'fixture.direct',
      {},
    );
    expect(compileBuffLeafNode(node(direct), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [{ kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 0.75 } }],
      state: new Map(),
    });
    const owner = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.ObtainUspInNormalSkill+Data, Gameplay.Beyond',
        source: targetFixture('Owner'),
        coefficient: { useBlackboardKey: false, value: 1, blackboardKey: '' },
      },
      'fixture.owner',
      {},
    );
    expect(compileBuffLeafNode(node(owner), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [{ kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } }],
      state: new Map(),
    });
    expect(() =>
      compileBuffLeafNode(node(owner), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        actionOwnerTarget: 'currentAbilityEntity',
      }),
    ).toThrow('unsupported ObtainUspInNormalSkill projection');
    const unresolved = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.ObtainUspInNormalSkill+Data, Gameplay.Beyond',
        source: targetFixture('Source'),
        coefficient: { useBlackboardKey: true, value: 1, blackboardKey: 'runtime_ratio' },
      },
      'fixture.unresolved',
      {},
    );
    expect(() =>
      compileBuffLeafNode(node(unresolved), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toThrow('unsupported ObtainUspInNormalSkill projection');
  });

  it('HealAction 的直接 ActionSource 目标治疗施法者并忽略未选中的 finder 残值', () => {
    const action = {
      family: 'heal' as const,
      action: {
        kind: 'heal' as const,
        alwaysNext: true,
        healType: 'Normal',
        healer: 'ActionSource',
        contextKey: '',
        target: {
          targetSource: 'Source',
          targetGroupKey: '',
          finderType: 'CharacterTeamFinder',
          validatorTypes: ['MainCharacterValidator'],
          postProcessorTypes: [],
        },
        calculation: {
          kind: 'attribute' as const,
          valueSource: 'AttackerOrHealer',
          attributeType: 'Wisd',
          multiplier: { value: 1, blackboardKey: 'heal_sub_multi', levelValues: null },
          addition: { value: 0, blackboardKey: 'heal_base', levelValues: null },
        },
        useHealTags: false,
        healTagIds: [],
      },
    } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>;

    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [
        {
          kind: 'heal',
          parameters: {
            target: 'caster',
            alwaysNext: true,
            tags: [],
            attribute: 'intellect',
            multiplier: { kind: 'blackboard', key: 'heal_sub_multi' },
            addition: { kind: 'blackboard', key: 'heal_base' },
          },
        },
      ],
      state: new Map(),
    });
  });

  it('Buff 宿主通过 InFightEnemyFinder 按敌人 MaxHp 治疗唯一敌人', () => {
    const action = {
      family: 'heal' as const,
      action: {
        kind: 'heal' as const,
        alwaysNext: true,
        healType: 'Normal',
        healer: 'ActionOwner',
        contextKey: '',
        target: {
          targetSource: 'Owner',
          targetGroupKey: '',
          finderType: 'InFightEnemyFinder',
          validatorTypes: [],
          postProcessorTypes: [],
          priorityFilters: [],
          shuffleTargets: [],
          distanceValidators: [],
          finderSpawnedObjectType: null,
          validatorTagQueries: [],
        },
        calculation: {
          kind: 'attribute' as const,
          valueSource: 'Target',
          attributeType: 'MaxHp',
          multiplier: { value: 1, blackboardKey: 'eny_heal_ratio', levelValues: null },
          addition: { value: 0, blackboardKey: null, levelValues: [0] },
        },
        useHealTags: false,
        healTagIds: [],
      },
    } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>;

    expect(
      compileBuffLeafNode(node(action), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        actionOwnerTarget: 'buffOwner',
        fixedBuffOwnerTarget: 'enemy',
      }),
    ).toEqual({
      steps: [
        {
          kind: 'heal',
          parameters: {
            target: 'enemy',
            source: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'blackboard', key: 'eny_heal_ratio' },
            addition: { kind: 'constant', value: 0 },
            attributeSource: 'target',
          },
        },
      ],
      state: new Map(),
    });
  });

  it('Buff 生命周期中的 Owner 治疗实际 Buff 宿主', () => {
    const action = {
      family: 'heal' as const,
      action: {
        kind: 'heal' as const,
        alwaysNext: true,
        healType: 'Normal',
        healer: 'ActionSource',
        contextKey: '',
        target: {
          targetSource: 'Owner',
          targetGroupKey: '',
          finderType: null,
          validatorTypes: [],
          postProcessorTypes: [],
        },
        calculation: {
          kind: 'attribute' as const,
          valueSource: 'AttackerOrHealer',
          attributeType: 'Wisd',
          multiplier: { value: 1, blackboardKey: 'heal_sub_multi', levelValues: null },
          addition: { value: 0, blackboardKey: 'heal_base', levelValues: null },
        },
        useHealTags: false,
        healTagIds: [],
      },
    } as unknown as ReturnType<typeof parseKnownNativeActionLeafSource>;

    expect(
      compileBuffLeafNode(node(action), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        actionOwnerTarget: 'buffOwner',
      }),
    ).toEqual({
      steps: [
        {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'intellect',
            multiplier: { kind: 'blackboard', key: 'heal_sub_multi' },
            addition: { kind: 'blackboard', key: 'heal_base' },
          },
        },
      ],
      state: new Map(),
    });
  });

  it('全队寒冷附着/冻结驱散在无敌方主动行为模型中省略', () => {
    const raw = {
      ...META,
      $type: 'Beyond.Gameplay.Core.DispelAction+Data, Gameplay.Beyond',
      dispelSource: targetFixture('Source'),
      dispelTargets: targetFixture('Context', undefined, 'tar'),
      dispelLevel: 'Default',
      checkTag: true,
      tagQuery: {
        queryType: 'HasAny',
        tags: [{ tagId: 82629473 }, { tagId: 548732882 }],
      },
    };
    const action = parseKnownNativeActionLeafSource(raw, 'fixture.action', {});

    expect(
      compileBuffLeafNode(
        node(action),
        new Set(),
        new Map([['tar', 'party']]),
        ACTIVE_SKILL_CONTEXT,
      ),
    ).toEqual({ steps: [], state: new Map([['tar', 'party']]) });

    const unknown = parseKnownNativeActionLeafSource(
      { ...raw, tagQuery: { queryType: 'HasAny', tags: [{ tagId: 82629473 }] } },
      'fixture.unknown',
      {},
    );
    expect(() =>
      compileBuffLeafNode(
        node(unknown),
        new Set(),
        new Map([['tar', 'party']]),
        ACTIVE_SKILL_CONTEXT,
      ),
    ).toThrow('unsupported DispelAction projection');
  });

  it('InterruptAction 的 Target 来源不读取残留 targetGroupKey', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.InterruptAction+Data, Gameplay.Beyond',
        attacker: targetFixture('Source'),
        defender: targetFixture('Target', undefined, 'residual-enemy-key'),
        overrideSuperArmorLimit: -1,
        immobilizedTime: 1,
      },
      'fixture.action',
      {},
    );

    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map(),
    });
  });

  it.each([undefined, false, true])(
    '能力实体出生于直接 Source，单目标下多输入配置 %s 不改变结果',
    allowMultiInputTarget => {
      const action = parseKnownNativeActionLeafSource(
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.SpawnAbilityEntity+Data, Gameplay.Beyond',
          abilityEntityId: 'abilityentity_fixture',
          setAbilityEntitySource: true,
          abilityEntitySource: 'ActionOwner',
          abilityEntitySourceContextKey: '',
          setAbilityEntityTarget: false,
          abilityEntityTarget: targetFixture('Target'),
          bornAt: {
            ...targetFixture('Source'),
            selectorData: {
              finderData: {
                $type: 'Beyond.Gameplay.Core.Selector+CharacterTeamFinder+Data, Gameplay.Beyond',
              },
              validatorData: [
                {
                  $type:
                    'Beyond.Gameplay.Core.Selector+MainCharacterValidator+Data, Gameplay.Beyond',
                },
              ],
              postProcessorData: [],
            },
          },
          bornMountPoint: 'None',
          bornPosOffset: { x: -1, y: 0.5, z: 0 },
          checkNavmeshAreaName: false,
          forbiddenAreaNames: [],
          attachToClosestMeshPoint: false,
          yRotateFromBoneToCurPos: false,
          bornRotation: 'SourceForward',
          bornRotationContextTarget: '',
          useAdvancedDirectionSetting: false,
          advancedDirectionSetting: {
            directionType: 'SourceForward',
            sourceMountPoint: 'None',
            targetMountPoint: 'None',
            customSourceAndTarget: false,
            clampToXZ: true,
            invertDirection: false,
          },
          clampToXZPlane: false,
          applyBornRotationOffset: false,
          bornRotationOffset: { x: 0, y: 0, z: 0, w: 1 },
          assignEntityBlackboard: false,
          assignPairs: [],
          assignBlackboard: true,
          abilityEntitySkillId: 'fixture_skill',
          ...(allowMultiInputTarget === undefined ? {} : { allowMultiInputTarget }),
          overrideDuration: false,
          duration: scalarFixture(0),
          saveToContext: false,
          contextKey: '',
          pauseEffectOnEnd: false,
          inheritSourceSkillCastId: true,
          dieWhenSourceDie: false,
          forceSyncInit: false,
          dieOnEnd: false,
        },
        'fixture.action',
        {},
      );

      expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual(
        {
          steps: [
            {
              kind: 'spawnAbilityEntity',
              parameters: {
                abilityEntityId: 'abilityentity_fixture',
                childSkillId: 'fixture_skill',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
              },
            },
          ],
          state: new Map(),
        },
      );
      if (action.family !== 'abilityEntity') throw new Error('expected AbilityEntity action');
      const enemyTargetAction = {
        ...action,
        action: { ...action.action, setTarget: true },
      };
      expect(
        compileBuffLeafNode(node(enemyTargetAction), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
      ).toMatchObject({ steps: [{ kind: 'spawnAbilityEntity', parameters: { target: 'enemy' } }] });
      const spatialTargets = {
        ...enemyTargetAction,
        action: {
          ...enemyTargetAction.action,
          target: { ...action.action.target, targetSource: 'Context', targetGroupKey: 'points' },
        },
      };
      if (allowMultiInputTarget === true) {
        expect(() =>
          compileBuffLeafNode(
            node(spatialTargets),
            new Set(),
            new Map([['points', 'spatialPoint']]),
            ACTIVE_SKILL_CONTEXT,
          ),
        ).toThrow('allowMultiInputTarget: child skill input is not a proven singleton');
      }
      const casterTargetAction = {
        ...action,
        action: {
          ...action.action,
          setTarget: true,
          target: { ...action.action.target, targetSource: 'Source', targetGroupKey: '' },
        },
      };
      expect(
        compileBuffLeafNode(node(casterTargetAction), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
      ).toMatchObject({
        steps: [{ kind: 'spawnAbilityEntity', parameters: { target: 'caster' } }],
      });
      const sourceBoundAction = {
        ...action,
        action: { ...action.action, dieWhenSourceDies: true, dieOnEnd: true },
      };
      expect(
        compileBuffLeafNode(node(sourceBoundAction), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
      ).toMatchObject({
        steps: [
          {
            kind: 'spawnAbilityEntity',
            parameters: { dieWhenSourceDies: true, finishByAction: true },
          },
        ],
      });
      const projectileOwnedAction = {
        ...action,
        action: {
          ...action.action,
          bornAt: {
            ...action.action.bornAt,
            targetSource: 'Context' as const,
            targetGroupKey: 'projectile_hit_position',
            finderType: null,
            validatorTypes: [],
            postProcessorTypes: [],
          },
        },
      };
      expect(
        compileBuffLeafNode(
          node(projectileOwnedAction),
          new Set(),
          new Map([['projectile_hit_position', 'spatialPoint']]),
          { ...ACTIVE_SKILL_CONTEXT, actionOwnerTarget: 'currentAbilityEntity' },
        ),
      ).toMatchObject({
        steps: [
          {
            kind: 'spawnAbilityEntity',
            parameters: { source: 'currentAbilityEntity', dieWhenSourceDies: false },
          },
        ],
      });
      expect(() =>
        compileBuffLeafNode(node(action), new Set(), new Map(), {
          ...ACTIVE_SKILL_CONTEXT,
          actionSourceTarget: 'buffSource',
        }),
      ).toThrow('unsupported AbilityEntity spawn projection');
    },
  );

  it('敌方监听 Buff 可按已证明的创建来源减少干员绝对冷却', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.SetSkillCdAtOnce+Data, Gameplay.Beyond',
        target: targetFixture('Source'),
        useSkillType: false,
        skillTypeMask: 'None',
        skillId: 'chr_0022_bounda_combo_skill',
        functionType: 'Reduce',
        isPercentage: false,
        value: scalarFixture(0, 'reduce'),
      },
      'fixture.action',
      { reduce: [1] },
    );
    const context: CombatActionProjectionContextSource = {
      ...ACTIVE_SKILL_CONTEXT,
      actionOwnerTarget: 'buffOwner',
      fixedBuffOwnerTarget: 'enemy',
      fixedBuffSourceTarget: 'caster',
    };
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), context)).toEqual({
      steps: [
        {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0022_bounda_combo_skill' },
            operation: 'reduce',
            basis: 'absoluteSeconds',
            value: { kind: 'blackboard', key: 'reduce' },
          },
        },
      ],
      state: new Map(),
    });
  });

  it('能力实体出生于已证明的施术者 Owner 时投影为同一零空间锚点', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.SpawnAbilityEntity+Data, Gameplay.Beyond',
        abilityEntityId: 'abilityentity_fixture_owner',
        setAbilityEntitySource: true,
        abilityEntitySource: 'ActionSource',
        abilityEntitySourceContextKey: '',
        setAbilityEntityTarget: false,
        abilityEntityTarget: targetFixture('Target'),
        bornAt: targetFixture('Owner'),
        bornMountPoint: 'None',
        bornPosOffset: { x: 0, y: 0, z: 0 },
        checkNavmeshAreaName: false,
        forbiddenAreaNames: [],
        attachToClosestMeshPoint: false,
        yRotateFromBoneToCurPos: false,
        bornRotation: 'SourceForward',
        bornRotationContextTarget: '',
        useAdvancedDirectionSetting: false,
        advancedDirectionSetting: {
          directionType: 'SourceForward',
          sourceMountPoint: 'None',
          targetMountPoint: 'None',
          customSourceAndTarget: false,
          clampToXZ: true,
          invertDirection: false,
        },
        clampToXZPlane: false,
        applyBornRotationOffset: false,
        bornRotationOffset: { x: 0, y: 0, z: 0, w: 1 },
        assignEntityBlackboard: false,
        assignPairs: [],
        assignBlackboard: true,
        abilityEntitySkillId: 'fixture_skill',
        overrideDuration: false,
        duration: scalarFixture(0),
        saveToContext: false,
        contextKey: '',
        pauseEffectOnEnd: false,
        inheritSourceSkillCastId: true,
        dieWhenSourceDie: false,
        forceSyncInit: false,
        dieOnEnd: false,
      },
      'fixture.action',
      {},
    );

    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_fixture_owner',
            childSkillId: 'fixture_skill',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
      ],
      state: new Map(),
    });
    if (action.family !== 'abilityEntity') throw new Error('expected AbilityEntity action');
    const pauseVisualOnEnd = {
      ...action,
      action: { ...action.action, pauseEffectOnEnd: true },
    };
    expect(
      compileBuffLeafNode(node(pauseVisualOnEnd), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toEqual({
      steps: [
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_fixture_owner',
            childSkillId: 'fixture_skill',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
      ],
      state: new Map(),
    });
    const dieOnEnd = {
      ...action,
      action: { ...action.action, dieOnEnd: true },
    };
    expect(compileBuffLeafNode(node(dieOnEnd), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual(
      {
        steps: [
          {
            kind: 'spawnAbilityEntity',
            parameters: {
              abilityEntityId: 'abilityentity_fixture_owner',
              childSkillId: 'fixture_skill',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              finishByAction: true,
            },
          },
        ],
        state: new Map(),
      },
    );
    const enemyAnchor = structuredClone(action);
    if (enemyAnchor?.family !== 'abilityEntity') throw new Error('expected AbilityEntity action');
    (enemyAnchor.action as { bornAt: { targetSource: string; targetGroupKey: string } }).bornAt = {
      ...enemyAnchor.action.bornAt,
      targetSource: 'Context',
      targetGroupKey: 'enemy_anchor',
    };
    expect(
      compileBuffLeafNode(
        node(enemyAnchor),
        new Set(),
        new Map([['enemy_anchor', 'enemy']]),
        ACTIVE_SKILL_CONTEXT,
      ),
    ).toEqual({
      steps: [
        {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_fixture_owner',
            childSkillId: 'fixture_skill',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
      ],
      state: new Map([['enemy_anchor', 'enemy']]),
    });
    const inputAnchor = structuredClone(action);
    if (inputAnchor?.family !== 'abilityEntity') throw new Error('expected AbilityEntity action');
    (inputAnchor.action as { bornAt: { targetSource: string; targetGroupKey: string } }).bornAt = {
      ...inputAnchor.action.bornAt,
      targetSource: 'Target',
      targetGroupKey: 'residual_key',
    };
    expect(
      compileBuffLeafNode(node(inputAnchor), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toMatchObject({ steps: [{ kind: 'spawnAbilityEntity' }] });
    const targeted = structuredClone(action);
    if (targeted?.family !== 'abilityEntity') throw new Error('expected AbilityEntity action');
    (targeted.action as { setTarget: boolean }).setTarget = true;
    expect(compileBuffLeafNode(node(targeted), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual(
      {
        steps: [
          {
            kind: 'spawnAbilityEntity',
            parameters: {
              abilityEntityId: 'abilityentity_fixture_owner',
              childSkillId: 'fixture_skill',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              target: 'enemy',
            },
          },
        ],
        state: new Map(),
      },
    );
    expect(() =>
      compileBuffLeafNode(node(action), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        actionOwnerTarget: 'buffOwner',
      }),
    ).toThrow('unsupported AbilityEntity spawn projection');
  });

  it('OnlyDead 吹飞在死亡终止模型中省略，活目标吹飞仍阻断', () => {
    expect(
      compileBuffLeafNode(node(blowOff('OnlyDead')), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toEqual({ steps: [], state: new Map() });
    expect(() =>
      compileBuffLeafNode(node(blowOff('OnlyAlive')), new Set(), new Map(), ACTIVE_SKILL_CONTEXT),
    ).toThrow('live-target BlowOffEnemy physical infliction');
  });

  it('自身 ChannelingCasting 只限制同一施法区间，不产生战斗步骤', () => {
    const action = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.ChannelingCastingAction+Data, Gameplay.Beyond',
        cantSwitchPosition: true,
        cantSwitchToCenter: false,
        duration: scalarFixture(3.7),
        cantCastSkill: true,
      },
      'fixture.action',
      {},
    );
    expect(compileBuffLeafNode(node(action), new Set(), new Map(), ACTIVE_SKILL_CONTEXT)).toEqual({
      steps: [],
      state: new Map(),
    });
    expect(() =>
      compileBuffLeafNode(node(action), new Set(), new Map(), {
        ...ACTIVE_SKILL_CONTEXT,
        actionSourceTarget: 'buffSource',
      }),
    ).toThrow('unsupported ChannelingCastingAction owner');
  });
});
