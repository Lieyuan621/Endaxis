import { COMPILED_BUFF_CAPTURED_TARGET_GROUPS } from '../src/compiler/buffs/compiledBuffMetadata.ts';
import { describe, expect, it } from 'vitest';
import {
  collectCompiledAbilityEntitySpawns,
  collectCompiledBuffApplications,
  collectCompiledBuffCapturedTargetGroups,
} from '../src/compiler/references/compiledReferences.ts';

describe('compiled definition references', () => {
  it('collects nested AbilityEntity child-skill spawn edges', () => {
    expect(
      collectCompiledAbilityEntitySpawns({
        childSkill: {
          scheduledSequences: [
            {
              sequence: {
                steps: [
                  {
                    kind: 'branch',
                    whenTrue: {
                      steps: [
                        {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_child',
                            childSkillId: 'child_skill',
                          },
                        },
                        {
                          kind: 'spawnAbilityEntity',
                          parameters: { abilityEntityId: 'abilityentity_passive_host' },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      }),
    ).toEqual([
      {
        abilityEntityId: 'abilityentity_child',
        skillId: 'child_skill',
        sourcePath: 'compiled.spawnAbilityEntity.abilityentity_child.child_skill',
      },
      {
        abilityEntityId: 'abilityentity_passive_host',
        sourcePath: 'compiled.spawnAbilityEntity.abilityentity_passive_host',
      },
    ]);
  });
});

it('瞄准注册携带标记 Buff 施加引用，保留敌人宿主而不猜测来源', () => {
  expect(
    collectCompiledBuffApplications({
      nodes: {
        register: {
          action: {
            kind: 'startTyphoeaArchery',
            parameters: {
              markBuffId: 'aimed_enemy',
              targetCount: { kind: 'constant', value: 2 },
              priorityTags: [],
              priorityTagQueryType: 'hasAny',
            },
          },
        },
      },
    }),
  ).toEqual([{ buffId: 'aimed_enemy', target: 'enemy', source: 'unknown' }]);
  expect(() =>
    collectCompiledBuffApplications({
      kind: 'startTyphoeaArchery',
      parameters: { markBuffId: '' },
    }),
  ).toThrow('missing its mark Buff');
});

it('共享 Buff 捕获目标按所有来源取交集，敌人／位置混合证明不能覆盖干员来源', () => {
  const application = (enemyKeys: string[], enemyOrSpatialKeys: string[]) => ({
    kind: 'applyBuff',
    parameters: {
      buffs: [{ buffId: 'shared' }],
      targets: { kind: 'inputTarget' },
      passTargetGroupsToBuff: true,
      [COMPILED_BUFF_CAPTURED_TARGET_GROUPS]: { enemyKeys, enemyOrSpatialKeys, zeroSpaceKeys: [] },
    },
  });
  const enemy = application(['target'], []);
  const mixed = application([], ['target']);
  const operator = application([], []);
  for (const producers of [
    [enemy, mixed],
    [mixed, enemy],
  ]) {
    const captured = collectCompiledBuffCapturedTargetGroups(producers).get('shared');
    expect(captured?.enemyKeys).toEqual([]);
    expect(captured?.enemyOrSpatialKeys).toEqual(['target']);
    expect(
      collectCompiledBuffCapturedTargetGroups([...producers, operator]).get('shared')
        ?.enemyOrSpatialKeys,
    ).toEqual([]);
  }
});
