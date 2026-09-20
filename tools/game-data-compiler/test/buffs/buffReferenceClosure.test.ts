import { expect, it } from 'vitest';
import { collectBuffRuntimeClosure } from '../../src/compiler/buffs/buffReferenceClosure.ts';
import { buffFixture, scalarFixture, targetFixture } from '../sourceFixtures.ts';

function rootBuff() {
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
            actionData: [
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
