import { describe, expect, it } from 'vitest';
import {
  collectBuffActionReferences,
  createBuffDefinitionReferenceNode,
  parseReferenceAwareBuffActionGraphSource,
  resolveDefinitionReferenceClosure,
} from '../src/index.ts';
import { targetFixture } from './sourceFixtures.ts';

describe('Buff 公共动作图', () => {
  it('保留时间时钟、数值能力事件和其中的动态子技能引用', () => {
    const parsed = parseReferenceAwareBuffActionGraphSource(
      buffFixture({
        useTimeDilationDt: true,
        abilityEventAction: [
          {
            abilityEvent: 0,
            actions: [sequence([castSkill()])],
          },
        ],
      }),
      'buff_fixture.json',
      {},
    );
    expect(parsed).toMatchObject({
      buffId: 'buff_fixture',
      useTimeDilationDeltaTime: true,
      onlyUseSelfTimeDilation: false,
      abilityEvents: [{ event: 0 }],
    });
    expect(collectBuffActionReferences(parsed)).toMatchObject([
      {
        kind: 'skill',
        usage: 'cast',
        state: 'dynamic',
        id: null,
        blackboardKey: 'child_skill',
      },
    ]);
    const node = createBuffDefinitionReferenceNode(parsed, 'buff_fixture.json');
    expect(node).toMatchObject({ kind: 'buff', id: 'buff_fixture' });
    expect(resolveDefinitionReferenceClosure([['buff', 'buff_fixture']], [node]).missing).toEqual(
      [],
    );
  });
});

function buffFixture(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    abilityEventAction: [],
    addingCooldown: {},
    applyTags: [],
    attributeModifier: {},
    blackboard: [],
    buffEventAction: [],
    damageModifier: [],
    dispelConfig: {},
    duration: {},
    finishOnRepatriate: false,
    globalModifier: [],
    hasAddingCooldown: false,
    hasIcon: false,
    healModifier: [],
    iconConfig: {},
    id: 'buff_fixture',
    igniteEventAction: [],
    ignoreCooldownWhenAdding: false,
    ignoreTagImmune: false,
    lifeType: 'Infinity',
    maxTriggerCnt: {},
    onlyUseSelfTimeDilation: false,
    poiseModifier: [],
    shieldConfigs: [],
    stackingSettings: {},
    tagsAfterTriggerExtendBuffAction: [],
    timelineActions: [],
    triggerInterval: {},
    useTimeDilationDt: false,
    waitFirstTriggerInterval: true,
    ...overrides,
  };
}

function sequence(actionData: unknown[]): Record<string, unknown> {
  return {
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  };
}

function castSkill(): Record<string, unknown> {
  return {
    $type: 'Beyond.Gameplay.Core.CastSkill+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 1,
    caster: targetFixture('Source'),
    target: targetFixture('Target'),
    skillId: { value: '', useBlackboardKey: true, blackboardKey: 'child_skill' },
    skipApplyCost: true,
    inheritSourceSkillCastId: true,
  };
}
