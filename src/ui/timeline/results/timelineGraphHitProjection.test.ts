import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import { expect, it } from 'vitest';
import type {
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph';
import type { SkillCastDocument } from '../../../core/project/schema';
import { perlica } from '../../../data/operators/perlica.generated';
import { projectCastGraphHitMarkers } from './timelineHitProjection';
import {
  deriveAnonymousDamageStepKey,
  deriveHitId,
} from '../../../core/combat/timeline/deriveHitId';

const cast: SkillCastDocument = {
  id: 'preview',
  source: { kind: 'operatorSkill', skillGroupKey: 'battleSkill', skillKey: 'test' },
  placement: { startFrame: 0 },
};

function resource(action: ActionGraphStep): ActionGraphResourceDefinition {
  return {
    main: { nodes: { entry: { action: { kind: 'callMacro', macroId: 'shared' }, next: null } } },
    macros: {
      shared: {
        entry: { $sequence: 'entry' },
        graph: {
          nodes: {
            entry: { action, next: null },
          },
        },
      },
    },
  };
}

function damage(key?: string): ActionGraphStep {
  return {
    kind: 'dealFixedDamage',
    ...(key === undefined ? {} : { key }),
    parameters: { damageType: 'physical', value: 1, tags: [] },
  };
}

function skill(action: ActionGraphStep): SkillDefinition {
  return {
    key: 'test',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 4, sequence: { $sequence: 'entry' } }],
    actionGraph: resource(action),
  };
}

it('Buff 的同名节点和宏属于自己的资源，返回后仍能继续技能入口', () => {
  const definition = skill({ kind: 'applyBuff', parameters: { buffId: 'buff', target: 'enemy' } });
  const operator = {
    ...perlica,
    buffDefinitions: {
      buff: {
        stackingType: 'unlimited' as const,
        scheduledSequences: [{ startFrame: 7, sequence: { $sequence: 'entry' } }],
        actionGraph: resource(damage('buff-hit')),
      },
    },
  };
  const result = projectCastGraphHitMarkers(
    cast,
    {
      ...definition,
      scheduledSequences: [
        ...definition.scheduledSequences,
        { startFrame: 20, sequence: { $sequence: 'entry' } },
      ],
    },
    operator,
  );
  expect(result.map(hit => [hit.stepKey, hit.frameOffset, hit.conditional])).toEqual([
    ['buff-hit', 11, true],
    ['buff-hit', 27, true],
  ]);
});

it('能力实体子技能使用实体所属图，不在发射技能的图中查找节点', () => {
  const definition = skill({
    kind: 'spawnAbilityEntity',
    parameters: {
      abilityEntityId: 'entity',
      dieWhenSourceDies: false,
    },
  });
  const operator = {
    ...perlica,
    abilityEntityDefinitions: {
      entity: {
        lifetime: { kind: 'infinite' as const },
        childSkill: {
          nativeSkillType: 'normalSkill' as const,
          naturalDurationFrames: 30,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'sp' as const, value: 0, availabilityThreshold: 0 },
          },
          skillId: 'child',
          scheduledSequences: [{ startFrame: 7, sequence: { $sequence: 'entry' } }],
          actionGraph: resource(damage('entity-hit')),
        },
      },
    },
  };
  expect(
    projectCastGraphHitMarkers(cast, definition, operator).map(hit => [
      hit.stepKey,
      hit.frameOffset,
    ]),
  ).toEqual([['entity-hit', 11]]);
});

it('没有静态 key 的伤害按调用位置与宏节点身份分配预览身份，与运行时回执一致', () => {
  expect(projectCastGraphHitMarkers(cast, skill(damage()), perlica)).toEqual([
    {
      stepKey: deriveAnonymousDamageStepKey(
        'test:scheduledSequences[0].sequence/%5Bnull%2C%22entry%22%5D:0',
        JSON.stringify(['shared', 'entry']),
      ),
      hitId: deriveHitId(
        'preview',
        deriveAnonymousDamageStepKey(
          'test:scheduledSequences[0].sequence/%5Bnull%2C%22entry%22%5D:0',
          JSON.stringify(['shared', 'entry']),
        ),
      ),
      frameOffset: 4,
      conditional: false,
    },
  ]);
});

it('抽取宏的两处中间段保留原始匿名命中身份与各自后续命中', () => {
  const source: SkillDefinition = {
    key: 'test',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 4, sequence: { $sequence: 'first' } }],
    actionGraph: {
      main: {
        nodes: {
          first: { action: damage(), next: 'after-first' },
          'after-first': { action: damage('first-exit'), next: 'second' },
          second: { action: damage(), next: 'after-second' },
          'after-second': { action: damage('second-exit'), next: null },
        },
      },
      macros: {},
    },
  };
  const extracted: SkillDefinition = {
    ...source,
    actionGraph: {
      main: {
        nodes: {
          ...source.actionGraph.main.nodes,
          first: {
            action: { kind: 'callMacro', macroId: 'middle', nodeBindings: { hit: 'first' } },
            next: 'after-first',
          },
          second: {
            action: { kind: 'callMacro', macroId: 'middle', nodeBindings: { hit: 'second' } },
            next: 'after-second',
          },
        },
      },
      macros: {
        middle: {
          entry: { $sequence: 'hit' },
          graph: { nodes: { hit: { action: damage(), next: null } } },
        },
      },
    },
  };
  expect(projectCastGraphHitMarkers(cast, extracted, perlica)).toEqual(
    projectCastGraphHitMarkers(cast, source, perlica),
  );
});
