import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { parseNativeSequenceSource, collectNativeActionNodes } from '../src/source/controlFlow.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../src/compiler/buffs/buffRuntimeProjection.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';
import { compileActionSequence } from '../../../src/core/compiler/compileSkill';
import { CombatActionSequenceRuntime } from '../../../src/core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard';

const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 0 };
const sequence = (actionData: unknown[]) => ({
  actionData,
  onlyExecuteWhenSourceIsMainChar: false,
  onlyExecuteWhenSourceIsGuard: false,
});
const gain = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.ObtainCostAction+Data, Gameplay.Beyond',
  costType: 'Atb',
  isPercentValue: false,
  useUspRecoverTag: false,
  uspRecoverTag: { tagId: 0 },
  ignoreUspGainScalar: false,
  atbSourceType: 'NormalAttack',
  atbGainMethod: 'Gain',
  playObtainAtbEffect: false,
  playObtainAtbAudio: false,
  costValue: scalarFixture(0, 'atb'),
  coefficient: scalarFixture(1),
  atbOnlyMainChar: false,
  source: targetFixture('Source'),
  target: targetFixture('Source'),
};
const once = (child: unknown[] = [gain]) => ({
  ...meta,
  $type: 'Beyond.Gameplay.Core.DoOnceAction+Data, Gameplay.Beyond',
  sequenceActionData: sequence(child),
});
const positivePotential = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.CompareFloat+Data, Gameplay.Beyond',
  valueA: scalarFixture(0, 'potential'),
  compare: 'GT',
  valueB: scalarFixture(0),
};
const presentation = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.IgnoreModelIntervalCheck+Data, Gameplay.Beyond',
};
const emptyPresentationBranch = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.IfElseAction+IfElseActionData, Gameplay.Beyond',
  conditionAction: sequence([
    {
      ...meta,
      $type: 'Beyond.Gameplay.Core.Conditions.CheckMainCharacterCondition+Data, Gameplay.Beyond',
      checkTarget: targetFixture('Source'),
    },
  ]),
  succeedActions: sequence([]),
  failActions: sequence([]),
  alwaysNext: true,
};
const applyBuff = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond',
  buffs: [
    {
      buffId: 'buff_common_obtain_ultimate_sp',
      assignBlackboard: false,
      assignItems: [],
      readIdFromBlackboard: false,
      buffIdKey: '',
    },
  ],
  count: scalarFixture(1),
  targetSettings: targetFixture('Source'),
  buffSource: 'ActionSource',
  contextKey: '',
  autoFinishByAction: false,
  inheritSkillIdList: [],
  finishWithNextSkillIfNotInherited: true,
  asChildBuff: false,
  inheritSourceSkillCastId: true,
  inheritSourceSkillCastInfo: true,
  isExtra: false,
  passTargetGroupsToBuff: false,
  overrideBuffIconDuration: false,
  buffIconDurationSource: {
    m_abilityEntityTypeInfo: '',
    m_timedMarkerInfo: '',
    durationSourceType: 'AbilityEntity',
    timedMarkerId: '',
  },
};
const interrupt = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.InterruptAction+Data, Gameplay.Beyond',
  attacker: targetFixture('Source'),
  defender: targetFixture('Target'),
  overrideSuperArmorLimit: -1,
  immobilizedTime: 1,
};
const tickInterval = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.TickIntervalAction+Data, Gameplay.Beyond',
  executeEachFrame: false,
  tickInterval: 0.07,
  tickIntervalBlackboardKey: '',
  useTickIntervalBlackboardKey: false,
  actionOnTick: sequence([gain]),
};
const storeCurrentSkillFrame = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.StoreCurSkillExecuteFrame+Data, Gameplay.Beyond',
  target: targetFixture('Owner'),
  blackboardKey: 'music_loop',
};
const casterChanneling = {
  ...meta,
  $type: 'Beyond.Gameplay.Core.ChannelingAction+Data, Gameplay.Beyond',
  targetSettings: targetFixture('Owner'),
  executeEachFrame: false,
  triggerInterval: 0.1,
  maxCountPerTarget: -1,
  targetTriggerInterval: 0,
  actionOnTick: sequence([{ ...applyBuff, targetSettings: targetFixture('Target') }]),
};
const context = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'enemy',
  timelineRange: { startFrame: 0, endFrame: 60 },
} as const;
function parse(raw: unknown) {
  return parseNativeSequenceSource(raw, 'skill.sequence', {}, (value, path) =>
    parseKnownNativeActionLeafSource(value, path, {}),
  );
}

describe('DoOnce 技能资源回复的窄投影', () => {
  it.each(['Atb', 'UltimateSp'])('主控限制只作用于技力而非终结技能量：%s', costType => {
    const compiled = compileActionSequence(
      compileCombatActionSequenceSource(
        parse(sequence([{ ...gain, costType, atbOnlyMainChar: true }])),
        context,
      ),
      1,
    );
    let calls = 0;
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => {
          calls++;
          return true;
        },
        evaluate: () => false,
      },
      { blackboard: new ActionBlackboard({ atb: 10 }) },
    );
    runtime.createSequence(compiled).executeInstant({});
    expect(calls).toBe(costType === 'Atb' ? 0 : 1);
  });

  it('转换结果经正式编译执行：重复命中不重复回复，新施法重新获得机会', () => {
    const compiled = compileActionSequence(
      compileCombatActionSequenceSource(parse(sequence([once(), once()])), context),
      1,
    );
    let calls = 0;
    const makeRuntime = () =>
      new CombatActionSequenceRuntime(
        {
          execute: () => {
            calls++;
            return false;
          },
          evaluate: () => true,
        },
        { blackboard: new ActionBlackboard({ atb: 5 }) },
      );
    const runtime = makeRuntime();
    expect(runtime.createSequence(compiled).executeInstant({})).toBe(true);
    expect(runtime.createSequence(compiled).executeInstant({})).toBe(true);
    expect(calls).toBe(2);
    makeRuntime().createSequence(compiled).executeInstant({});
    expect(calls).toBe(4);
    runtime.reset();
    runtime.createSequence(compiled).executeInstant({});
    expect(calls).toBe(6);
  });

  it('保留子树，两个原生动作使用不同的实例作用域', () => {
    const source = parse(sequence([once(), once()]));
    expect(collectNativeActionNodes(source).map(node => node.metadata.nativeName)).toEqual([
      'DoOnceAction',
      'ObtainCostAction',
      'DoOnceAction',
      'ObtainCostAction',
    ]);
    const compiled = compileCombatActionSequenceSource(source, context);
    expect(compiled.steps).toMatchObject(
      [0, 1].map(index => ({
        kind: 'once',
        parameters: { scopeKey: `skill.sequence.actionData[${index}]` },
        body: {
          steps: [
            {
              kind: 'changeResourceByActionValue',
              parameters: {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                spGainSource: 'normalAttack',
              },
            },
          ],
        },
      })),
    );
  });

  it('直接子树只有严格纯表现动作时省略 DoOnce 及其私有状态', () => {
    expect(
      compileCombatActionSequenceSource(parse(sequence([once([presentation])])), context),
    ).toEqual({ steps: [] });
  });

  it('递归投影为空的表现分支也省略 DoOnce 及其私有状态', () => {
    expect(
      compileCombatActionSequenceSource(
        parse(sequence([once([presentation, emptyPresentationBranch])])),
        context,
      ),
    ).toEqual({ steps: [] });
  });

  it('保留一次性回能 Buff，按静态木桩证据省略相邻 InterruptAction', () => {
    expect(
      compileCombatActionSequenceSource(parse(sequence([once([applyBuff, interrupt])])), context)
        .steps[0],
    ).toMatchObject({
      kind: 'once',
      body: {
        steps: [
          {
            kind: 'gainSquadUltimateEnergyFromSkillCost',
            parameters: { coefficient: 1 },
          },
        ],
      },
    });
  });

  it('保留 DoOnce 内的纯条件前缀，并让它短路一次性资源动作', () => {
    expect(
      compileCombatActionSequenceSource(parse(sequence([once([positivePotential, gain])])), context)
        .steps[0],
    ).toMatchObject({
      kind: 'once',
      body: {
        steps: [
          {
            kind: 'conditional',
            parameters: {
              condition: {
                kind: 'actionValueCompare',
                operator: 'greater',
                left: { kind: 'blackboard', key: 'potential' },
                right: { kind: 'constant', value: 0 },
              },
            },
            whenTrue: { steps: [{ kind: 'changeResourceByActionValue' }] },
          },
        ],
      },
    });
  });

  it('未知生命周期、子角色守卫及非资源子动作仍阻断', () => {
    expect(() =>
      compileCombatActionSequenceSource(parse(sequence([once()])), {
        ...context,
        timelineRange: undefined,
      }),
    ).toThrow();
    expect(() =>
      compileCombatActionSequenceSource(
        parse(
          sequence([
            {
              ...once(),
              sequenceActionData: { ...sequence([gain]), onlyExecuteWhenSourceIsMainChar: true },
            },
          ]),
        ),
        context,
      ),
    ).toThrow();
    expect(() =>
      compileCombatActionSequenceSource(parse(sequence([once([once()])])), context),
    ).toThrow();
  });

  it('未知字段不会被控制流读取器吞掉', () => {
    expect(() => parse(sequence([{ ...once(), extra: 1 }]))).toThrow('extra');
  });
});

describe('TickIntervalAction 调度投影', () => {
  it('逐宿主 Tick 读取当前技能局部帧，不静态展开', () => {
    const eachFrame = {
      ...tickInterval,
      executeEachFrame: true,
      tickInterval: 0.1,
      actionOnTick: sequence([storeCurrentSkillFrame]),
    };
    expect(
      compileCombatActionSequenceSource(parse(sequence([eachFrame])), context).steps[0],
    ).toMatchObject({
      kind: 'repeatEachTick',
      parameters: {
        nativeTickInterval: { executeEachFrame: true, intervalSeconds: 0.1 },
      },
      body: {
        steps: [{ kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'music_loop' } }],
      },
    });
  });

  it('保留直接周期和原生首次即时/单次追赶模式', () => {
    expect(
      compileCombatActionSequenceSource(parse(sequence([tickInterval])), context).steps[0],
    ).toMatchObject({
      kind: 'repeatEachTick',
      parameters: {
        nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 },
      },
      body: { steps: [{ kind: 'changeResourceByActionValue' }] },
    });
  });

  it('动态周期和未知宿主区间继续阻断', () => {
    expect(() =>
      compileCombatActionSequenceSource(
        parse(
          sequence([
            {
              ...tickInterval,
              useTickIntervalBlackboardKey: true,
              tickIntervalBlackboardKey: 'interval',
            },
          ]),
        ),
        context,
      ),
    ).toThrow('unsupported Buff runtime action');
    expect(() =>
      compileCombatActionSequenceSource(parse(sequence([tickInterval])), {
        ...context,
        timelineRange: undefined,
      }),
    ).toThrow('unsupported Buff runtime action');
  });
});

describe('ChannelingAction 单目标身份投影', () => {
  it('以主动技能 Owner 为目标时，子动作 Target 保留为施术者而非敌人', () => {
    expect(
      compileCombatActionSequenceSource(parse(sequence([casterChanneling])), context).steps[0],
    ).toMatchObject({
      kind: 'repeatEachTick',
      parameters: {
        nativeChanneling: {
          executeEachFrame: false,
          triggerIntervalSeconds: 0.1,
          maxCountPerTarget: -1,
          targetTriggerIntervalSeconds: 0,
        },
      },
      body: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: { buffId: 'buff_common_obtain_ultimate_sp', target: 'caster' },
          },
        ],
      },
    });
  });

  it('V2 以主动技能 Target 为扫描输入时，tick 子动作仍指向唯一敌人', () => {
    const enemyChanneling = {
      ...casterChanneling,
      $type: 'Beyond.Gameplay.Core.ChannelingActionV2+Data, Gameplay.Beyond',
      targetSettings: {
        ...targetFixture('Target'),
        targetContextKey: 'tar',
      },
      executeEachFrame: true,
      triggerInterval: 0.033,
      maxCountPerTarget: 3,
      targetTriggerInterval: 0.1,
      actionOnTick: sequence([interrupt]),
    };

    expect(
      compileCombatActionSequenceSource(parse(sequence([enemyChanneling])), context).steps[0],
    ).toMatchObject({
      kind: 'repeatEachTick',
      parameters: {
        nativeChanneling: {
          executeEachFrame: true,
          triggerIntervalSeconds: 0.033,
          maxCountPerTarget: 3,
          targetTriggerIntervalSeconds: 0.1,
        },
      },
    });
  });

  it('Target 通过已证明的 Context 组扫描时，tick 子动作保留唯一敌人身份', () => {
    const groupedEnemyChanneling = {
      ...casterChanneling,
      targetSettings: targetFixture('Target', undefined, 'myTar'),
    };
    const groupedContext = {
      ...context,
      staticEnemyTargetGroupKeys: new Set(['myTar']),
    };

    expect(
      compileCombatActionSequenceSource(parse(sequence([groupedEnemyChanneling])), groupedContext)
        .steps[0],
    ).toMatchObject({
      kind: 'repeatEachTick',
      body: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: { buffId: 'buff_common_obtain_ultimate_sp', target: 'enemy' },
          },
        ],
      },
    });
  });
});
