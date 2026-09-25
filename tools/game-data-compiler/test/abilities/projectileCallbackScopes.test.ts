import { describe, expect, it } from 'vitest';
import { compileProjectileLaunchScopeSource } from '../../src/compiler/abilities/projectileCallbackScopes.ts';
import type { ProjectileLaunchActionSource } from '../../src/source/referenceActions.ts';

const launch = {
  kind: 'projectileLaunch',
  projectileId: 'projectile_empty_entity_board',
  assignBlackboard: true,
  assignEntityBlackboard: true,
  assignments: [],
  callbacks: [{ event: 'hit', enabled: true, skillId: 'projectile_hit' }],
} as unknown as ProjectileLaunchActionSource;

describe('synchronous projectile callback scope', () => {
  it('accepts an enabled but empty entity assignment list with an evidenced empty template board', () => {
    const result = compileProjectileLaunchScopeSource({
      body: { steps: [] },
      sourcePath: 'skill.LaunchProjectile',
      launch,
      template: {
        projectileId: launch.projectileId,
        entityBlackboard: [],
      },
      invocations: [
        {
          event: 'hit',
          skillId: 'projectile_hit',
          declaredBlackboard: [],
          sequence: { steps: [] },
        },
      ],
    });

    expect(result.parameters.entityInitialValues).toEqual({});
    expect(result.body.steps).toHaveLength(0);
  });

  it('omits projectile entity assignments that no callback blackboard consumes', () => {
    const result = compileProjectileLaunchScopeSource({
      body: { steps: [] },
      sourcePath: 'skill.LaunchProjectile',
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
      template: {
        projectileId: launch.projectileId,
        entityBlackboard: [],
      },
      invocations: [],
    });
    expect(result.parameters.entityAssignments).toBeUndefined();
  });

  it('retains projectile entity assignments consumed by a callback blackboard', () => {
    const result = compileProjectileLaunchScopeSource({
      body: { steps: [] },
      sourcePath: 'skill.LaunchProjectile',
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
      template: { projectileId: launch.projectileId, entityBlackboard: [] },
      invocations: [
        {
          event: 'hit',
          skillId: 'projectile_hit',
          declaredBlackboard: [{ key: 'EntityBB_value', value: 0, isDynamic: true }],
          sequence: { steps: [] },
        },
      ],
    });
    expect(result.parameters.entityAssignments).toEqual({
      EntityBB_value: { kind: 'constant', value: 1 },
    });
  });

  it('does not treat a pure EntityBB assignment as a read requiring template defaults', () => {
    const result = compileProjectileLaunchScopeSource({
      body: { steps: [] },
      sourcePath: 'skill.LaunchProjectile',
      launch,
      template: null,
      allowMissingEntityBlackboardEvidence: true,
      invocations: [
        {
          event: 'hit',
          skillId: 'projectile_hit',
          declaredBlackboard: [],
          sequence: {
            steps: [
              {
                kind: 'modifyActionValue',
                parameters: {
                  key: 'EntityBB_written',
                  operation: 'assign',
                  value: { kind: 'constant', value: 1 },
                },
              },
            ],
          },
        },
      ],
    });

    expect(result.parameters.entityInitialValues).toEqual({});
  });
});
