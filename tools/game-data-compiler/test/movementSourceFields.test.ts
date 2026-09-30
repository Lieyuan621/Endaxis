import { describe, expect, it } from 'vitest';
import {
  parseKnownNativeActionLeafSource,
  parseKnownNativeActionSequenceSource,
} from '../src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import type { CombatActionProjectionContextSource } from '../src/compiler/combatProjectionCommon.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../src/compiler/actions/combatActionProjectionTypes.ts';

/** 图编译包装：返回入口同层动作数组，保持旧断言的扁平比较形状。 */
function projectSequence(
  source: Parameters<typeof compileCombatActionSequenceSource>[0],
  context: Omit<CombatActionProjectionContextSource, 'graph'>,
) {
  const builder = createActionGraphBuilder<CompiledBuffStepSource>();
  const entry = compileCombatActionSequenceSource(source, { ...context, graph: builder });
  return { steps: readActionGraphChain(builder.finish(), entry) };
}
import { scalarFixture as scalar, targetFixture } from './sourceFixtures.ts';
import { parseReceiveMoveInputActionSource } from '../src/source/spatialActions.ts';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 1 };

describe('侧移模式朝向偏移', () => {
  const create = (extra: Record<string, unknown> = {}) => ({
    ...meta,
    $type: 'Beyond.Gameplay.Core.SetStrafeModeAction+Data, Gameplay.Beyond',
    strafeTarget: targetFixture('Owner'),
    limitGait: false,
    minGait: 'Sprint',
    maxGait: 'Sprint',
    lockToCamera: true,
    ...extra,
  });

  it('非零朝向偏移与旧格式投影一致，不产生战斗步骤', () => {
    expect(parseKnownNativeActionLeafSource(create({ yawOffset: -30 }), 'strafe', {})).toEqual(
      parseKnownNativeActionLeafSource(create(), 'strafe', {}),
    );
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [create({ yawOffset: -30 })],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'sequence',
      {},
    );
    expect(
      projectSequence(source, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it.each(['10', Infinity])('拒绝非法偏移 %j', yawOffset => {
    expect(() => parseKnownNativeActionLeafSource(create({ yawOffset }), 'strafe', {})).toThrow(
      'strafe.yawOffset',
    );
  });

  it('新增偏移不放开未知字段', () => {
    expect(() =>
      parseKnownNativeActionLeafSource(create({ yawOffset: 0, unknown: 1 }), 'strafe', {}),
    ).toThrow('unexpected fields');
  });
});
const curve = [
  { time: 0, value: 1, inTangent: 0, outTangent: 0, inWeight: 0, outWeight: 0, weightedMode: 0 },
];

function rootMotion(): Record<string, unknown> {
  return {
    ...meta,
    $type: 'Beyond.Gameplay.Core.CustomRootMotionAction+Data, Gameplay.Beyond',
    moveTo: targetFixture('Target'),
    animKey: 'ComboSkill',
    rootMotionCurveMask: 'PosZ',
    scaleX: scalar(1),
    scaleY: scalar(1),
    scaleZ: scalar(1),
    enableScaleZWithDistanceCurve: false,
    distance2ScaleZ: curve,
    blockRadius: scalar(1),
    useExtraBlockRadiusForInt: false,
    extraRadiusForInt: scalar(0),
    enableMaxDistanceCheckWhenMoveBack: false,
    maxDistanceWhenMoveBack: scalar(5),
    updateDir: true,
    startOffsetFrame: 6,
    playbackSpeed: scalar(1),
    stopByCliff: true,
    ignoreAllCollision: false,
    ignoreCollisionLayer: { m_Mask: 0 },
  };
}

function moveTo(): Record<string, unknown> {
  const subSpeed = {
    speedType: 'FixedSpeed',
    fixedSpeed: scalar(1),
    speedCurve: curve,
    rootMotionAnimKey: '',
    rootMotionScale: scalar(1),
  };
  return {
    ...meta,
    $type: 'Beyond.Gameplay.Core.MoveToAction+Data, Gameplay.Beyond',
    moveType: 'Location',
    totalTime: scalar(0.1),
    updateMoveTarget: true,
    directionType: 'ToTarget',
    target: targetFixture('Target'),
    fixAngle: { x: 0, y: 0, z: 0 },
    fixDirectionType: 'SourceForward',
    fixPosAngle: { x: scalar(0), y: scalar(0), z: scalar(0) },
    fixPosLength: scalar(0),
    blockRadius: scalar(0),
    enableMaxDistanceCheckWhenMoveBack: false,
    maxDistanceWhenMoveBack: scalar(5),
    useExtraBlockRadiusForInt: false,
    extraRadiusForInt: scalar(0),
    counterClockwise: false,
    faceToMoveDir: true,
    overrideRotateRate: false,
    rotateRate: scalar(1800),
    speedType: 'AutoFixSpeed',
    speed: scalar(1),
    speedCurve: curve,
    rootMotionAnimKey: '',
    startOffsetFrame: 0,
    autoScaled: false,
    rootMotionScale: scalar(1),
    dontClampDirToXZ: false,
    enableXAxisMove: false,
    xAxisSpeed: subSpeed,
    enableYAxisMove: false,
    yAxisSpeed: subSpeed,
    limitMoveDirRotateSpeed: false,
    moveDirYRotateSpeed: 0,
    disableReachAutoEnd: false,
    ignoreNavmesh: true,
    ignoreAllCollision: false,
    ignoreCollisionLayer: {},
    stopByCliff: false,
    overrideStepOffset: false,
    stepOffset: 0,
  };
}

const cases = [
  { name: 'CustomRootMotion', create: rootMotion, fields: ['manualTick'] },
  {
    name: 'MoveTo',
    create: moveTo,
    fields: ['manualTick', 'updateLatestMainCharacter', 'dontClampFaceToMoveDirToXZ'],
  },
];

describe('输入位移与根运动混合', () => {
  const teammateParam = {
    inputDirection: 'All',
    speedType: 'FixedSpeed',
    speed: scalar(1),
    speedCurve: curve,
    speedScale: scalar(1),
    faceToMoveDir: true,
    overrideRotateSpeed: false,
    rotateSpeed: scalar(1),
    disableDynamicPush: false,
  };
  const old = {
    ...meta,
    $type: 'Beyond.Gameplay.Core.ReceiveMoveInputAction+Data, Gameplay.Beyond',
    duration: scalar(1),
    inputDirection: 'All',
    speedType: 'FixedSpeed',
    speed: scalar(1),
    speedCurve: curve,
    speedScale: scalar(1),
    faceToMoveDir: true,
    overrideRotateSpeed: false,
    disableCliffCheck: false,
    rotateSpeed: scalar(1),
    recoverWhenLanding: false,
    useTeammateParam: false,
    teammateParam,
  };
  it('开启混合开关不改变原有技能时长来源', () => {
    const current = {
      ...old,
      combineRootMotion: true,
      inputAlongRMScale: scalar(0.5),
      rootMotionScale: scalar(1, 'scale'),
    };
    expect(parseReceiveMoveInputActionSource(current, 'move', { scale: [1, 2] })).toEqual(
      parseReceiveMoveInputActionSource(old, 'move', {}),
    );
    const parsed = parseKnownNativeActionSequenceSource(
      {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData: [current],
      },
      'sequence',
      { scale: [1, 2] },
    );
    expect(
      projectSequence(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it.each([
    { combineRootMotion: false },
    { rootMotionScale: scalar(1) },
    { combineRootMotion: false, inputAlongRMScale: null, rootMotionScale: scalar(1) },
  ])('新字段组不得残缺或绕过类型校验 %j', extra => {
    expect(() => parseReceiveMoveInputActionSource({ ...old, ...extra }, 'move', {})).toThrow(
      'move',
    );
  });
});

describe.each(cases)('$name 新版空间字段', ({ create, fields }) => {
  it('开启新开关仍沿用旧版空间来源与省略路径', () => {
    const old = create();
    const current = { ...old, ...Object.fromEntries(fields.map(key => [key, true])) };
    expect(parseKnownNativeActionLeafSource(current, 'movement', {})).toEqual(
      parseKnownNativeActionLeafSource(old, 'movement', {}),
    );
    const parsed = parseKnownNativeActionSequenceSource(
      {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData: [current],
      },
      'sequence',
      {},
    );
    expect(
      projectSequence(parsed, {
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    ).toEqual({ steps: [] });
  });

  it.each([undefined, 'false'])('不把显式非法值 %j 当作缺省', value => {
    for (const key of fields) {
      expect(() =>
        parseKnownNativeActionLeafSource({ ...create(), [key]: value }, 'movement', {}),
      ).toThrow(`movement.${key}`);
    }
  });

  it('不放开其他未知字段或回调', () => {
    for (const key of ['unknownCombatField', 'onMoveEnd']) {
      expect(() =>
        parseKnownNativeActionLeafSource({ ...create(), [key]: {} }, 'movement', {}),
      ).toThrow('unexpected fields');
    }
  });
});
