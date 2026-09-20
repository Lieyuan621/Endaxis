import { describe, expect, it } from 'vitest';
import { compileActionNode } from '../src/compiler/actions/combatActionLeafProjection.ts';
import { BUFF_ACTION_CONTEXT } from '../src/compiler/combatProjectionCommon.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 54,
} as const;

describe('custom ability event projection', () => {
  it('projects the observed literal caster-to-caster subset', () => {
    const leaf = parseKnownNativeActionLeafSource(
      {
        ...META,
        $type: 'Beyond.Gameplay.Core.TriggerCustomAbilityEvent+Data, Gameplay.Beyond',
        eventSource: targetFixture('Source'),
        targets: targetFixture('Source'),
        eventName: { useBlackboardKey: false, value: 'liino_comboskill_end', blackboardKey: '' },
        eventParam: scalarFixture(0),
      },
      'fixture.customEvent',
      {},
    );

    expect(
      compileActionNode(
        {
          sourcePath: 'fixture.customEvent',
          metadata: {
            nativeType: 'TriggerCustomAbilityEvent',
            nativeName: 'TriggerCustomAbilityEvent',
            enabled: true,
            priorityLevel: 'Default',
            priorityOffset: 0,
            serverActionIndex: 54,
          },
          body: { kind: 'leaf', value: leaf },
        },
        new Set(),
        new Map(),
        BUFF_ACTION_CONTEXT,
      ),
    ).toEqual([
      {
        kind: 'triggerCustomAbilityEvent',
        parameters: {
          eventName: 'liino_comboskill_end',
          eventParam: 0,
          source: 'caster',
          target: 'caster',
        },
      },
    ]);
  });
});
