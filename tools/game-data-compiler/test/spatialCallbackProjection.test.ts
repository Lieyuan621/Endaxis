import { describe, expect, it } from 'vitest';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { collectNativeActionNodes } from '../src/source/controlFlow.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 1 };
const sequence = (actionData: unknown[], guarded = false) => ({
  actionData,
  onlyExecuteWhenSourceIsMainChar: guarded,
  onlyExecuteWhenSourceIsGuard: false,
});
const teleport = (callback?: unknown) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.TeleportAction+Data, Gameplay.Beyond',
  teleportTo: targetFixture('Context', undefined, 'pos'),
  radius: scalarFixture(0),
  allowCheckMainCharPosToDestPathAvailable: true,
  throughWall: false,
  clampDirToXZ: false,
  checkMaxDistance: false,
  maxDistance: 20,
  ignoreNavmeshLink: true,
  snapToFloor: true,
  ...(callback === undefined ? {} : { actionOnTargetPointInvalid: callback }),
});
const selectPoint = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.TeleportPosSelectAction+Data, Gameplay.Beyond',
  targetSettings: targetFixture('Target'),
  teleportType: 'FixedDistance',
  fixDistanceData: {
    excludeCurrentPos: true,
    distance: scalarFixture(5),
    useAddScoreToPrevSide: false,
  },
  rangedData: { forwardDistance: scalarFixture(0) },
  contextKey: 'pos',
};
const calculation = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.SimpleCalcBBAction+Data, Gameplay.Beyond',
  key: 'damage_scale',
  operation: 'Add',
  value1: scalarFixture(1),
  value2: scalarFixture(2),
};
const condition = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.CompareFloat+Data, Gameplay.Beyond',
  valueA: scalarFixture(0, 'spatial_only'),
  compare: 'LT',
  valueB: scalarFixture(1),
};
const spatialConditions = [
  {
    ...meta,
    $type: 'Beyond.Gameplay.Core.Conditions.CheckTargetInScreen+Data, Gameplay.Beyond',
    targetSettings: targetFixture('Owner'),
  },
  {
    ...meta,
    $type: 'Beyond.Gameplay.Core.Conditions.CheckTwoDirectionAngle+Data, Gameplay.Beyond',
    dir1Source: targetFixture('Source'),
    dir1Target: targetFixture('Target'),
    dir1DirectionType: 'CameraForward',
    dir2Source: targetFixture('Context', undefined, 'MainChar'),
    dir2Target: targetFixture('Target'),
    dir2DirectionType: 'SourceToTarget',
    compareType: 'LT',
    value: scalarFixture(0),
  },
];
const branch = (check: unknown, yes: unknown[], no: unknown[] = []) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.IfElseAction+IfElseActionData, Gameplay.Beyond',
  conditionAction: sequence([check]),
  succeedActions: sequence(yes),
  failActions: sequence(no),
  alwaysNext: true,
});
const parse = (actions: unknown[]) =>
  parseKnownNativeActionSequenceSource(sequence(actions), 'fixture', {});
const compile = (actions: unknown[]) =>
  compileCombatActionSequenceSource(parse(actions), {
    actionOwnerTarget: 'caster',
    actionSourceTarget: 'caster',
    actionTargetTarget: 'enemy',
  });

describe('空间失败回调自叶向根消去', () => {
  it.each(spatialConditions)('条件槽中的纯空 alwaysNext 分支按原生返回规则恒真：$type', check => {
    expect(compile([branch(branch(check, []), [calculation], [teleport()])])).toEqual(
      compile([calculation]),
    );
  });

  it('空 IfElse 只有无副作用且 alwaysNext=true 才能作为恒真条件', () => {
    expect(() =>
      compile([branch({ ...branch(condition, []), alwaysNext: false }, [calculation])]),
    ).toThrow('expected a condition-only sequence');
    expect(() => compile([branch(branch(calculation, []), [calculation])])).toThrow(
      'expected a condition-only sequence',
    );
    expect(() => compile([branch(branch(condition, [calculation]), [calculation])])).toThrow(
      'expected a condition-only sequence',
    );
  });

  it.each(spatialConditions)('静态预选不抢先编译空间条件：$\u0074ype', check => {
    const nested = branch(check, [selectPoint, teleport(sequence([]))], [teleport()]);
    expect(compile([branch(check, [nested], [teleport()]), calculation])).toEqual(
      compile([calculation]),
    );
  });

  it.each(spatialConditions)('两侧相同的有效写入合并，无需空间条件：$\u0074ype', check => {
    expect(compile([branch(check, [calculation], [calculation])])).toEqual(compile([calculation]));
  });

  it.each(spatialConditions)('两侧仍有战斗差异时空间条件继续阻断：$\u0074ype', check => {
    expect(() => compile([branch(check, [calculation], [teleport()])])).toThrow(
      'unaudited single-enemy action condition',
    );
  });

  it('来源树保留非空回调及其全部子动作，不把回调当同步后继', () => {
    const source = parse([teleport(sequence([selectPoint, teleport(sequence([]))]))]);
    expect(source.actions[0]!.body.kind).toBe('actionWithCallback');
    expect(collectNativeActionNodes(source).map(node => node.metadata.nativeName)).toEqual([
      'TeleportAction',
      'TeleportPosSelectAction',
      'TeleportAction',
    ]);
    expect(collectNativeActionNodes(source)[1]!.sourcePath).toContain(
      'actionOnTargetPointInvalid.actionData[0]',
    );
  });

  it.each([false, true])('末端传送、选点、嵌套回调逐层消去，根守卫=%s', guarded => {
    const callback = sequence([selectPoint, teleport(sequence([teleport(sequence([]))]))], guarded);
    expect(compile([teleport(callback)])).toEqual({ steps: [] });
  });

  it('控制纯空间末端的条件也消去，不输出空分支', () => {
    expect(compile([teleport(sequence([condition, selectPoint, teleport(sequence([]))]))])).toEqual(
      { steps: [] },
    );
  });

  it('调试日志中的目标设置不把空间输出变成战斗依赖', () => {
    expect(
      compile([
        selectPoint,
        {
          ...meta,
          $type: 'Beyond.Gameplay.Core.DebugPrintAction+Data, Gameplay.Beyond',
          logType: 'TargetSetting',
          target: targetFixture('Context', undefined, 'pos'),
          color: { r: 1, g: 0, b: 0, a: 1 },
          bbKey: '',
          identifier: 'selected-point',
        },
        teleport(),
      ]),
    ).toEqual({ steps: [] });
  });

  it('非空回调中的有效写入不能被持有动作的 spatial 分类吞掉', () => {
    expect(() => compile([teleport(sequence([calculation]))])).toThrow(
      'combat-visible targetPointInvalid callback',
    );
    expect(() => compile([teleport(sequence([teleport(sequence([calculation]))]))])).toThrow(
      'combat-visible targetPointInvalid callback',
    );
  });

  it('关闭的写入不产生效果，外部兄弟写入仍按原顺序输出', () => {
    const before = { ...calculation, key: 'before' };
    const after = { ...calculation, key: 'after' };
    const result = compile([
      before,
      teleport(sequence([{ ...calculation, isEnable: false }])),
      after,
    ]);
    expect(result).toEqual(compile([before, after]));
  });

  it('回调写出的空间 Context 仍被外层有效读者使用时阻止消去', () => {
    const reader = {
      ...meta,
      $type: 'Beyond.Gameplay.Core.ModifyDynamicBlackboard+Data, Gameplay.Beyond',
      key: 'health',
      operation: 'Assign',
      directValue: false,
      value: scalarFixture(0),
      calculationTarget: targetFixture('Context', undefined, 'pos'),
      calculateType: 'HpRatio',
    };
    expect(() =>
      compile([teleport(sequence([selectPoint, teleport(sequence([]))])), reader]),
    ).toThrow('spatial output pos reaches combat action');
  });

  it('旧无回调结构等价；未知字段、残缺结构不因空间省略而静默放行', () => {
    expect(compile([teleport()])).toEqual(compile([teleport(sequence([]))]));
    expect(() => parse([{ ...teleport(sequence([])), unknown: true }])).toThrow(
      'unexpected fields',
    );
    expect(() => parse([teleport(null)])).toThrow('actionOnTargetPointInvalid');
    expect(() => parse([teleport({ actionData: [] })])).toThrow('actionOnTargetPointInvalid');
  });
});
