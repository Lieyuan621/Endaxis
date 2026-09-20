import { describe, expect, it } from 'vitest';

import { parseFinishOwnerActionSource } from '../src/index.ts';
import { targetFixture } from './sourceFixtures.ts';

describe('生命周期动作来源载荷', () => {
  it('FinishOwnerAction 保留完整目标和死亡表现开关', () => {
    expect(
      parseFinishOwnerActionSource(
        {
          $type: 'Example.FinishOwnerAction+Data, Example',
          isEnable: true,
          priorityLevel: 'Default',
          priorityOffset: 0,
          serverActionIndex: 1,
          owner: targetFixture('Context', undefined, 'swordToDie'),
          skipDieDisplay: true,
        },
        'fixture.finishOwner',
      ),
    ).toMatchObject({
      kind: 'finishOwner',
      owner: { targetSource: 'Context', targetGroupKey: 'swordToDie' },
      skipDieDisplay: true,
    });
  });
});
