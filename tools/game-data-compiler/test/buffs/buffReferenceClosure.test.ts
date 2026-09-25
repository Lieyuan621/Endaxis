import { expect, it } from 'vitest';
import { collectBuffRuntimeClosure } from '../../src/compiler/buffs/buffReferenceClosure.ts';
import { buffFixture, scalarFixture, targetFixture } from '../sourceFixtures.ts';
import { ExternalBuffReferenceProof } from '../../src/compiler/references/externalBuffReferenceProof.ts';
import { inspectExternalBlackboardUsage } from '../../src/compiler/references/externalBlackboardUsage.ts';
import type { DefinitionReferenceSource } from '../../src/source/referenceGraph.ts';
import { collectCombatInvisibleBuffClosureIds } from '../../src/compiler/buffs/combatInvisibleBuffClosure.ts';

it('空 Buff 被外部事件监听时，创建它的父 Buff 也不能作为纯表现裁掉', () => {
  const fields = { applyTags: [], iconConfig: { _spritePath: '' } };
  const buffs: Record<string, unknown> = {
    root: rootBuff(undefined, fields),
    child: buffFixture({ ...fields, id: 'child' }),
  };
  expect([...collectCombatInvisibleBuffClosureIds(['root'], id => buffs[id])].sort()).toEqual([
    'child',
    'root',
  ]);
  expect([
    ...collectCombatInvisibleBuffClosureIds(['root'], id => buffs[id], new Set(['child'])),
  ]).toEqual([]);
});

function rootBuff(actions?: unknown[], overrides: Record<string, unknown> = {}) {
  return buffFixture({
    id: 'root',
    applyTags: [],
    buffEventAction: [
      {
        buffEvent: 'OnBuffEnable',
        actions: [
          {
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
            actionData: actions ?? [
              {
                $type: 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 0,
                buffs: [
                  {
                    buffId: 'child',
                    assignBlackboard: false,
                    assignItems: [],
                    readIdFromBlackboard: false,
                    buffIdKey: '',
                  },
                ],
                count: scalarFixture(1),
                targetSettings: targetFixture('Target'),
                buffSource: 'ActionSource',
                contextKey: '',
                autoFinishByAction: false,
                inheritSkillIdList: [],
                finishWithNextSkillIfNotInherited: false,
                asChildBuff: false,
                inheritSourceSkillCastId: false,
                inheritSourceSkillCastInfo: false,
                isExtra: false,
                passTargetGroupsToBuff: false,
                overrideBuffIconDuration: false,
                buffIconDurationSource: { durationSourceType: 'AbilityEntity', timedMarkerId: '' },
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  });
}

it('缺少根 Buff 时直接报出身份', () => {
  expect(() => collectBuffRuntimeClosure(['missing'], {})).toThrow(
    'BuffData: missing Buff definition "missing"',
  );
});

it('缺少间接依赖时阻塞，不能只返回已找到的 Buff', () => {
  expect(() => collectBuffRuntimeClosure(['root'], { root: rootBuff() })).toThrow(
    'BuffData: missing Buff definition "child"',
  );
});

it('按需收集依赖，同一 Buff 只读取一次', () => {
  const data: Record<string, unknown> = {
    root: rootBuff(),
    child: buffFixture({ id: 'child', applyTags: [] }),
  };
  const loaded: string[] = [];
  const result = collectBuffRuntimeClosure(['root', 'child', 'root'], id => {
    loaded.push(id);
    return data[id];
  });
  expect([...result.keys()]).toEqual(['root', 'child']);
  expect(loaded).toEqual(['root', 'child']);
});

function keywordData(overrideChildBuffId: boolean, value: string, blackboardKey = '') {
  const creator = rootBuff([
    {
      $type: 'Beyond.Gameplay.Core.ShelterAction+Data, Gameplay.Beyond',
      isEnable: true,
      priorityLevel: 'Default',
      priorityOffset: 0,
      serverActionIndex: 0,
      source: targetFixture('Target'),
      target: targetFixture('Target'),
      duration: scalarFixture(3),
      rate: scalarFixture(0.1),
      overrideChildBuffId,
      childBuffId: { useBlackboardKey: blackboardKey !== '', value, blackboardKey },
      asChildBuff: false,
      autoFinishByAction: false,
      enhancingList: [],
    },
  ]);
  const carrier = rootBuff(undefined, {
    id: 'buff_common_affixes_shelter',
    blackboard: [{ key: 'child_buff_id', valueStr: 'child', valueDouble: 0, isDynamic: false }],
  });
  // 仅改变创建动作的 ID 输入，保留完整的原生创建参数。
  const events = carrier.buffEventAction as Array<{
    buffEvent: string;
    actions: Array<{ actionData: Array<{ buffs: unknown[] }> }>;
  }>;
  events[0]!.buffEvent = 'DuringBuffEnable';
  events[0]!.actions[0]!.actionData[0]!.buffs = [
    {
      buffId: '',
      assignBlackboard: false,
      assignItems: [],
      readIdFromBlackboard: true,
      buffIdKey: 'child_buff_id',
    },
  ];
  return {
    root: creator,
    buff_common_affixes_shelter: carrier,
    child: buffFixture({ id: 'child', applyTags: [] }),
    alternate: buffFixture({ id: 'alternate', applyTags: [] }),
  };
}

function keywordClosure(enabled: boolean, value: string, key = '') {
  return collectBuffRuntimeClosure(['root'], keywordData(enabled, value, key));
}

it.each([false, true])('外部检查消费关键词候选并扫描子 Buff 的黑板，覆盖=%s', override => {
  const data: Record<string, unknown> = keywordData(override, 'alternate');
  data[override ? 'alternate' : 'child'] = buffFixture({
    id: override ? 'alternate' : 'child',
    applyTags: [],
    blackboard: [{ key: 'angle', valueDouble: 1, valueStr: '', isDynamic: false }],
  });
  const proof = new ExternalBuffReferenceProof();
  const root: DefinitionReferenceSource = {
    kind: 'buff',
    id: 'root',
    usage: 'apply',
    state: 'active',
    blackboardKey: null,
    sourcePath: 'skill',
  };
  proof.addExternalReferences([root]);
  const result = inspectExternalBlackboardUsage(
    [root],
    ref => ({
      value: data[ref.id!],
      references: proof.addBuff(ref.id!, data[ref.id!], ref.id!),
    }),
    ref => proof.resolve(ref),
  );
  expect(result.unresolved).toEqual([]);
  expect(result.mentionedKeys.has('angle')).toBe(true);
});

it('后来出现普通创建来路会推翻原来的关键词默认值证明', () => {
  const data = keywordData(false, '');
  const proof = new ExternalBuffReferenceProof();
  proof.addBuff('root', data.root, 'root');
  const refs = proof.addBuff(
    'buff_common_affixes_shelter',
    data.buff_common_affixes_shelter,
    'carrier',
  );
  const dynamic = refs.find(ref => ref.state === 'dynamic')!;
  expect(proof.resolve(dynamic)?.map(ref => ref.id)).toEqual(['child']);
  proof.addExternalReferences([
    { ...dynamic, state: 'active', id: 'buff_common_affixes_shelter', usage: 'apply' },
  ]);
  expect(proof.resolve(dynamic)).toBeUndefined();
});

it.each([
  [false, 'ignored', 'child'],
  [true, '', 'child'],
  [true, 'alternate', 'alternate'],
] as const)('关键词覆盖 %s/%s 选择 %s', (enabled, value, child) => {
  expect([...keywordClosure(enabled, value).keys()]).toEqual([
    'root',
    'buff_common_affixes_shelter',
    child,
  ]);
});

it('关键词动态覆盖不能当成声明默认值', () => {
  expect(() => keywordClosure(true, '', 'external')).toThrow(/dynamic Buff references/);
});
