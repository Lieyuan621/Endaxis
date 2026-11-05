import { describe, expect, it } from 'vitest';
import { compileActiveSkillRuntimeProjectionSource } from '../src/compiler/skills/activeSkillRuntimeProjection.ts';
import { gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';
import { fixtureGameplayTagRegistry } from './gameplayTagFixtures.ts';
import { activeSkillFixture } from './sourceFixtures.ts';
import { withProjectionGraph } from './support/projectionContext.ts';

describe('技能定义标签与事件技能标签条件', () => {
  it('保留技能标签并将 CheckSkillGameplayTag 投影为事件条件', () => {
    const tagId = gameplayTagIdFromPath('Test/Tag123');
    const skill = activeSkillFixture();
    skill.skillTags = { predefinedTag: [{ tagId }] };
    skill.actionGroupData = {
      timelineActions: [
        {
          _startFrame: 0,
          _endFrame: 1,
          _sequenceActionData: {
            actionData: [
              {
                $type:
                  'Beyond.Gameplay.Core.Conditions.CheckSkillGameplayTag+Data, Gameplay.Beyond',
                isEnable: true,
                priorityLevel: 'Default',
                priorityOffset: 0,
                serverActionIndex: 0,
                checkType: 'HasAny',
                gameplayTagList: { predefinedTag: [{ tagId }] },
              },
            ],
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
          },
          forceSyncAnimData: {
            forceSync: false,
            montageName: '',
            targetFrame: 0,
            playbackSpeed: 1,
          },
        },
      ],
      passiveEventActions: [],
    };
    const result = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'skill',
      patch: null,
      context: withProjectionGraph({
        gameplayTagRegistry: fixtureGameplayTagRegistry,
        actionOwnerTarget: 'caster',
        actionSourceTarget: 'caster',
        actionTargetTarget: 'enemy',
      }),
    });
    expect(result.skillTags).toEqual(['Test/Tag123']);
    expect(Object.values(result.actionGraph.main.nodes).map(node => node.action)).toContainEqual({
      kind: 'checkCondition',
      parameters: {
        condition: {
          kind: 'eventSkillTagsMatch',
          tagQueryType: 'hasAny',
          tags: ['Test/Tag123'],
        },
      },
    });
  });
});
