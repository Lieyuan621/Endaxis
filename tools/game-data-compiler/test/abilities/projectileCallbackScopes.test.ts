import { describe, expect, it } from 'vitest';
import {
  compileProjectileLaunchScopeSource,
  omitDeadSingleEnemyBounceBookkeeping,
} from '../../src/compiler/abilities/projectileCallbackScopes.ts';
import {
  createActionGraphBuilder,
  readActionGraphChain,
} from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../../src/compiler/actions/combatActionProjectionTypes.ts';
import type { ActionGraphReference } from '../../../../packages/game-data-contract/src/actionGraph.ts';
import type { ProjectileLaunchActionSource } from '../../src/source/referenceActions.ts';

const launch = {
  kind: 'projectileLaunch',
  projectileId: 'projectile_empty_entity_board',
  assignBlackboard: true,
  assignEntityBlackboard: true,
  assignments: [],
  callbacks: [{ event: 'hit', enabled: true, skillId: 'projectile_hit' }],
} as unknown as ProjectileLaunchActionSource;

/** 回调子图由调用方独立构建；外层宿主图只保存引用。 */
function invocation(
  build: (
    program: ReturnType<typeof createActionGraphBuilder<CompiledBuffStepSource>>,
  ) => ActionGraphReference,
  declaredBlackboard: { key: string; value: number; isDynamic: boolean }[] = [],
) {
  const program = createActionGraphBuilder<CompiledBuffStepSource>();
  const sequence = build(program);
  return {
    program,
    event: 'hit' as const,
    skillId: 'projectile_hit',
    declaredBlackboard,
    sequence,
  };
}

const emptyInvocation = () => invocation(program => program.sequence([]));

const bounceBookkeepingInvocation = (withDamage = true) =>
  invocation(program => {
    const whenTrue = program.sequence([
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'EntityBB_bounced',
          operation: 'assign',
          value: { kind: 'constant', value: 1 },
        },
      },
      {
        kind: 'mergeContextTargets',
        parameters: { saveToContextKey: 'extra_target', sources: [] },
      },
    ]);
    return program.sequence([
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'actionValueCompare',
            left: { kind: 'blackboard', key: 'EntityBB_bounced' },
            operator: 'equal',
            right: { kind: 'constant', value: 0 },
          },
          alwaysNext: true,
        },
        whenTrue,
      },
      ...(withDamage
        ? [
            {
              kind: 'dealDamage',
              parameters: {
                damageType: 'electric',
                attackScale: { kind: 'constant', value: 1 },
                tags: [],
                features: [],
                stagger: { kind: 'constant', value: 0 },
              },
            } satisfies CompiledBuffStepSource,
          ]
        : []),
    ]);
  });

function compile(input: {
  launch?: ProjectileLaunchActionSource;
  template?: { projectileId: string; entityBlackboard: [] } | null;
  invocations: readonly ReturnType<typeof invocation>[];
  allowMissingEntityBlackboardEvidence?: boolean;
}) {
  const graph = createActionGraphBuilder<CompiledBuffStepSource>();
  const body = graph.sequence([]);
  const result = compileProjectileLaunchScopeSource({
    sourcePath: 'skill.LaunchProjectile',
    launch: input.launch ?? launch,
    template:
      input.template === undefined
        ? { projectileId: launch.projectileId, entityBlackboard: [] }
        : input.template,
    invocations: input.invocations,
    body,
    ...(input.allowMissingEntityBlackboardEvidence === undefined
      ? {}
      : { allowMissingEntityBlackboardEvidence: input.allowMissingEntityBlackboardEvidence }),
  });
  return { result, body };
}

describe('projectile launch scope', () => {
  it('accepts an enabled but empty entity assignment list with an evidenced empty template board', () => {
    const { result, body } = compile({ invocations: [emptyInvocation()] });

    expect(result.parameters.entityInitialValues).toEqual({});
    expect(result.body).toBe(body);
  });

  it('omits projectile entity assignments that no callback blackboard consumes', () => {
    const { result } = compile({
      launch: {
        ...launch,
        assignments: [
          {
            targetKey: 'EntityBB_value',
            valueType: 'Numeric',
            numericValue: 1,
            stringValue: '',
            useDirectValue: true,
            inputValueKey: '',
          },
        ],
      },
      invocations: [],
    });
    expect(result.parameters.entityAssignments).toBeUndefined();
  });

  it('retains projectile entity assignments consumed by a callback blackboard', () => {
    const { result } = compile({
      launch: {
        ...launch,
        assignments: [
          {
            targetKey: 'EntityBB_value',
            valueType: 'Numeric',
            numericValue: 1,
            stringValue: '',
            useDirectValue: true,
            inputValueKey: '',
          },
        ],
      },
      invocations: [
        invocation(
          program => program.sequence([]),
          [{ key: 'EntityBB_value', value: 0, isDynamic: true }],
        ),
      ],
    });
    expect(result.parameters.entityAssignments).toEqual({
      EntityBB_value: { kind: 'constant', value: 1 },
    });
  });

  it('removes single-enemy bounce bookkeeping after its empty target consumer is omitted', () => {
    const inv = bounceBookkeepingInvocation();
    const trimmed = omitDeadSingleEnemyBounceBookkeeping(inv.program, inv.sequence, []);
    // 回调是独立资源；记账条件被移除后，被调用资源内只剩伤害节点。
    expect(readActionGraphChain(inv.program.finish(), trimmed).map(step => step.kind)).toEqual([
      'dealDamage',
    ]);
  });

  it('does not require missing entity-board evidence for bookkeeping removed by the fixed stump model', () => {
    const inv = bounceBookkeepingInvocation(false);
    const trimmed = omitDeadSingleEnemyBounceBookkeeping(inv.program, inv.sequence, []);
    expect(readActionGraphChain(inv.program.finish(), trimmed)).toEqual([]);
    const { result } = compile({
      template: null,
      allowMissingEntityBlackboardEvidence: true,
      invocations: [{ ...inv, sequence: trimmed }],
    });
    expect(result.parameters.entityInitialValues).toEqual({});
  });

  it('does not treat a pure EntityBB assignment as a read requiring template defaults', () => {
    const { result } = compile({
      template: null,
      allowMissingEntityBlackboardEvidence: true,
      invocations: [
        invocation(program =>
          program.sequence([
            {
              kind: 'modifyActionValue',
              parameters: {
                key: 'EntityBB_written',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              },
            },
          ]),
        ),
      ],
    });

    expect(result.parameters.entityInitialValues).toEqual({});
  });
});
