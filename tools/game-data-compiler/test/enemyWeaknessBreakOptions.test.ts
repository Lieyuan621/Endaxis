import { describe, expect, it } from 'vitest';
import { generatedEnemyDefinitions } from '../../../src/data/enemies/generated/index.generated';
import type { EnemyDefinition } from '../../../packages/game-data-contract/src/enemies';
import { readSkillWeaknessBreakAmounts } from '../src/domains/enemy/weaknessBreakOptions.ts';

describe('红圈打断的基础失衡候选', () => {
  it('共用模板招式参考，保留同一技能各窗口的数值', () => {
    const enemies: readonly EnemyDefinition[] = generatedEnemyDefinitions;
    const options = enemies.find(enemy => enemy.id === 'eny-0120-klbear')?.weaknessBreakOptions;
    expect(
      enemies.find(enemy => enemy.id === 'eny-0120-klbear-tower015')?.weaknessBreakOptions,
    ).toBe(options);
    expect(
      options
        ?.filter(option => option.skillId === 'eny_0120_klbear_skill05_angry_02')
        .map(option => option.stagger),
    ).toEqual([30, 40, 80]);
    expect(options).toContainEqual({ skillId: 'eny_0120_klbear_skill03', stagger: 20 });
    expect(options).toContainEqual({ skillId: 'eny_0120_klbear_skill08', stagger: 30 });
    const mines = enemies.find(enemy => enemy.id === 'eny-0075-lbroshan')?.weaknessBreakOptions;
    expect(mines).toContainEqual({ skillId: 'eny_0075_lbroshan_skill2_coin', stagger: 30 });
  });

  it('解析己身 Buff 的触发、建窗与中断 Buff 赋值，未知输入和白圈不会产生零值', () => {
    const scalar = (value: number | string) =>
      typeof value === 'number'
        ? { useBlackboardKey: false, value }
        : { useBlackboardKey: true, blackboardKey: value, value: 0 };
    const apply = (buffId: string, key?: string) => ({
      $type: 'Beyond.Gameplay.Core.CreateBuffAction+Data, Gameplay.Beyond',
      count: scalar(1),
      targetSettings: { targetSource: 'Owner' },
      buffs: [
        {
          buffId,
          assignBlackboard: !!key,
          assignItems: key ? [{ targetKey: 'p', useDirectValue: false, inputValueKey: key }] : [],
        },
      ],
    });
    const declared = (value: number) => [
      { key: 'p', valueDouble: value, valueStr: '', isDynamic: false },
    ];
    const window = (key: string, redDuration: number) => ({
      $type: 'Beyond.Gameplay.Core.SetWeaknessAction+Data, Gameplay.Beyond',
      alertEffectDurationBB: scalar(redDuration),
      triggerActions: { actionData: [apply('interrupt', key)] },
    });
    const event = (buffEvent: string, ...actions: unknown[]) => [
      { buffEvent, actions: [{ actionData: actions }] },
    ];
    const buffs = {
      timer: { blackboard: [], buffEventAction: event('OnBuffTrigger', apply('open')) },
      open: {
        blackboard: declared(17),
        buffEventAction: event('DuringBuffEnable', window('missing', 2), window('p', 2)),
      },
      interrupt: {
        blackboard: declared(0),
        buffEventAction: event('OnBuffStart', {
          $type: 'Beyond.Gameplay.Core.DamageAction+Data, Gameplay.Beyond',
          targetSettings: { targetSource: 'Target' },
          damageUnits: [
            {
              damageAttributeType: 'Poise',
              poiseCalculation: {
                $type: 'Beyond.Gameplay.Core.DefiniteValueCalculation, Gameplay.Beyond',
                value: scalar('p'),
              },
            },
          ],
        }),
      },
    };
    const skill = {
      skillId: 'example',
      blackboard: declared(0),
      actionGroupData: {
        actionData: [apply('timer'), window('p', 0), { ...window('p', 1), isEnable: false }],
      },
    };
    const read = (id: string) => buffs[id as keyof typeof buffs];
    expect(readSkillWeaknessBreakAmounts(skill, read, new Set(['timer', 'open']))).toEqual([17]);
    expect(
      readSkillWeaknessBreakAmounts({ ...skill, actionGroupData: window('p', 1) }, read, new Set()),
    ).toEqual([0]);
  });
});
