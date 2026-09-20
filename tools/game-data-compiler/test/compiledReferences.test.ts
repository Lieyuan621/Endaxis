import { describe, expect, it } from 'vitest';
import { collectCompiledAbilityEntitySpawns } from '../src/compiler/references/compiledReferences.ts';

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
    ]);
  });
});
