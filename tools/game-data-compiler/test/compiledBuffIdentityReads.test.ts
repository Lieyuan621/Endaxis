import { describe, expect, it } from 'vitest';
import { collectCompiledBuffIdentityReadIds } from '../src/compiler/references/compiledReferences';

describe('observed Buff identities survive presentation pruning', () => {
  it('keeps otherwise-empty signals read inside nested ability event listeners', () => {
    const reads = collectCompiledBuffIdentityReadIds({
      scheduledSequences: [
        {
          sequence: {
            steps: [
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      event: { kind: 'buffApplied' },
                      sequence: {
                        steps: [
                          {
                            kind: 'conditional',
                            condition: { kind: 'eventBuffIdMatch', buffIds: ['signal'] },
                            whenTrue: {
                              steps: [
                                { kind: 'jumpTimeline', parameters: { destinationFrame: 100 } },
                              ],
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
        },
      ],
    });
    expect([...reads]).toEqual(['signal']);
  });
  it('does not promote every apply edge or unrelated identifier to an observed signal', () => {
    expect([
      ...collectCompiledBuffIdentityReadIds([
        { kind: 'applyBuff', parameters: { buffId: 'visual' } },
        { kind: 'eventBuffIdMatch', buffIds: ['', null, 'signal', 'signal'] },
      ]),
    ]).toEqual(['signal']);
  });

  it('keeps empty marker Buffs whose stack, blackboard, or lifetime is read by a compiled step', () => {
    expect([
      ...collectCompiledBuffIdentityReadIds([
        {
          kind: 'readBuffStackCount',
          parameters: { query: { kind: 'id', buffIds: ['stack-marker'] } },
        },
        {
          kind: 'readBuffBlackboard',
          parameters: { query: { kind: 'id', buffIds: ['value-marker'] } },
        },
        {
          kind: 'readBuffRemainingDuration',
          parameters: { buffIds: ['duration-marker'] },
        },
      ]),
    ]).toEqual(['stack-marker', 'value-marker', 'duration-marker']);
  });
});
